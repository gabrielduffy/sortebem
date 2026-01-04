import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Generate random card code
function generateCardCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'SB-'
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// Generate random bingo card numbers (25 unique numbers from 1-75)
function generateCardNumbers(): number[] {
  const numbers: number[] = []
  while (numbers.length < 25) {
    const num = Math.floor(Math.random() * 75) + 1
    if (!numbers.includes(num)) {
      numbers.push(num)
    }
  }
  return numbers.sort((a, b) => a - b)
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

    const { 
      quantity, 
      customer_name,
      customer_phone,
      payment_method, 
      payment_reference 
    } = await req.json()

    if (!quantity || quantity < 1) {
      throw new Error('Quantity must be at least 1')
    }

    if (!payment_method) {
      throw new Error('Payment method required')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log(`Creating POS sale: ${quantity} cards for establishment ${tokenData.establishment_id}`)

    // Get current round
    const { data: round, error: roundError } = await supabase
      .from('rounds')
      .select('*')
      .in('status', ['open', 'selling'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (roundError || !round) {
      throw new Error('Nenhuma rodada aberta para venda')
    }

    // Check if selling is still allowed
    const now = new Date()
    const sellingEnds = new Date(round.selling_ends_at)
    if (now > sellingEnds) {
      throw new Error('Vendas encerradas para esta rodada')
    }

    // Check max cards
    const newTotal = (round.cards_sold || 0) + quantity
    if (newTotal > round.max_cards) {
      throw new Error(`Limite de cartelas excedido. Disponíveis: ${round.max_cards - (round.cards_sold || 0)}`)
    }

    const totalAmount = quantity * round.card_price
    const transactionCode = `POS-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    // Create purchase
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .insert({
        round_id: round.id,
        establishment_id: tokenData.establishment_id,
        customer_name: customer_name || 'Cliente POS',
        customer_phone: customer_phone || null,
        quantity,
        unit_price: round.card_price,
        total_amount: totalAmount,
        payment_method: payment_method,
        payment_status: 'approved', // POS payments are instant
        payment_confirmed: true,
        paid_at: new Date().toISOString(),
        transaction_code: transactionCode,
        gateway: 'pos'
      })
      .select()
      .single()

    if (purchaseError) {
      console.error('Error creating purchase:', purchaseError)
      throw new Error('Erro ao criar compra')
    }

    // Generate cards
    const cards = []
    for (let i = 0; i < quantity; i++) {
      const cardCode = generateCardCode()
      const numbers = generateCardNumbers()
      
      const { data: card, error: cardError } = await supabase
        .from('cards')
        .insert({
          purchase_id: purchase.id,
          round_id: round.id,
          code: cardCode,
          numbers,
          status: 'active'
        })
        .select()
        .single()

      if (cardError) {
        console.error('Error creating card:', cardError)
        continue
      }

      cards.push({
        id: card.id,
        code: card.code,
        numbers: card.numbers,
        qr_url: `https://sortebem.com.br/c/${card.code}`
      })
    }

    // Update round cards_sold
    await supabase
      .from('rounds')
      .update({ 
        cards_sold: (round.cards_sold || 0) + quantity 
      })
      .eq('id', round.id)

    console.log(`POS sale completed: ${cards.length} cards created`)

    return new Response(
      JSON.stringify({
        success: true,
        transaction_code: transactionCode,
        purchase_id: purchase.id,
        round_number: round.number,
        quantity,
        total_amount: totalAmount,
        cards
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('Error in pos-create-sale:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
