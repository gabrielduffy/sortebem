-- =====================================================
-- FASE 8: CRIAÇÃO MANUAL DE RODADAS COM VALIDAÇÃO
-- Data: 2025-01-01
-- Autor: Claude Code
-- Descrição: Permite criar rodadas manualmente com validação de conflitos
-- =====================================================

-- 8.1 - ADICIONAR COLUNAS À TABELA ROUNDS
-- =====================================================

-- Adicionar colunas para configuração avançada de rodadas
ALTER TABLE rounds
ADD COLUMN IF NOT EXISTS manual_creation BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS winner_criteria TEXT DEFAULT 'full_card',
ADD COLUMN IF NOT EXISTS tiebreak_rule TEXT DEFAULT 'first_marked',
ADD COLUMN IF NOT EXISTS min_participants INTEGER,
ADD COLUMN IF NOT EXISTS max_participants INTEGER,
ADD COLUMN IF NOT EXISTS draw_time TIME,
ADD COLUMN IF NOT EXISTS allow_late_entry BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS late_entry_cutoff_minutes INTEGER DEFAULT 5;

-- Comentários
COMMENT ON COLUMN rounds.manual_creation IS 'Se a rodada foi criada manualmente pelo admin';
COMMENT ON COLUMN rounds.winner_criteria IS 'Critério de vitória: full_card (cartela cheia), line (linha), pattern (padrão específico)';
COMMENT ON COLUMN rounds.tiebreak_rule IS 'Regra de desempate: first_marked (primeiro a marcar), split_prize (dividir prêmio), draw (sorteio)';
COMMENT ON COLUMN rounds.min_participants IS 'Número mínimo de participantes para rodada acontecer';
COMMENT ON COLUMN rounds.max_participants IS 'Número máximo de participantes permitido';
COMMENT ON COLUMN rounds.draw_time IS 'Horário específico do sorteio';
COMMENT ON COLUMN rounds.allow_late_entry IS 'Permite entrada após início do sorteio';
COMMENT ON COLUMN rounds.late_entry_cutoff_minutes IS 'Minutos após início que ainda permite entrada';

-- 8.2 - FUNÇÃO PARA VALIDAR CONFLITOS DE HORÁRIO
-- =====================================================

CREATE OR REPLACE FUNCTION validate_round_time_conflict(
  p_establishment_id BIGINT,
  p_draw_date TIMESTAMPTZ,
  p_draw_time TIME DEFAULT NULL,
  p_exclude_round_id BIGINT DEFAULT NULL
)
RETURNS TABLE(
  has_conflict BOOLEAN,
  conflicting_rounds JSONB
) AS $$
DECLARE
  v_start_time TIMESTAMPTZ;
  v_end_time TIMESTAMPTZ;
  v_conflicts JSONB;
BEGIN
  -- Calcular janela de tempo (±30 minutos)
  IF p_draw_time IS NOT NULL THEN
    v_start_time := (p_draw_date::DATE + p_draw_time) - INTERVAL '30 minutes';
    v_end_time := (p_draw_date::DATE + p_draw_time) + INTERVAL '30 minutes';
  ELSE
    v_start_time := p_draw_date - INTERVAL '30 minutes';
    v_end_time := p_draw_date + INTERVAL '30 minutes';
  END IF;

  -- Buscar rodadas conflitantes
  SELECT json_agg(
    json_build_object(
      'id', r.id,
      'draw_date', r.draw_date,
      'draw_time', r.draw_time,
      'prize', r.prize,
      'status', r.status
    )
  ) INTO v_conflicts
  FROM rounds r
  WHERE r.establishment_id = p_establishment_id
    AND r.status IN ('open', 'in_progress', 'scheduled')
    AND (p_exclude_round_id IS NULL OR r.id != p_exclude_round_id)
    AND (
      -- Se a rodada existente tem draw_time
      (r.draw_time IS NOT NULL AND
        (r.draw_date::DATE + r.draw_time) BETWEEN v_start_time AND v_end_time)
      OR
      -- Se a rodada existente não tem draw_time
      (r.draw_time IS NULL AND
        r.draw_date BETWEEN v_start_time AND v_end_time)
    );

  -- Retornar resultado
  IF v_conflicts IS NOT NULL THEN
    RETURN QUERY SELECT true, v_conflicts;
  ELSE
    RETURN QUERY SELECT false, '[]'::JSONB;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION validate_round_time_conflict IS 'Valida se há conflito de horário na criação de rodada (±30 minutos)';

GRANT EXECUTE ON FUNCTION validate_round_time_conflict TO authenticated, service_role;

-- 8.3 - FUNÇÃO PARA CRIAR RODADA MANUALMENTE
-- =====================================================

