-- =====================================================
-- Corrigir Views SECURITY DEFINER
-- =====================================================

-- Recriar view v_groq_usage_stats com SECURITY INVOKER
DROP VIEW IF EXISTS public.v_groq_usage_stats;
CREATE VIEW public.v_groq_usage_stats 
WITH (security_invoker = true)
AS
SELECT 
  DATE(created_at) as date,
  prompt_name,
  model,
  COUNT(*) as total_requests,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful_requests,
  SUM(CASE WHEN NOT success THEN 1 ELSE 0 END) as failed_requests,
  SUM(tokens_total) as total_tokens,
  AVG(tokens_total)::INTEGER as avg_tokens_per_request,
  AVG(duration_ms)::INTEGER as avg_duration_ms,
  MIN(created_at) as first_request,
  MAX(created_at) as last_request
FROM public.groq_usage_logs
GROUP BY DATE(created_at), prompt_name, model;

-- Recriar view v_player_stats com SECURITY INVOKER
DROP VIEW IF EXISTS public.v_player_stats;
CREATE VIEW public.v_player_stats 
WITH (security_invoker = true)
AS
SELECT 
  p.id,
  p.name,
  p.email,
  p.phone,
  p.is_bot,
  p.establishment_id,
  p.tags,
  p.created_at,
  COALESCE(pp.total_participations, 0) as total_participations,
  COALESCE(pp.total_wins, 0) as total_wins,
  COALESCE(pp.total_prizes_won, 0) as total_prizes_won,
  COALESCE(pp.total_spent, 0) as total_spent,
  COALESCE(pp.total_cards, 0) as total_cards_purchased,
  pp.last_participation,
  pp.recent_participations
FROM public.players p
LEFT JOIN LATERAL (
  SELECT 
    COUNT(*) as total_participations,
    SUM(CASE WHEN is_winner THEN 1 ELSE 0 END) as total_wins,
    SUM(COALESCE(prize_amount, 0)) as total_prizes_won,
    SUM(COALESCE(total_amount, 0)) as total_spent,
    SUM(quantity) as total_cards,
    MAX(participated_at) as last_participation,
    json_agg(
      json_build_object(
        'round_id', round_id,
        'quantity', quantity,
        'is_winner', is_winner,
        'participated_at', participated_at
      ) ORDER BY participated_at DESC
    ) FILTER (WHERE participated_at IS NOT NULL) as recent_participations
  FROM public.player_participations
  WHERE player_id = p.id
) pp ON true;

-- =====================================================
-- Corrigir funções com search_path mutable
-- =====================================================

-- Função refresh_establishment_stats
CREATE OR REPLACE FUNCTION public.refresh_establishment_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RAISE NOTICE 'Stats refresh placeholder function';
END;
$function$;

-- Função trigger_refresh_stats
CREATE OR REPLACE FUNCTION public.trigger_refresh_stats()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  PERFORM pg_notify('stats_changed', TG_TABLE_NAME);
  RETURN NEW;
END;
$function$;

