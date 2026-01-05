import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    const relayUrl = Deno.env.get("MAIL_RELAY_URL")!;
    const apiKey = Deno.env.get("MAIL_RELAY_API_KEY")!;

    console.log(`Sending email via relay to: ${body.to}`);

    const r = await fetch(`${relayUrl}/send-email`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        apiKey,
        to: body.to,
        subject: body.subject,
        text: body.text,
        html: body.html,
      }),
    });

    const data = await r.json();
    console.log(`Relay response: ${r.status}`, data);

    return new Response(JSON.stringify(data), {
      status: r.status,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  } catch (e: any) {
    console.error("Error sending email:", e);
    return new Response(
      JSON.stringify({ ok: false, error: String(e?.message || e) }),
      { status: 500, headers: { ...corsHeaders, "content-type": "application/json" } }
    );
  }
});
