import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-event, x-webhook-timestamp",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface PixGoWebhookPayload {
  event: "payment.completed" | "payment.expired" | "payment.refunded";
  timestamp: string;
  data: {
    payment_id: string;
    external_id?: string;
    amount: number;
    status: string;
    payer_name?: string;
    payer_cpf?: string;
    payer_phone?: string;
    description?: string;
    created_at: string;
    completed_at?: string;
    expired_at?: string;
    refunded_at?: string;
  };
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse webhook payload
    const payload: PixGoWebhookPayload = await req.json();
    
    console.log("PixGo Webhook received:", JSON.stringify(payload));

    // Get webhook event from header (optional validation)
    const webhookEvent = req.headers.get("x-webhook-event");
    console.log("Webhook event header:", webhookEvent);

    // Validate payload structure
    if (!payload.event || !payload.data) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid payload structure" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { event, data } = payload;

    // Log webhook to database
    const { data: webhookLog, error: logError } = await supabase
      .from("payment_webhooks")
      .insert({
        gateway: "pixgo",
        event_type: event,
        payload: payload,
        processed: false,
      })
      .select()
      .single();

    if (logError) {
      console.error("Error logging webhook:", logError);
    }

    // Find purchase by pixgo_payment_id or external_id
    let purchase = null;
    
    // Try by payment_id first (stored as pixgo_payment_id)
    const { data: purchaseByPaymentId } = await supabase
      .from("purchases")
      .select("id, payment_status, cards_generated")
      .eq("pixgo_payment_id", data.payment_id)
      .maybeSingle();
    
    purchase = purchaseByPaymentId;
    
    // If not found, try by external_id (which is our purchase_id)
    if (!purchase && data.external_id) {
      const { data: purchaseByRef } = await supabase
        .from("purchases")
        .select("id, payment_status, cards_generated")
        .eq("id", parseInt(data.external_id))
        .maybeSingle();
      
      purchase = purchaseByRef;
      
      // Update the pixgo_payment_id if found by reference
      if (purchase) {
        await supabase
          .from("purchases")
          .update({ pixgo_payment_id: data.payment_id })
          .eq("id", purchase.id);
      }
    }

    if (!purchase) {
      console.log("Purchase not found for payment:", data.payment_id, "external_id:", data.external_id);
      return new Response(
        JSON.stringify({ success: true, message: "Purchase not found, event logged" }),
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

    // Handle payment.completed event
    if (event === "payment.completed") {
      const { error: updateError } = await supabase
        .from("purchases")
        .update({
          payment_status: "confirmed",
          payment_confirmed: true,
          paid_at: data.completed_at || new Date().toISOString(),
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

      console.log("Payment confirmed for purchase:", purchase.id);
    }

    // Handle payment.expired event
    if (event === "payment.expired") {
      await supabase
        .from("purchases")
        .update({
          payment_status: "expired",
          updated_at: new Date().toISOString(),
        })
        .eq("id", purchase.id);

      if (webhookLog) {
        await supabase
          .from("payment_webhooks")
          .update({ 
            processed: true, 
            processed_at: new Date().toISOString() 
          })
          .eq("id", webhookLog.id);
      }

      console.log("Payment expired for purchase:", purchase.id);
    }

    // Handle payment.refunded event
    if (event === "payment.refunded") {
      await supabase
        .from("purchases")
        .update({
          payment_status: "refunded",
          updated_at: new Date().toISOString(),
        })
        .eq("id", purchase.id);

      if (webhookLog) {
        await supabase
          .from("payment_webhooks")
          .update({ 
            processed: true, 
            processed_at: new Date().toISOString() 
          })
          .eq("id", webhookLog.id);
      }

      console.log("Payment refunded for purchase:", purchase.id);
    }

    return new Response(
      JSON.stringify({ success: true, event, purchaseId: purchase.id }),
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
