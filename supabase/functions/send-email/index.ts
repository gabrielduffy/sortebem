import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  to: string
  subject?: string
  html?: string
  text?: string
  templateName?: string
  variables?: Record<string, string>
}

interface SMTPConfig {
  enabled: boolean
  host: string
  port: string
  user: string
  password: string
  fromName: string
  fromEmail: string
  secure: boolean
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const body: EmailRequest = await req.json()
    const { to, subject, html, text, templateName, variables } = body

    if (!to) {
      throw new Error('Destinatário (to) é obrigatório')
    }

    // Initialize Supabase client to get settings
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get SMTP config from settings
    const { data: settingsData, error: settingsError } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'smtp_config')
      .single()

    if (settingsError) {
      console.error('Error fetching SMTP settings:', settingsError)
      throw new Error('Falha ao buscar configuração SMTP')
    }

    const config: SMTPConfig = settingsData?.value?.smtp || settingsData?.value
    
    if (!config || !config.host || !config.user || !config.password) {
      throw new Error('Configuração SMTP incompleta. Verifique host, usuário e senha.')
    }

    if (!config.enabled) {
      throw new Error('SMTP não está habilitado nas configurações')
    }

    // Get email content
    let emailSubject = subject || 'Teste de E-mail - Sortebem'
    let emailHtml = html
    let emailText = text

    // If using template, find it
    if (templateName && !html) {
      const templates = settingsData?.value?.templates || []
      const template = templates.find((t: any) => t.name === templateName)
      
      if (template) {
        emailSubject = template.subject
        emailHtml = template.content
        
        // Replace variables in template
        if (variables && emailHtml) {
          Object.entries(variables).forEach(([key, value]) => {
            emailHtml = emailHtml!.replace(new RegExp(`{{${key}}}`, 'g'), value)
            emailSubject = emailSubject.replace(new RegExp(`{{${key}}}`, 'g'), value)
          })
        }
      }
    }

    // If no content, use test content
    if (!emailHtml && !emailText) {
      emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #22c55e;">✅ E-mail de Teste - Sortebem</h1>
          <p>Este é um e-mail de teste enviado pelo sistema Sortebem.</p>
          <p>Se você recebeu este e-mail, significa que a configuração SMTP está funcionando corretamente!</p>
          <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 12px;">
            Enviado em: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
          </p>
        </div>
      `
      emailText = 'E-mail de teste do Sortebem. Se você recebeu este e-mail, a configuração SMTP está funcionando!'
    }

    const port = parseInt(config.port) || 587
    const useSSL = port === 465 || config.secure === true

    console.log(`Connecting to SMTP: ${config.host}:${port}, SSL: ${useSSL}`)
    console.log(`From: ${config.fromEmail || config.user}`)
    console.log(`To: ${to}`)

    // Create base64 encoded credentials for SMTP AUTH
    const credentials = btoa(`\x00${config.user}\x00${config.password}`)
    
    // For now, we'll use a simple HTTP-based email sending approach
    // since SMTP in Deno Edge Functions has compatibility issues
    
    // Try using the MailChannels API which is free for Cloudflare Workers
    // Or use a simple webhook approach
    
    // Alternative: Use fetch to send via an external SMTP relay API
    // For testing purposes, we'll simulate success and log the attempt
    
    // Check if we have a RESEND_API_KEY for Resend integration
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    
    if (resendApiKey) {
      // Use Resend API
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${config.fromName || 'Sortebem'} <${config.fromEmail || config.user}>`,
          to: [to],
          subject: emailSubject,
          html: emailHtml,
          text: emailText,
        }),
      })

      if (!resendResponse.ok) {
        const errorData = await resendResponse.json()
        console.error('Resend API error:', errorData)
        throw new Error(errorData.message || 'Erro ao enviar via Resend')
      }

      const resendData = await resendResponse.json()
      console.log('Email sent via Resend:', resendData)

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'E-mail enviado com sucesso via Resend',
          to,
          subject: emailSubject,
          id: resendData.id
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // If no Resend API key, try using nodemailer-style SMTP via external service
    // For now, return a helpful error message
    console.log('No RESEND_API_KEY found, SMTP direct connection not supported in edge functions')
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Para enviar e-mails, configure a chave RESEND_API_KEY no projeto. O envio direto via SMTP não é suportado em edge functions. Acesse https://resend.com para criar uma conta gratuita.',
        smtp_config: {
          host: config.host,
          port: port,
          user: config.user,
          fromEmail: config.fromEmail
        }
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error: any) {
    console.error('Error sending email:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Erro ao enviar e-mail' 
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
