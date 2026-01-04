import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { terminal_code, api_key } = await req.json()

    if (!terminal_code || !api_key) {
      throw new Error('Terminal code and API key are required')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log(`Authenticating terminal: ${terminal_code}`)

    // Find terminal by code and api_key
    const { data: terminal, error: terminalError } = await supabase
      .from('pos_terminals')
      .select(`
        id,
        terminal_code,
        name,
        is_active,
        establishment_id,
        establishments (
          id,
          name,
          code,
          is_active
        )
      `)
      .eq('terminal_code', terminal_code)
      .eq('api_key', api_key)
      .single()

    if (terminalError || !terminal) {
      console.error('Terminal not found or invalid API key:', terminalError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Terminal não encontrado ou API Key inválida' 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!terminal.is_active) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Terminal desativado' 
        }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const establishment = terminal.establishments as any
    if (!establishment?.is_active) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Estabelecimento desativado' 
        }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Update last heartbeat
    await supabase
      .from('pos_terminals')
      .update({ last_heartbeat: new Date().toISOString() })
      .eq('id', terminal.id)

    // Generate session token (simple JWT-like token)
    const sessionToken = btoa(JSON.stringify({
      terminal_id: terminal.id,
      establishment_id: terminal.establishment_id,
      exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    }))

    console.log(`Terminal ${terminal_code} authenticated successfully`)

    return new Response(
      JSON.stringify({
        success: true,
        token: sessionToken,
        terminal: {
          id: terminal.id,
          name: terminal.name,
          code: terminal.terminal_code
        },
        establishment: {
          id: establishment.id,
          name: establishment.name,
          code: establishment.code
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('Error in pos-auth:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
