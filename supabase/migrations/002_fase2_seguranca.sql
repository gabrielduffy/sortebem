-- =====================================================
-- FASE 2: SEGURANÇA COM BACKWARDS COMPATIBILITY
-- Data: 2025-01-01
-- Autor: Claude Code
-- Descrição: Implementa bcrypt e JWT mantendo sistema antigo funcionando
-- =====================================================

-- 2.1 - Garantir que pgcrypto está instalado (para bcrypt)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2.2 - Criar função para gerar hash bcrypt de senha
CREATE OR REPLACE FUNCTION hash_password(password TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Gera hash bcrypt com 10 rounds (bom balance entre segurança e performance)
  RETURN crypt(password, gen_salt('bf', 10));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION hash_password IS 'Gera hash bcrypt de uma senha (10 rounds)';

-- 2.3 - Criar função para verificar senha contra hash
CREATE OR REPLACE FUNCTION verify_password(password TEXT, hash TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Compara senha com hash usando bcrypt
  RETURN hash = crypt(password, hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION verify_password IS 'Verifica se uma senha corresponde ao hash bcrypt';

-- 2.4 - Adicionar colunas para migração gradual de senhas
ALTER TABLE users
ADD COLUMN IF NOT EXISTS password_migrated BOOLEAN DEFAULT false;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS password_hash_new TEXT;

-- Adicionar comentários
COMMENT ON COLUMN users.password_migrated IS 'Indica se a senha do usuário já foi migrada para bcrypt';
COMMENT ON COLUMN users.password_hash_new IS 'Hash bcrypt da senha (novo sistema)';

-- 2.5 - Criar índice para melhorar performance de consultas
CREATE INDEX IF NOT EXISTS idx_users_password_migrated
ON users(password_migrated)
WHERE password_migrated = false;

-- 2.6 - Criar função para migrar senha de um usuário específico
CREATE OR REPLACE FUNCTION migrate_user_password(
  p_user_id BIGINT,
  p_new_password TEXT
)
RETURNS BOOLEAN AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION migrate_user_password IS 'Migra a senha de um usuário específico para o novo sistema bcrypt';

-- 2.7 - Migrar senhas conhecidas (do seed_real_users.js)
-- ATENÇÃO: Só executa se o usuário existir
DO $$
DECLARE
  admin_id BIGINT;
  gerente_id BIGINT;
  estabelecimento_id BIGINT;
BEGIN
  -- Buscar ID do admin (se existir)
  SELECT id INTO admin_id FROM users WHERE email = 'admin@sortebem.com.br' LIMIT 1;
  IF admin_id IS NOT NULL THEN
    PERFORM migrate_user_password(admin_id, 'Admin@2025');
  END IF;

  -- Buscar ID do gerente (se existir)
  SELECT id INTO gerente_id FROM users WHERE email = 'gerente@sortebem.com.br' LIMIT 1;
  IF gerente_id IS NOT NULL THEN
    PERFORM migrate_user_password(gerente_id, 'Gerente@2025');
  END IF;

  -- Buscar ID do estabelecimento (se existir)
  SELECT id INTO estabelecimento_id FROM users WHERE email = 'estabelecimento@sortebem.com.br' LIMIT 1;
  IF estabelecimento_id IS NOT NULL THEN
    PERFORM migrate_user_password(estabelecimento_id, 'Estabelecimento@2025');
  END IF;
END $$;

-- 2.8 - Registrar migração
INSERT INTO schema_migrations (version, description) VALUES
  (5, 'Extension pgcrypto habilitada'),
  (6, 'Functions hash_password e verify_password criadas'),
  (7, 'Colunas password_migrated e password_hash_new adicionadas'),
  (8, 'Senhas de usuários conhecidos migradas para bcrypt')
ON CONFLICT (version) DO NOTHING;

-- 2.9 - Grant permissions nas functions
GRANT EXECUTE ON FUNCTION hash_password TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION verify_password TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION migrate_user_password TO service_role; -- Apenas service_role

-- 2.10 - Criar função auxiliar para login (será chamada pelo frontend)
CREATE OR REPLACE FUNCTION authenticate_user(
  p_email TEXT,
  p_password TEXT
)
RETURNS TABLE(
  success BOOLEAN,
  user_id BIGINT,
  user_name TEXT,
  user_email TEXT,
  user_role TEXT,
  message TEXT
) AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION authenticate_user IS 'Autentica usuário com suporte a migração gradual de bcrypt';

GRANT EXECUTE ON FUNCTION authenticate_user TO anon, authenticated, service_role;

-- Registrar criação da função
INSERT INTO schema_migrations (version, description) VALUES
  (9, 'Função authenticate_user criada para dual auth')
ON CONFLICT (version) DO NOTHING;
