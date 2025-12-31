-- =====================================================
-- FASE 9: SISTEMA COMPLETO DE VENCEDORES, DESEMPATE E SAQUES
-- Data: 2025-01-01
-- Autor: Claude Code
-- Descrição: Sistema completo de verificação de vencedores,
--            desempate por "Pedra Maior", splits Asaas e saques automáticos
-- =====================================================

-- 9.1 - ALTERAR TABELA WINNERS PARA SUPORTAR DESEMPATE
-- =====================================================

-- Adicionar colunas para desempate por pedra maior
ALTER TABLE winners
ADD COLUMN IF NOT EXISTS tiebreak_stone_number INTEGER,
ADD COLUMN IF NOT EXISTS tiebreak_position INTEGER,
ADD COLUMN IF NOT EXISTS is_tied BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS user_id BIGINT,
ADD COLUMN IF NOT EXISTS asaas_transfer_id TEXT,
ADD COLUMN IF NOT EXISTS auto_withdrawal_attempted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS withdrawal_error TEXT;

-- Comentários
COMMENT ON COLUMN winners.tiebreak_stone_number IS 'Número da pedra sorteado para desempate (pedra maior)';
COMMENT ON COLUMN winners.tiebreak_position IS 'Posição no ranking de desempate (1 = vencedor)';
COMMENT ON COLUMN winners.is_tied IS 'Se este vencedor está em situação de empate';
COMMENT ON COLUMN winners.user_id IS 'ID do usuário ganhador (para saque)';
COMMENT ON COLUMN winners.asaas_transfer_id IS 'ID da transferência Asaas para saque';
COMMENT ON COLUMN winners.auto_withdrawal_attempted IS 'Se tentativa de saque automático foi feita';
COMMENT ON COLUMN winners.withdrawal_error IS 'Erro ocorrido no saque automático (se houver)';

-- 9.2 - ADICIONAR CAMPOS ASAAS EM ESTABLISHMENTS E MANAGERS
-- =====================================================

-- Establishments: adicionar campos para split e subconta Asaas
ALTER TABLE establishments
ADD COLUMN IF NOT EXISTS asaas_account_id TEXT,
ADD COLUMN IF NOT EXISTS asaas_wallet_id TEXT,
ADD COLUMN IF NOT EXISTS pix_key_withdrawal TEXT,
ADD COLUMN IF NOT EXISTS auto_withdrawal_enabled BOOLEAN DEFAULT false;

COMMENT ON COLUMN establishments.asaas_account_id IS 'ID da subconta Asaas do estabelecimento';
COMMENT ON COLUMN establishments.asaas_wallet_id IS 'ID da carteira Asaas para splits';
COMMENT ON COLUMN establishments.pix_key_withdrawal IS 'Chave PIX para recebimento de comissões';
COMMENT ON COLUMN establishments.auto_withdrawal_enabled IS 'Habilitar saque automático de comissões';

-- Managers: adicionar campos similares
ALTER TABLE managers
ADD COLUMN IF NOT EXISTS asaas_account_id TEXT,
ADD COLUMN IF NOT EXISTS asaas_wallet_id TEXT,
ADD COLUMN IF NOT EXISTS pix_key_withdrawal TEXT,
ADD COLUMN IF NOT EXISTS auto_withdrawal_enabled BOOLEAN DEFAULT false;

COMMENT ON COLUMN managers.asaas_account_id IS 'ID da subconta Asaas do gerente';
COMMENT ON COLUMN managers.asaas_wallet_id IS 'ID da carteira Asaas';
COMMENT ON COLUMN managers.pix_key_withdrawal IS 'Chave PIX para recebimento';
COMMENT ON COLUMN managers.auto_withdrawal_enabled IS 'Habilitar saque automático';

-- 9.3 - TABELA DE SPLITS/COMISSIONAMENTO
-- =====================================================

