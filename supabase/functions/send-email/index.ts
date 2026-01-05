import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts"

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
    // Port 465 uses implicit TLS (set tls: true)
    // Port 587 uses STARTTLS (set tls: false, will upgrade automatically)
    const useTLS = port === 465
    
    console.log(`Connecting to SMTP: ${config.host}:${port}, TLS: ${useTLS}`)
    console.log(`From: ${config.fromEmail || config.user}`)
    console.log(`To: ${to}`)

    // Create SMTP client with explicit TLS settings
    const client = new SMTPClient({
      connection: {
        hostname: config.host,
        port: port,
        tls: useTLS, // Only true for port 465
        auth: {
          username: config.user,
          password: config.password,
        },
      },
    })

    console.log('Sending email...')

    // Send email
    await client.send({
      from: config.fromEmail || config.user,
      to: to,
      subject: emailSubject,
      content: emailText || 'E-mail enviado pelo Sortebem',
      html: emailHtml,
    })

    console.log('Email sent successfully!')

    await client.close()

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'E-mail enviado com sucesso',
        to,
        subject: emailSubject
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error: any) {
    console.error('Error sending email:', error)
    
    // Provide helpful error messages
    let errorMessage = error.message || 'Erro ao enviar e-mail'
    
    if (errorMessage.includes('InvalidContentType') || errorMessage.includes('BadResource')) {
      errorMessage = 'Erro de conexão SMTP. Tente alterar a porta para 465 (SSL) nas configurações.'
    }
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
