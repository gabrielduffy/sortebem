


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



CREATE OR REPLACE FUNCTION "public"."update_ticker_messages_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_ticker_messages_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

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
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."payment_webhooks" OWNER TO "postgres";


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
    CONSTRAINT "purchases_gateway_check" CHECK (("gateway" = ANY (ARRAY['asaas'::"text", 'pagseguro'::"text"]))),
    CONSTRAINT "purchases_payment_method_check" CHECK (("payment_method" = ANY (ARRAY['pix'::"text", 'credit_card'::"text", 'debit_card'::"text"]))),
    CONSTRAINT "purchases_payment_status_check" CHECK (("payment_status" = ANY (ARRAY['pending'::"text", 'paid'::"text", 'failed'::"text", 'cancelled'::"text", 'refunded'::"text"])))
);


ALTER TABLE "public"."purchases" OWNER TO "postgres";


COMMENT ON TABLE "public"."purchases" IS 'Compras de cartelas (PIX ou cartão)';



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
    CONSTRAINT "rounds_status_check" CHECK (("status" = ANY (ARRAY['scheduled'::"text", 'selling'::"text", 'drawing'::"text", 'finished'::"text", 'cancelled'::"text"]))),
    CONSTRAINT "rounds_type_check" CHECK (("type" = ANY (ARRAY['regular'::"text", 'special'::"text"])))
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



CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "email" "text",
    "whatsapp" "text",
    "phone" "text",
    "cpf" "text",
    "password_hash" "text" NOT NULL,
    "role" "text" DEFAULT 'user'::"text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "users_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'manager'::"text", 'establishment'::"text", 'user'::"text"])))
);


ALTER TABLE "public"."users" OWNER TO "postgres";


COMMENT ON TABLE "public"."users" IS 'Usuários do sistema (admin, gerentes, estabelecimentos, clientes)';



CREATE SEQUENCE IF NOT EXISTS "public"."users_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."users_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."users_id_seq" OWNED BY "public"."users"."id";



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



ALTER TABLE ONLY "public"."logs" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."logs_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."managers" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."managers_id_seq"'::"regclass");



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
    ADD CONSTRAINT "establishments_cnpj_key" UNIQUE ("cnpj");



ALTER TABLE ONLY "public"."establishments"
    ADD CONSTRAINT "establishments_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."establishments"
    ADD CONSTRAINT "establishments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."establishments"
    ADD CONSTRAINT "establishments_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."logs"
    ADD CONSTRAINT "logs_pkey" PRIMARY KEY ("id");



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



ALTER TABLE ONLY "public"."settings"
    ADD CONSTRAINT "settings_key_key" UNIQUE ("key");



ALTER TABLE ONLY "public"."settings"
    ADD CONSTRAINT "settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ticker_messages"
    ADD CONSTRAINT "ticker_messages_pkey" PRIMARY KEY ("id");



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



CREATE INDEX "idx_cards_purchase_id" ON "public"."cards" USING "btree" ("purchase_id");



CREATE INDEX "idx_cards_round_id" ON "public"."cards" USING "btree" ("round_id");



CREATE INDEX "idx_cards_status" ON "public"."cards" USING "btree" ("status");



CREATE INDEX "idx_charities_active" ON "public"."charities" USING "btree" ("is_active");



CREATE INDEX "idx_charities_active_month" ON "public"."charities" USING "btree" ("active_month");



CREATE INDEX "idx_draws_position" ON "public"."draws" USING "btree" ("position");



CREATE INDEX "idx_draws_round_id" ON "public"."draws" USING "btree" ("round_id");



CREATE UNIQUE INDEX "idx_draws_round_number" ON "public"."draws" USING "btree" ("round_id", "number");



CREATE INDEX "idx_establishments_code" ON "public"."establishments" USING "btree" ("code");



CREATE INDEX "idx_establishments_manager_id" ON "public"."establishments" USING "btree" ("manager_id");



CREATE INDEX "idx_establishments_slug" ON "public"."establishments" USING "btree" ("slug");



CREATE INDEX "idx_establishments_user_id" ON "public"."establishments" USING "btree" ("user_id");



CREATE INDEX "idx_logs_action" ON "public"."logs" USING "btree" ("action");



CREATE INDEX "idx_logs_created_at" ON "public"."logs" USING "btree" ("created_at");



CREATE INDEX "idx_logs_entity_type" ON "public"."logs" USING "btree" ("entity_type");



CREATE INDEX "idx_logs_user_id" ON "public"."logs" USING "btree" ("user_id");



CREATE INDEX "idx_managers_code" ON "public"."managers" USING "btree" ("code");



CREATE INDEX "idx_managers_referral_code" ON "public"."managers" USING "btree" ("referral_code");



CREATE INDEX "idx_managers_user_id" ON "public"."managers" USING "btree" ("user_id");



CREATE INDEX "idx_payment_webhooks_gateway" ON "public"."payment_webhooks" USING "btree" ("gateway", "processed");



CREATE INDEX "idx_payment_webhooks_purchase" ON "public"."payment_webhooks" USING "btree" ("purchase_id");



CREATE INDEX "idx_pos_terminals_active" ON "public"."pos_terminals" USING "btree" ("is_active");



CREATE INDEX "idx_pos_terminals_establishment_id" ON "public"."pos_terminals" USING "btree" ("establishment_id");



CREATE INDEX "idx_pos_terminals_terminal_code" ON "public"."pos_terminals" USING "btree" ("terminal_code");