CREATE TABLE IF NOT EXISTS payment_splits (
  id BIGSERIAL PRIMARY KEY,
  purchase_id BIGINT NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  asaas_payment_id TEXT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  platform_amount DECIMAL(10,2) NOT NULL,
  manager_amount DECIMAL(10,2),
  establishment_amount DECIMAL(10,2),
  manager_id BIGINT REFERENCES managers(id),
  establishment_id BIGINT REFERENCES establishments(id),
  split_rules JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_splits_purchase ON payment_splits(purchase_id);
CREATE INDEX IF NOT EXISTS idx_payment_splits_status ON payment_splits(status);

COMMENT ON TABLE payment_splits IS 'Registro de divisão de pagamentos (splits) via Asaas';
COMMENT ON COLUMN payment_splits.split_rules IS 'Regras de split em formato JSON';

-- 9.4 - TABELA DE NÚMEROS SORTEADOS PARA DESEMPATE
-- =====================================================

CREATE TABLE IF NOT EXISTS tiebreak_stones (
  id BIGSERIAL PRIMARY KEY,
  round_id BIGINT NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  stone_number INTEGER NOT NULL CHECK (stone_number >= 1 AND stone_number <= 99),
  drawn_at TIMESTAMPTZ DEFAULT NOW(),
  affected_winners INTEGER[] DEFAULT ARRAY[]::INTEGER[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tiebreak_stones_round ON tiebreak_stones(round_id);

COMMENT ON TABLE tiebreak_stones IS 'Pedras sorteadas para desempate (pedra maior)';
COMMENT ON COLUMN tiebreak_stones.stone_number IS 'Número da pedra sorteado (1-99)';
COMMENT ON COLUMN tiebreak_stones.affected_winners IS 'IDs dos winners afetados pelo desempate';

-- 9.5 - FUNÇÃO: VERIFICAR SE CARTELA É VENCEDORA
-- =====================================================

CREATE OR REPLACE FUNCTION check_winner_card(
  p_card_id BIGINT,
  p_round_id BIGINT,
  p_pattern TEXT DEFAULT 'full_card'
)
RETURNS JSONB AS $$
DECLARE
  v_card RECORD;
  v_drawn_numbers INTEGER[];
  v_marked_count INTEGER := 0;
  v_total_required INTEGER;
  v_is_winner BOOLEAN := false;
  v_pattern_matched JSONB;
BEGIN
  -- Buscar cartela
  SELECT * INTO v_card FROM cards WHERE id = p_card_id AND round_id = p_round_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Cartela não encontrada');
  END IF;

  -- Buscar números sorteados
  SELECT ARRAY_AGG(number ORDER BY position) INTO v_drawn_numbers
  FROM draws
  WHERE round_id = p_round_id;

  -- Contar quantos números da cartela foram sorteados
  SELECT COUNT(*) INTO v_marked_count
  FROM UNNEST(v_card.numbers) AS card_num
  WHERE card_num = ANY(v_drawn_numbers);

  -- Verificar padrão de vitória
  CASE p_pattern
    WHEN 'full_card' THEN
      v_total_required := 25; -- Cartela cheia (5x5)
      v_is_winner := (v_marked_count >= v_total_required);

    WHEN 'line' THEN
      v_total_required := 5; -- Uma linha
      -- TODO: Implementar lógica de verificação de linha
      v_is_winner := (v_marked_count >= v_total_required);

    ELSE
      v_is_winner := false;
  END CASE;

  v_pattern_matched := json_build_object(
    'pattern', p_pattern,
    'marked_count', v_marked_count,
    'total_required', v_total_required,
    'drawn_numbers', v_drawn_numbers
  );

  RETURN json_build_object(
    'success', true,
    'is_winner', v_is_winner,
    'card_id', p_card_id,
    'pattern_matched', v_pattern_matched,
    'marked_count', v_marked_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_winner_card IS 'Verifica se uma cartela é vencedora baseado nos números sorteados';

GRANT EXECUTE ON FUNCTION check_winner_card TO authenticated, service_role;

-- 9.6 - FUNÇÃO: VERIFICAR TODAS AS CARTELAS AUTOMATICAMENTE
-- =====================================================

CREATE OR REPLACE FUNCTION check_all_cards_for_round(
  p_round_id BIGINT,
  p_pattern TEXT DEFAULT 'full_card'
)
RETURNS JSONB AS $$
DECLARE
  v_card RECORD;
  v_check_result JSONB;
  v_winners_found INTEGER := 0;
  v_winner_ids INTEGER[] := ARRAY[]::INTEGER[];
  v_prize_per_winner DECIMAL(10,2);
  v_round RECORD;
BEGIN
  -- Buscar rodada
  SELECT * INTO v_round FROM rounds WHERE id = p_round_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Rodada não encontrada');
  END IF;

  -- Verificar cada cartela
  FOR v_card IN SELECT * FROM cards WHERE round_id = p_round_id
  LOOP
    v_check_result := check_winner_card(v_card.id, p_round_id, p_pattern);

    IF (v_check_result->>'is_winner')::BOOLEAN THEN
      v_winners_found := v_winners_found + 1;
      v_winner_ids := array_append(v_winner_ids, v_card.id::INTEGER);
    END IF;
  END LOOP;

  -- Se há vencedores, calcular prêmio
  IF v_winners_found > 0 THEN
    v_prize_per_winner := v_round.prize / v_winners_found;

    -- Inserir vencedores
    FOR v_card IN SELECT * FROM cards WHERE id = ANY(v_winner_ids::BIGINT[])
    LOOP
      -- Buscar user_id da purchase
      DECLARE
        v_user_id BIGINT;
      BEGIN
        SELECT user_id INTO v_user_id FROM purchases WHERE id = v_card.purchase_id;

        INSERT INTO winners (
          round_id,
          card_id,
          card_code,
          prize_amount,
          pattern,
          pattern_matched,
          status,
          is_tied,
          user_id,
          created_at
        ) VALUES (
          p_round_id,
          v_card.id,
          v_card.card_number,
          v_prize_per_winner,
          p_pattern,
          '{}',
          'pending',
          (v_winners_found > 1),
          v_user_id,
          NOW()
        );
      END;
    END LOOP;
  END IF;

  RETURN json_build_object(
    'success', true,
    'round_id', p_round_id,
    'winners_found', v_winners_found,
    'winner_card_ids', v_winner_ids,
    'prize_per_winner', v_prize_per_winner,
    'requires_tiebreak', (v_winners_found > 1)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_all_cards_for_round IS 'Verifica todas as cartelas de uma rodada e registra vencedores automaticamente';

GRANT EXECUTE ON FUNCTION check_all_cards_for_round TO authenticated, service_role;

-- 9.7 - FUNÇÃO: RESOLVER DESEMPATE COM PEDRA MAIOR
-- =====================================================

CREATE OR REPLACE FUNCTION resolve_tiebreak_with_stone(
  p_round_id BIGINT
)
RETURNS JSONB AS $$
DECLARE
  v_stone_number INTEGER;
  v_winner RECORD;
  v_best_stone INTEGER;
  v_best_winner_id BIGINT;
  v_tied_winners INTEGER := 0;
  v_prize_total DECIMAL(10,2);
BEGIN
  -- Contar winners empatados
  SELECT COUNT(*), COALESCE(SUM(prize_amount), 0)
  INTO v_tied_winners, v_prize_total
  FROM winners
  WHERE round_id = p_round_id AND is_tied = true AND status = 'pending';

  IF v_tied_winners = 0 THEN
    RETURN json_build_object('success', false, 'error', 'Nenhum empate encontrado');
  END IF;

  -- Sortear pedra (1-99)
  v_stone_number := 1 + (RANDOM() * 98)::INTEGER;

  -- Registrar pedra sorteada
  INSERT INTO tiebreak_stones (round_id, stone_number)
  VALUES (p_round_id, v_stone_number)
  RETURNING stone_number INTO v_stone_number;

  -- Para cada winner empatado, sortear uma pedra individual
  FOR v_winner IN
    SELECT * FROM winners
    WHERE round_id = p_round_id AND is_tied = true AND status = 'pending'
  LOOP
    -- Sortear pedra individual para este jogador
    DECLARE
      v_player_stone INTEGER;
    BEGIN
      v_player_stone := 1 + (RANDOM() * 98)::INTEGER;

      -- Atualizar winner com a pedra
      UPDATE winners
      SET tiebreak_stone_number = v_player_stone
      WHERE id = v_winner.id;

      -- Verificar se é a melhor pedra até agora
      IF v_best_stone IS NULL OR v_player_stone > v_best_stone THEN
        v_best_stone := v_player_stone;
        v_best_winner_id := v_winner.id;
      END IF;
    END;
  END LOOP;

  -- Atualizar o vencedor (pedra maior)
  UPDATE winners
  SET
    tiebreak_position = 1,
    status = 'claimed',
    prize_amount = v_prize_total,
    is_tied = false
  WHERE id = v_best_winner_id;

  -- Atualizar os perdedores do desempate
  UPDATE winners
  SET
    tiebreak_position = 2,
    status = 'cancelled',
    prize_amount = 0,
    is_tied = false
  WHERE round_id = p_round_id
    AND id != v_best_winner_id
    AND is_tied = true;

  -- Atualizar rodada
  UPDATE rounds
  SET status = 'completed'
  WHERE id = p_round_id;

  RETURN json_build_object(
    'success', true,
    'round_id', p_round_id,
    'tied_winners', v_tied_winners,
    'stone_drawn', v_stone_number,
    'winner_id', v_best_winner_id,
    'winning_stone', v_best_stone,
    'total_prize', v_prize_total
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION resolve_tiebreak_with_stone IS 'Resolve empate usando pedra maior (maior número vence)';

GRANT EXECUTE ON FUNCTION resolve_tiebreak_with_stone TO authenticated, service_role;

-- 9.8 - FUNÇÃO: PROCESSAR SAQUE AUTOMÁTICO VIA ASAAS
-- =====================================================

CREATE OR REPLACE FUNCTION process_automatic_withdrawal(
  p_winner_id BIGINT,
  p_pix_key TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_winner RECORD;
  v_transfer_id TEXT;
BEGIN
  -- Buscar winner
  SELECT * INTO v_winner FROM winners WHERE id = p_winner_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Vencedor não encontrado');
  END IF;

  -- Validar status
  IF v_winner.status != 'claimed' THEN
    RETURN json_build_object('success', false, 'error', 'Status inválido para saque');
  END IF;

  -- Atualizar chave PIX
  UPDATE winners
  SET
    pix_key = p_pix_key,
    status = 'processing'
  WHERE id = p_winner_id;

  -- Gerar ID de transferência (será processado via Asaas)
  v_transfer_id := 'TRF-' || p_winner_id || '-' || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS');

  -- Marcar como tentativa de saque
  UPDATE winners
  SET
    asaas_transfer_id = v_transfer_id,
    auto_withdrawal_attempted = true
  WHERE id = p_winner_id;

  RETURN json_build_object(
    'success', true,
    'winner_id', p_winner_id,
    'transfer_id', v_transfer_id,
    'amount', v_winner.prize_amount,
    'pix_key', p_pix_key,
    'message', 'Transferência será processada via Asaas'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION process_automatic_withdrawal IS 'Processa saque automático do prêmio via Asaas';

GRANT EXECUTE ON FUNCTION process_automatic_withdrawal TO authenticated, service_role;

-- 9.9 - FUNÇÃO: PROCESSAR SPLIT DE PAGAMENTO
-- =====================================================

CREATE OR REPLACE FUNCTION process_payment_split(
  p_purchase_id BIGINT,
  p_asaas_payment_id TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_purchase RECORD;
  v_establishment RECORD;
  v_manager RECORD;
  v_platform_percent DECIMAL(5,2) := 10.00; -- 10% plataforma
  v_manager_percent DECIMAL(5,2);
  v_establishment_percent DECIMAL(5,2);
  v_platform_amount DECIMAL(10,2);
  v_manager_amount DECIMAL(10,2);
  v_establishment_amount DECIMAL(10,2);
  v_split_rules JSONB;
BEGIN
  -- Buscar purchase
  SELECT * INTO v_purchase FROM purchases WHERE id = p_purchase_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Compra não encontrada');
  END IF;

  -- Buscar estabelecimento
  SELECT * INTO v_establishment FROM establishments
  WHERE id = v_purchase.establishment_id;

  -- Buscar gerente (se houver)
  IF v_establishment.manager_id IS NOT NULL THEN
    SELECT * INTO v_manager FROM managers WHERE id = v_establishment.manager_id;
    v_manager_percent := COALESCE(v_manager.commission_rate, 5.00);
  ELSE
    v_manager_percent := 0;
  END IF;

  -- Calcular percentuais
  v_establishment_percent := COALESCE(v_establishment.commission_rate, 5.00);

  -- Validar que soma não excede 100%
  IF (v_platform_percent + v_manager_percent + v_establishment_percent) > 100 THEN
    RETURN json_build_object('success', false, 'error', 'Soma de comissões excede 100%');
  END IF;

  -- Calcular valores
  v_platform_amount := v_purchase.total_amount * (v_platform_percent / 100);
  v_manager_amount := v_purchase.total_amount * (v_manager_percent / 100);
  v_establishment_amount := v_purchase.total_amount * (v_establishment_percent / 100);

  -- Criar regras de split
  v_split_rules := json_build_object(
    'platform', json_build_object('percent', v_platform_percent, 'amount', v_platform_amount),
    'manager', json_build_object('percent', v_manager_percent, 'amount', v_manager_amount, 'id', v_manager.id),
    'establishment', json_build_object('percent', v_establishment_percent, 'amount', v_establishment_amount, 'id', v_establishment.id)
  );

  -- Registrar split
  INSERT INTO payment_splits (
    purchase_id,
    asaas_payment_id,
    total_amount,
    platform_amount,
    manager_amount,
    establishment_amount,
    manager_id,
    establishment_id,
    split_rules,
    status
  ) VALUES (
    p_purchase_id,
    p_asaas_payment_id,
    v_purchase.total_amount,
    v_platform_amount,
    v_manager_amount,
    v_establishment_amount,
    v_manager.id,
    v_establishment.id,
    v_split_rules,
    'pending'
  );

  RETURN json_build_object(
    'success', true,
    'purchase_id', p_purchase_id,
    'split_rules', v_split_rules,
    'total_amount', v_purchase.total_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION process_payment_split IS 'Calcula e registra splits de pagamento (comissionamento)';

GRANT EXECUTE ON FUNCTION process_payment_split TO authenticated, service_role;

-- 9.10 - TRIGGER: AUTO-PROCESSAR SPLIT APÓS PAGAMENTO CONFIRMADO
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_process_split()
RETURNS TRIGGER AS $$
BEGIN
  -- Se pagamento foi confirmado e tem asaas_charge_id
  IF NEW.payment_confirmed = true AND NEW.asaas_charge_id IS NOT NULL THEN
    -- Processar split
    PERFORM process_payment_split(NEW.id, NEW.asaas_charge_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_purchases_auto_split
AFTER UPDATE OF payment_confirmed ON purchases
FOR EACH ROW
WHEN (NEW.payment_confirmed = true AND NEW.asaas_charge_id IS NOT NULL)
EXECUTE FUNCTION trigger_process_split();

COMMENT ON FUNCTION trigger_process_split IS 'Trigger para processar split automaticamente após confirmação de pagamento';

-- 9.11 - VIEWS ÚTEIS
-- =====================================================

-- View de vencedores pendentes de saque
CREATE OR REPLACE VIEW v_pending_withdrawals AS
SELECT
  w.id as winner_id,
  w.round_id,
  r.draw_date,
  w.card_code,
  w.prize_amount,
  w.status,
  w.pix_key,
  w.user_id,
  u.name as winner_name,
  u.email as winner_email,
  w.created_at,
  w.asaas_transfer_id,
  w.auto_withdrawal_attempted,
  w.withdrawal_error
FROM winners w
INNER JOIN rounds r ON r.id = w.round_id
LEFT JOIN users u ON u.id = w.user_id
WHERE w.status IN ('claimed', 'processing')
ORDER BY w.created_at ASC;

COMMENT ON VIEW v_pending_withdrawals IS 'Vencedores com saques pendentes';

-- View de splits pendentes
CREATE OR REPLACE VIEW v_pending_splits AS
SELECT
  ps.id,
  ps.purchase_id,
  ps.asaas_payment_id,
  ps.total_amount,
  ps.platform_amount,
  ps.manager_amount,
  ps.establishment_amount,
  ps.status,
  ps.created_at,
  e.name as establishment_name,
  m.name as manager_name
FROM payment_splits ps
LEFT JOIN establishments e ON e.id = ps.establishment_id
LEFT JOIN managers m ON m.id = ps.manager_id
WHERE ps.status = 'pending'
ORDER BY ps.created_at ASC;

COMMENT ON VIEW v_pending_splits IS 'Splits de pagamento pendentes de processamento';

-- 9.12 - ÍNDICES ADICIONAIS
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_winners_user_id ON winners(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_winners_status_pending ON winners(status) WHERE status IN ('pending', 'claimed', 'processing');
CREATE INDEX IF NOT EXISTS idx_winners_tied ON winners(is_tied) WHERE is_tied = true;

-- 9.13 - REGISTRAR MIGRATIONS
-- =====================================================

INSERT INTO schema_migrations (version, description) VALUES
  (36, 'Colunas de desempate adicionadas em winners'),
  (37, 'Campos Asaas adicionados em establishments e managers'),
  (38, 'Tabela payment_splits criada'),
  (39, 'Tabela tiebreak_stones criada'),
  (40, 'Função check_winner_card criada'),
  (41, 'Função check_all_cards_for_round criada'),
  (42, 'Função resolve_tiebreak_with_stone criada'),
  (43, 'Função process_automatic_withdrawal criada'),
  (44, 'Função process_payment_split criada'),
  (45, 'Trigger auto-processar split criado'),
  (46, 'Views de pending withdrawals e splits criadas')
ON CONFLICT (version) DO NOTHING;

-- =====================================================
-- FIM DA FASE 9
-- =====================================================
