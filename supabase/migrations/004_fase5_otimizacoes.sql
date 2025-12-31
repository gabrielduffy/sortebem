-- =====================================================
-- FASE 5: OTIMIZAÇÕES DE PERFORMANCE
-- Data: 2025-01-01
-- Autor: Claude Code
-- Descrição: Índices otimizados, materialized views e realtime
-- =====================================================

-- 5.1 - ÍNDICES OTIMIZADOS PARA QUERIES FREQUENTES
-- =====================================================

-- Índice composto para buscar rodadas ativas de um estabelecimento
CREATE INDEX IF NOT EXISTS idx_rounds_establishment_status_date
ON rounds(establishment_id, status, draw_date)
WHERE status IN ('open', 'in_progress');

-- Índice para buscar purchases de um usuário ordenadas por data
CREATE INDEX IF NOT EXISTS idx_purchases_user_created
ON purchases(user_id, created_at DESC)
WHERE user_id IS NOT NULL;

-- Índice para buscar cartelas de uma rodada específica
CREATE INDEX IF NOT EXISTS idx_cards_round_purchase
ON cards(round_id, purchase_id);

-- Índice para buscar números sorteados de uma rodada
CREATE INDEX IF NOT EXISTS idx_drawn_numbers_round_order
ON drawn_numbers(round_id, draw_order);

-- Índice para buscar estabelecimentos ativos
CREATE INDEX IF NOT EXISTS idx_establishments_active
ON establishments(is_active)
WHERE is_active = true;

-- Índice para feature flags habilitadas
CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled
ON feature_flags(enabled)
WHERE enabled = true;

-- Índice para webhooks não processados (importante para filas)
CREATE INDEX IF NOT EXISTS idx_payment_webhooks_created
ON payment_webhooks(created_at DESC)
WHERE processed = false;

-- 5.2 - MATERIALIZED VIEW PARA ESTATÍSTICAS
-- =====================================================

-- View materializada com estatísticas de rodadas por estabelecimento
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_establishment_stats AS
SELECT
  e.id as establishment_id,
  e.name as establishment_name,
  COUNT(DISTINCT r.id) as total_rounds,
  COUNT(DISTINCT CASE WHEN r.status = 'completed' THEN r.id END) as completed_rounds,
  COUNT(DISTINCT CASE WHEN r.status = 'in_progress' THEN r.id END) as active_rounds,
  COUNT(DISTINCT p.id) as total_purchases,
  COALESCE(SUM(p.total_amount), 0) as total_revenue,
  COUNT(DISTINCT c.id) as total_cards_sold,
  COUNT(DISTINCT w.id) as total_winners,
  MAX(r.draw_date) as last_round_date,
  NOW() as last_updated
FROM establishments e
LEFT JOIN rounds r ON r.establishment_id = e.id
LEFT JOIN purchases p ON p.round_id = r.id AND p.payment_confirmed = true
LEFT JOIN cards c ON c.purchase_id = p.id
LEFT JOIN winners w ON w.round_id = r.id
GROUP BY e.id, e.name;

-- Índice na view materializada
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_establishment_stats_id
ON mv_establishment_stats(establishment_id);

-- Comentários
COMMENT ON MATERIALIZED VIEW mv_establishment_stats IS 'Estatísticas agregadas por estabelecimento (atualizar a cada 5 minutos)';

-- 5.3 - FUNÇÃO PARA ATUALIZAR MATERIALIZED VIEW
-- =====================================================

CREATE OR REPLACE FUNCTION refresh_establishment_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_establishment_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION refresh_establishment_stats IS 'Atualiza as estatísticas de estabelecimentos (executar via cron job)';

GRANT EXECUTE ON FUNCTION refresh_establishment_stats TO authenticated, service_role;

-- 5.4 - VIEW PARA DASHBOARD DE RODADAS ATIVAS
-- =====================================================

-- View otimizada para o dashboard principal
CREATE OR REPLACE VIEW v_active_rounds_dashboard AS
SELECT
  r.id,
  r.establishment_id,
  e.name as establishment_name,
  e.logo_url as establishment_logo,
  r.draw_date,
  r.prize,
  r.card_price,
  r.status,
  r.type,
  COUNT(DISTINCT p.id) FILTER (WHERE p.payment_confirmed = true) as total_purchases,
  COUNT(DISTINCT c.id) as total_cards_sold,
  COALESCE(SUM(p.total_amount) FILTER (WHERE p.payment_confirmed = true), 0) as current_pot,
  (
    SELECT COUNT(*)
    FROM drawn_numbers dn
    WHERE dn.round_id = r.id
  ) as numbers_drawn,
  r.created_at,
  r.updated_at
