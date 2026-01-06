-- Remover políticas existentes e recriar de forma mais permissiva
DROP POLICY IF EXISTS "Admins can manage bot automation config" ON bot_automation_config;
DROP POLICY IF EXISTS "Admins can view bot automation config" ON bot_automation_config;
DROP POLICY IF EXISTS "Admins can insert bot automation config" ON bot_automation_config;
DROP POLICY IF EXISTS "Admins can update bot automation config" ON bot_automation_config;
DROP POLICY IF EXISTS "Admins can delete bot automation config" ON bot_automation_config;

-- Criar políticas separadas para cada operação (mais flexíveis)
CREATE POLICY "Anyone can view bot automation config"
ON bot_automation_config FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert bot automation config"
ON bot_automation_config FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update bot automation config"
ON bot_automation_config FOR UPDATE
USING (true);

CREATE POLICY "Anyone can delete bot automation config"
ON bot_automation_config FOR DELETE
USING (true);

-- Fazer o mesmo para logs
DROP POLICY IF EXISTS "Admins can manage bot automation logs" ON bot_automation_logs;
DROP POLICY IF EXISTS "Admins can view bot automation logs" ON bot_automation_logs;
DROP POLICY IF EXISTS "Admins can insert bot automation logs" ON bot_automation_logs;

CREATE POLICY "Anyone can view bot automation logs"
ON bot_automation_logs FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert bot automation logs"
ON bot_automation_logs FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update bot automation logs"
ON bot_automation_logs FOR UPDATE
USING (true);