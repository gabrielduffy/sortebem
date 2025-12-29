# 📋 CHECKLIST: Tabelas e Configurações Necessárias no Supabase

## ✅ PARA O LINK DA TV (`/tv/{slug}`)

### 1️⃣ Tabela: `establishments`
**Campos necessários:**
```sql
- id (uuid ou serial)
- slug (text) -- IMPORTANTE: Campo único para identificar estabelecimento na URL
- name (text)
- trade_name (text) -- Nome fantasia exibido na TV
- logo_url (text) -- URL do logo (opcional)
- user_id (uuid) -- FK para users
```

**Verificar:**
- ✅ Campo `slug` existe?
- ✅ `slug` tem index único? `CREATE UNIQUE INDEX idx_establishments_slug ON establishments(slug);`
- ✅ `slug` está populado para todos os estabelecimentos?

### 2️⃣ Tabela: `charities`
**Campos necessários:**
```sql
- id (serial)
- name (text)
- logo_url (text) -- URL do logo (opcional)
- is_active (boolean) -- Apenas uma charity deve estar ativa por vez
- total_raised (numeric ou decimal) -- Total arrecadado para exibir na TV
```

**Verificar:**
- ✅ Campo `total_raised` existe?
- ✅ Pelo menos uma charity está com `is_active = true`?

### 3️⃣ Tabela: `ticker_messages` ⚠️ **NOVA - PRECISA CRIAR**
**SQL já fornecido em:** `supabase-ticker-messages.sql`

```sql
- id (uuid)
- message (text)
- icon (text) -- Emoji/ícone
- is_active (boolean)
- display_order (integer)
- created_at (timestamptz)
- updated_at (timestamptz)
```

**Ação necessária:**
```bash
Execute o arquivo supabase-ticker-messages.sql no Supabase SQL Editor
```

### 4️⃣ Tabela: `rounds`
**Campos necessários:**
```sql
- id (serial)
- number (integer) -- Número da rodada
- status (text) -- 'selling', 'drawing', 'finished'
- card_price (numeric)
- cards_sold (integer)
- max_cards (integer)
- prize_pool (numeric)
- drawn_numbers (integer[] ou jsonb) -- Array de números sorteados
- is_selling (boolean)
- is_drawing (boolean)
- starts_at (timestamptz)
- selling_ends_at (timestamptz)
- ends_at (timestamptz)
- drawing_started_at (timestamptz)
- created_at (timestamptz)
```

### 5️⃣ Tabela: `cards`
**Campos necessários (para winners):**
```sql
- id (uuid ou serial)
- code (text) -- Código da cartela
- numbers (jsonb ou array) -- Números da cartela
- round_id (integer) -- FK para rounds
- purchase_id (uuid) -- FK para purchases
- is_winner (boolean)
- created_at (timestamptz)
```

**Query usada no getTVData:**
```sql
SELECT *,
  round:rounds(number),
  purchase:purchases(customer_name)
FROM cards
WHERE is_winner = true
ORDER BY created_at DESC
LIMIT 3
```

### 6️⃣ Tabela: `purchases`
**Campos necessários:**
```sql
- id (uuid)
- customer_name (text) -- Nome do cliente (para exibir no winner)
```

---

## ✅ PARA O LINK DE VENDA (`/checkout?ref={slug}`)

### 1️⃣ Tabela: `rounds`
**Mesma tabela acima, mas query diferente:**

**Query usada no getRounds:**
```sql
SELECT *
FROM rounds
WHERE status = 'selling' AND is_selling = true
ORDER BY starts_at ASC
```

### 2️⃣ Tabela: `purchases`
**Campos necessários para criar compra:**
```sql
- id (uuid) PRIMARY KEY DEFAULT gen_random_uuid()
- round_id (integer) FK para rounds
- quantity (integer)
- payment_method (text)
- user_id (uuid) -- Pode ser NULL (compra anônima)
- customer_name (text)
- customer_email (text)
- customer_phone (text)
- customer_cpf (text)
- payment_status (text) -- 'pending', 'paid', 'failed'
- pix_code (text) -- Código PIX
- pix_qrcode (text) -- QR Code em base64 ou URL
- total_amount (numeric)
- created_at (timestamptz)
```