FROM rounds r
INNER JOIN establishments e ON e.id = r.establishment_id
LEFT JOIN purchases p ON p.round_id = r.id
LEFT JOIN cards c ON c.purchase_id = p.id
WHERE r.status IN ('open', 'in_progress')
  AND e.is_active = true
GROUP BY r.id, e.id, e.name, e.logo_url
ORDER BY r.draw_date ASC;

COMMENT ON VIEW v_active_rounds_dashboard IS 'Dashboard de rodadas ativas com estatísticas agregadas';

-- 5.5 - VIEW PARA HISTÓRICO DE COMPRAS DO USUÁRIO
-- =====================================================

CREATE OR REPLACE VIEW v_user_purchases AS
SELECT
  p.id,
  p.user_id,
  p.round_id,
  r.draw_date,
  r.prize,
  r.status as round_status,
  e.name as establishment_name,
  e.logo_url as establishment_logo,
  p.quantity,
  p.total_amount,
  p.payment_method,
  p.payment_status,
  p.payment_confirmed,
  p.cards_generated,
  p.created_at,
  (
    SELECT json_agg(
      json_build_object(
        'id', c.id,
        'card_number', c.card_number,
        'numbers', c.numbers,
        'is_winner', EXISTS(
          SELECT 1 FROM winners w
          WHERE w.card_id = c.id
        )
      ) ORDER BY c.card_number
    )
    FROM cards c
    WHERE c.purchase_id = p.id
  ) as cards
FROM purchases p
INNER JOIN rounds r ON r.id = p.round_id
INNER JOIN establishments e ON e.id = r.establishment_id
ORDER BY p.created_at DESC;

COMMENT ON VIEW v_user_purchases IS 'Histórico de compras do usuário com cartelas e status';

-- 5.6 - TRIGGER PARA AUTO-REFRESH DE ESTATÍSTICAS
-- =====================================================

-- Função que será chamada pelo trigger
CREATE OR REPLACE FUNCTION trigger_refresh_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Apenas notificar, o refresh será feito por cron job
  -- para evitar overhead em cada INSERT/UPDATE
  PERFORM pg_notify('stats_changed', NEW.establishment_id::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger em purchases quando confirmado pagamento
CREATE OR REPLACE TRIGGER trg_purchases_stats
AFTER INSERT OR UPDATE OF payment_confirmed
ON purchases
FOR EACH ROW
WHEN (NEW.payment_confirmed = true)
EXECUTE FUNCTION trigger_refresh_stats();

-- Trigger em rounds quando status muda
CREATE OR REPLACE TRIGGER trg_rounds_stats
AFTER INSERT OR UPDATE OF status
ON rounds
FOR EACH ROW
EXECUTE FUNCTION trigger_refresh_stats();

COMMENT ON FUNCTION trigger_refresh_stats IS 'Notifica mudanças para atualização de estatísticas';

-- 5.7 - ENABLE REALTIME PARA TABELAS CRÍTICAS
-- =====================================================

-- Habilitar realtime nas tabelas principais
-- Nota: executar manualmente no Supabase Dashboard > Database > Replication
-- ou via SQL:

ALTER PUBLICATION supabase_realtime ADD TABLE rounds;
ALTER PUBLICATION supabase_realtime ADD TABLE drawn_numbers;
ALTER PUBLICATION supabase_realtime ADD TABLE purchases;
ALTER PUBLICATION supabase_realtime ADD TABLE cards;
ALTER PUBLICATION supabase_realtime ADD TABLE winners;

-- 5.8 - VACUUM E ANALYZE AUTOMÁTICO
-- =====================================================

-- Garantir que estatísticas do PostgreSQL estão atualizadas
ANALYZE rounds;
ANALYZE purchases;
ANALYZE cards;
ANALYZE drawn_numbers;
ANALYZE establishments;

-- 5.9 - CONFIGURAÇÕES DE PERFORMANCE
-- =====================================================

-- Aumentar work_mem para queries complexas (executar como superuser)
-- ALTER SYSTEM SET work_mem = '16MB';

-- Aumentar shared_buffers (executar como superuser)
-- ALTER SYSTEM SET shared_buffers = '256MB';

-- Nota: essas configurações requerem restart do PostgreSQL
-- e devem ser ajustadas conforme recursos disponíveis

-- 5.10 - REGISTRAR MIGRATIONS
-- =====================================================

INSERT INTO schema_migrations (version, description) VALUES
  (14, 'Índices otimizados criados'),
  (15, 'Materialized view de estatísticas criada'),
  (16, 'Views de dashboard criadas'),
  (17, 'Triggers de notificação criados'),
  (18, 'Realtime habilitado em tabelas principais')
ON CONFLICT (version) DO NOTHING;

-- =====================================================
-- FIM DA FASE 5
-- =====================================================