CREATE OR REPLACE FUNCTION create_manual_round(
  p_establishment_id BIGINT,
  p_draw_date DATE,
  p_draw_time TIME,
  p_prize DECIMAL,
  p_card_price DECIMAL,
  p_winner_criteria TEXT DEFAULT 'full_card',
  p_tiebreak_rule TEXT DEFAULT 'first_marked',
  p_min_participants INTEGER DEFAULT NULL,
  p_max_participants INTEGER DEFAULT NULL,
  p_type TEXT DEFAULT 'regular',
  p_description TEXT DEFAULT NULL,
  p_created_by BIGINT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_round_id BIGINT;
  v_draw_datetime TIMESTAMPTZ;
  v_conflict_check RECORD;
BEGIN
  -- Combinar data e hora
  v_draw_datetime := p_draw_date::TIMESTAMP + p_draw_time;

  -- Validar conflitos de horário
  SELECT * INTO v_conflict_check
  FROM validate_round_time_conflict(p_establishment_id, v_draw_datetime, p_draw_time);

  IF v_conflict_check.has_conflict THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Conflito de horário detectado',
      'conflicting_rounds', v_conflict_check.conflicting_rounds
    );
  END IF;

  -- Validações de negócio
  IF p_prize <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Prêmio deve ser maior que zero');
  END IF;

  IF p_card_price <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Preço da cartela deve ser maior que zero');
  END IF;

  IF p_min_participants IS NOT NULL AND p_max_participants IS NOT NULL THEN
    IF p_min_participants > p_max_participants THEN
      RETURN json_build_object('success', false, 'error', 'Mínimo de participantes não pode ser maior que máximo');
    END IF;
  END IF;

  -- Criar rodada
  INSERT INTO rounds (
    establishment_id,
    draw_date,
    draw_time,
    prize,
    card_price,
    winner_criteria,
    tiebreak_rule,
    min_participants,
    max_participants,
    type,
    description,
    status,
    manual_creation,
    created_at
  ) VALUES (
    p_establishment_id,
    v_draw_datetime,
    p_draw_time,
    p_prize,
    p_card_price,
    p_winner_criteria,
    p_tiebreak_rule,
    p_min_participants,
    p_max_participants,
    p_type,
    p_description,
    'scheduled',
    true,
    NOW()
  )
  RETURNING id INTO v_round_id;

  RETURN json_build_object(
    'success', true,
    'round_id', v_round_id,
    'draw_datetime', v_draw_datetime
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION create_manual_round IS 'Cria rodada manualmente com validações de conflito e negócio';

GRANT EXECUTE ON FUNCTION create_manual_round TO authenticated, service_role;

-- 8.4 - FUNÇÃO PARA ATUALIZAR RODADA COM VALIDAÇÃO
-- =====================================================

CREATE OR REPLACE FUNCTION update_manual_round(
  p_round_id BIGINT,
  p_draw_date DATE DEFAULT NULL,
  p_draw_time TIME DEFAULT NULL,
  p_prize DECIMAL DEFAULT NULL,
  p_card_price DECIMAL DEFAULT NULL,
  p_winner_criteria TEXT DEFAULT NULL,
  p_tiebreak_rule TEXT DEFAULT NULL,
  p_min_participants INTEGER DEFAULT NULL,
  p_max_participants INTEGER DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_round RECORD;
  v_draw_datetime TIMESTAMPTZ;
  v_conflict_check RECORD;
  v_updates_count INTEGER := 0;
BEGIN
  -- Buscar rodada existente
  SELECT * INTO v_round FROM rounds WHERE id = p_round_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Rodada não encontrada');
  END IF;

  -- Se mudou data/hora, validar conflitos
  IF p_draw_date IS NOT NULL OR p_draw_time IS NOT NULL THEN
    v_draw_datetime := COALESCE(p_draw_date::TIMESTAMP, v_round.draw_date::TIMESTAMP) +
                       COALESCE(p_draw_time, v_round.draw_time);

    SELECT * INTO v_conflict_check
    FROM validate_round_time_conflict(
      v_round.establishment_id,
      v_draw_datetime,
      COALESCE(p_draw_time, v_round.draw_time),
      p_round_id
    );

    IF v_conflict_check.has_conflict THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Conflito de horário detectado',
        'conflicting_rounds', v_conflict_check.conflicting_rounds
      );
    END IF;
  END IF;

  -- Atualizar rodada
  UPDATE rounds SET
    draw_date = COALESCE(
      (COALESCE(p_draw_date::TIMESTAMP, draw_date::TIMESTAMP) + COALESCE(p_draw_time, draw_time)),
      draw_date
    ),
    draw_time = COALESCE(p_draw_time, draw_time),
    prize = COALESCE(p_prize, prize),
    card_price = COALESCE(p_card_price, card_price),
    winner_criteria = COALESCE(p_winner_criteria, winner_criteria),
    tiebreak_rule = COALESCE(p_tiebreak_rule, tiebreak_rule),
    min_participants = COALESCE(p_min_participants, min_participants),
    max_participants = COALESCE(p_max_participants, max_participants),
    description = COALESCE(p_description, description),
    updated_at = NOW()
  WHERE id = p_round_id;

  GET DIAGNOSTICS v_updates_count = ROW_COUNT;

  RETURN json_build_object(
    'success', true,
    'updated', v_updates_count > 0
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION update_manual_round IS 'Atualiza rodada manual com validações';

GRANT EXECUTE ON FUNCTION update_manual_round TO authenticated, service_role;

-- 8.5 - VIEW PARA RODADAS AGENDADAS
-- =====================================================

CREATE OR REPLACE VIEW v_scheduled_rounds AS
SELECT
  r.id,
  r.establishment_id,
  e.name as establishment_name,
  r.draw_date,
  r.draw_time,
  (r.draw_date::DATE + r.draw_time) as full_datetime,
  r.prize,
  r.card_price,
  r.status,
  r.type,
  r.manual_creation,
  r.winner_criteria,
  r.tiebreak_rule,
  r.min_participants,
  r.max_participants,
  r.description,
  r.created_at,
  COUNT(DISTINCT p.id) FILTER (WHERE p.payment_confirmed = true) as confirmed_participants,
  COUNT(DISTINCT c.id) as total_cards_sold,
  COALESCE(SUM(p.total_amount) FILTER (WHERE p.payment_confirmed = true), 0) as total_revenue
FROM rounds r
INNER JOIN establishments e ON e.id = r.establishment_id
LEFT JOIN purchases p ON p.round_id = r.id
LEFT JOIN cards c ON c.purchase_id = p.id
WHERE r.status IN ('scheduled', 'open')
GROUP BY r.id, e.name
ORDER BY r.draw_date ASC;

COMMENT ON VIEW v_scheduled_rounds IS 'Rodadas agendadas com informações consolidadas';

-- 8.6 - TRIGGER PARA AUTO-ABRIR RODADAS
-- =====================================================

-- Função que será executada periodicamente para abrir rodadas agendadas
CREATE OR REPLACE FUNCTION auto_open_scheduled_rounds()
RETURNS INTEGER AS $$
DECLARE
  v_opened_count INTEGER := 0;
BEGIN
  -- Abrir rodadas agendadas que já chegaram na data/hora
  UPDATE rounds
  SET status = 'open',
      updated_at = NOW()
  WHERE status = 'scheduled'
    AND (draw_date::DATE + COALESCE(draw_time, '00:00'::TIME)) <= NOW();

  GET DIAGNOSTICS v_opened_count = ROW_COUNT;

  RETURN v_opened_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION auto_open_scheduled_rounds IS 'Abre automaticamente rodadas agendadas (executar via cron job)';

GRANT EXECUTE ON FUNCTION auto_open_scheduled_rounds TO authenticated, service_role;

-- 8.7 - ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_rounds_scheduled
ON rounds(status, draw_date)
WHERE status = 'scheduled';

CREATE INDEX IF NOT EXISTS idx_rounds_draw_datetime
ON rounds((draw_date::DATE + COALESCE(draw_time, '00:00'::TIME)));

CREATE INDEX IF NOT EXISTS idx_rounds_manual_creation
ON rounds(manual_creation)
WHERE manual_creation = true;

-- 8.8 - CONSTRAINT PARA VALIDAR CRITÉRIOS
-- =====================================================

ALTER TABLE rounds
ADD CONSTRAINT rounds_winner_criteria_valid
CHECK (winner_criteria IN ('full_card', 'line', 'two_lines', 'pattern', 'corners', 'blackout'));

ALTER TABLE rounds
ADD CONSTRAINT rounds_tiebreak_rule_valid
CHECK (tiebreak_rule IN ('first_marked', 'split_prize', 'draw', 'fastest_time'));

-- 8.9 - REGISTRAR MIGRATIONS
-- =====================================================

INSERT INTO schema_migrations (version, description) VALUES
  (29, 'Colunas de criação manual adicionadas em rounds'),
  (30, 'Função validate_round_time_conflict criada'),
  (31, 'Função create_manual_round criada'),
  (32, 'Função update_manual_round criada'),
  (33, 'View v_scheduled_rounds criada'),
  (34, 'Função auto_open_scheduled_rounds criada'),
  (35, 'Constraints de validação adicionadas')
ON CONFLICT (version) DO NOTHING;

-- =====================================================
-- FIM DA FASE 8
-- =====================================================