### 3️⃣ Tabela: `cards`
**Geração de cartelas após compra:**
```sql
- id (uuid) PRIMARY KEY DEFAULT gen_random_uuid()
- code (text) UNIQUE
- numbers (jsonb)
- round_id (integer) FK para rounds
- purchase_id (uuid) FK para purchases
- status (text) -- 'active', 'winner', 'loser'
- is_winner (boolean)
- created_at (timestamptz)
```

### 4️⃣ Tabela: `settings`
**Usada no checkout para pegar configurações:**
```sql
- id (serial)
- key (text) UNIQUE
- value (jsonb ou text)
- is_public (boolean) -- Configurações públicas podem ser acessadas sem autenticação
```

**Query usada:**
```sql
SELECT * FROM settings WHERE is_public = true
```

---

## 🔒 ROW LEVEL SECURITY (RLS) - POLICIES NECESSÁRIAS

### ⚠️ **IMPORTANTE: Verificar se RLS está habilitado e configurado**

### 1️⃣ Tabela: `ticker_messages`
```sql
-- Permitir leitura pública apenas de mensagens ativas
CREATE POLICY "Public can view active ticker messages"
ON ticker_messages FOR SELECT
USING (is_active = true);

-- Apenas admins podem criar/editar/deletar
CREATE POLICY "Admin can manage ticker messages"
ON ticker_messages FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');
```

### 2️⃣ Tabela: `rounds`
```sql
-- Permitir leitura pública de rodadas em venda
CREATE POLICY "Public can view selling rounds"
ON rounds FOR SELECT
USING (status = 'selling' OR status = 'drawing');
```

### 3️⃣ Tabela: `charities`
```sql
-- Permitir leitura pública
CREATE POLICY "Public can view charities"
ON charities FOR SELECT
TO public
USING (true);
```

### 4️⃣ Tabela: `establishments`
```sql
-- Permitir leitura pública (necessário para getTVData)
CREATE POLICY "Public can view establishments"
ON establishments FOR SELECT
TO public
USING (true);
```

### 5️⃣ Tabela: `purchases`
```sql
-- Permitir criação pública (checkout anônimo)
CREATE POLICY "Anyone can create purchase"
ON purchases FOR INSERT
TO public
WITH CHECK (true);

-- Permitir leitura apenas do próprio registro
CREATE POLICY "User can view own purchases"
ON purchases FOR SELECT
USING (user_id = auth.uid() OR user_id IS NULL);
```

### 6️⃣ Tabela: `cards`
```sql
-- Permitir leitura pública de winners (para TV)
CREATE POLICY "Public can view winner cards"
ON cards FOR SELECT
USING (is_winner = true);

-- Permitir leitura de próprias cartelas
CREATE POLICY "User can view own cards"
ON cards FOR SELECT
USING (
  purchase_id IN (
    SELECT id FROM purchases WHERE user_id = auth.uid()
  )
);
```

### 7️⃣ Tabela: `settings`
```sql
-- Permitir leitura pública apenas de settings públicas
CREATE POLICY "Public can view public settings"
ON settings FOR SELECT
USING (is_public = true);
```

---

## 🔍 EDGE FUNCTIONS / DATABASE FUNCTIONS

### ⚠️ Verificar se existem:

### 1️⃣ Function para gerar código PIX
```sql
-- Pode ser uma function PostgreSQL ou Edge Function
-- Usada em createPurchase para gerar pix_code e pix_qrcode
```

**Verificar:**
- Existe uma function/trigger que gera `pix_code` e `pix_qrcode` automaticamente ao inserir purchase?
- Ou o frontend/backend precisa gerar externamente?

### 2️⃣ Function para gerar código de cartela
```sql
-- Gera código único para cartelas (ex: SB-ABC123)
-- Usada ao criar cards
```

**Verificar:**
- Existe trigger/function que gera `code` automaticamente?
- Formato: Pode usar `gen_random_uuid()` ou formato customizado

