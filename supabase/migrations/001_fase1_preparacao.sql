-- =====================================================
-- FASE 1: PREPARAÇÃO E INFRAESTRUTURA
-- Data: 2025-01-01
-- Autor: Claude Code
-- Descrição: Setup inicial sem impacto no sistema atual
-- =====================================================

-- 1.1 - Criar tabela de feature flags
CREATE TABLE IF NOT EXISTS feature_flags (
  key TEXT PRIMARY KEY,
  enabled BOOLEAN DEFAULT false,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_feature_flags_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_feature_flags_updated_at
  BEFORE UPDATE ON feature_flags
  FOR EACH ROW
  EXECUTE FUNCTION update_feature_flags_updated_at();

-- Inserir feature flags que vamos usar
INSERT INTO feature_flags (key, description, enabled) VALUES
  ('use_bcrypt_auth', 'Usar bcrypt para autenticação de senhas', false),
  ('use_signed_jwt', 'Usar JWT assinado com jose library', false),
  ('use_asaas_pix', 'Usar Asaas para gerar PIX real', false),
  ('auto_generate_cards', 'Gerar cartelas automaticamente após pagamento', false),
  ('use_webhook_payment', 'Usar webhook ao invés de polling para confirmação', false),
  ('use_realtime_updates', 'Usar Supabase Realtime para updates', false)
ON CONFLICT (key) DO NOTHING;

-- Habilitar RLS na tabela feature_flags
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

-- Política: Todos podem ler feature flags (necessário para o frontend)
CREATE POLICY "Anyone can read feature flags"
ON feature_flags FOR SELECT
USING (true);

-- Política: Apenas admins podem modificar
CREATE POLICY "Only admins can modify feature flags"
ON feature_flags
FOR ALL
USING ((auth.jwt() ->> 'role'::text) = 'admin'::text);

-- 1.2 - Popular tabela settings com configurações padrão
INSERT INTO settings (key, value, description, is_public) VALUES
  ('card_price_regular', '{"price": 5.00}'::jsonb, 'Preço da cartela regular em reais', true),
  ('card_price_special', '{"price": 10.00}'::jsonb, 'Preço da cartela especial em reais', true),
  ('regular_prize', '{"amount": 150}'::jsonb, 'Valor do prêmio de rodada regular', true),
  ('special_prize', '{"amount": 5000}'::jsonb, 'Valor do prêmio de rodada especial', true),
  ('accumulated_prize', '{"amount": 12500}'::jsonb, 'Valor do prêmio acumulado', true),
  ('max_cards_per_purchase', '{"max": 100}'::jsonb, 'Máximo de cartelas permitidas por compra', true),
  ('asaas_config', '{"api_key": "", "environment": "sandbox", "enabled": false}'::jsonb, 'Configurações da API Asaas', false),
  ('pagseguro_config', '{"token": "", "environment": "sandbox", "enabled": false}'::jsonb, 'Configurações da API PagSeguro', false),
  ('whatsapp_config', '{"api_url": "", "api_key": "", "enabled": false}'::jsonb, 'Configurações da API WhatsApp', false)
ON CONFLICT (key) DO NOTHING;

-- 1.3 - Criar tabela de controle de migrações
CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  description TEXT NOT NULL,
  executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir registro das migrações executadas
INSERT INTO schema_migrations (version, description) VALUES
  (1, 'Schema inicial exportado'),
  (2, 'Tabela feature_flags criada'),
  (3, 'Tabela settings populada com valores padrão'),
  (4, 'Tabela schema_migrations criada')
ON CONFLICT (version) DO NOTHING;

-- Adicionar comentários para documentação
COMMENT ON TABLE feature_flags IS 'Controle de feature flags para rollout gradual de funcionalidades';
COMMENT ON COLUMN feature_flags.key IS 'Identificador único da feature';
COMMENT ON COLUMN feature_flags.enabled IS 'Se a feature está habilitada (true) ou desabilitada (false)';
COMMENT ON COLUMN feature_flags.description IS 'Descrição do que a feature faz';

COMMENT ON TABLE schema_migrations IS 'Histórico de migrações executadas no banco de dados';
COMMENT ON COLUMN schema_migrations.version IS 'Número sequencial da migração';
COMMENT ON COLUMN schema_migrations.description IS 'Descrição do que a migração fez';

-- Grant permissions
GRANT ALL ON TABLE feature_flags TO anon, authenticated, service_role;
GRANT ALL ON TABLE schema_migrations TO anon, authenticated, service_role;
