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
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Authorization token required')
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Decode and validate token
    let tokenData
    try {
      tokenData = JSON.parse(atob(token))
      if (tokenData.exp < Date.now()) {
        throw new Error('Token expired')
      }
    } catch {
      throw new Error('Invalid token')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log(`Getting round for establishment ${tokenData.establishment_id}`)

    // Get current open round
    const { data: round, error: roundError } = await supabase
      .from('rounds')
      .select('*')
      .in('status', ['open', 'selling'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (roundError && roundError.code !== 'PGRST116') {
      console.error('Error fetching round:', roundError)
      throw new Error('Failed to fetch round')
    }

    if (!round) {
      return new Response(
        JSON.stringify({
          success: true,
          round: null,
          message: 'Nenhuma rodada aberta no momento'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get card count for this establishment in this round
    const { count: establishmentCards } = await supabase
      .from('purchases')
      .select('*', { count: 'exact', head: true })
      .eq('round_id', round.id)
      .eq('establishment_id', tokenData.establishment_id)
      .eq('payment_status', 'approved')

    return new Response(
      JSON.stringify({
        success: true,
        round: {
          id: round.id,
          number: round.number,
          type: round.type,
          status: round.status,
          card_price: round.card_price,
          prize_pool: round.prize_pool,
          cards_sold: round.cards_sold || 0,
          max_cards: round.max_cards,
          starts_at: round.starts_at,
          ends_at: round.ends_at,
          selling_ends_at: round.selling_ends_at
        },
        establishment_cards: establishmentCards || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('Error in pos-get-round:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
