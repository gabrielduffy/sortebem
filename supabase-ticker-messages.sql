-- ============================================
-- TABELA: ticker_messages
-- Armazena mensagens do letreiro (ticker) da TV Mode
-- ============================================

CREATE TABLE IF NOT EXISTS ticker_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message TEXT NOT NULL,
  icon TEXT DEFAULT '📢', -- Emoji ou ícone para exibir antes da mensagem
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index para ordenação e filtragem
CREATE INDEX idx_ticker_messages_active_order ON ticker_messages(is_active, display_order);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_ticker_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ticker_messages_updated_at
  BEFORE UPDATE ON ticker_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_ticker_messages_updated_at();

-- Inserir mensagens padrão
INSERT INTO ticker_messages (message, icon, is_active, display_order) VALUES
  ('Rodadas a cada 10 minutos • Cartelas a partir de R$ 5,00', '🎁', true, 1),
  ('Participe pelo QR Code ou acesse www.sortebem.com.br', '📱', true, 2),
  ('Ajudando instituições beneficentes que transformam vidas', '💝', true, 3),
  ('Sorteios 100% transparentes e seguros', '🔒', true, 4),
  ('Ganhe prêmios incríveis e ajude quem precisa!', '🏆', true, 5);

-- Comentários
COMMENT ON TABLE ticker_messages IS 'Mensagens do letreiro (ticker) exibidas no rodapé da TV Mode';
COMMENT ON COLUMN ticker_messages.message IS 'Texto da mensagem a ser exibida no ticker';
COMMENT ON COLUMN ticker_messages.icon IS 'Emoji ou ícone exibido antes da mensagem';
COMMENT ON COLUMN ticker_messages.is_active IS 'Se a mensagem está ativa e deve ser exibida';
COMMENT ON COLUMN ticker_messages.display_order IS 'Ordem de exibição (menor = primeiro)';