CREATE INDEX "idx_purchases_created_at" ON "public"."purchases" USING "btree" ("created_at");



CREATE INDEX "idx_purchases_establishment_id" ON "public"."purchases" USING "btree" ("establishment_id");



CREATE INDEX "idx_purchases_payment_status" ON "public"."purchases" USING "btree" ("payment_status");



CREATE INDEX "idx_purchases_round_id" ON "public"."purchases" USING "btree" ("round_id");



CREATE INDEX "idx_purchases_transaction_code" ON "public"."purchases" USING "btree" ("transaction_code");



CREATE INDEX "idx_purchases_user_id" ON "public"."purchases" USING "btree" ("user_id");



CREATE INDEX "idx_rounds_number" ON "public"."rounds" USING "btree" ("number");



CREATE INDEX "idx_rounds_selling" ON "public"."rounds" USING "btree" ("is_selling");



CREATE INDEX "idx_rounds_starts_at" ON "public"."rounds" USING "btree" ("starts_at");



CREATE INDEX "idx_rounds_status" ON "public"."rounds" USING "btree" ("status");



CREATE INDEX "idx_rounds_type" ON "public"."rounds" USING "btree" ("type");



CREATE INDEX "idx_settings_key" ON "public"."settings" USING "btree" ("key");



CREATE INDEX "idx_settings_public" ON "public"."settings" USING "btree" ("is_public") WHERE ("is_public" = true);



CREATE INDEX "idx_ticker_messages_active_order" ON "public"."ticker_messages" USING "btree" ("is_active", "display_order");



CREATE INDEX "idx_users_cpf" ON "public"."users" USING "btree" ("cpf");



CREATE INDEX "idx_users_email" ON "public"."users" USING "btree" ("email");



CREATE INDEX "idx_users_role" ON "public"."users" USING "btree" ("role");



CREATE INDEX "idx_users_whatsapp" ON "public"."users" USING "btree" ("whatsapp");



CREATE INDEX "idx_winners_card_id" ON "public"."winners" USING "btree" ("card_id");



CREATE INDEX "idx_winners_round_id" ON "public"."winners" USING "btree" ("round_id");



CREATE INDEX "idx_winners_status" ON "public"."winners" USING "btree" ("status");



CREATE INDEX "idx_withdrawals_entity_id" ON "public"."withdrawals" USING "btree" ("entity_id");



CREATE INDEX "idx_withdrawals_status" ON "public"."withdrawals" USING "btree" ("status");



CREATE INDEX "idx_withdrawals_user_id" ON "public"."withdrawals" USING "btree" ("user_id");



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



ALTER TABLE ONLY "public"."winners"
    ADD CONSTRAINT "winners_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."winners"
    ADD CONSTRAINT "winners_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "public"."rounds"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."withdrawals"
    ADD CONSTRAINT "withdrawals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Allow public read for login" ON "public"."users" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Anyone can create purchase" ON "public"."purchases" FOR INSERT WITH CHECK (true);



CREATE POLICY "Anyone can create purchases" ON "public"."purchases" FOR INSERT WITH CHECK (true);



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



CREATE POLICY "System can insert logs" ON "public"."logs" FOR INSERT WITH CHECK (true);



CREATE POLICY "Users can create withdrawals" ON "public"."withdrawals" FOR INSERT WITH CHECK (("user_id" = (("auth"."jwt"() ->> 'user_id'::"text"))::bigint));



CREATE POLICY "Users can update own profile" ON "public"."users" FOR UPDATE USING ((("id" = (("auth"."jwt"() ->> 'user_id'::"text"))::bigint) OR (("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text")));



CREATE POLICY "Users can view own profile" ON "public"."users" FOR SELECT USING ((("id" = (("auth"."jwt"() ->> 'user_id'::"text"))::bigint) OR (("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text")));



CREATE POLICY "Users can view own purchases" ON "public"."purchases" FOR SELECT USING ((("user_id" = (("auth"."jwt"() ->> 'user_id'::"text"))::bigint) OR (("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text")));



CREATE POLICY "Users can view own withdrawals" ON "public"."withdrawals" FOR SELECT USING ((("user_id" = (("auth"."jwt"() ->> 'user_id'::"text"))::bigint) OR (("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text")));



CREATE POLICY "Winners are viewable by everyone" ON "public"."winners" FOR SELECT USING (true);



COMMENT ON POLICY "Winners are viewable by everyone" ON "public"."winners" IS 'Ganhadores são públicos para transparência';



ALTER TABLE "public"."cards" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."charities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."draws" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."establishments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."managers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pos_terminals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."purchases" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rounds" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ticker_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."winners" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."withdrawals" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";





GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";














































































































































































GRANT ALL ON FUNCTION "public"."create_next_rounds"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_next_rounds"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_next_rounds"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_ticker_messages_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_ticker_messages_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_ticker_messages_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";
























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



GRANT ALL ON TABLE "public"."settings" TO "anon";
GRANT ALL ON TABLE "public"."settings" TO "authenticated";
GRANT ALL ON TABLE "public"."settings" TO "service_role";



GRANT ALL ON SEQUENCE "public"."settings_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."settings_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."settings_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."ticker_messages" TO "anon";
GRANT ALL ON TABLE "public"."ticker_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."ticker_messages" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON SEQUENCE "public"."users_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."users_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."users_id_seq" TO "service_role";



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































