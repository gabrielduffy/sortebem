import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// PagSeguro notification status mapping
const statusMap: Record<string, string> = {
  "1": "pending",      // Aguardando pagamento
  "2": "analyzing",    // Em análise
  "3": "confirmed",    // Paga
  "4": "confirmed",    // Disponível
  "5": "disputed",     // Em disputa
  "6": "refunded",     // Devolvida
  "7": "cancelled",    // Cancelada
  "8": "debited",      // Debitado
  "9": "pending_review", // Retenção temporária
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // PagSeguro sends notifications as form-urlencoded
    const contentType = req.headers.get("content-type") || "";
    let notificationCode: string | null = null;
    let notificationType: string | null = null;

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      notificationCode = formData.get("notificationCode") as string;
      notificationType = formData.get("notificationType") as string;
    } else if (contentType.includes("application/json")) {
      const json = await req.json();
      notificationCode = json.notificationCode;
      notificationType = json.notificationType;
    }

    console.log("PagSeguro Webhook received:", { notificationCode, notificationType });

    // Log webhook to database
    const { data: webhookLog, error: logError } = await supabase
      .from("payment_webhooks")
      .insert({
        gateway: "pagseguro",
        event_type: notificationType || "unknown",
        payload: { notificationCode, notificationType },
        processed: false,
      })
      .select()
      .single();

    if (logError) {
      console.error("Error logging webhook:", logError);
    }

    if (!notificationCode) {
      console.log("No notification code received");
      return new Response(
        JSON.stringify({ success: true, message: "No notification code" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get PagSeguro config to fetch transaction details
    const { data: gatewaySettings } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "gateway")
      .maybeSingle();

    const pagseguroConfig = gatewaySettings?.value?.pagseguro;
    
    if (!pagseguroConfig?.token) {
      console.error("PagSeguro token not configured");
      return new Response(
        JSON.stringify({ success: false, error: "PagSeguro not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch transaction details from PagSeguro
    const environment = pagseguroConfig.environment || "sandbox";
    const apiUrl = environment === "production" 
      ? "https://ws.pagseguro.uol.com.br" 
      : "https://ws.sandbox.pagseguro.uol.com.br";

    const notificationUrl = `${apiUrl}/v3/transactions/notifications/${notificationCode}?email=${pagseguroConfig.email || ""}&token=${pagseguroConfig.token}`;
    
    console.log("Fetching notification from PagSeguro...");
    
    const pagseguroResponse = await fetch(notificationUrl, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    if (!pagseguroResponse.ok) {
      const errorText = await pagseguroResponse.text();
      console.error("PagSeguro API error:", errorText);
      
      // Update webhook with error
      if (webhookLog) {
        await supabase
          .from("payment_webhooks")
          .update({ 
            error_message: `PagSeguro API error: ${pagseguroResponse.status}`,
            processed: true,
            processed_at: new Date().toISOString()
          })
          .eq("id", webhookLog.id);
      }
      
      // Return 200 to not retry
      return new Response(
        JSON.stringify({ success: false, error: "Failed to fetch transaction" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse XML response (PagSeguro returns XML)
    const xmlText = await pagseguroResponse.text();
    console.log("PagSeguro response:", xmlText.substring(0, 500));

    // Simple XML parsing for key fields
    const getXmlValue = (xml: string, tag: string): string | null => {
      const match = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
      return match ? match[1] : null;
    };

    const transactionCode = getXmlValue(xmlText, "code");
    const reference = getXmlValue(xmlText, "reference");
    const status = getXmlValue(xmlText, "status");
    const grossAmount = getXmlValue(xmlText, "grossAmount");

    console.log("Parsed transaction:", { transactionCode, reference, status, grossAmount });

    // Update webhook log with full payload
    if (webhookLog) {
      await supabase
        .from("payment_webhooks")
        .update({ 
          payload: { 
            notificationCode, 
            notificationType, 
            transactionCode,
            reference,
            status,
            grossAmount,
            rawXml: xmlText.substring(0, 2000) // Truncate for storage
          }
        })
        .eq("id", webhookLog.id);
    }

    // Find purchase by reference (our purchase_id)
    if (!reference) {
      console.log("No reference in transaction");
      return new Response(
        JSON.stringify({ success: true, message: "No reference found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: purchase } = await supabase
      .from("purchases")
      .select("id, payment_status, cards_generated")
      .eq("id", parseInt(reference))
      .maybeSingle();

    if (!purchase) {
      console.log("Purchase not found for reference:", reference);
      return new Response(
        JSON.stringify({ success: true, message: "Purchase not found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update webhook log with purchase_id
    if (webhookLog) {
      await supabase
        .from("payment_webhooks")
        .update({ purchase_id: purchase.id })
        .eq("id", webhookLog.id);
    }

    // Map PagSeguro status to our status
    const mappedStatus = status ? statusMap[status] : "pending";

    // Handle confirmed payments (status 3 or 4)
    if (mappedStatus === "confirmed") {
      const { error: updateError } = await supabase
        .from("purchases")
        .update({
          payment_status: "confirmed",
          payment_confirmed: true,
          paid_at: new Date().toISOString(),
          transaction_code: transactionCode,
          updated_at: new Date().toISOString(),
        })
        .eq("id", purchase.id);

      if (updateError) {
        console.error("Error updating purchase:", updateError);
        return new Response(
          JSON.stringify({ success: false, error: "Failed to update purchase" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("Payment confirmed for purchase:", purchase.id);
    } else if (mappedStatus === "cancelled" || mappedStatus === "refunded") {
      await supabase
        .from("purchases")
        .update({
          payment_status: mappedStatus,
          transaction_code: transactionCode,
          updated_at: new Date().toISOString(),
        })
        .eq("id", purchase.id);

      console.log("Payment cancelled/refunded for purchase:", purchase.id);
    }

    // Mark webhook as processed
    if (webhookLog) {
      await supabase
        .from("payment_webhooks")
        .update({ 
          processed: true, 
          processed_at: new Date().toISOString() 
        })
        .eq("id", webhookLog.id);
    }

    return new Response(
      JSON.stringify({ success: true, purchaseId: purchase.id, status: mappedStatus }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
