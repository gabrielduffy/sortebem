import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { text, voiceId, modelId } = await req.json()

    if (!text) {
      throw new Error('Text is required')
    }

    // Initialize Supabase client to get settings
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get ElevenLabs config from settings
    const { data: settingsData, error: settingsError } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'elevenlabs_config')
      .single()

    if (settingsError) {
      console.error('Error fetching settings:', settingsError)
      throw new Error('Failed to fetch ElevenLabs configuration')
    }

    const config = settingsData?.value || {}
    const apiKey = config.apiKey
    const defaultVoiceId = config.voiceId || 'EXAVITQu4vr4xnSDxMaL' // Sarah
    const defaultModelId = config.modelId || 'eleven_multilingual_v2'

    if (!apiKey) {
      throw new Error('ElevenLabs API Key not configured')
    }

    const finalVoiceId = voiceId || defaultVoiceId
    const finalModelId = modelId || defaultModelId

    console.log(`Generating speech for: "${text}" with voice ${finalVoiceId}`)

    // Call ElevenLabs API
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${finalVoiceId}?output_format=mp3_44100_128`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: finalModelId,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.5,
            use_speaker_boost: true,
          },
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('ElevenLabs API error:', errorText)
      throw new Error(`ElevenLabs API error: ${response.status}`)
    }

    // Get audio as array buffer and convert to base64
    const arrayBuffer = await response.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)
    
    // Convert to base64 using Deno's built-in encoding
    const base64Audio = btoa(
      uint8Array.reduce((data, byte) => data + String.fromCharCode(byte), '')
    )

    console.log(`Successfully generated audio (${uint8Array.length} bytes)`)

    return new Response(
      JSON.stringify({ 
        audioContent: base64Audio,
        format: 'mp3',
        text: text 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error: any) {
    console.error('Error in elevenlabs-tts:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
