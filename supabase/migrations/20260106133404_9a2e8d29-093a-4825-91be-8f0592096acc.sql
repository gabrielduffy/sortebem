-- Criar estabelecimento "Online" padrão para jogadores sem vínculo presencial
INSERT INTO public.establishments (
  name,
  slug,
  code,
  city,
  state,
  is_active,
  commission_rate,
  balance,
  total_sales,
  total_commission
) VALUES (
  'Sortebem Online',
  'online',
  'ONLINE',
  'Internet',
  'BR',
  true,
  0.00,
  0.00,
  0.00,
  0.00
) ON CONFLICT (slug) DO NOTHING;

-- Criar tabela para configuração de automação de bots
CREATE TABLE IF NOT EXISTS public.bot_automation_config (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  establishment_id BIGINT NOT NULL REFERENCES establishments(id),
  enabled BOOLEAN DEFAULT false,
  min_bots_per_round INTEGER DEFAULT 5,
  max_bots_per_round INTEGER DEFAULT 20,
  min_cards_per_bot INTEGER DEFAULT 1,
  max_cards_per_bot INTEGER DEFAULT 3,
  trigger_type TEXT DEFAULT 'round_open', -- round_open, scheduled, manual
  schedule_cron TEXT,
  last_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(establishment_id)
);

-- Habilitar RLS
ALTER TABLE public.bot_automation_config ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Admins can manage bot config" ON public.bot_automation_config
FOR ALL USING (public.is_admin());

CREATE POLICY "Public can read bot config" ON public.bot_automation_config
FOR SELECT USING (true);

-- Trigger para updated_at
CREATE TRIGGER update_bot_automation_config_updated_at
  BEFORE UPDATE ON public.bot_automation_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Tabela para logs de execução de automação
CREATE TABLE IF NOT EXISTS public.bot_automation_logs (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  config_id BIGINT REFERENCES bot_automation_config(id),
  round_id BIGINT REFERENCES rounds(id),
  bots_created INTEGER DEFAULT 0,
  cards_generated INTEGER DEFAULT 0,
  total_amount NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'pending', -- pending, running, completed, failed
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.bot_automation_logs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Admins can manage bot logs" ON public.bot_automation_logs
FOR ALL USING (public.is_admin());

CREATE POLICY "Public can read bot logs" ON public.bot_automation_logs
FOR SELECT USING (true);

-- Função para executar automação de bots em uma rodada
CREATE OR REPLACE FUNCTION public.execute_bot_automation(
  p_round_id BIGINT,
  p_establishment_id BIGINT,
  p_bot_names TEXT[],
  p_cards_per_bot INTEGER DEFAULT 1
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_round RECORD;
  v_name TEXT;
  v_player_id BIGINT;
  v_participation_id BIGINT;
  v_bots_created INTEGER := 0;
  v_cards_generated INTEGER := 0;
  v_total_amount NUMERIC := 0;
BEGIN
  -- Verificar se rodada existe e está em vendas
  SELECT * INTO v_round FROM rounds WHERE id = p_round_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Rodada não encontrada');
  END IF;
  
  IF v_round.status NOT IN ('selling', 'scheduled', 'open') THEN
    RETURN json_build_object('success', false, 'error', 'Rodada não está aberta para vendas');
  END IF;
  
  -- Processar cada nome de bot
  FOREACH v_name IN ARRAY p_bot_names
  LOOP
    -- Criar ou buscar jogador
    SELECT id INTO v_player_id
    FROM players
    WHERE establishment_id = p_establishment_id
      AND LOWER(name) = LOWER(v_name)
    LIMIT 1;
    
    IF v_player_id IS NULL THEN
      INSERT INTO players (establishment_id, name, is_bot)
      VALUES (p_establishment_id, v_name, true)
      RETURNING id INTO v_player_id;
      v_bots_created := v_bots_created + 1;
    END IF;
    
    -- Verificar se já participa da rodada
    IF NOT EXISTS (
      SELECT 1 FROM player_participations
      WHERE player_id = v_player_id AND round_id = p_round_id
    ) THEN
      -- Adicionar participação
      INSERT INTO player_participations (
        player_id,
        round_id,
        quantity,
        total_amount
      ) VALUES (
        v_player_id,
        p_round_id,
        p_cards_per_bot,
        v_round.card_price * p_cards_per_bot
      )
      RETURNING id INTO v_participation_id;
      
      v_cards_generated := v_cards_generated + p_cards_per_bot;
      v_total_amount := v_total_amount + (v_round.card_price * p_cards_per_bot);
    END IF;
  END LOOP;
  
  -- Atualizar contagem de cartelas na rodada
  UPDATE rounds
  SET cards_sold = COALESCE(cards_sold, 0) + v_cards_generated
  WHERE id = p_round_id;
  
  RETURN json_build_object(
    'success', true,
    'bots_created', v_bots_created,
    'cards_generated', v_cards_generated,
    'total_amount', v_total_amount
  );
END;
$$;