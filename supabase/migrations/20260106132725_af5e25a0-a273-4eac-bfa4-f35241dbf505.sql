-- =====================================================
-- FASE 1: Corrigir RLS para groq_prompts
-- =====================================================

-- Habilitar RLS na tabela groq_prompts (se não estiver)
ALTER TABLE public.groq_prompts ENABLE ROW LEVEL SECURITY;

-- Permitir leitura de prompts para qualquer usuário (prompts são públicos)
CREATE POLICY "Allow public read prompts" 
ON public.groq_prompts 
FOR SELECT 
USING (true);

-- Permitir admins gerenciar prompts (insert, update, delete)
CREATE POLICY "Admins can manage prompts" 
ON public.groq_prompts 
FOR ALL 
USING (public.is_admin());

-- =====================================================
-- FASE 2: Ativar Feature Flags para Produção
-- =====================================================

-- Ativar flags críticas
UPDATE public.feature_flags 
SET enabled = true, updated_at = NOW() 
WHERE key IN (
  'use_asaas_pix',
  'use_webhook_payment',
  'use_bcrypt_auth'
);

-- =====================================================
-- FASE 3: Corrigir RLS para groq_usage_logs
-- =====================================================

-- Habilitar RLS na tabela groq_usage_logs
ALTER TABLE public.groq_usage_logs ENABLE ROW LEVEL SECURITY;

-- Permitir inserção via função (já é SECURITY DEFINER)
CREATE POLICY "Allow insert via function" 
ON public.groq_usage_logs 
FOR INSERT 
WITH CHECK (true);

-- Permitir admins ver logs
CREATE POLICY "Admins can view usage logs" 
ON public.groq_usage_logs 
FOR SELECT 
USING (public.is_admin());