import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, asaas-access-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface AsaasWebhookPayload {
  event: string;
  payment?: {
    id: string;
    customer: string;
    value: number;
    status: string;
    billingType: string;
    externalReference?: string;
    confirmedDate?: string;
    paymentDate?: string;
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

    // Get the access token from header (sent by Asaas)
    const receivedToken = req.headers.get("asaas-access-token");
    
    // Optionally validate token against saved webhook token
    // This is optional - Asaas sends this header if you configure a token
    if (receivedToken) {
      console.log("Asaas webhook received with access token");
      
      // Get saved webhook token from settings
      const { data: gatewaySettings } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "gateway")
        .maybeSingle();
      
      const savedToken = gatewaySettings?.value?.asaas?.webhookToken;
      
      if (savedToken && savedToken !== receivedToken) {
        console.warn("Webhook token mismatch!");
        return new Response(
          JSON.stringify({ success: false, error: "Invalid webhook token" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Parse webhook payload
    const payload: AsaasWebhookPayload = await req.json();
    
    console.log("Asaas Webhook received:", JSON.stringify(payload));

    // Validate event type
    if (!payload.event) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid payload - missing event" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { event, payment } = payload;

    // Log webhook to database
    const { data: webhookLog, error: logError } = await supabase
      .from("payment_webhooks")
      .insert({
        gateway: "asaas",
        event_type: event,
        payload: payload,
        processed: false,
      })
      .select()
      .single();

    if (logError) {
      console.error("Error logging webhook:", logError);
    }

    // If no payment data, just log and return success
    if (!payment) {
      console.log("Webhook without payment data, event:", event);
      return new Response(
        JSON.stringify({ success: true, message: "Event logged", event }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find purchase by asaas_charge_id or externalReference
    let purchase = null;
    
    // Try by charge_id first
    const { data: purchaseByCharge } = await supabase
      .from("purchases")
      .select("id, payment_status, cards_generated")
      .eq("asaas_charge_id", payment.id)
      .maybeSingle();
    
    purchase = purchaseByCharge;
    
    // If not found, try by externalReference (which is our purchase_id)
    if (!purchase && payment.externalReference) {
      const { data: purchaseByRef } = await supabase
        .from("purchases")
        .select("id, payment_status, cards_generated")
        .eq("id", parseInt(payment.externalReference))
        .maybeSingle();
      
      purchase = purchaseByRef;
      
      // Update the asaas_charge_id if found by reference
      if (purchase) {
        await supabase
          .from("purchases")
          .update({ asaas_charge_id: payment.id })
          .eq("id", purchase.id);
      }
    }

    if (!purchase) {
      console.log("Purchase not found for charge:", payment.id, "ref:", payment.externalReference);
      // Still return success - Asaas might send webhooks for other events
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

    // Handle payment confirmed events
    const confirmedEvents = ["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED"];
    
    if (confirmedEvents.includes(event)) {
      // Update purchase status
      const { error: updateError } = await supabase
        .from("purchases")
        .update({
          payment_status: "confirmed",
          payment_confirmed: true,
          paid_at: payment.confirmedDate || payment.paymentDate || new Date().toISOString(),
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

    // Handle payment failed/cancelled events
    const failedEvents = ["PAYMENT_DELETED", "PAYMENT_REFUNDED", "PAYMENT_OVERDUE"];
    
    if (failedEvents.includes(event)) {
      await supabase
        .from("purchases")
        .update({
          payment_status: event === "PAYMENT_REFUNDED" ? "refunded" : "cancelled",
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

      console.log("Payment failed/cancelled for purchase:", purchase.id);
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
