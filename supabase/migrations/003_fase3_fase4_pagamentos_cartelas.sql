-- =====================================================
-- FASE 3 e FASE 4: PAGAMENTOS E GERAÇÃO DE CARTELAS
-- Data: 2025-01-01
-- Autor: Claude Code
-- Descrição: Integração com Asaas e geração automática de cartelas
-- =====================================================

-- 3.1 - Adicionar colunas para integração Asaas nas purchases
ALTER TABLE purchases
ADD COLUMN IF NOT EXISTS asaas_charge_id TEXT,
ADD COLUMN IF NOT EXISTS asaas_customer_id TEXT,
ADD COLUMN IF NOT EXISTS pix_qr_code TEXT,
ADD COLUMN IF NOT EXISTS pix_expiration TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payment_confirmed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS cards_generated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS cards_generated_at TIMESTAMPTZ;

-- Comentários
COMMENT ON COLUMN purchases.asaas_charge_id IS 'ID da cobrança no Asaas';
COMMENT ON COLUMN purchases.asaas_customer_id IS 'ID do cliente no Asaas';
COMMENT ON COLUMN purchases.pix_qr_code IS 'Código PIX copia e cola';
COMMENT ON COLUMN purchases.pix_expiration IS 'Data de expiração do PIX';
COMMENT ON COLUMN purchases.paid_at IS 'Data/hora de confirmação do pagamento';
COMMENT ON COLUMN purchases.payment_confirmed IS 'Se o pagamento foi confirmado';
COMMENT ON COLUMN purchases.cards_generated IS 'Se as cartelas já foram geradas';
COMMENT ON COLUMN purchases.cards_generated_at IS 'Data/hora de geração das cartelas';

-- 3.2 - Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_purchases_asaas_charge_id
ON purchases(asaas_charge_id)
WHERE asaas_charge_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_purchases_payment_confirmed
ON purchases(payment_confirmed)
WHERE payment_confirmed = true;

CREATE INDEX IF NOT EXISTS idx_purchases_cards_generated
ON purchases(cards_generated)
WHERE cards_generated = false AND payment_confirmed = true;

-- 3.3 - Atualizar tabela payment_webhooks (se já existe, adicionar colunas)
ALTER TABLE payment_webhooks
ADD COLUMN IF NOT EXISTS processed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS error_message TEXT;

COMMENT ON COLUMN payment_webhooks.processed IS 'Se o webhook já foi processado';
COMMENT ON COLUMN payment_webhooks.processed_at IS 'Data/hora de processamento do webhook';
COMMENT ON COLUMN payment_webhooks.error_message IS 'Mensagem de erro se falhou';

-- Criar índice
CREATE INDEX IF NOT EXISTS idx_payment_webhooks_processed
ON payment_webhooks(processed)
WHERE processed = false;

-- 3.4 - Criar função para processar webhook de pagamento
CREATE OR REPLACE FUNCTION process_payment_webhook(
  p_webhook_id BIGINT,
  p_purchase_id BIGINT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_auto_generate BOOLEAN := false;
BEGIN
  -- Marcar purchase como paga
  UPDATE purchases
  SET
    status = 'confirmed',
    paid_at = NOW(),
    payment_confirmed = true,
    updated_at = NOW()
  WHERE id = p_purchase_id;

  IF NOT FOUND THEN
    RAISE NOTICE 'Purchase % not found', p_purchase_id;
    RETURN false;
  END IF;

  -- Marcar webhook como processado
  UPDATE payment_webhooks
  SET
    processed = true,
    processed_at = NOW()
  WHERE id = p_webhook_id;

  -- Verificar feature flag de geração automática
  SELECT enabled INTO v_auto_generate
  FROM feature_flags
  WHERE key = 'auto_generate_cards'
  LIMIT 1;

  -- Se geração automática estiver habilitada, será feita pelo frontend
  -- (a lógica complexa de geração fica no TypeScript)
  IF v_auto_generate THEN
    RAISE NOTICE 'Auto-generate flag enabled for purchase %', p_purchase_id;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION process_payment_webhook IS 'Processa webhook de pagamento confirmado';

GRANT EXECUTE ON FUNCTION process_payment_webhook TO anon, authenticated, service_role;

-- 3.5 - Registrar migrations
INSERT INTO schema_migrations (version, description) VALUES
  (10, 'Colunas Asaas adicionadas em purchases'),
  (11, 'Colunas de geração de cartelas adicionadas'),
  (12, 'Índices de performance criados'),
  (13, 'Função process_payment_webhook criada')
ON CONFLICT (version) DO NOTHING;