-- Função update_updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- Função update_ticker_messages_updated_at
CREATE OR REPLACE FUNCTION public.update_ticker_messages_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- Função update_feature_flags_updated_at
CREATE OR REPLACE FUNCTION public.update_feature_flags_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- Função update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- Função migrate_user_password
CREATE OR REPLACE FUNCTION public.migrate_user_password(p_user_id bigint, p_new_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  new_hash TEXT;
BEGIN
  SELECT hash_password(p_new_password) INTO new_hash;
  UPDATE users
  SET
    password_hash_new = new_hash,
    password_migrated = true,
    updated_at = NOW()
  WHERE id = p_user_id;
  IF FOUND THEN
    RETURN true;
  ELSE
    RETURN false;
  END IF;
END;
$function$;

-- Função create_next_rounds
CREATE OR REPLACE FUNCTION public.create_next_rounds()
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  last_regular_round RECORD;
  last_special_round RECORD;
  next_regular_number INTEGER;
  next_special_number INTEGER;
  now_time TIMESTAMPTZ;
  regular_price DECIMAL(10,2);
  special_price DECIMAL(10,2);
BEGIN
  now_time := NOW();
  regular_price := 5.00;
  special_price := 10.00;

  SELECT * INTO last_regular_round
  FROM rounds WHERE type = 'regular' ORDER BY created_at DESC LIMIT 1;
  
  IF last_regular_round IS NULL OR 
     (last_regular_round.selling_ends_at < now_time AND last_regular_round.status != 'drawing') THEN
    SELECT COALESCE(MAX(number), 0) + 1 INTO next_regular_number FROM rounds WHERE type = 'regular';
    INSERT INTO rounds (number, type, status, card_price, max_cards, starts_at, ends_at, selling_ends_at, is_selling)
    VALUES (next_regular_number, 'regular', 'selling', regular_price, 1000, now_time, 
            now_time + INTERVAL '10 minutes', now_time + INTERVAL '7 minutes', true);
  END IF;

  SELECT * INTO last_special_round
  FROM rounds WHERE type = 'special' ORDER BY created_at DESC LIMIT 1;
  
  IF last_special_round IS NULL OR 
     (last_special_round.selling_ends_at < now_time AND last_special_round.status != 'drawing') THEN
    SELECT COALESCE(MAX(number), 0) + 1 INTO next_special_number FROM rounds WHERE type = 'special';
    INSERT INTO rounds (number, type, status, card_price, max_cards, starts_at, ends_at, selling_ends_at, is_selling)
    VALUES (next_special_number, 'special', 'selling', special_price, 5000, now_time,
            now_time + INTERVAL '60 minutes', now_time + INTERVAL '57 minutes', true);
  END IF;

  UPDATE rounds SET is_selling = false WHERE is_selling = true AND selling_ends_at < now_time AND status = 'selling';
  UPDATE rounds SET status = 'finished', is_selling = false, finished_at = now_time
  WHERE status IN ('selling', 'drawing') AND ends_at < now_time;
END;
$function$;

-- Função create_players_batch
CREATE OR REPLACE FUNCTION public.create_players_batch(p_establishment_id bigint, p_names text[], p_is_bot boolean DEFAULT true, p_created_by bigint DEFAULT NULL::bigint)
RETURNS TABLE(id bigint, name text, created boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_name TEXT;
  v_player_id BIGINT;
  v_exists BOOLEAN;
BEGIN
  FOREACH v_name IN ARRAY p_names LOOP
    SELECT EXISTS(SELECT 1 FROM players WHERE establishment_id = p_establishment_id AND LOWER(players.name) = LOWER(v_name)) INTO v_exists;
    IF v_exists THEN
      SELECT pl.id INTO v_player_id FROM players pl WHERE pl.establishment_id = p_establishment_id AND LOWER(pl.name) = LOWER(v_name) LIMIT 1;
      RETURN QUERY SELECT v_player_id, v_name, false;
    ELSE
      INSERT INTO players (establishment_id, name, is_bot, created_by) VALUES (p_establishment_id, v_name, p_is_bot, p_created_by) RETURNING players.id INTO v_player_id;
      RETURN QUERY SELECT v_player_id, v_name, true;
    END IF;
  END LOOP;
END;
$function$;

-- Função process_player_command
CREATE OR REPLACE FUNCTION public.process_player_command(p_command text, p_establishment_id bigint DEFAULT NULL::bigint, p_user_id bigint DEFAULT NULL::bigint)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_result JSONB;
BEGIN
  v_result := json_build_object(
    'success', true,
    'command', p_command,
    'parsed', json_build_object('action', 'create_players', 'quantity', NULL, 'establishment_id', p_establishment_id, 'round_id', NULL),
    'message', 'Comando recebido. Use Groq AI para interpretar.'
  );
  RETURN v_result;
END;
$function$;

-- Função create_manual_round
CREATE OR REPLACE FUNCTION public.create_manual_round(p_establishment_id bigint, p_draw_date date, p_draw_time time without time zone, p_prize numeric, p_card_price numeric, p_winner_criteria text DEFAULT 'full_card'::text, p_tiebreak_rule text DEFAULT 'stone'::text, p_min_participants integer DEFAULT NULL::integer, p_max_participants integer DEFAULT NULL::integer, p_type text DEFAULT 'regular'::text, p_description text DEFAULT NULL::text, p_created_by bigint DEFAULT NULL::bigint)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_round_id BIGINT;
  v_starts_at TIMESTAMPTZ;
  v_ends_at TIMESTAMPTZ;
  v_selling_ends_at TIMESTAMPTZ;
  v_round_number INTEGER;
BEGIN
  v_starts_at := p_draw_date::TIMESTAMP + p_draw_time;
  v_ends_at := v_starts_at + INTERVAL '2 hours';
  v_selling_ends_at := v_starts_at - INTERVAL '5 minutes';
  SELECT COALESCE(MAX(number), 0) + 1 INTO v_round_number FROM rounds;
  IF p_prize <= 0 THEN RETURN json_build_object('success', false, 'error', 'Prêmio deve ser maior que zero'); END IF;
  IF p_card_price <= 0 THEN RETURN json_build_object('success', false, 'error', 'Preço da cartela deve ser maior que zero'); END IF;
  INSERT INTO rounds (number, type, status, card_price, max_cards, prize_pool, starts_at, ends_at, selling_ends_at, manual_creation, winner_criteria, tiebreak_rule, min_participants, max_participants, draw_time, created_at)
  VALUES (v_round_number, p_type, 'scheduled', p_card_price, COALESCE(p_max_participants, 1000), p_prize, v_starts_at, v_ends_at, v_selling_ends_at, true, p_winner_criteria, p_tiebreak_rule, p_min_participants, p_max_participants, p_draw_time, NOW())
  RETURNING id INTO v_round_id;
  RETURN json_build_object('success', true, 'round_id', v_round_id, 'draw_datetime', v_starts_at);
END;
$function$;

-- Função hash_password
CREATE OR REPLACE FUNCTION public.hash_password(password text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN crypt(password, gen_salt('bf', 10));
END;
$function$;

-- Função verify_password
CREATE OR REPLACE FUNCTION public.verify_password(password text, hash text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN hash = crypt(password, hash);
END;
$function$;

-- Função authenticate_user
CREATE OR REPLACE FUNCTION public.authenticate_user(p_email text, p_password text)
RETURNS TABLE(success boolean, user_id bigint, user_name text, user_email text, user_role text, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_user RECORD;
  v_authenticated BOOLEAN := false;
  v_flag_enabled BOOLEAN := false;
BEGIN
  SELECT * INTO v_user FROM users WHERE email = LOWER(p_email) AND is_active = true;
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::BIGINT, NULL::TEXT, NULL::TEXT, NULL::TEXT, 'Credenciais inválidas'::TEXT;
    RETURN;
  END IF;
  SELECT enabled INTO v_flag_enabled FROM feature_flags WHERE key = 'use_bcrypt_auth' LIMIT 1;
  IF v_flag_enabled AND v_user.password_migrated AND v_user.password_hash_new IS NOT NULL THEN
    v_authenticated := verify_password(p_password, v_user.password_hash_new);
  ELSE
    v_authenticated := true;
    IF v_flag_enabled THEN PERFORM migrate_user_password(v_user.id, p_password); END IF;
  END IF;
  IF v_authenticated THEN
    RETURN QUERY SELECT true, v_user.id, v_user.name, v_user.email, v_user.role, 'Login bem-sucedido'::TEXT;
  ELSE
    RETURN QUERY SELECT false, NULL::BIGINT, NULL::TEXT, NULL::TEXT, NULL::TEXT, 'Credenciais inválidas'::TEXT;
  END IF;
END;
$function$;

-- Função process_payment_webhook
CREATE OR REPLACE FUNCTION public.process_payment_webhook(p_webhook_id bigint, p_purchase_id bigint)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_auto_generate BOOLEAN := false;
BEGIN
  UPDATE purchases SET payment_status = 'confirmed', paid_at = NOW(), payment_confirmed = true, updated_at = NOW() WHERE id = p_purchase_id;
  IF NOT FOUND THEN RETURN false; END IF;
  UPDATE payment_webhooks SET processed = true, processed_at = NOW() WHERE id = p_webhook_id;
  SELECT enabled INTO v_auto_generate FROM feature_flags WHERE key = 'auto_generate_cards' LIMIT 1;
  RETURN true;
END;
$function$;

-- Função log_groq_usage
CREATE OR REPLACE FUNCTION public.log_groq_usage(p_prompt_id bigint, p_prompt_name text, p_model text, p_user_id bigint, p_establishment_id bigint, p_request jsonb, p_response jsonb, p_tokens_prompt integer, p_tokens_completion integer, p_duration_ms integer, p_success boolean, p_error_message text DEFAULT NULL::text)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_log_id BIGINT;
BEGIN
  INSERT INTO groq_usage_logs (prompt_id, prompt_name, model, user_id, establishment_id, request_payload, response_payload, tokens_prompt, tokens_completion, tokens_total, duration_ms, success, error_message)
  VALUES (p_prompt_id, p_prompt_name, p_model, p_user_id, p_establishment_id, p_request, p_response, p_tokens_prompt, p_tokens_completion, COALESCE(p_tokens_prompt, 0) + COALESCE(p_tokens_completion, 0), p_duration_ms, p_success, p_error_message)
  RETURNING id INTO v_log_id;
  RETURN v_log_id;
END;
$function$;

-- Função add_player_to_round
CREATE OR REPLACE FUNCTION public.add_player_to_round(p_player_id bigint, p_round_id bigint, p_quantity integer DEFAULT 1, p_total_amount numeric DEFAULT 0)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_participation_id BIGINT;
BEGIN
  IF EXISTS(SELECT 1 FROM player_participations WHERE player_id = p_player_id AND round_id = p_round_id) THEN
    RAISE EXCEPTION 'Jogador já está participando desta rodada';
  END IF;
  INSERT INTO player_participations (player_id, round_id, quantity, total_amount) VALUES (p_player_id, p_round_id, p_quantity, p_total_amount) RETURNING id INTO v_participation_id;
  RETURN v_participation_id;
END;
$function$;

-- Função validate_round_time_conflict
CREATE OR REPLACE FUNCTION public.validate_round_time_conflict(p_establishment_id bigint, p_draw_datetime timestamp with time zone, p_exclude_round_id bigint DEFAULT NULL::bigint)
RETURNS TABLE(has_conflict boolean, conflicting_rounds jsonb)
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  v_start_time TIMESTAMPTZ;
  v_end_time TIMESTAMPTZ;
  v_conflicts JSONB;
BEGIN
  v_start_time := p_draw_datetime - INTERVAL '30 minutes';
  v_end_time := p_draw_datetime + INTERVAL '30 minutes';
  SELECT json_agg(json_build_object('id', r.id, 'prize', r.prize_pool, 'status', r.status)) INTO v_conflicts
  FROM rounds r WHERE (p_exclude_round_id IS NULL OR r.id != p_exclude_round_id) AND r.status IN ('open', 'in_progress', 'scheduled');
  IF v_conflicts IS NOT NULL THEN RETURN QUERY SELECT true, v_conflicts;
  ELSE RETURN QUERY SELECT false, '[]'::JSONB; END IF;
END;
$function$;

-- Função auto_open_scheduled_rounds
CREATE OR REPLACE FUNCTION public.auto_open_scheduled_rounds()
RETURNS integer
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  v_opened_count INTEGER := 0;
BEGIN
  UPDATE rounds SET status = 'open', updated_at = NOW() WHERE status = 'scheduled' AND draw_time IS NOT NULL;
  GET DIAGNOSTICS v_opened_count = ROW_COUNT;
  RETURN v_opened_count;
END;
$function$;