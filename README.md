# 🎰 SORTEBEM - Sistema de Loteria Digital

Sistema completo de loteria digital com cartelas de bingo, gerenciamento de rodadas, pagamentos PIX e modo TV para sorteios ao vivo.

---

## 📋 **Índice**

- [Sobre o Projeto](#sobre-o-projeto)
- [Tecnologias](#tecnologias)
- [Arquitetura](#arquitetura)
- [Banco de Dados](#banco-de-dados)
- [Feature Flags](#feature-flags)
- [Segurança e Autenticação](#segurança-e-autenticação)
- [Como Desenvolver](#como-desenvolver)
- [Migrations](#migrations)
- [Deploy](#deploy)
- [APIs e Integrações](#apis-e-integrações)

---

## 🎯 **Sobre o Projeto**

SORTEBEM é um sistema completo de loteria digital que permite:

- **Compra de cartelas** de bingo regular e especial
- **Geração de PIX** para pagamento via Asaas/PagSeguro
- **Gerenciamento de rodadas** com prêmios configuráveis
- **Sorteio de números** ao vivo via TV Mode
- **Verificação automática** de cartelas vencedoras
- **Sistema de saques** para ganhadores
- **Dashboard administrativo** completo
- **Modo TV** com letreiro (ticker) e identidade visual profissional
- **Notificações via WhatsApp** (integração futura)

---

## 🛠️ **Tecnologias**

### **Frontend**
- **React 18** - Biblioteca UI
- **TypeScript** - Tipagem estática
- **Vite** - Build tool e dev server
- **TailwindCSS** - Estilização
- **shadcn/ui** - Componentes UI
- **React Router** - Navegação
- **TanStack Query** - Gerenciamento de estado servidor
- **Framer Motion** - Animações
- **Recharts** - Gráficos e visualizações
- **date-fns** - Manipulação de datas
- **Zod** - Validação de schemas
- **React Hook Form** - Formulários

### **Backend/Database**
- **Supabase** - Backend as a Service
- **PostgreSQL** - Banco de dados relacional
- **Row Level Security (RLS)** - Segurança nível de linha
- **pgcrypto** - Criptografia bcrypt para senhas
- **PostgreSQL Functions** - Lógica de negócio no banco
- **PostgreSQL Triggers** - Automações

### **Integrações**
- **Asaas** - Pagamentos PIX (produção)
- **PagSeguro** - Pagamentos PIX (fallback)
- **WhatsApp Business API** - Notificações

### **DevOps**
- **GitHub Actions** - CI/CD
- **npm** - Gerenciamento de pacotes
- **ESLint** - Linting

---

## 🏗️ **Arquitetura**

```
sortebem/
├── src/
│   ├── components/          # Componentes React
│   │   ├── admin/           # Painel administrativo
│   │   ├── checkout/        # Fluxo de compra
│   │   ├── demo/            # Páginas de demonstração
│   │   ├── shared/          # Componentes compartilhados
│   │   ├── tv/              # TV Mode com letreiro
│   │   └── ui/              # Componentes shadcn/ui
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Bibliotecas e configurações
│   │   ├── supabase.ts      # Cliente Supabase
│   │   └── utils.ts         # Utilitários
│   ├── pages/               # Páginas da aplicação
│   ├── services/            # Serviços de API
│   │   ├── api.ts           # API service principal
│   │   ├── authService.ts   # Autenticação com dual auth
│   │   └── featureFlagService.ts  # Gerenciamento de feature flags
│   └── types/               # TypeScript types
├── supabase/
│   └── migrations/          # Migrations SQL
│       ├── 001_fase1_preparacao.sql    # Feature flags + settings
│       └── 002_fase2_seguranca.sql     # bcrypt + dual auth
├── scripts/
│   └── run-migrations.js    # Script automático de migrations
├── .github/
│   └── workflows/
│       ├── export-schema.yml         # Export schema automático
│       └── run-migrations.yml        # Executar migrations (manual)
└── public/                  # Arquivos estáticos
```

---

## 🗄️ **Banco de Dados**

### **Tabelas Principais**

#### **Usuários e Autenticação**
- `users` - Usuários do sistema (admin, gerente, estabelecimento, cliente)
- `managers` - Gerentes de estabelecimentos
- `establishments` - Pontos de venda físicos
- `charities` - Instituições beneficiadas

#### **Rodadas e Cartelas**
- `rounds` - Rodadas de loteria (regular/especial)
- `cards` - Cartelas de bingo geradas
- `purchases` - Compras realizadas
- `draws` - Números sorteados
- `winners` - Ganhadores das rodadas

#### **Financeiro**
- `withdrawals` - Saques de prêmios
- `payment_webhooks` - Webhooks de pagamento
- `pos_terminals` - Terminais POS físicos

#### **Configuração**
- `settings` - Configurações do sistema
- `feature_flags` - Feature flags para rollout gradual
- `schema_migrations` - Controle de versão do schema
- `ticker_messages` - Mensagens do letreiro (TV Mode)
- `logs` - Logs do sistema

### **Relacionamentos**

```
users (1) --> (N) managers
users (1) --> (N) establishments
users (1) --> (N) purchases
purchases (1) --> (N) cards
rounds (1) --> (N) cards
rounds (1) --> (N) draws
rounds (1) --> (N) winners
establishments (1) --> (N) purchases
charities (1) --> (N) establishments
```

### **Funções PostgreSQL**

- `hash_password(password)` - Gera hash bcrypt
- `verify_password(password, hash)` - Verifica senha contra hash
- `authenticate_user(email, password)` - Autenticação com dual auth
- `migrate_user_password(user_id, password)` - Migração on-the-fly de senhas
- `create_next_rounds()` - Cria próximas rodadas automaticamente
- `update_updated_at_column()` - Trigger para atualizar timestamps

### **Row Level Security (RLS)**

Todas as tabelas possuem RLS habilitado com policies específicas por role:
- `anon` - Acesso público limitado
- `authenticated` - Usuários autenticados
- `service_role` - Acesso total (backend/migrations)

---

## 🚩 **Feature Flags**

Sistema de feature flags para rollout gradual de funcionalidades:

| Flag | Descrição | Status Atual |
|------|-----------|--------------|
| `use_bcrypt_auth` | Usar bcrypt para autenticação de senhas | ❌ Desabilitado |
| `use_signed_jwt` | Usar JWT assinado com jose library | ❌ Desabilitado |
| `use_asaas_pix` | Usar Asaas para gerar PIX real | ❌ Desabilitado |
| `auto_generate_cards` | Gerar cartelas automaticamente após pagamento | ❌ Desabilitado |
| `use_webhook_payment` | Usar webhook ao invés de polling | ❌ Desabilitado |
| `use_realtime_updates` | Usar Supabase Realtime para updates | ❌ Desabilitado |

### **Como Habilitar/Desabilitar**

```sql
-- Habilitar feature flag
UPDATE feature_flags SET enabled = true WHERE key = 'use_bcrypt_auth';

-- Desabilitar feature flag
UPDATE feature_flags SET enabled = false WHERE key = 'use_bcrypt_auth';

-- Verificar status
SELECT key, enabled, description FROM feature_flags ORDER BY key;
```

### **Uso no Frontend**

```typescript
import { featureFlagService } from '@/services/featureFlagService';

// Verificar se feature está habilitada
const isEnabled = await featureFlagService.isEnabled('use_bcrypt_auth');

if (isEnabled) {
  // Lógica nova
} else {
  // Lógica antiga (fallback)
}
```

---

## 🔒 **Segurança e Autenticação**

### **Sistema de Dual Authentication**

Implementado sistema gradual de migração de senhas:

1. **Sistema Antigo** (deprecated)
   - Qualquer senha é aceita (sem validação)
   - Usado para compatibilidade durante migração

2. **Sistema Novo** (bcrypt)
   - Hash bcrypt com 10 rounds
   - Migração on-the-fly durante login
   - Validação robusta de senhas

### **Fluxo de Autenticação**

```
Login → authenticate_user(email, password)
  ↓
Buscar usuário no banco
  ↓
Feature flag 'use_bcrypt_auth' habilitada?
  ├─ SIM → Usuário já migrado?
  │   ├─ SIM → Verificar senha com bcrypt
  │   └─ NÃO → Aceitar qualquer senha + Migrar on-the-fly
  └─ NÃO → Aceitar qualquer senha (sistema antigo)
```

### **Senhas Conhecidas (Migradas)**

| Email | Senha | Migrado |
|-------|-------|---------|
| admin@sortebem.com.br | Admin@2025 | ✅ Sim |
| gerente@sortebem.com.br | Gerente@2025 | ✅ Sim |
| estabelecimento@sortebem.com.br | Estabelecimento@2025 | ✅ Sim |

### **Roles e Permissões**

- `admin` - Acesso total ao sistema
- `manager` - Gerenciamento de estabelecimentos
- `establishment` - Operação de ponto de venda
- `user` - Cliente final (comprador)

---

## 💻 **Como Desenvolver**

### **Pré-requisitos**

- Node.js 18+ ([instalar com nvm](https://github.com/nvm-sh/nvm))
- npm 9+
- Git

### **Setup Inicial**

```bash
# 1. Clonar repositório
git clone https://github.com/gabrielduffy/sortebem.git
cd sortebem

# 2. Instalar dependências
npm install

# 3. Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas credenciais

# 4. Executar migrations (ver seção Migrations)
npm run migrate

# 5. Iniciar servidor de desenvolvimento
npm run dev
```

### **Scripts Disponíveis**

```bash
npm run dev          # Iniciar dev server (porta 5173)
npm run build        # Build para produção
npm run build:dev    # Build em modo desenvolvimento
npm run lint         # Executar linter
npm run preview      # Preview do build
npm run migrate      # Executar migrations SQL
```

### **Variáveis de Ambiente**

Criar arquivo `.env` na raiz:

```env
# Supabase
VITE_SUPABASE_URL=https://ctjdbnvcqcyitpydnmdt.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui

# Database (para migrations)
SUPABASE_DB_PASSWORD=sua-senha-do-banco-aqui

# Asaas (produção)
VITE_ASAAS_API_KEY=sua-chave-asaas-aqui
VITE_ASAAS_ENVIRONMENT=sandbox # ou production

# PagSeguro (fallback)
VITE_PAGSEGURO_TOKEN=seu-token-pagseguro-aqui
```

---

## 🔄 **Migrations**

### **Executar Migrations Localmente**

```bash
# 1. Configurar senha do banco
export SUPABASE_DB_PASSWORD="sua-senha-aqui"

# 2. Executar migrations
npm run migrate
```

### **Executar Migrations via GitHub Actions**

1. Acessar: **Settings** → **Secrets and variables** → **Actions**
2. Criar secret: `SUPABASE_DB_PASSWORD`
3. Ir em: **Actions** → **Run Supabase Migrations**
4. Clicar: **Run workflow**
5. Digitar: `migrate` para confirmar
6. Clicar: **Run workflow**

### **Criar Nova Migration**

```bash
# 1. Criar arquivo numerado
touch supabase/migrations/003_minha_migration.sql

# 2. Escrever SQL
-- =====================================================
-- DESCRIÇÃO DA MIGRATION
-- =====================================================

CREATE TABLE IF NOT EXISTS minha_tabela (
  id BIGSERIAL PRIMARY KEY,
  ...
);

-- Registrar migration
INSERT INTO schema_migrations (version, description) VALUES
  (10, 'Minha migration criada')
ON CONFLICT (version) DO NOTHING;

# 3. Executar
npm run migrate
```

### **Rollback de Migration**

Migrations não possuem rollback automático. Para reverter:

1. Criar nova migration de rollback
2. Ou executar SQL manual para reverter mudanças

---

## 🚀 **Deploy**

### **Deploy Automático (Lovable)**

1. Acessar: https://lovable.dev/projects/sortebem
2. Clicar: **Share** → **Publish**
3. Deploy automático em produção

### **Deploy Manual**

```bash
# 1. Build para produção
npm run build

# 2. Preview do build
npm run preview

# 3. Deploy via hosting de sua escolha
# (Vercel, Netlify, Cloudflare Pages, etc)
```

### **Checklist de Deploy**

- [ ] Migrations executadas em produção
- [ ] Feature flags configuradas
- [ ] Variáveis de ambiente configuradas
- [ ] Credenciais Asaas/PagSeguro válidas
- [ ] Teste de login funcionando
- [ ] Teste de compra funcionando
- [ ] Teste de sorteio funcionando
- [ ] TV Mode funcionando

---

## 🔌 **APIs e Integrações**

### **Supabase**

```typescript
import { supabase } from '@/lib/supabase';

// Query básica
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('email', 'user@example.com')
  .single();

// Insert
const { data, error } = await supabase
  .from('purchases')
  .insert({ user_id: 1, amount: 10.00 });

// Update
const { data, error } = await supabase
  .from('users')
  .update({ name: 'Novo Nome' })
  .eq('id', 1);

// RPC (função PostgreSQL)
const { data, error } = await supabase
  .rpc('authenticate_user', {
    p_email: 'user@example.com',
    p_password: 'senha123'
  });
```

### **Asaas (Pagamentos PIX)**

```typescript
import { apiService } from '@/services/api';

// Gerar PIX
const response = await apiService.generatePix({
  purchaseId: 123,
  amount: 50.00,
  customerName: 'João Silva',
  customerDocument: '12345678900'
});

// Retorna:
// {
//   ok: true,
//   data: {
//     pixKey: 'chave-pix-aqui',
//     qrCode: 'base64-qrcode',
//     expiresAt: '2025-01-01T12:00:00Z'
//   }
// }
```

### **WhatsApp Business API**

```typescript
// TODO: Implementar em FASE 3
// Enviar notificação de compra aprovada
// Enviar notificação de sorteio
// Enviar notificação de prêmio ganho
```

---

## 📝 **Fases de Implementação**

### **✅ FASE 1: Preparação e Infraestrutura** (Concluída)
- [x] Tabela `feature_flags`
- [x] Tabela `schema_migrations`
- [x] Popular `settings` com valores padrão
- [x] RLS policies configuradas

### **✅ FASE 2: Segurança** (Concluída)
- [x] Extension `pgcrypto` habilitada
- [x] Funções `hash_password()` e `verify_password()`
- [x] Dual authentication implementado
- [x] Migração on-the-fly de senhas
- [x] Serviço `authService.ts`
- [x] Serviço `featureFlagService.ts`

### **🔄 FASE 3: Pagamentos** (Em Planejamento)
- [ ] Integração Asaas completa
- [ ] Geração de PIX real
- [ ] Webhook de confirmação
- [ ] Notificação via WhatsApp
- [ ] Dashboard de pagamentos

### **🔄 FASE 4: Geração Automática de Cartelas** (Em Planejamento)
- [ ] Geração após confirmação de pagamento
- [ ] Validação de duplicatas
- [ ] Distribuição de números balanceada
- [ ] Envio automático via WhatsApp

### **🔄 FASE 5: Otimizações** (Em Planejamento)
- [ ] Índices otimizados
- [ ] Cache de queries
- [ ] Realtime updates
- [ ] Performance improvements

---

## 📊 **Estrutura de Dados**

### **Settings (Configurações)**

```json
{
  "card_price_regular": { "price": 5.00 },
  "card_price_special": { "price": 10.00 },
  "regular_prize": { "amount": 150 },
  "special_prize": { "amount": 5000 },
  "accumulated_prize": { "amount": 12500 },
  "max_cards_per_purchase": { "max": 100 },
  "asaas_config": {
    "api_key": "...",
    "environment": "sandbox",
    "enabled": false
  }
}
```

### **Cartela de Bingo**

```typescript
interface Card {
  id: number;
  purchase_id: number;
  round_id: number;
  card_number: string;      // Ex: "001234"
  numbers: number[];         // Ex: [5, 12, 23, 34, 45, ...]
  is_special: boolean;
  is_winner: boolean;
  created_at: string;
}
```

### **Rodada**

```typescript
interface Round {
  id: number;
  round_number: number;      // Ex: 123
  round_type: 'regular' | 'special';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  draw_date: string;
  prize_amount: number;
  cards_sold: number;
  charity_id?: number;
  created_at: string;
}
```

---

## 🤝 **Contribuindo**

1. Fork o projeto
2. Criar branch de feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'feat: adicionar MinhaFeature'`)
4. Push para o branch (`git push origin feature/MinhaFeature`)
5. Abrir Pull Request

---

## 📄 **Licença**

Propriedade privada de SORTEBEM. Todos os direitos reservados.

---

## 📞 **Suporte**

- **Email**: suporte@sortebem.com.br
- **Supabase Dashboard**: https://app.supabase.com/project/ctjdbnvcqcyitpydnmdt
- **GitHub Issues**: https://github.com/gabrielduffy/sortebem/issues

---

**Última atualização**: 31/12/2024
**Versão**: 1.0.0
