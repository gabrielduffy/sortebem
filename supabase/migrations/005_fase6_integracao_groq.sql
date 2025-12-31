-- =====================================================
-- FASE 6: INTEGRAÇÃO GROQ AI
-- Data: 2025-01-01
-- Autor: Claude Code
-- Descrição: Integração com Groq AI para geração de conteúdo e analytics
-- =====================================================

-- 6.1 - TABELA DE PROMPTS GROQ
-- =====================================================

CREATE TABLE IF NOT EXISTS groq_prompts (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  system_prompt TEXT NOT NULL,
  user_prompt_template TEXT NOT NULL,
  model TEXT NOT NULL DEFAULT 'llama-3.1-70b-versatile',
  temperature DECIMAL(3,2) DEFAULT 0.7 CHECK (temperature >= 0 AND temperature <= 2),
  max_tokens INTEGER DEFAULT 1024,
  is_active BOOLEAN DEFAULT true,
  category TEXT DEFAULT 'general',
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_groq_prompts_active
ON groq_prompts(is_active)
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_groq_prompts_category
ON groq_prompts(category);

-- Comentários
COMMENT ON TABLE groq_prompts IS 'Templates de prompts para Groq AI';
COMMENT ON COLUMN groq_prompts.name IS 'Nome único do prompt (ex: generate_player_name)';
COMMENT ON COLUMN groq_prompts.system_prompt IS 'Prompt de sistema que define comportamento do AI';
COMMENT ON COLUMN groq_prompts.user_prompt_template IS 'Template do prompt do usuário (pode ter variáveis {{var}})';
COMMENT ON COLUMN groq_prompts.model IS 'Modelo Groq a ser usado';
COMMENT ON COLUMN groq_prompts.temperature IS 'Criatividade da resposta (0=determinístico, 2=criativo)';
COMMENT ON COLUMN groq_prompts.category IS 'Categoria do prompt (analytics, content_generation, bots, etc)';

-- 6.2 - TABELA DE LOGS DE USO GROQ
-- =====================================================

CREATE TABLE IF NOT EXISTS groq_usage_logs (
  id BIGSERIAL PRIMARY KEY,
  prompt_id BIGINT REFERENCES groq_prompts(id) ON DELETE SET NULL,
  prompt_name TEXT,
  model TEXT NOT NULL,
  user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  establishment_id BIGINT REFERENCES establishments(id) ON DELETE SET NULL,
  request_payload JSONB NOT NULL,
  response_payload JSONB,
  tokens_prompt INTEGER,
  tokens_completion INTEGER,
  tokens_total INTEGER,
  duration_ms INTEGER,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_groq_usage_logs_created
ON groq_usage_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_groq_usage_logs_prompt
ON groq_usage_logs(prompt_id)
WHERE prompt_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_groq_usage_logs_user
ON groq_usage_logs(user_id)
WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_groq_usage_logs_establishment
ON groq_usage_logs(establishment_id)
WHERE establishment_id IS NOT NULL;

-- Comentários
COMMENT ON TABLE groq_usage_logs IS 'Logs de uso da API Groq para analytics e billing';
COMMENT ON COLUMN groq_usage_logs.request_payload IS 'Payload completo enviado ao Groq';
COMMENT ON COLUMN groq_usage_logs.response_payload IS 'Resposta completa do Groq';
COMMENT ON COLUMN groq_usage_logs.tokens_prompt IS 'Tokens usados no prompt';
COMMENT ON COLUMN groq_usage_logs.tokens_completion IS 'Tokens usados na completion';
COMMENT ON COLUMN groq_usage_logs.tokens_total IS 'Total de tokens (prompt + completion)';
COMMENT ON COLUMN groq_usage_logs.duration_ms IS 'Duração da requisição em milissegundos';

-- 6.3 - INSERIR PROMPTS PRÉ-CONFIGURADOS
-- =====================================================

INSERT INTO groq_prompts (name, description, system_prompt, user_prompt_template, category, temperature, max_tokens) VALUES

-- Prompt para gerar nomes de jogadores
('generate_player_name',
 'Gerar nome realista para jogador de bingo brasileiro',
 'Você é um assistente que gera nomes realistas de pessoas brasileiras. Retorne apenas o nome completo, sem explicações adicionais.',
 'Gere um nome completo brasileiro realista para um jogador de bingo. Considere nomes comuns no Brasil.',
 'bots',
 0.9,
 50),

-- Prompt para gerar múltiplos jogadores
('generate_multiple_players',
 'Gerar múltiplos nomes de jogadores de uma vez',
 'Você é um assistente que gera listas de nomes realistas de pessoas brasileiras. Retorne uma lista JSON com os nomes.',
 'Gere {{quantity}} nomes completos brasileiros realistas para jogadores de bingo do estabelecimento "{{establishment_name}}". Retorne um array JSON no formato: ["Nome Completo 1", "Nome Completo 2", ...]',
 'bots',
 0.9,
 500),

-- Prompt para análise de rodada
('analyze_round_performance',
 'Analisar performance de uma rodada de bingo',
 'Você é um analista de dados especializado em jogos de bingo. Analise os dados fornecidos e retorne insights acionáveis.',
 'Analise esta rodada de bingo:\n- Total de cartelas vendidas: {{cards_sold}}\n- Valor arrecadado: R$ {{revenue}}\n- Prêmio: R$ {{prize}}\n- Número de vencedores: {{winners}}\n\nForneça:\n1. Análise de rentabilidade\n2. Insights sobre o desempenho\n3. Sugestões de melhoria',
 'analytics',
 0.5,
 1024),

-- Prompt para sugerir preços
('suggest_card_price',
 'Sugerir preço ideal para cartelas baseado em histórico',
 'Você é um especialista em precificação de jogos de bingo. Analise dados históricos e sugira preços otimizados.',
 'Baseado nestes dados históricos:\n- Preço médio anterior: R$ {{avg_price}}\n- Taxa de venda média: {{avg_sales_rate}}%\n- Prêmio planejado: R$ {{prize}}\n\nSugira um preço ideal para maximizar vendas e lucratividade.',
 'analytics',
 0.3,
 512),

-- Prompt para gerar descrição de estabelecimento
('generate_establishment_description',
 'Gerar descrição atraente para estabelecimento',
 'Você é um copywriter especializado em marketing para estabelecimentos de entretenimento.',
 'Crie uma descrição atraente e profissional (máximo 200 caracteres) para o estabelecimento "{{name}}" que oferece bingo online. Destaque: {{highlights}}',
 'content_generation',
 0.8,
 200);

-- 6.4 - VIEW PARA ANALYTICS DE USO GROQ
-- =====================================================

CREATE OR REPLACE VIEW v_groq_usage_stats AS
SELECT
  DATE_TRUNC('day', created_at) as date,
  prompt_name,
  model,
  COUNT(*) as total_requests,
  COUNT(*) FILTER (WHERE success = true) as successful_requests,
  COUNT(*) FILTER (WHERE success = false) as failed_requests,
  SUM(tokens_total) as total_tokens,
  AVG(tokens_total) as avg_tokens_per_request,
  AVG(duration_ms) as avg_duration_ms,
  MIN(created_at) as first_request,
  MAX(created_at) as last_request
FROM groq_usage_logs
GROUP BY DATE_TRUNC('day', created_at), prompt_name, model
ORDER BY date DESC, total_requests DESC;

COMMENT ON VIEW v_groq_usage_stats IS 'Estatísticas de uso da API Groq agregadas por dia';

-- 6.5 - FUNÇÃO PARA LOGAR USO GROQ
-- =====================================================

CREATE OR REPLACE FUNCTION log_groq_usage(
  p_prompt_id BIGINT,
  p_prompt_name TEXT,
  p_model TEXT,
  p_user_id BIGINT,
  p_establishment_id BIGINT,
  p_request JSONB,
  p_response JSONB,
  p_tokens_prompt INTEGER,
  p_tokens_completion INTEGER,
  p_duration_ms INTEGER,
  p_success BOOLEAN,
  p_error_message TEXT DEFAULT NULL
)
RETURNS BIGINT AS $$
DECLARE
  v_log_id BIGINT;
BEGIN
  INSERT INTO groq_usage_logs (
    prompt_id,
    prompt_name,
    model,
    user_id,
    establishment_id,
    request_payload,
    response_payload,
    tokens_prompt,
    tokens_completion,
    tokens_total,
    duration_ms,
    success,
    error_message
  ) VALUES (
    p_prompt_id,
    p_prompt_name,
    p_model,
    p_user_id,
    p_establishment_id,
    p_request,
    p_response,
    p_tokens_prompt,
    p_tokens_completion,
    COALESCE(p_tokens_prompt, 0) + COALESCE(p_tokens_completion, 0),
    p_duration_ms,
    p_success,
    p_error_message
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION log_groq_usage IS 'Registra uso da API Groq no banco de dados';

GRANT EXECUTE ON FUNCTION log_groq_usage TO authenticated, service_role;

-- 6.6 - RLS POLICIES
-- =====================================================

-- Prompts: admin pode ler/escrever, autenticados podem ler ativos
ALTER TABLE groq_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin pode gerenciar prompts"
ON groq_prompts FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

CREATE POLICY "Usuários autenticados podem ler prompts ativos"
ON groq_prompts FOR SELECT
TO authenticated
USING (is_active = true);

-- Logs: apenas admin pode ler
ALTER TABLE groq_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin pode ler logs Groq"
ON groq_usage_logs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- 6.7 - TRIGGER PARA UPDATED_AT
-- =====================================================

CREATE OR REPLACE TRIGGER trg_groq_prompts_updated_at
BEFORE UPDATE ON groq_prompts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- 6.8 - REGISTRAR MIGRATIONS
-- =====================================================

INSERT INTO schema_migrations (version, description) VALUES
  (19, 'Tabela groq_prompts criada'),
  (20, 'Tabela groq_usage_logs criada'),
  (21, 'Prompts pré-configurados inseridos'),
  (22, 'View de analytics Groq criada'),
  (23, 'RLS policies para Groq configuradas')
ON CONFLICT (version) DO NOTHING;

-- =====================================================
-- FIM DA FASE 6 - BANCO DE DADOS
-- =====================================================