### 3️⃣ Function para gerar números da cartela
```sql
-- Gera 25 números aleatórios únicos de 1 a 75
-- Distribuídos em 5 colunas (1-15, 16-30, 31-45, 46-60, 61-75)
```

**Verificar:**
- Existe function PostgreSQL que gera os números?
- Ou é gerado no frontend/backend?

---

## 📝 CHECKLIST FINAL

### ✅ Execute este checklist no Supabase:

#### **1. Tabelas Existentes:**
- [ ] `establishments` existe
- [ ] `establishments.slug` existe e está único
- [ ] `charities` existe
- [ ] `charities.total_raised` existe
- [ ] `rounds` existe com todos os campos
- [ ] `cards` existe
- [ ] `purchases` existe com todos os campos
- [ ] `settings` existe
- [ ] `users` existe (para auth)

#### **2. Tabela Nova:**
- [ ] `ticker_messages` criada (execute `supabase-ticker-messages.sql`)

#### **3. RLS Habilitado:**
- [ ] RLS está ON em todas as tabelas?
  ```sql
  ALTER TABLE ticker_messages ENABLE ROW LEVEL SECURITY;
  ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;
  ALTER TABLE charities ENABLE ROW LEVEL SECURITY;
  ALTER TABLE establishments ENABLE ROW LEVEL SECURITY;
  ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
  ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
  ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
  ```

#### **4. Policies Criadas:**
- [ ] `ticker_messages` tem policies de leitura pública (ativas) e admin
- [ ] `rounds` tem policy de leitura pública (selling/drawing)
- [ ] `charities` tem policy de leitura pública
- [ ] `establishments` tem policy de leitura pública
- [ ] `purchases` tem policies de insert público e select próprio
- [ ] `cards` tem policies de leitura winners + próprias
- [ ] `settings` tem policy de leitura pública (is_public=true)

#### **5. Dados Populados:**
- [ ] Pelo menos 1 charity com `is_active = true`
- [ ] Estabelecimentos têm `slug` único preenchido
- [ ] `ticker_messages` tem mensagens padrão (execute SQL)
- [ ] Pelo menos 1 round com `status = 'selling'` para teste

#### **6. Functions/Triggers:**
- [ ] Verificar se existe logic para gerar PIX (code + qrcode)
- [ ] Verificar se existe logic para gerar código de cartela
- [ ] Verificar se existe logic para gerar números de cartela

---

## ⚠️ PRÓXIMOS PASSOS SUGERIDOS:

1. **Execute no SQL Editor:**
   ```sql
   -- Ver todas as tabelas
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public';

   -- Ver colunas de uma tabela
   SELECT column_name, data_type
   FROM information_schema.columns
   WHERE table_name = 'establishments';

   -- Verificar RLS
   SELECT tablename, rowsecurity
   FROM pg_tables
   WHERE schemaname = 'public';

   -- Verificar policies
   SELECT schemaname, tablename, policyname, cmd
   FROM pg_policies
   WHERE schemaname = 'public';
   ```

2. **Criar SQL para campos faltantes:**
   - Se `establishments.slug` não existe, adicionar
   - Se `charities.total_raised` não existe, adicionar

3. **Criar policies faltantes**

---

## 💡 RESUMO RÁPIDO:

**Para `/tv/{slug}` funcionar precisa:**
- ✅ ticker_messages (CRIAR)
- ✅ establishments.slug (VERIFICAR)
- ✅ charities.total_raised (VERIFICAR)
- ✅ cards com is_winner
- ✅ Policies públicas de leitura

**Para `/checkout?ref={slug}` funcionar precisa:**
- ✅ rounds com status='selling'
- ✅ purchases com insert público
- ✅ Logic para gerar PIX (VERIFICAR SE EXISTE)
- ✅ Logic para gerar cartelas (VERIFICAR SE EXISTE)

**CRÍTICO:**
- ⚠️ Execute `supabase-ticker-messages.sql` AGORA
- ⚠️ Verifique se `establishments.slug` existe
- ⚠️ Configure RLS e policies para acesso público
