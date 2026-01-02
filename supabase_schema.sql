


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."app_role" AS ENUM (
    'admin',
    'manager',
    'establishment',
    'user'
);


ALTER TYPE "public"."app_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_player_to_round"("p_player_id" bigint, "p_round_id" bigint, "p_quantity" integer DEFAULT 1, "p_total_amount" numeric DEFAULT 0) RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_participation_id BIGINT;
BEGIN
  IF EXISTS(
    SELECT 1 FROM player_participations
    WHERE player_id = p_player_id AND round_id = p_round_id
  ) THEN
    RAISE EXCEPTION 'Jogador já está participando desta rodada';
  END IF;

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
$$;


ALTER FUNCTION "public"."add_player_to_round"("p_player_id" bigint, "p_round_id" bigint, "p_quantity" integer, "p_total_amount" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."authenticate_user"("p_email" "text", "p_password" "text") RETURNS TABLE("success" boolean, "user_id" bigint, "user_name" "text", "user_email" "text", "user_role" "text", "message" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_user RECORD;
  v_authenticated BOOLEAN := false;
  v_flag_enabled BOOLEAN := false;
BEGIN
  -- Buscar usuário
  SELECT * INTO v_user
  FROM users
  WHERE email = LOWER(p_email)
    AND is_active = true;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::BIGINT, NULL::TEXT, NULL::TEXT, NULL::TEXT, 'Credenciais inválidas'::TEXT;
    RETURN;
  END IF;

  -- Verificar se feature flag de bcrypt está habilitada
  SELECT enabled INTO v_flag_enabled
  FROM feature_flags
  WHERE key = 'use_bcrypt_auth'
  LIMIT 1;

  -- DUAL AUTH: Tenta novo sistema primeiro, fallback para antigo
  IF v_flag_enabled AND v_user.password_migrated AND v_user.password_hash_new IS NOT NULL THEN
    -- Sistema NOVO: Verificar senha com bcrypt
    v_authenticated := verify_password(p_password, v_user.password_hash_new);
  ELSE
    -- Sistema ANTIGO: Aceita qualquer senha (compatibilidade)
    v_authenticated := true;

    -- Aproveita para migrar on-the-fly
    IF v_flag_enabled THEN
      PERFORM migrate_user_password(v_user.id, p_password);
    END IF;
  END IF;

  IF v_authenticated THEN
    RETURN QUERY SELECT
      true,
      v_user.id,
      v_user.name,
      v_user.email,
      v_user.role,
      'Login bem-sucedido'::TEXT;
  ELSE
    RETURN QUERY SELECT
      false,
      NULL::BIGINT,
      NULL::TEXT,
      NULL::TEXT,
      NULL::TEXT,
      'Credenciais inválidas'::TEXT;
  END IF;
END;
$$;


ALTER FUNCTION "public"."authenticate_user"("p_email" "text", "p_password" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."authenticate_user"("p_email" "text", "p_password" "text") IS 'Autentica usuário com suporte a migração gradual de bcrypt';



CREATE OR REPLACE FUNCTION "public"."auto_open_scheduled_rounds"() RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_opened_count INTEGER := 0;
BEGIN
  UPDATE rounds
  SET status = 'open',
      updated_at = NOW()
  WHERE status = 'scheduled'
    AND draw_time IS NOT NULL;

  GET DIAGNOSTICS v_opened_count = ROW_COUNT;
  RETURN v_opened_count;
END;
$$;


ALTER FUNCTION "public"."auto_open_scheduled_rounds"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_manual_round"("p_establishment_id" bigint, "p_draw_date" "date", "p_draw_time" time without time zone, "p_prize" numeric, "p_card_price" numeric, "p_winner_criteria" "text" DEFAULT 'full_card'::"text", "p_tiebreak_rule" "text" DEFAULT 'stone'::"text", "p_min_participants" integer DEFAULT NULL::integer, "p_max_participants" integer DEFAULT NULL::integer, "p_type" "text" DEFAULT 'regular'::"text", "p_description" "text" DEFAULT NULL::"text", "p_created_by" bigint DEFAULT NULL::bigint) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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

  IF p_prize <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Prêmio deve ser maior que zero');
  END IF;

  IF p_card_price <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Preço da cartela deve ser maior que zero');
  END IF;

  INSERT INTO rounds (
    number,
    type,
    status,
    card_price,
    max_cards,
    prize_pool,
    starts_at,
    ends_at,
    selling_ends_at,
    manual_creation,
    winner_criteria,
    tiebreak_rule,
    min_participants,
    max_participants,
    draw_time,
    created_at
  ) VALUES (
    v_round_number,
    p_type,
    'scheduled',
    p_card_price,
    COALESCE(p_max_participants, 1000),
    p_prize,
    v_starts_at,
    v_ends_at,
    v_selling_ends_at,
    true,
    p_winner_criteria,
    p_tiebreak_rule,
    p_min_participants,
    p_max_participants,
    p_draw_time,
    NOW()
  )
  RETURNING id INTO v_round_id;

  RETURN json_build_object(
    'success', true,
    'round_id', v_round_id,
    'draw_datetime', v_starts_at
  );
END;
$$;


ALTER FUNCTION "public"."create_manual_round"("p_establishment_id" bigint, "p_draw_date" "date", "p_draw_time" time without time zone, "p_prize" numeric, "p_card_price" numeric, "p_winner_criteria" "text", "p_tiebreak_rule" "text", "p_min_participants" integer, "p_max_participants" integer, "p_type" "text", "p_description" "text", "p_created_by" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_next_rounds"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
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
  
  -- Valores padrão
  regular_price := 5.00;
  special_price := 10.00;

  -- =====================================================
  -- CRIAR RODADA REGULAR (a cada 10 minutos)
  -- =====================================================
  
  -- Buscar última rodada regular
  SELECT * INTO last_regular_round
  FROM rounds
  WHERE type = 'regular'
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Se não existe rodada regular OU a última terminou as vendas
  IF last_regular_round IS NULL OR 
     (last_regular_round.selling_ends_at < now_time AND last_regular_round.status != 'drawing') THEN
    
    -- Calcular próximo número (contador separado para regular)
    SELECT COALESCE(MAX(number), 0) + 1 INTO next_regular_number
    FROM rounds
    WHERE type = 'regular';
    
    -- Criar nova rodada regular
    INSERT INTO rounds (
      number,
      type,
      status,
      card_price,
      max_cards,
      starts_at,
      ends_at,
      selling_ends_at,
      is_selling
    ) VALUES (
      next_regular_number,
      'regular',
      'selling',
      regular_price,
      1000,
      now_time,
      now_time + INTERVAL '10 minutes',
      now_time + INTERVAL '7 minutes',
      true
    );
    
    RAISE NOTICE 'Rodada regular #% criada', next_regular_number;
  END IF;

  -- =====================================================
  -- CRIAR RODADA ESPECIAL (a cada 60 minutos)
  -- =====================================================
  
  -- Buscar última rodada especial
  SELECT * INTO last_special_round
  FROM rounds
  WHERE type = 'special'
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Se não existe rodada especial OU a última terminou as vendas
  IF last_special_round IS NULL OR 
     (last_special_round.selling_ends_at < now_time AND last_special_round.status != 'drawing') THEN
    
    -- Calcular próximo número (contador separado para especial)
    SELECT COALESCE(MAX(number), 0) + 1 INTO next_special_number
    FROM rounds
    WHERE type = 'special';
    
    -- Criar nova rodada especial
    INSERT INTO rounds (
      number,
      type,
      status,
      card_price,
      max_cards,
      starts_at,
      ends_at,
      selling_ends_at,
      is_selling
    ) VALUES (
      next_special_number,
      'special',
      'selling',
      special_price,
      5000,
      now_time,
      now_time + INTERVAL '60 minutes',
      now_time + INTERVAL '57 minutes',
      true
    );
    
    RAISE NOTICE 'Rodada especial #% criada', next_special_number;
  END IF;

  -- =====================================================
  -- ATUALIZAR STATUS DAS RODADAS
  -- =====================================================
  
  -- Parar vendas quando selling_ends_at passar
  UPDATE rounds
  SET is_selling = false
  WHERE is_selling = true 
    AND selling_ends_at < now_time
    AND status = 'selling';
  
  -- Finalizar rodadas quando ends_at passar
  UPDATE rounds
  SET 
    status = 'finished',
    is_selling = false,
    finished_at = now_time
  WHERE status IN ('selling', 'drawing')
    AND ends_at < now_time;

END;
$$;


ALTER FUNCTION "public"."create_next_rounds"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."create_next_rounds"() IS 'Cria rodadas automaticamente (regular: 10min, special: 60min)';



CREATE OR REPLACE FUNCTION "public"."create_players_batch"("p_establishment_id" bigint, "p_names" "text"[], "p_is_bot" boolean DEFAULT true, "p_created_by" bigint DEFAULT NULL::bigint) RETURNS TABLE("id" bigint, "name" "text", "created" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_name TEXT;
  v_player_id BIGINT;
  v_exists BOOLEAN;
BEGIN
  FOREACH v_name IN ARRAY p_names
  LOOP
    SELECT EXISTS(
      SELECT 1 FROM players
      WHERE establishment_id = p_establishment_id
      AND LOWER(name) = LOWER(v_name)
    ) INTO v_exists;

    IF v_exists THEN
      SELECT pl.id INTO v_player_id
      FROM players pl
      WHERE pl.establishment_id = p_establishment_id
      AND LOWER(pl.name) = LOWER(v_name)
      LIMIT 1;

      RETURN QUERY SELECT v_player_id, v_name, false;
    ELSE
      INSERT INTO players (establishment_id, name, is_bot, created_by)
      VALUES (p_establishment_id, v_name, p_is_bot, p_created_by)
      RETURNING players.id INTO v_player_id;

      RETURN QUERY SELECT v_player_id, v_name, true;
    END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."create_players_batch"("p_establishment_id" bigint, "p_names" "text"[], "p_is_bot" boolean, "p_created_by" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_id_by_auth"("p_auth_id" "uuid") RETURNS bigint
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT id FROM public.users WHERE auth_id = p_auth_id LIMIT 1;
$$;


ALTER FUNCTION "public"."get_user_id_by_auth"("p_auth_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_role"("_user_id" bigint, "_role" "public"."app_role") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


ALTER FUNCTION "public"."has_role"("_user_id" bigint, "_role" "public"."app_role") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hash_password"("password" "text") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Gera hash bcrypt com 10 rounds (bom balance entre segurança e performance)
  RETURN crypt(password, gen_salt('bf', 10));
END;
$$;


ALTER FUNCTION "public"."hash_password"("password" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."hash_password"("password" "text") IS 'Gera hash bcrypt de uma senha (10 rounds)';



CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.users u ON ur.user_id = u.id
    WHERE u.auth_id = auth.uid()
      AND ur.role = 'admin'
  )
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_groq_usage"("p_prompt_id" bigint, "p_prompt_name" "text", "p_model" "text", "p_user_id" bigint, "p_establishment_id" bigint, "p_request" "jsonb", "p_response" "jsonb", "p_tokens_prompt" integer, "p_tokens_completion" integer, "p_duration_ms" integer, "p_success" boolean, "p_error_message" "text" DEFAULT NULL::"text") RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_log_id BIGINT;
BEGIN
  INSERT INTO groq_usage_logs (
    prompt_id, prompt_name, model, user_id, establishment_id,
    request_payload, response_payload, tokens_prompt, tokens_completion,
    tokens_total, duration_ms, success, error_message
  ) VALUES (
    p_prompt_id, p_prompt_name, p_model, p_user_id, p_establishment_id,
    p_request, p_response, p_tokens_prompt, p_tokens_completion,
    COALESCE(p_tokens_prompt, 0) + COALESCE(p_tokens_completion, 0),
    p_duration_ms, p_success, p_error_message
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;


ALTER FUNCTION "public"."log_groq_usage"("p_prompt_id" bigint, "p_prompt_name" "text", "p_model" "text", "p_user_id" bigint, "p_establishment_id" bigint, "p_request" "jsonb", "p_response" "jsonb", "p_tokens_prompt" integer, "p_tokens_completion" integer, "p_duration_ms" integer, "p_success" boolean, "p_error_message" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."migrate_user_password"("p_user_id" bigint, "p_new_password" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  new_hash TEXT;
BEGIN
  -- Gerar hash bcrypt da nova senha
  SELECT hash_password(p_new_password) INTO new_hash;

  -- Atualizar usuário
  UPDATE users
  SET
    password_hash_new = new_hash,
    password_migrated = true,
    updated_at = NOW()
  WHERE id = p_user_id;

  IF FOUND THEN
    RAISE NOTICE 'Password migrated for user %', p_user_id;
    RETURN true;
  ELSE
    RAISE NOTICE 'User % not found', p_user_id;
    RETURN false;
  END IF;
END;
$$;


ALTER FUNCTION "public"."migrate_user_password"("p_user_id" bigint, "p_new_password" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."migrate_user_password"("p_user_id" bigint, "p_new_password" "text") IS 'Migra a senha de um usuário específico para o novo sistema bcrypt';



CREATE OR REPLACE FUNCTION "public"."process_payment_webhook"("p_webhook_id" bigint, "p_purchase_id" bigint) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_auto_generate BOOLEAN := false;
BEGIN
  -- Marcar purchase como paga
  UPDATE purchases
  SET
    payment_status = 'confirmed',
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
$$;


ALTER FUNCTION "public"."process_payment_webhook"("p_webhook_id" bigint, "p_purchase_id" bigint) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."process_payment_webhook"("p_webhook_id" bigint, "p_purchase_id" bigint) IS 'Processa webhook de pagamento confirmado';



CREATE OR REPLACE FUNCTION "public"."process_player_command"("p_command" "text", "p_establishment_id" bigint DEFAULT NULL::bigint, "p_user_id" bigint DEFAULT NULL::bigint) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_result JSONB;
BEGIN
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
$$;


ALTER FUNCTION "public"."process_player_command"("p_command" "text", "p_establishment_id" bigint, "p_user_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."refresh_establishment_stats"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RAISE NOTICE 'Stats refresh placeholder function';
END;
$$;


ALTER FUNCTION "public"."refresh_establishment_stats"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."resolve_tiebreak_stone"("p_round_id" bigint, "p_card_ids" bigint[]) RETURNS TABLE("winner_card_id" bigint, "stone_number" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_card_id BIGINT;
  v_max_stone INTEGER := 0;
  v_winner_id BIGINT;
  v_stone INTEGER;
  v_stones INTEGER[] := '{}';
BEGIN
  -- Para cada cartela empatada, sortear número de 1-75
  FOREACH v_card_id IN ARRAY p_card_ids
  LOOP
    v_stone := floor(random() * 75 + 1)::INTEGER;
    -- Garantir número único
    WHILE v_stone = ANY(v_stones) LOOP
      v_stone := floor(random() * 75 + 1)::INTEGER;
    END LOOP;
    v_stones := array_append(v_stones, v_stone);
    
    IF v_stone > v_max_stone THEN
      v_max_stone := v_stone;
      v_winner_id := v_card_id;
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT v_winner_id, v_max_stone;
END;
$$;


ALTER FUNCTION "public"."resolve_tiebreak_stone"("p_round_id" bigint, "p_card_ids" bigint[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_refresh_stats"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  PERFORM pg_notify('stats_changed', TG_TABLE_NAME);
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_refresh_stats"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_feature_flags_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_feature_flags_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_ticker_messages_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_ticker_messages_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_round_time_conflict"("p_establishment_id" bigint, "p_draw_datetime" timestamp with time zone, "p_exclude_round_id" bigint DEFAULT NULL::bigint) RETURNS TABLE("has_conflict" boolean, "conflicting_rounds" "jsonb")
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_start_time TIMESTAMPTZ;
  v_end_time TIMESTAMPTZ;
  v_conflicts JSONB;
BEGIN
  v_start_time := p_draw_datetime - INTERVAL '30 minutes';
  v_end_time := p_draw_datetime + INTERVAL '30 minutes';

  SELECT json_agg(
    json_build_object(
      'id', r.id,
      'prize', r.prize,
      'status', r.status
    )
  ) INTO v_conflicts
  FROM rounds r
  WHERE (p_exclude_round_id IS NULL OR r.id != p_exclude_round_id)
    AND r.status IN ('open', 'in_progress', 'scheduled');

  IF v_conflicts IS NOT NULL THEN
    RETURN QUERY SELECT true, v_conflicts;
  ELSE
    RETURN QUERY SELECT false, '[]'::JSONB;
  END IF;
END;
$$;


ALTER FUNCTION "public"."validate_round_time_conflict"("p_establishment_id" bigint, "p_draw_datetime" timestamp with time zone, "p_exclude_round_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."verify_password"("password" "text", "hash" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Compara senha com hash usando bcrypt
  RETURN hash = crypt(password, hash);
END;
$$;


ALTER FUNCTION "public"."verify_password"("password" "text", "hash" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."verify_password"("password" "text", "hash" "text") IS 'Verifica se uma senha corresponde ao hash bcrypt';


SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."cards" (
    "id" bigint NOT NULL,
    "code" "text" NOT NULL,
    "round_id" bigint NOT NULL,
    "purchase_id" bigint,
    "numbers" integer[] NOT NULL,
    "status" "text" DEFAULT 'active'::"text",
    "is_winner" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "cards_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'winner'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."cards" OWNER TO "postgres";


COMMENT ON TABLE "public"."cards" IS 'Cartelas de bingo 5x5';



CREATE SEQUENCE IF NOT EXISTS "public"."cards_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."cards_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."cards_id_seq" OWNED BY "public"."cards"."id";



CREATE TABLE IF NOT EXISTS "public"."charities" (
    "id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "logo_url" "text",
    "pix_key" "text",
    "website" "text",
    "instagram" "text",
    "is_active" boolean DEFAULT false,
    "total_received" numeric(12,2) DEFAULT 0.00,
    "active_month" "date",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "total_raised" numeric(12,2) DEFAULT 0
);


ALTER TABLE "public"."charities" OWNER TO "postgres";


COMMENT ON TABLE "public"."charities" IS 'Instituições beneficentes que recebem doações';



COMMENT ON COLUMN "public"."charities"."total_raised" IS 'Total arrecadado para a instituição (exibido no TV Mode)';



CREATE SEQUENCE IF NOT EXISTS "public"."charities_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."charities_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."charities_id_seq" OWNED BY "public"."charities"."id";



CREATE TABLE IF NOT EXISTS "public"."draws" (
    "id" bigint NOT NULL,
    "round_id" bigint NOT NULL,
    "number" integer NOT NULL,
    "position" integer NOT NULL,
    "drawn_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."draws" OWNER TO "postgres";


COMMENT ON TABLE "public"."draws" IS 'Histórico de números sorteados';



CREATE SEQUENCE IF NOT EXISTS "public"."draws_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."draws_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."draws_id_seq" OWNED BY "public"."draws"."id";



CREATE TABLE IF NOT EXISTS "public"."establishments" (
    "id" bigint NOT NULL,
    "user_id" bigint,
    "manager_id" bigint,
    "name" "text" NOT NULL,
    "cnpj" "text",
    "phone" "text",
    "address" "text",
    "city" "text",
    "state" "text",
    "code" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "commission_rate" numeric(5,2) DEFAULT 5.00,
    "balance" numeric(12,2) DEFAULT 0.00,
    "total_sales" numeric(12,2) DEFAULT 0.00,
    "total_commission" numeric(12,2) DEFAULT 0.00,
    "kyc_status" "text" DEFAULT 'pending'::"text",
    "is_active" boolean DEFAULT true,
    "logo_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "auth_id" "uuid",
    CONSTRAINT "establishments_kyc_status_check" CHECK (("kyc_status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."establishments" OWNER TO "postgres";


COMMENT ON TABLE "public"."establishments" IS 'Estabelecimentos parceiros que vendem cartelas';



COMMENT ON COLUMN "public"."establishments"."slug" IS 'Identificador único para URL da TV Mode (/tv/{slug})';



CREATE SEQUENCE IF NOT EXISTS "public"."establishments_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."establishments_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."establishments_id_seq" OWNED BY "public"."establishments"."id";



CREATE TABLE IF NOT EXISTS "public"."feature_flags" (
    "key" "text" NOT NULL,
    "enabled" boolean DEFAULT false NOT NULL,
    "description" "text",
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."feature_flags" OWNER TO "postgres";


COMMENT ON TABLE "public"."feature_flags" IS 'Controle de feature flags para rollout gradual de funcionalidades';



COMMENT ON COLUMN "public"."feature_flags"."key" IS 'Identificador único da feature';



COMMENT ON COLUMN "public"."feature_flags"."enabled" IS 'Se a feature está habilitada (true) ou desabilitada (false)';



COMMENT ON COLUMN "public"."feature_flags"."description" IS 'Descrição do que a feature faz';



CREATE TABLE IF NOT EXISTS "public"."groq_prompts" (
    "id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "system_prompt" "text" NOT NULL,
    "user_prompt_template" "text" NOT NULL,
    "model" "text" DEFAULT 'llama-3.1-70b-versatile'::"text" NOT NULL,
    "temperature" numeric(3,2) DEFAULT 0.7,
    "max_tokens" integer DEFAULT 1024,
    "is_active" boolean DEFAULT true,
    "category" "text" DEFAULT 'general'::"text",
    "created_by" bigint,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "groq_prompts_temperature_check" CHECK ((("temperature" >= (0)::numeric) AND ("temperature" <= (2)::numeric)))
);


ALTER TABLE "public"."groq_prompts" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."groq_prompts_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."groq_prompts_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."groq_prompts_id_seq" OWNED BY "public"."groq_prompts"."id";



CREATE TABLE IF NOT EXISTS "public"."groq_usage_logs" (
    "id" bigint NOT NULL,
    "prompt_id" bigint,
    "prompt_name" "text",
    "model" "text" NOT NULL,
    "user_id" bigint,
    "establishment_id" bigint,
    "request_payload" "jsonb" NOT NULL,
    "response_payload" "jsonb",
    "tokens_prompt" integer,
    "tokens_completion" integer,
    "tokens_total" integer,
    "duration_ms" integer,
    "success" boolean DEFAULT true,
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."groq_usage_logs" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."groq_usage_logs_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."groq_usage_logs_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."groq_usage_logs_id_seq" OWNED BY "public"."groq_usage_logs"."id";



CREATE TABLE IF NOT EXISTS "public"."logs" (
    "id" bigint NOT NULL,
    "user_id" bigint,
    "action" "text" NOT NULL,
    "entity_type" "text",
    "entity_id" bigint,
    "details" "jsonb",
    "ip_address" "text",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."logs" OWNER TO "postgres";


COMMENT ON TABLE "public"."logs" IS 'Logs de auditoria de ações no sistema';



CREATE SEQUENCE IF NOT EXISTS "public"."logs_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."logs_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."logs_id_seq" OWNED BY "public"."logs"."id";



CREATE TABLE IF NOT EXISTS "public"."managers" (
    "id" bigint NOT NULL,
    "user_id" bigint,
    "code" "text" NOT NULL,
    "cpf" "text",
    "commission_rate" numeric(5,2) DEFAULT 10.00,
    "kyc_status" "text" DEFAULT 'pending'::"text",
    "balance" numeric(12,2) DEFAULT 0.00,
    "total_commission" numeric(12,2) DEFAULT 0.00,
    "is_active" boolean DEFAULT true,
    "referral_code" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "auth_id" "uuid",
    CONSTRAINT "managers_kyc_status_check" CHECK (("kyc_status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."managers" OWNER TO "postgres";


COMMENT ON TABLE "public"."managers" IS 'Gerentes que indicam estabelecimentos';



CREATE SEQUENCE IF NOT EXISTS "public"."managers_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."managers_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."managers_id_seq" OWNED BY "public"."managers"."id";



CREATE TABLE IF NOT EXISTS "public"."payment_webhooks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "purchase_id" bigint,
    "gateway" "text" NOT NULL,
    "event_type" "text" NOT NULL,
    "payload" "jsonb" NOT NULL,
    "processed" boolean DEFAULT false,
    "processed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "error_message" "text"
);


ALTER TABLE "public"."payment_webhooks" OWNER TO "postgres";


COMMENT ON COLUMN "public"."payment_webhooks"."processed" IS 'Se o webhook já foi processado';



COMMENT ON COLUMN "public"."payment_webhooks"."processed_at" IS 'Data/hora de processamento do webhook';



COMMENT ON COLUMN "public"."payment_webhooks"."error_message" IS 'Mensagem de erro se falhou';



CREATE TABLE IF NOT EXISTS "public"."player_participations" (
    "id" bigint NOT NULL,
    "player_id" bigint NOT NULL,
    "round_id" bigint NOT NULL,
    "purchase_id" bigint,
    "quantity" integer DEFAULT 1 NOT NULL,
    "total_amount" numeric(10,2) DEFAULT 0,
    "is_winner" boolean DEFAULT false,
    "prize_amount" numeric(10,2),
    "participated_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "player_participations_quantity_check" CHECK ((("quantity" > 0) AND ("quantity" <= 100)))
);


ALTER TABLE "public"."player_participations" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."player_participations_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."player_participations_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."player_participations_id_seq" OWNED BY "public"."player_participations"."id";



CREATE TABLE IF NOT EXISTS "public"."players" (
    "id" bigint NOT NULL,
    "establishment_id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "email" "text",
    "phone" "text",
    "cpf" "text",
    "is_bot" boolean DEFAULT false,
    "avatar_url" "text",
    "notes" "text",
    "tags" "text"[] DEFAULT ARRAY[]::"text"[],
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_by" bigint,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "players_cpf_format" CHECK ((("cpf" IS NULL) OR ("cpf" ~ '^\d{11}$'::"text"))),
    CONSTRAINT "players_phone_format" CHECK ((("phone" IS NULL) OR ("phone" ~ '^\d{10,15}$'::"text")))
);


ALTER TABLE "public"."players" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."players_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."players_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."players_id_seq" OWNED BY "public"."players"."id";



CREATE TABLE IF NOT EXISTS "public"."pos_terminals" (
    "id" bigint NOT NULL,
    "establishment_id" bigint NOT NULL,
    "terminal_code" "text" NOT NULL,
    "api_key" "text" NOT NULL,
    "api_key_hash" "text" NOT NULL,
    "terminal_id" "text",
    "name" "text",
    "is_active" boolean DEFAULT true,
    "active" boolean DEFAULT true,
    "last_heartbeat" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."pos_terminals" OWNER TO "postgres";


COMMENT ON TABLE "public"."pos_terminals" IS 'Terminais POS (maquininhas) dos estabelecimentos';



CREATE SEQUENCE IF NOT EXISTS "public"."pos_terminals_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."pos_terminals_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."pos_terminals_id_seq" OWNED BY "public"."pos_terminals"."id";



CREATE TABLE IF NOT EXISTS "public"."purchases" (
    "id" bigint NOT NULL,
    "round_id" bigint NOT NULL,
    "user_id" bigint,
    "establishment_id" bigint,
    "quantity" integer NOT NULL,
    "unit_price" numeric(10,2) NOT NULL,
    "total_amount" numeric(12,2) NOT NULL,
    "payment_method" "text" NOT NULL,
    "payment_status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "transaction_code" "text",
    "gateway" "text",
    "pix_code" "text",
    "pix_qrcode" "text",
    "customer_name" "text" NOT NULL,
    "customer_email" "text",
    "customer_phone" "text",
    "customer_cpf" "text",
    "paid_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "asaas_charge_id" "text",
    "asaas_customer_id" "text",
    "pix_qr_code" "text",
    "pix_expiration" timestamp with time zone,
    "payment_confirmed" boolean DEFAULT false,
    "cards_generated" boolean DEFAULT false,
    "cards_generated_at" timestamp with time zone,
    CONSTRAINT "purchases_gateway_check" CHECK (("gateway" = ANY (ARRAY['asaas'::"text", 'pagseguro'::"text"]))),
    CONSTRAINT "purchases_payment_method_check" CHECK (("payment_method" = ANY (ARRAY['pix'::"text", 'credit_card'::"text", 'debit_card'::"text"]))),
    CONSTRAINT "purchases_payment_status_check" CHECK (("payment_status" = ANY (ARRAY['pending'::"text", 'paid'::"text", 'failed'::"text", 'cancelled'::"text", 'refunded'::"text"])))
);


ALTER TABLE "public"."purchases" OWNER TO "postgres";


COMMENT ON TABLE "public"."purchases" IS 'Compras de cartelas (PIX ou cartão)';



COMMENT ON COLUMN "public"."purchases"."paid_at" IS 'Data/hora de confirmação do pagamento';



COMMENT ON COLUMN "public"."purchases"."asaas_charge_id" IS 'ID da cobrança no Asaas';



COMMENT ON COLUMN "public"."purchases"."asaas_customer_id" IS 'ID do cliente no Asaas';



COMMENT ON COLUMN "public"."purchases"."pix_qr_code" IS 'Código PIX copia e cola';



COMMENT ON COLUMN "public"."purchases"."pix_expiration" IS 'Data de expiração do PIX';



COMMENT ON COLUMN "public"."purchases"."payment_confirmed" IS 'Se o pagamento foi confirmado';



COMMENT ON COLUMN "public"."purchases"."cards_generated" IS 'Se as cartelas já foram geradas';



COMMENT ON COLUMN "public"."purchases"."cards_generated_at" IS 'Data/hora de geração das cartelas';



CREATE SEQUENCE IF NOT EXISTS "public"."purchases_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."purchases_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."purchases_id_seq" OWNED BY "public"."purchases"."id";



CREATE TABLE IF NOT EXISTS "public"."rounds" (
    "id" bigint NOT NULL,
    "number" integer NOT NULL,
    "type" "text" NOT NULL,
    "status" "text" DEFAULT 'scheduled'::"text" NOT NULL,
    "card_price" numeric(10,2) NOT NULL,
    "max_cards" integer DEFAULT 1000 NOT NULL,
    "cards_sold" integer DEFAULT 0,
    "prize_pool" numeric(12,2) DEFAULT 0.00,
    "charity_amount" numeric(12,2) DEFAULT 0.00,
    "platform_amount" numeric(12,2) DEFAULT 0.00,
    "commission_amount" numeric(12,2) DEFAULT 0.00,
    "drawn_numbers" integer[] DEFAULT '{}'::integer[],
    "starts_at" timestamp with time zone NOT NULL,
    "ends_at" timestamp with time zone NOT NULL,
    "selling_ends_at" timestamp with time zone NOT NULL,
    "is_selling" boolean DEFAULT false,
    "drawing_started_at" timestamp with time zone,
    "finished_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "manual_creation" boolean DEFAULT false,
    "winner_criteria" "text" DEFAULT 'full_card'::"text",
    "tiebreak_rule" "text" DEFAULT 'stone'::"text",
    "min_participants" integer,
    "max_participants" integer,
    "draw_time" time without time zone,
    "allow_late_entry" boolean DEFAULT true,
    "late_entry_cutoff_minutes" integer DEFAULT 5,
    CONSTRAINT "rounds_status_check" CHECK (("status" = ANY (ARRAY['scheduled'::"text", 'selling'::"text", 'drawing'::"text", 'finished'::"text", 'cancelled'::"text"]))),
    CONSTRAINT "rounds_tiebreak_rule_valid" CHECK (("tiebreak_rule" = ANY (ARRAY['first_marked'::"text", 'split_prize'::"text", 'draw'::"text", 'fastest_time'::"text"]))),
    CONSTRAINT "rounds_type_check" CHECK (("type" = ANY (ARRAY['regular'::"text", 'special'::"text"]))),
    CONSTRAINT "rounds_winner_criteria_valid" CHECK (("winner_criteria" = ANY (ARRAY['full_card'::"text", 'line'::"text", 'two_lines'::"text", 'pattern'::"text", 'corners'::"text", 'blackout'::"text"])))
);


ALTER TABLE "public"."rounds" OWNER TO "postgres";


COMMENT ON TABLE "public"."rounds" IS 'Rodadas de sorteio (regular: 10min, special: 60min)';



CREATE SEQUENCE IF NOT EXISTS "public"."rounds_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."rounds_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."rounds_id_seq" OWNED BY "public"."rounds"."id";



CREATE TABLE IF NOT EXISTS "public"."schema_migrations" (
    "version" integer NOT NULL,
    "description" "text" NOT NULL,
    "executed_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."schema_migrations" OWNER TO "postgres";


COMMENT ON TABLE "public"."schema_migrations" IS 'Histórico de migrações executadas no banco de dados';



COMMENT ON COLUMN "public"."schema_migrations"."version" IS 'Número sequencial da migração';



COMMENT ON COLUMN "public"."schema_migrations"."description" IS 'Descrição do que a migração fez';



CREATE TABLE IF NOT EXISTS "public"."settings" (
    "id" bigint NOT NULL,
    "key" "text" NOT NULL,
    "value" "jsonb" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_public" boolean DEFAULT false
);


ALTER TABLE "public"."settings" OWNER TO "postgres";


COMMENT ON TABLE "public"."settings" IS 'Configurações do sistema em formato JSONB';



CREATE SEQUENCE IF NOT EXISTS "public"."settings_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."settings_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."settings_id_seq" OWNED BY "public"."settings"."id";



CREATE TABLE IF NOT EXISTS "public"."ticker_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "message" "text" NOT NULL,
    "icon" "text" DEFAULT '📢'::"text",
    "is_active" boolean DEFAULT true,
    "display_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ticker_messages" OWNER TO "postgres";


COMMENT ON TABLE "public"."ticker_messages" IS 'Mensagens do letreiro (ticker) exibidas no rodapé da TV Mode';



COMMENT ON COLUMN "public"."ticker_messages"."message" IS 'Texto da mensagem a ser exibida no ticker';



COMMENT ON COLUMN "public"."ticker_messages"."icon" IS 'Emoji ou ícone exibido antes da mensagem';



COMMENT ON COLUMN "public"."ticker_messages"."is_active" IS 'Se a mensagem está ativa e deve ser exibida';



COMMENT ON COLUMN "public"."ticker_messages"."display_order" IS 'Ordem de exibição (menor = primeiro)';



CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" bigint NOT NULL,
    "role" "public"."app_role" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "email" "text",
    "whatsapp" "text",
    "phone" "text",
    "cpf" "text",
    "password_hash" "text" DEFAULT ''::"text" NOT NULL,
    "role" "text" DEFAULT 'user'::"text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "password_migrated" boolean DEFAULT false,
    "password_hash_new" "text",
    "auth_id" "uuid",
    CONSTRAINT "users_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'manager'::"text", 'establishment'::"text", 'user'::"text"])))
);


ALTER TABLE "public"."users" OWNER TO "postgres";


COMMENT ON TABLE "public"."users" IS 'Usuários do sistema (admin, gerentes, estabelecimentos, clientes)';



COMMENT ON COLUMN "public"."users"."password_migrated" IS 'Indica se a senha do usuário já foi migrada para bcrypt';



COMMENT ON COLUMN "public"."users"."password_hash_new" IS 'Hash bcrypt da senha (novo sistema)';



CREATE SEQUENCE IF NOT EXISTS "public"."users_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."users_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."users_id_seq" OWNED BY "public"."users"."id";



CREATE OR REPLACE VIEW "public"."v_groq_usage_stats" AS
 SELECT "date_trunc"('day'::"text", "created_at") AS "date",
    "prompt_name",
    "model",
    "count"(*) AS "total_requests",
    "count"(*) FILTER (WHERE ("success" = true)) AS "successful_requests",
    "count"(*) FILTER (WHERE ("success" = false)) AS "failed_requests",
    "sum"("tokens_total") AS "total_tokens",
    "avg"("tokens_total") AS "avg_tokens_per_request",
    "avg"("duration_ms") AS "avg_duration_ms",
    "min"("created_at") AS "first_request",
    "max"("created_at") AS "last_request"
   FROM "public"."groq_usage_logs"
  GROUP BY ("date_trunc"('day'::"text", "created_at")), "prompt_name", "model"
  ORDER BY ("date_trunc"('day'::"text", "created_at")) DESC, ("count"(*)) DESC;


ALTER VIEW "public"."v_groq_usage_stats" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_player_stats" AS
 SELECT "p"."id",
    "p"."establishment_id",
    "p"."name",
    "p"."email",
    "p"."phone",
    "p"."is_bot",
    "p"."tags",
    "p"."created_at",
    "count"(DISTINCT "pp"."round_id") AS "total_participations",
    "sum"("pp"."quantity") AS "total_cards_purchased",
    COALESCE("sum"("pp"."total_amount"), (0)::numeric) AS "total_spent",
    "count"(*) FILTER (WHERE ("pp"."is_winner" = true)) AS "total_wins",
    COALESCE("sum"("pp"."prize_amount") FILTER (WHERE ("pp"."is_winner" = true)), (0)::numeric) AS "total_prizes_won",
    "max"("pp"."participated_at") AS "last_participation",
    ( SELECT "json_agg"("json_build_object"('round_id', "pp2"."round_id", 'quantity', "pp2"."quantity", 'is_winner', "pp2"."is_winner", 'participated_at', "pp2"."participated_at") ORDER BY "pp2"."participated_at" DESC) AS "json_agg"
           FROM "public"."player_participations" "pp2"
          WHERE ("pp2"."player_id" = "p"."id")
         LIMIT 10) AS "recent_participations"
   FROM ("public"."players" "p"
     LEFT JOIN "public"."player_participations" "pp" ON (("pp"."player_id" = "p"."id")))
  GROUP BY "p"."id", "p"."establishment_id", "p"."name", "p"."email", "p"."phone", "p"."is_bot", "p"."tags", "p"."created_at"
  ORDER BY ("count"(DISTINCT "pp"."round_id")) DESC;


ALTER VIEW "public"."v_player_stats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."winners" (
    "id" bigint NOT NULL,
    "round_id" bigint NOT NULL,
    "card_id" bigint NOT NULL,
    "card_code" "text" NOT NULL,
    "prize_amount" numeric(12,2) NOT NULL,
    "pattern" "text" NOT NULL,
    "pattern_matched" "jsonb",
    "status" "text" DEFAULT 'pending'::"text",
    "pix_key" "text",
    "claimed_at" timestamp with time zone,
    "paid_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "tiebreak_stone" integer,
    CONSTRAINT "winners_pattern_check" CHECK (("pattern" = ANY (ARRAY['line'::"text", 'full_card'::"text"]))),
    CONSTRAINT "winners_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'claimed'::"text", 'paid'::"text"])))
);


ALTER TABLE "public"."winners" OWNER TO "postgres";


COMMENT ON TABLE "public"."winners" IS 'Ganhadores de prêmios';



CREATE SEQUENCE IF NOT EXISTS "public"."winners_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."winners_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."winners_id_seq" OWNED BY "public"."winners"."id";



CREATE TABLE IF NOT EXISTS "public"."withdrawals" (
    "id" bigint NOT NULL,
    "user_id" bigint NOT NULL,
    "user_type" "text" NOT NULL,
    "entity_id" bigint NOT NULL,
    "amount" numeric(12,2) NOT NULL,
    "pix_key" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "transaction_id" "text",
    "processed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "withdrawals_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'paid'::"text", 'cancelled'::"text"]))),
    CONSTRAINT "withdrawals_user_type_check" CHECK (("user_type" = ANY (ARRAY['manager'::"text", 'establishment'::"text"])))
);


ALTER TABLE "public"."withdrawals" OWNER TO "postgres";


COMMENT ON TABLE "public"."withdrawals" IS 'Solicitações de saque de gerentes e estabelecimentos';



CREATE SEQUENCE IF NOT EXISTS "public"."withdrawals_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."withdrawals_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."withdrawals_id_seq" OWNED BY "public"."withdrawals"."id";



ALTER TABLE ONLY "public"."cards" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."cards_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."charities" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."charities_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."draws" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."draws_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."establishments" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."establishments_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."groq_prompts" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."groq_prompts_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."groq_usage_logs" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."groq_usage_logs_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."logs" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."logs_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."managers" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."managers_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."player_participations" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."player_participations_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."players" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."players_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."pos_terminals" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."pos_terminals_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."purchases" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."purchases_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."rounds" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."rounds_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."settings" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."settings_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."users" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."users_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."winners" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."winners_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."withdrawals" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."withdrawals_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."cards"
    ADD CONSTRAINT "cards_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."cards"
    ADD CONSTRAINT "cards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."charities"
    ADD CONSTRAINT "charities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."draws"
    ADD CONSTRAINT "draws_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."establishments"
    ADD CONSTRAINT "establishments_auth_id_key" UNIQUE ("auth_id");



ALTER TABLE ONLY "public"."establishments"
    ADD CONSTRAINT "establishments_cnpj_key" UNIQUE ("cnpj");



ALTER TABLE ONLY "public"."establishments"
    ADD CONSTRAINT "establishments_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."establishments"
    ADD CONSTRAINT "establishments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."establishments"
    ADD CONSTRAINT "establishments_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."feature_flags"
    ADD CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."groq_prompts"
    ADD CONSTRAINT "groq_prompts_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."groq_prompts"
    ADD CONSTRAINT "groq_prompts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."groq_usage_logs"
    ADD CONSTRAINT "groq_usage_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."logs"
    ADD CONSTRAINT "logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."managers"
    ADD CONSTRAINT "managers_auth_id_key" UNIQUE ("auth_id");



ALTER TABLE ONLY "public"."managers"
    ADD CONSTRAINT "managers_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."managers"
    ADD CONSTRAINT "managers_cpf_key" UNIQUE ("cpf");



ALTER TABLE ONLY "public"."managers"
    ADD CONSTRAINT "managers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."managers"
    ADD CONSTRAINT "managers_referral_code_key" UNIQUE ("referral_code");



ALTER TABLE ONLY "public"."payment_webhooks"
    ADD CONSTRAINT "payment_webhooks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."player_participations"
    ADD CONSTRAINT "player_participations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."player_participations"
    ADD CONSTRAINT "player_participations_player_id_round_id_key" UNIQUE ("player_id", "round_id");



ALTER TABLE ONLY "public"."players"
    ADD CONSTRAINT "players_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pos_terminals"
    ADD CONSTRAINT "pos_terminals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pos_terminals"
    ADD CONSTRAINT "pos_terminals_terminal_code_key" UNIQUE ("terminal_code");



ALTER TABLE ONLY "public"."purchases"
    ADD CONSTRAINT "purchases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rounds"
    ADD CONSTRAINT "rounds_number_type_unique" UNIQUE ("number", "type");



ALTER TABLE ONLY "public"."rounds"
    ADD CONSTRAINT "rounds_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."schema_migrations"
    ADD CONSTRAINT "schema_migrations_pkey" PRIMARY KEY ("version");



ALTER TABLE ONLY "public"."settings"
    ADD CONSTRAINT "settings_key_key" UNIQUE ("key");



ALTER TABLE ONLY "public"."settings"
    ADD CONSTRAINT "settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ticker_messages"
    ADD CONSTRAINT "ticker_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_role_key" UNIQUE ("user_id", "role");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_auth_id_key" UNIQUE ("auth_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_cpf_key" UNIQUE ("cpf");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_whatsapp_key" UNIQUE ("whatsapp");



ALTER TABLE ONLY "public"."winners"
    ADD CONSTRAINT "winners_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."withdrawals"
    ADD CONSTRAINT "withdrawals_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_cards_code" ON "public"."cards" USING "btree" ("code");



CREATE INDEX "idx_cards_purchase" ON "public"."cards" USING "btree" ("purchase_id");



CREATE INDEX "idx_cards_purchase_id" ON "public"."cards" USING "btree" ("purchase_id");



CREATE INDEX "idx_cards_round" ON "public"."cards" USING "btree" ("round_id");



CREATE INDEX "idx_cards_round_id" ON "public"."cards" USING "btree" ("round_id");



CREATE INDEX "idx_cards_status" ON "public"."cards" USING "btree" ("status");



CREATE INDEX "idx_charities_active" ON "public"."charities" USING "btree" ("is_active");



CREATE INDEX "idx_charities_active_month" ON "public"."charities" USING "btree" ("active_month");



CREATE INDEX "idx_draws_position" ON "public"."draws" USING "btree" ("position");



CREATE INDEX "idx_draws_round_id" ON "public"."draws" USING "btree" ("round_id");



CREATE UNIQUE INDEX "idx_draws_round_number" ON "public"."draws" USING "btree" ("round_id", "number");



CREATE INDEX "idx_establishments_active" ON "public"."establishments" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_establishments_code" ON "public"."establishments" USING "btree" ("code");



CREATE INDEX "idx_establishments_manager_id" ON "public"."establishments" USING "btree" ("manager_id");



CREATE INDEX "idx_establishments_slug" ON "public"."establishments" USING "btree" ("slug");



CREATE INDEX "idx_establishments_user_id" ON "public"."establishments" USING "btree" ("user_id");



CREATE INDEX "idx_feature_flags_enabled" ON "public"."feature_flags" USING "btree" ("enabled") WHERE ("enabled" = true);



CREATE INDEX "idx_groq_prompts_active" ON "public"."groq_prompts" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_groq_prompts_category" ON "public"."groq_prompts" USING "btree" ("category");



CREATE INDEX "idx_groq_usage_logs_created" ON "public"."groq_usage_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_groq_usage_logs_establishment" ON "public"."groq_usage_logs" USING "btree" ("establishment_id") WHERE ("establishment_id" IS NOT NULL);



CREATE INDEX "idx_groq_usage_logs_prompt" ON "public"."groq_usage_logs" USING "btree" ("prompt_id") WHERE ("prompt_id" IS NOT NULL);



CREATE INDEX "idx_groq_usage_logs_user" ON "public"."groq_usage_logs" USING "btree" ("user_id") WHERE ("user_id" IS NOT NULL);



CREATE INDEX "idx_logs_action" ON "public"."logs" USING "btree" ("action");



CREATE INDEX "idx_logs_created_at" ON "public"."logs" USING "btree" ("created_at");



CREATE INDEX "idx_logs_entity_type" ON "public"."logs" USING "btree" ("entity_type");



CREATE INDEX "idx_logs_user_id" ON "public"."logs" USING "btree" ("user_id");



CREATE INDEX "idx_managers_code" ON "public"."managers" USING "btree" ("code");



CREATE INDEX "idx_managers_referral_code" ON "public"."managers" USING "btree" ("referral_code");



CREATE INDEX "idx_managers_user_id" ON "public"."managers" USING "btree" ("user_id");



CREATE INDEX "idx_payment_webhooks_gateway" ON "public"."payment_webhooks" USING "btree" ("gateway", "processed");



CREATE INDEX "idx_payment_webhooks_processed" ON "public"."payment_webhooks" USING "btree" ("processed") WHERE ("processed" = false);



CREATE INDEX "idx_payment_webhooks_purchase" ON "public"."payment_webhooks" USING "btree" ("purchase_id");



CREATE INDEX "idx_player_participations_player" ON "public"."player_participations" USING "btree" ("player_id");



CREATE INDEX "idx_player_participations_purchase" ON "public"."player_participations" USING "btree" ("purchase_id") WHERE ("purchase_id" IS NOT NULL);



CREATE INDEX "idx_player_participations_round" ON "public"."player_participations" USING "btree" ("round_id");



CREATE INDEX "idx_player_participations_winner" ON "public"."player_participations" USING "btree" ("is_winner") WHERE ("is_winner" = true);



CREATE INDEX "idx_players_created_at" ON "public"."players" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_players_establishment" ON "public"."players" USING "btree" ("establishment_id");



CREATE INDEX "idx_players_is_bot" ON "public"."players" USING "btree" ("is_bot") WHERE ("is_bot" = true);



CREATE INDEX "idx_players_name_search" ON "public"."players" USING "gin" ("to_tsvector"('"portuguese"'::"regconfig", "name"));



CREATE INDEX "idx_players_tags" ON "public"."players" USING "gin" ("tags");



CREATE INDEX "idx_pos_terminals_active" ON "public"."pos_terminals" USING "btree" ("is_active");



CREATE INDEX "idx_pos_terminals_establishment_id" ON "public"."pos_terminals" USING "btree" ("establishment_id");



CREATE INDEX "idx_pos_terminals_terminal_code" ON "public"."pos_terminals" USING "btree" ("terminal_code");



CREATE INDEX "idx_purchases_asaas_charge_id" ON "public"."purchases" USING "btree" ("asaas_charge_id") WHERE ("asaas_charge_id" IS NOT NULL);



CREATE INDEX "idx_purchases_cards_generated" ON "public"."purchases" USING "btree" ("cards_generated") WHERE (("cards_generated" = false) AND ("payment_confirmed" = true));



CREATE INDEX "idx_purchases_created" ON "public"."purchases" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_purchases_created_at" ON "public"."purchases" USING "btree" ("created_at");



CREATE INDEX "idx_purchases_establishment_id" ON "public"."purchases" USING "btree" ("establishment_id");



CREATE INDEX "idx_purchases_payment_confirmed" ON "public"."purchases" USING "btree" ("payment_confirmed") WHERE ("payment_confirmed" = true);



CREATE INDEX "idx_purchases_payment_status" ON "public"."purchases" USING "btree" ("payment_status");



CREATE INDEX "idx_purchases_round_id" ON "public"."purchases" USING "btree" ("round_id");



CREATE INDEX "idx_purchases_transaction_code" ON "public"."purchases" USING "btree" ("transaction_code");



CREATE INDEX "idx_purchases_user" ON "public"."purchases" USING "btree" ("user_id");



CREATE INDEX "idx_purchases_user_id" ON "public"."purchases" USING "btree" ("user_id");



CREATE INDEX "idx_rounds_created" ON "public"."rounds" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_rounds_manual_creation" ON "public"."rounds" USING "btree" ("manual_creation") WHERE ("manual_creation" = true);



CREATE INDEX "idx_rounds_number" ON "public"."rounds" USING "btree" ("number");



CREATE INDEX "idx_rounds_scheduled" ON "public"."rounds" USING "btree" ("status") WHERE ("status" = 'scheduled'::"text");



CREATE INDEX "idx_rounds_selling" ON "public"."rounds" USING "btree" ("is_selling");



CREATE INDEX "idx_rounds_starts_at" ON "public"."rounds" USING "btree" ("starts_at");



CREATE INDEX "idx_rounds_status" ON "public"."rounds" USING "btree" ("status");



CREATE INDEX "idx_rounds_type" ON "public"."rounds" USING "btree" ("type");



CREATE INDEX "idx_settings_key" ON "public"."settings" USING "btree" ("key");



CREATE INDEX "idx_settings_public" ON "public"."settings" USING "btree" ("is_public") WHERE ("is_public" = true);



CREATE INDEX "idx_ticker_messages_active" ON "public"."ticker_messages" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_ticker_messages_active_order" ON "public"."ticker_messages" USING "btree" ("is_active", "display_order");



CREATE INDEX "idx_ticker_messages_order" ON "public"."ticker_messages" USING "btree" ("display_order");



CREATE INDEX "idx_users_auth_id" ON "public"."users" USING "btree" ("auth_id");



CREATE INDEX "idx_users_cpf" ON "public"."users" USING "btree" ("cpf");



CREATE INDEX "idx_users_email" ON "public"."users" USING "btree" ("email");



CREATE INDEX "idx_users_password_migrated" ON "public"."users" USING "btree" ("password_migrated") WHERE ("password_migrated" = false);



CREATE INDEX "idx_users_role" ON "public"."users" USING "btree" ("role");



CREATE INDEX "idx_users_whatsapp" ON "public"."users" USING "btree" ("whatsapp");



CREATE INDEX "idx_winners_card_id" ON "public"."winners" USING "btree" ("card_id");



CREATE INDEX "idx_winners_round_id" ON "public"."winners" USING "btree" ("round_id");



CREATE INDEX "idx_winners_status" ON "public"."winners" USING "btree" ("status");



CREATE INDEX "idx_withdrawals_entity_id" ON "public"."withdrawals" USING "btree" ("entity_id");



CREATE INDEX "idx_withdrawals_status" ON "public"."withdrawals" USING "btree" ("status");



CREATE INDEX "idx_withdrawals_user_id" ON "public"."withdrawals" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "trg_groq_prompts_updated_at" BEFORE UPDATE ON "public"."groq_prompts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "trg_players_updated_at" BEFORE UPDATE ON "public"."players" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "trg_purchases_stats" AFTER INSERT OR UPDATE OF "payment_confirmed" ON "public"."purchases" FOR EACH ROW WHEN (("new"."payment_confirmed" = true)) EXECUTE FUNCTION "public"."trigger_refresh_stats"();



CREATE OR REPLACE TRIGGER "trg_rounds_stats" AFTER INSERT OR UPDATE OF "status" ON "public"."rounds" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_refresh_stats"();



CREATE OR REPLACE TRIGGER "trg_ticker_messages_updated_at" BEFORE UPDATE ON "public"."ticker_messages" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_feature_flags_updated_at" BEFORE UPDATE ON "public"."feature_flags" FOR EACH ROW EXECUTE FUNCTION "public"."update_feature_flags_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_ticker_messages_updated_at" BEFORE UPDATE ON "public"."ticker_messages" FOR EACH ROW EXECUTE FUNCTION "public"."update_ticker_messages_updated_at"();



CREATE OR REPLACE TRIGGER "update_charities_updated_at" BEFORE UPDATE ON "public"."charities" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_establishments_updated_at" BEFORE UPDATE ON "public"."establishments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_managers_updated_at" BEFORE UPDATE ON "public"."managers" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_pos_terminals_updated_at" BEFORE UPDATE ON "public"."pos_terminals" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_purchases_updated_at" BEFORE UPDATE ON "public"."purchases" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_rounds_updated_at" BEFORE UPDATE ON "public"."rounds" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_settings_updated_at" BEFORE UPDATE ON "public"."settings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_users_updated_at" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_withdrawals_updated_at" BEFORE UPDATE ON "public"."withdrawals" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."cards"
    ADD CONSTRAINT "cards_purchase_id_fkey" FOREIGN KEY ("purchase_id") REFERENCES "public"."purchases"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."cards"
    ADD CONSTRAINT "cards_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "public"."rounds"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."draws"
    ADD CONSTRAINT "draws_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "public"."rounds"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."establishments"
    ADD CONSTRAINT "establishments_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "public"."managers"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."establishments"
    ADD CONSTRAINT "establishments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."logs"
    ADD CONSTRAINT "logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."managers"
    ADD CONSTRAINT "managers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payment_webhooks"
    ADD CONSTRAINT "payment_webhooks_purchase_id_fkey" FOREIGN KEY ("purchase_id") REFERENCES "public"."purchases"("id");



ALTER TABLE ONLY "public"."pos_terminals"
    ADD CONSTRAINT "pos_terminals_establishment_id_fkey" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."purchases"
    ADD CONSTRAINT "purchases_establishment_id_fkey" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishments"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."purchases"
    ADD CONSTRAINT "purchases_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "public"."rounds"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."purchases"
    ADD CONSTRAINT "purchases_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."winners"
    ADD CONSTRAINT "winners_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."winners"
    ADD CONSTRAINT "winners_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "public"."rounds"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."withdrawals"
    ADD CONSTRAINT "withdrawals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Admin pode gerenciar participações" ON "public"."player_participations" TO "authenticated" USING (true);



CREATE POLICY "Admin pode gerenciar prompts" ON "public"."groq_prompts" TO "authenticated" USING (true);



CREATE POLICY "Admin pode gerenciar roles" ON "public"."user_roles" USING ("public"."is_admin"());



CREATE POLICY "Admin pode gerenciar todos os jogadores" ON "public"."players" TO "authenticated" USING (true);



CREATE POLICY "Admin pode ler logs Groq" ON "public"."groq_usage_logs" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow public read for login" ON "public"."users" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Anyone can create purchase" ON "public"."purchases" FOR INSERT WITH CHECK (true);



CREATE POLICY "Anyone can create purchases" ON "public"."purchases" FOR INSERT WITH CHECK (true);



CREATE POLICY "Anyone can read feature flags" ON "public"."feature_flags" FOR SELECT USING (true);



CREATE POLICY "Anyone can register" ON "public"."users" FOR INSERT WITH CHECK (true);



CREATE POLICY "Cards are viewable by everyone" ON "public"."cards" FOR SELECT USING (true);



COMMENT ON POLICY "Cards are viewable by everyone" ON "public"."cards" IS 'Cartelas são públicas para validação';



CREATE POLICY "Charities are viewable by everyone" ON "public"."charities" FOR SELECT USING (true);



COMMENT ON POLICY "Charities are viewable by everyone" ON "public"."charities" IS 'Instituições são públicas para transparência';



CREATE POLICY "Draws are viewable by everyone" ON "public"."draws" FOR SELECT USING (true);



COMMENT ON POLICY "Draws are viewable by everyone" ON "public"."draws" IS 'Números sorteados são públicos para transparência';



CREATE POLICY "Establishments can view own terminals" ON "public"."pos_terminals" FOR SELECT USING ((("establishment_id" IN ( SELECT "establishments"."id"
   FROM "public"."establishments"
  WHERE ("establishments"."user_id" = (("auth"."jwt"() ->> 'user_id'::"text"))::bigint))) OR (("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text")));



CREATE POLICY "Establishments can view their purchases" ON "public"."purchases" FOR SELECT USING ((("establishment_id" IN ( SELECT "establishments"."id"
   FROM "public"."establishments"
  WHERE ("establishments"."user_id" = (("auth"."jwt"() ->> 'user_id'::"text"))::bigint))) OR (("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text")));



CREATE POLICY "Establishments visibility" ON "public"."establishments" FOR SELECT USING ((("user_id" = (("auth"."jwt"() ->> 'user_id'::"text"))::bigint) OR (("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text")));



CREATE POLICY "Managers visibility" ON "public"."managers" FOR SELECT USING ((("user_id" = (("auth"."jwt"() ->> 'user_id'::"text"))::bigint) OR (("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text")));



CREATE POLICY "Only admins can create draws" ON "public"."draws" FOR INSERT WITH CHECK ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "Only admins can manage charities" ON "public"."charities" USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "Only admins can manage establishments" ON "public"."establishments" USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "Only admins can manage managers" ON "public"."managers" USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "Only admins can manage rounds" ON "public"."rounds" USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "Only admins can manage settings" ON "public"."settings" USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "Only admins can manage terminals" ON "public"."pos_terminals" USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "Only admins can manage winners" ON "public"."winners" USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "Only admins can update purchases" ON "public"."purchases" FOR UPDATE USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "Only admins can update withdrawals" ON "public"."withdrawals" FOR UPDATE USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "Only admins can view logs" ON "public"."logs" FOR SELECT USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "Only system can create cards" ON "public"."cards" FOR INSERT WITH CHECK ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "Public can view active ticker messages" ON "public"."ticker_messages" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Public can view cards" ON "public"."cards" FOR SELECT USING (true);



CREATE POLICY "Public can view charities" ON "public"."charities" FOR SELECT USING (true);



CREATE POLICY "Public can view establishments" ON "public"."establishments" FOR SELECT USING (true);



CREATE POLICY "Public can view public settings" ON "public"."settings" FOR SELECT USING (("is_public" = true));



CREATE POLICY "Public can view purchases" ON "public"."purchases" FOR SELECT USING (true);



CREATE POLICY "Public can view selling rounds" ON "public"."rounds" FOR SELECT USING (("status" = ANY (ARRAY['selling'::"text", 'drawing'::"text", 'scheduled'::"text"])));



CREATE POLICY "Public settings are viewable by everyone" ON "public"."settings" FOR SELECT USING ((("key" = ANY (ARRAY['round_config'::"text", 'split_config'::"text"])) OR (("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text")));



CREATE POLICY "Rounds are viewable by everyone" ON "public"."rounds" FOR SELECT USING (true);



COMMENT ON POLICY "Rounds are viewable by everyone" ON "public"."rounds" IS 'Rodadas são públicas para que todos vejam';



CREATE POLICY "Service role can modify feature flags" ON "public"."feature_flags" TO "service_role" USING (true);



CREATE POLICY "System can insert logs" ON "public"."logs" FOR INSERT WITH CHECK (true);



CREATE POLICY "Users can create withdrawals" ON "public"."withdrawals" FOR INSERT WITH CHECK (("user_id" = (("auth"."jwt"() ->> 'user_id'::"text"))::bigint));



CREATE POLICY "Users can update own profile" ON "public"."users" FOR UPDATE USING ((("id" = (("auth"."jwt"() ->> 'user_id'::"text"))::bigint) OR (("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text")));



CREATE POLICY "Users can view own profile" ON "public"."users" FOR SELECT USING ((("id" = (("auth"."jwt"() ->> 'user_id'::"text"))::bigint) OR (("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text")));



CREATE POLICY "Users can view own purchases" ON "public"."purchases" FOR SELECT USING ((("user_id" = (("auth"."jwt"() ->> 'user_id'::"text"))::bigint) OR (("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text")));



CREATE POLICY "Users can view own withdrawals" ON "public"."withdrawals" FOR SELECT USING ((("user_id" = (("auth"."jwt"() ->> 'user_id'::"text"))::bigint) OR (("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text")));



CREATE POLICY "Usuário pode ver própria role" ON "public"."user_roles" FOR SELECT USING (("user_id" IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."auth_id" = "auth"."uid"()))));



CREATE POLICY "Usuários autenticados podem ler jogadores" ON "public"."players" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Usuários autenticados podem ler participações" ON "public"."player_participations" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Usuários autenticados podem ler prompts ativos" ON "public"."groq_prompts" FOR SELECT TO "authenticated" USING (("is_active" = true));



CREATE POLICY "Winners are viewable by everyone" ON "public"."winners" FOR SELECT USING (true);



COMMENT ON POLICY "Winners are viewable by everyone" ON "public"."winners" IS 'Ganhadores são públicos para transparência';



ALTER TABLE "public"."cards" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."charities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."draws" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."establishments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."feature_flags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."groq_prompts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."groq_usage_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."managers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payment_webhooks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."player_participations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."players" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pos_terminals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."purchases" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rounds" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."schema_migrations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ticker_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."winners" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."withdrawals" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."cards";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."draws";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."purchases";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."rounds";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."winners";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";














































































































































































GRANT ALL ON FUNCTION "public"."add_player_to_round"("p_player_id" bigint, "p_round_id" bigint, "p_quantity" integer, "p_total_amount" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."add_player_to_round"("p_player_id" bigint, "p_round_id" bigint, "p_quantity" integer, "p_total_amount" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_player_to_round"("p_player_id" bigint, "p_round_id" bigint, "p_quantity" integer, "p_total_amount" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."authenticate_user"("p_email" "text", "p_password" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."authenticate_user"("p_email" "text", "p_password" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."authenticate_user"("p_email" "text", "p_password" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."auto_open_scheduled_rounds"() TO "anon";
GRANT ALL ON FUNCTION "public"."auto_open_scheduled_rounds"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_open_scheduled_rounds"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_manual_round"("p_establishment_id" bigint, "p_draw_date" "date", "p_draw_time" time without time zone, "p_prize" numeric, "p_card_price" numeric, "p_winner_criteria" "text", "p_tiebreak_rule" "text", "p_min_participants" integer, "p_max_participants" integer, "p_type" "text", "p_description" "text", "p_created_by" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."create_manual_round"("p_establishment_id" bigint, "p_draw_date" "date", "p_draw_time" time without time zone, "p_prize" numeric, "p_card_price" numeric, "p_winner_criteria" "text", "p_tiebreak_rule" "text", "p_min_participants" integer, "p_max_participants" integer, "p_type" "text", "p_description" "text", "p_created_by" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_manual_round"("p_establishment_id" bigint, "p_draw_date" "date", "p_draw_time" time without time zone, "p_prize" numeric, "p_card_price" numeric, "p_winner_criteria" "text", "p_tiebreak_rule" "text", "p_min_participants" integer, "p_max_participants" integer, "p_type" "text", "p_description" "text", "p_created_by" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."create_next_rounds"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_next_rounds"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_next_rounds"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_players_batch"("p_establishment_id" bigint, "p_names" "text"[], "p_is_bot" boolean, "p_created_by" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."create_players_batch"("p_establishment_id" bigint, "p_names" "text"[], "p_is_bot" boolean, "p_created_by" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_players_batch"("p_establishment_id" bigint, "p_names" "text"[], "p_is_bot" boolean, "p_created_by" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_id_by_auth"("p_auth_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_id_by_auth"("p_auth_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_id_by_auth"("p_auth_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."has_role"("_user_id" bigint, "_role" "public"."app_role") TO "anon";
GRANT ALL ON FUNCTION "public"."has_role"("_user_id" bigint, "_role" "public"."app_role") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_role"("_user_id" bigint, "_role" "public"."app_role") TO "service_role";



GRANT ALL ON FUNCTION "public"."hash_password"("password" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."hash_password"("password" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hash_password"("password" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_groq_usage"("p_prompt_id" bigint, "p_prompt_name" "text", "p_model" "text", "p_user_id" bigint, "p_establishment_id" bigint, "p_request" "jsonb", "p_response" "jsonb", "p_tokens_prompt" integer, "p_tokens_completion" integer, "p_duration_ms" integer, "p_success" boolean, "p_error_message" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."log_groq_usage"("p_prompt_id" bigint, "p_prompt_name" "text", "p_model" "text", "p_user_id" bigint, "p_establishment_id" bigint, "p_request" "jsonb", "p_response" "jsonb", "p_tokens_prompt" integer, "p_tokens_completion" integer, "p_duration_ms" integer, "p_success" boolean, "p_error_message" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_groq_usage"("p_prompt_id" bigint, "p_prompt_name" "text", "p_model" "text", "p_user_id" bigint, "p_establishment_id" bigint, "p_request" "jsonb", "p_response" "jsonb", "p_tokens_prompt" integer, "p_tokens_completion" integer, "p_duration_ms" integer, "p_success" boolean, "p_error_message" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."migrate_user_password"("p_user_id" bigint, "p_new_password" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."migrate_user_password"("p_user_id" bigint, "p_new_password" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."migrate_user_password"("p_user_id" bigint, "p_new_password" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."process_payment_webhook"("p_webhook_id" bigint, "p_purchase_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."process_payment_webhook"("p_webhook_id" bigint, "p_purchase_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_payment_webhook"("p_webhook_id" bigint, "p_purchase_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."process_player_command"("p_command" "text", "p_establishment_id" bigint, "p_user_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."process_player_command"("p_command" "text", "p_establishment_id" bigint, "p_user_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_player_command"("p_command" "text", "p_establishment_id" bigint, "p_user_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."refresh_establishment_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."refresh_establishment_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."refresh_establishment_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."resolve_tiebreak_stone"("p_round_id" bigint, "p_card_ids" bigint[]) TO "anon";
GRANT ALL ON FUNCTION "public"."resolve_tiebreak_stone"("p_round_id" bigint, "p_card_ids" bigint[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."resolve_tiebreak_stone"("p_round_id" bigint, "p_card_ids" bigint[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_refresh_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_refresh_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_refresh_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_feature_flags_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_feature_flags_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_feature_flags_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_ticker_messages_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_ticker_messages_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_ticker_messages_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_round_time_conflict"("p_establishment_id" bigint, "p_draw_datetime" timestamp with time zone, "p_exclude_round_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."validate_round_time_conflict"("p_establishment_id" bigint, "p_draw_datetime" timestamp with time zone, "p_exclude_round_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_round_time_conflict"("p_establishment_id" bigint, "p_draw_datetime" timestamp with time zone, "p_exclude_round_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."verify_password"("password" "text", "hash" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."verify_password"("password" "text", "hash" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."verify_password"("password" "text", "hash" "text") TO "service_role";
























GRANT ALL ON TABLE "public"."cards" TO "anon";
GRANT ALL ON TABLE "public"."cards" TO "authenticated";
GRANT ALL ON TABLE "public"."cards" TO "service_role";



GRANT ALL ON SEQUENCE "public"."cards_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."cards_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."cards_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."charities" TO "anon";
GRANT ALL ON TABLE "public"."charities" TO "authenticated";
GRANT ALL ON TABLE "public"."charities" TO "service_role";



GRANT ALL ON SEQUENCE "public"."charities_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."charities_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."charities_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."draws" TO "anon";
GRANT ALL ON TABLE "public"."draws" TO "authenticated";
GRANT ALL ON TABLE "public"."draws" TO "service_role";



GRANT ALL ON SEQUENCE "public"."draws_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."draws_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."draws_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."establishments" TO "anon";
GRANT ALL ON TABLE "public"."establishments" TO "authenticated";
GRANT ALL ON TABLE "public"."establishments" TO "service_role";



GRANT ALL ON SEQUENCE "public"."establishments_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."establishments_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."establishments_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."feature_flags" TO "anon";
GRANT ALL ON TABLE "public"."feature_flags" TO "authenticated";
GRANT ALL ON TABLE "public"."feature_flags" TO "service_role";



GRANT ALL ON TABLE "public"."groq_prompts" TO "anon";
GRANT ALL ON TABLE "public"."groq_prompts" TO "authenticated";
GRANT ALL ON TABLE "public"."groq_prompts" TO "service_role";



GRANT ALL ON SEQUENCE "public"."groq_prompts_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."groq_prompts_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."groq_prompts_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."groq_usage_logs" TO "anon";
GRANT ALL ON TABLE "public"."groq_usage_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."groq_usage_logs" TO "service_role";



GRANT ALL ON SEQUENCE "public"."groq_usage_logs_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."groq_usage_logs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."groq_usage_logs_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."logs" TO "anon";
GRANT ALL ON TABLE "public"."logs" TO "authenticated";
GRANT ALL ON TABLE "public"."logs" TO "service_role";



GRANT ALL ON SEQUENCE "public"."logs_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."logs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."logs_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."managers" TO "anon";
GRANT ALL ON TABLE "public"."managers" TO "authenticated";
GRANT ALL ON TABLE "public"."managers" TO "service_role";



GRANT ALL ON SEQUENCE "public"."managers_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."managers_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."managers_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."payment_webhooks" TO "anon";
GRANT ALL ON TABLE "public"."payment_webhooks" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_webhooks" TO "service_role";



GRANT ALL ON TABLE "public"."player_participations" TO "anon";
GRANT ALL ON TABLE "public"."player_participations" TO "authenticated";
GRANT ALL ON TABLE "public"."player_participations" TO "service_role";



GRANT ALL ON SEQUENCE "public"."player_participations_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."player_participations_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."player_participations_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."players" TO "anon";
GRANT ALL ON TABLE "public"."players" TO "authenticated";
GRANT ALL ON TABLE "public"."players" TO "service_role";



GRANT ALL ON SEQUENCE "public"."players_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."players_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."players_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."pos_terminals" TO "anon";
GRANT ALL ON TABLE "public"."pos_terminals" TO "authenticated";
GRANT ALL ON TABLE "public"."pos_terminals" TO "service_role";



GRANT ALL ON SEQUENCE "public"."pos_terminals_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."pos_terminals_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."pos_terminals_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."purchases" TO "anon";
GRANT ALL ON TABLE "public"."purchases" TO "authenticated";
GRANT ALL ON TABLE "public"."purchases" TO "service_role";



GRANT ALL ON SEQUENCE "public"."purchases_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."purchases_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."purchases_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."rounds" TO "anon";
GRANT ALL ON TABLE "public"."rounds" TO "authenticated";
GRANT ALL ON TABLE "public"."rounds" TO "service_role";



GRANT ALL ON SEQUENCE "public"."rounds_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."rounds_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."rounds_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."schema_migrations" TO "anon";
GRANT ALL ON TABLE "public"."schema_migrations" TO "authenticated";
GRANT ALL ON TABLE "public"."schema_migrations" TO "service_role";



GRANT ALL ON TABLE "public"."settings" TO "anon";
GRANT ALL ON TABLE "public"."settings" TO "authenticated";
GRANT ALL ON TABLE "public"."settings" TO "service_role";



GRANT ALL ON SEQUENCE "public"."settings_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."settings_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."settings_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."ticker_messages" TO "anon";
GRANT ALL ON TABLE "public"."ticker_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."ticker_messages" TO "service_role";



GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON SEQUENCE "public"."users_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."users_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."users_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."v_groq_usage_stats" TO "anon";
GRANT ALL ON TABLE "public"."v_groq_usage_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."v_groq_usage_stats" TO "service_role";



GRANT ALL ON TABLE "public"."v_player_stats" TO "anon";
GRANT ALL ON TABLE "public"."v_player_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."v_player_stats" TO "service_role";



GRANT ALL ON TABLE "public"."winners" TO "anon";
GRANT ALL ON TABLE "public"."winners" TO "authenticated";
GRANT ALL ON TABLE "public"."winners" TO "service_role";



GRANT ALL ON SEQUENCE "public"."winners_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."winners_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."winners_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."withdrawals" TO "anon";
GRANT ALL ON TABLE "public"."withdrawals" TO "authenticated";
GRANT ALL ON TABLE "public"."withdrawals" TO "service_role";



GRANT ALL ON SEQUENCE "public"."withdrawals_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."withdrawals_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."withdrawals_id_seq" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































