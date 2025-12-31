-- =====================================================
-- FASE 7: SISTEMA DE JOGADORES/BOTS COM AI
-- Data: 2025-01-01
-- Autor: Claude Code
-- Descrição: Gerenciamento de jogadores e bots para rodadas de bingo
-- =====================================================

-- 7.1 - TABELA DE JOGADORES
-- =====================================================

CREATE TABLE IF NOT EXISTS players (
  id BIGSERIAL PRIMARY KEY,
  establishment_id BIGINT NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  cpf TEXT,
  is_bot BOOLEAN DEFAULT false,
  avatar_url TEXT,
  notes TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  metadata JSONB DEFAULT '{}'::JSONB,
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT players_phone_format CHECK (phone IS NULL OR phone ~ '^\d{10,15}$'),
  CONSTRAINT players_cpf_format CHECK (cpf IS NULL OR cpf ~ '^\d{11}$')
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_players_establishment
ON players(establishment_id);

CREATE INDEX IF NOT EXISTS idx_players_is_bot
ON players(is_bot)
WHERE is_bot = true;

CREATE INDEX IF NOT EXISTS idx_players_name_search
ON players USING gin(to_tsvector('portuguese', name));

CREATE INDEX IF NOT EXISTS idx_players_tags
ON players USING gin(tags);

CREATE INDEX IF NOT EXISTS idx_players_created_at
ON players(created_at DESC);

-- Comentários
COMMENT ON TABLE players IS 'Jogadores/bots associados a estabelecimentos';
COMMENT ON COLUMN players.establishment_id IS 'Estabelecimento ao qual o jogador pertence';
COMMENT ON COLUMN players.name IS 'Nome completo do jogador';
COMMENT ON COLUMN players.is_bot IS 'Se é um bot gerado por AI';
COMMENT ON COLUMN players.tags IS 'Tags para categorização (ex: VIP, regular, novo)';
COMMENT ON COLUMN players.metadata IS 'Dados adicionais em JSON (preferências, histórico, etc)';

-- 7.2 - TABELA DE PARTICIPAÇÕES
-- =====================================================

CREATE TABLE IF NOT EXISTS player_participations (
  id BIGSERIAL PRIMARY KEY,
  player_id BIGINT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  round_id BIGINT NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  purchase_id BIGINT REFERENCES purchases(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0 AND quantity <= 100),
  total_amount DECIMAL(10,2) DEFAULT 0,
  is_winner BOOLEAN DEFAULT false,
  prize_amount DECIMAL(10,2),
  participated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Evitar duplicatas
  UNIQUE(player_id, round_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_player_participations_player
ON player_participations(player_id);

CREATE INDEX IF NOT EXISTS idx_player_participations_round
ON player_participations(round_id);

CREATE INDEX IF NOT EXISTS idx_player_participations_purchase
ON player_participations(purchase_id)
WHERE purchase_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_player_participations_winner
ON player_participations(is_winner)
WHERE is_winner = true;

-- Comentários
COMMENT ON TABLE player_participations IS 'Registro de participações de jogadores em rodadas';
COMMENT ON COLUMN player_participations.player_id IS 'Jogador participante';
COMMENT ON COLUMN player_participations.round_id IS 'Rodada em que participou';
COMMENT ON COLUMN player_participations.purchase_id IS 'Compra associada (se houver)';
COMMENT ON COLUMN player_participations.quantity IS 'Quantidade de cartelas compradas';
COMMENT ON COLUMN player_participations.is_winner IS 'Se este jogador ganhou';
COMMENT ON COLUMN player_participations.prize_amount IS 'Valor do prêmio recebido';

-- 7.3 - VIEW DE ESTATÍSTICAS DE JOGADORES
-- =====================================================

CREATE OR REPLACE VIEW v_player_stats AS
SELECT
  p.id,
  p.establishment_id,
  p.name,
  p.email,
  p.phone,
  p.is_bot,
  p.tags,
  p.created_at,
  COUNT(DISTINCT pp.round_id) as total_participations,
  SUM(pp.quantity) as total_cards_purchased,
  COALESCE(SUM(pp.total_amount), 0) as total_spent,
  COUNT(*) FILTER (WHERE pp.is_winner = true) as total_wins,
  COALESCE(SUM(pp.prize_amount) FILTER (WHERE pp.is_winner = true), 0) as total_prizes_won,
  MAX(pp.participated_at) as last_participation,
  (
    SELECT json_agg(
      json_build_object(
        'round_id', pp2.round_id,
        'quantity', pp2.quantity,
        'is_winner', pp2.is_winner,
        'participated_at', pp2.participated_at
      ) ORDER BY pp2.participated_at DESC
    )
    FROM player_participations pp2
    WHERE pp2.player_id = p.id
    LIMIT 10
  ) as recent_participations
FROM players p
LEFT JOIN player_participations pp ON pp.player_id = p.id
GROUP BY p.id, p.establishment_id, p.name, p.email, p.phone, p.is_bot, p.tags, p.created_at
ORDER BY total_participations DESC;

COMMENT ON VIEW v_player_stats IS 'Estatísticas agregadas de jogadores com histórico';

-- 7.4 - FUNÇÃO PARA CRIAR JOGADORES EM LOTE
-- =====================================================

CREATE OR REPLACE FUNCTION create_players_batch(
  p_establishment_id BIGINT,
  p_names TEXT[],
  p_is_bot BOOLEAN DEFAULT true,
  p_created_by BIGINT DEFAULT NULL
)
RETURNS TABLE(
  id BIGINT,
  name TEXT,
  created BOOLEAN
) AS $$
DECLARE
  v_name TEXT;
  v_player_id BIGINT;
  v_exists BOOLEAN;
BEGIN
  FOREACH v_name IN ARRAY p_names
  LOOP
    -- Verificar se jogador já existe
    SELECT EXISTS(
      SELECT 1 FROM players
      WHERE establishment_id = p_establishment_id
      AND LOWER(name) = LOWER(v_name)
    ) INTO v_exists;

    IF v_exists THEN
      -- Retornar jogador existente
      SELECT p.id INTO v_player_id
      FROM players p
      WHERE p.establishment_id = p_establishment_id
      AND LOWER(p.name) = LOWER(v_name)
      LIMIT 1;

      RETURN QUERY SELECT v_player_id, v_name, false;
    ELSE
      -- Criar novo jogador
      INSERT INTO players (establishment_id, name, is_bot, created_by)
      VALUES (p_establishment_id, v_name, p_is_bot, p_created_by)
      RETURNING players.id INTO v_player_id;

      RETURN QUERY SELECT v_player_id, v_name, true;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION create_players_batch IS 'Cria múltiplos jogadores em lote, evitando duplicatas';

GRANT EXECUTE ON FUNCTION create_players_batch TO authenticated, service_role;

-- 7.5 - FUNÇÃO PARA ADICIONAR JOGADOR À RODADA
-- =====================================================

CREATE OR REPLACE FUNCTION add_player_to_round(
  p_player_id BIGINT,
  p_round_id BIGINT,
  p_quantity INTEGER DEFAULT 1,
  p_total_amount DECIMAL DEFAULT 0
)
RETURNS BIGINT AS $$
DECLARE
  v_participation_id BIGINT;
BEGIN
  -- Verificar se jogador já está na rodada
  IF EXISTS(
    SELECT 1 FROM player_participations
    WHERE player_id = p_player_id AND round_id = p_round_id
  ) THEN
    RAISE EXCEPTION 'Jogador já está participando desta rodada';
  END IF;

  -- Inserir participação
  INSERT INTO player_participations (
    player_id,
    round_id,
    quantity,
    total_amount
  ) VALUES (
    p_player_id,
    p_round_id,
    p_quantity,
    p_total_amount
  )
  RETURNING id INTO v_participation_id;

  RETURN v_participation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION add_player_to_round IS 'Adiciona um jogador a uma rodada específica';

GRANT EXECUTE ON FUNCTION add_player_to_round TO authenticated, service_role;

-- 7.6 - FUNÇÃO PARA PROCESSAR COMANDO DE LINGUAGEM NATURAL
-- =====================================================

CREATE OR REPLACE FUNCTION process_player_command(
  p_command TEXT,
  p_establishment_id BIGINT DEFAULT NULL,
  p_user_id BIGINT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_action TEXT;
  v_quantity INTEGER;
  v_establishment_name TEXT;
  v_round_id BIGINT;
BEGIN
  -- Placeholder: esta função será expandida para parsear comandos
  -- Por enquanto, retorna estrutura que será processada pelo frontend/Groq

  v_result := json_build_object(
    'success', true,
    'command', p_command,
    'parsed', json_build_object(
      'action', 'create_players',
      'quantity', NULL,
      'establishment_id', p_establishment_id,
      'round_id', NULL
    ),
    'message', 'Comando recebido. Use Groq AI para interpretar.'
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION process_player_command IS 'Processa comandos de linguagem natural (a ser expandido)';

GRANT EXECUTE ON FUNCTION process_player_command TO authenticated, service_role;

-- 7.7 - TRIGGER PARA UPDATED_AT
-- =====================================================

CREATE OR REPLACE TRIGGER trg_players_updated_at
BEFORE UPDATE ON players
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- 7.8 - RLS POLICIES
-- =====================================================

-- Players: admin e establishment podem gerenciar seus jogadores
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin pode gerenciar todos os jogadores"
ON players FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

CREATE POLICY "Establishment pode gerenciar seus jogadores"
ON players FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'establishment'
    AND users.id = players.establishment_id
  )
);

CREATE POLICY "Usuários autenticados podem ler jogadores"
ON players FOR SELECT
TO authenticated
USING (true);

-- Player Participations: similar aos players
ALTER TABLE player_participations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin pode gerenciar participações"
ON player_participations FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

CREATE POLICY "Establishment pode gerenciar participações de seus jogadores"
ON player_participations FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM players p
    INNER JOIN users u ON u.id = p.establishment_id
    WHERE p.id = player_participations.player_id
    AND u.id = auth.uid()
    AND u.role = 'establishment'
  )
);

CREATE POLICY "Usuários autenticados podem ler participações"
ON player_participations FOR SELECT
TO authenticated
USING (true);

-- 7.9 - DADOS DE EXEMPLO (OPCIONAL)
-- =====================================================

-- Inserir jogadores de exemplo para estabelecimento 1 (se existir)
DO $$
DECLARE
  v_establishment_id BIGINT;
BEGIN
  SELECT id INTO v_establishment_id FROM establishments LIMIT 1;

  IF v_establishment_id IS NOT NULL THEN
    INSERT INTO players (establishment_id, name, is_bot, tags) VALUES
      (v_establishment_id, 'Ana Silva', true, ARRAY['bot', 'regular']),
      (v_establishment_id, 'Carlos Santos', true, ARRAY['bot', 'vip']),
      (v_establishment_id, 'Maria Oliveira', true, ARRAY['bot', 'novo'])
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- 7.10 - REGISTRAR MIGRATIONS
-- =====================================================

INSERT INTO schema_migrations (version, description) VALUES
  (24, 'Tabela players criada'),
  (25, 'Tabela player_participations criada'),
  (26, 'View v_player_stats criada'),
  (27, 'Funções de gerenciamento de jogadores criadas'),
  (28, 'RLS policies para jogadores configuradas')
ON CONFLICT (version) DO NOTHING;

-- =====================================================
-- FIM DA FASE 7 - BANCO DE DADOS
-- =====================================================
