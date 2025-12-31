# SORTEBEM - Documentação da Arquitetura

## ⚠️ IMPORTANTE - Arquitetura Atual

**O backend agora funciona 100% através do Supabase. Não há mais API separada em api.sortebem.com.br**

- **Banco de Dados**: Supabase (PostgreSQL)
- **Client**: Supabase JS Client (usado diretamente no frontend)
- **Autenticação**: JWT simples armazenado no localStorage
- **Webhooks**: Supabase Edge Functions (se configurados)

---

## Estrutura de Dados e Serviços

Toda a comunicação com o banco de dados é feita através do `ApiService` (`src/services/api.ts`) que utiliza o cliente Supabase diretamente.

### Padrão de Resposta
Todas as funções do ApiService retornam:
```typescript
interface ApiResponse {
  ok: boolean;
  data?: any;
  error?: string;
  message?: string;
}
```

---

## Funcionalidades Principais (via Supabase)

### Autenticação
- `apiService.login(email, password)` - Login com email/senha
- `apiService.loginWhatsApp(whatsapp, password)` - Login com WhatsApp
- Tokens JWT são armazenados no localStorage

### Gerentes
- `apiService.getManagers()` - Lista gerentes (Admin)
- `apiService.createManager(data)` - Cria gerente (Admin)
- `apiService.updateManagerKyc(id, kyc_status)` - Atualiza KYC

### Estabelecimentos
- `apiService.getEstablishments()` - Lista estabelecimentos (Admin)
- `apiService.createEstablishment(data)` - Cria estabelecimento (Admin)
- `apiService.getEstablishmentByCode(code)` - Busca por código

### Instituições (Charities)
- `apiService.getCharities()` - Lista instituições
- `apiService.getActiveCharity()` - Instituição ativa do mês
- `apiService.createCharity(data)` - Cria instituição (Admin)
- `apiService.activateCharity(id, month, year)` - Ativa para mês/ano

### Rodadas (Rounds)
- `apiService.getRounds()` - Lista rodadas em venda
- `apiService.getLiveRound()` - Rodada atual em sorteio
- `apiService.getRound(id)` - Busca rodada por ID
- `apiService.getDrawnNumbers(roundId)` - Números sorteados
- `apiService.createRound(type)` - Cria rodada (Admin)

### Compras (Purchases)
- `apiService.createPurchase(data)` - Cria compra
- `apiService.checkPurchaseStatus(purchaseId)` - Verifica status
- `apiService.getPurchaseCards(purchaseId)` - Lista cartelas da compra

### Cartelas (Cards)
- `apiService.getCardByCode(code)` - Busca cartela por código

### Configurações (Settings)
- `apiService.getSettings()` - Todas as configurações (Admin)
- `apiService.getPublicSettings()` - Configurações públicas
- `apiService.updateSetting(key, value)` - Atualiza configuração

### Estatísticas
- `apiService.getAdminStats()` - Estatísticas gerais (Admin)
- `apiService.getTVData(slug)` - Dados para modo TV

---

## Webhooks

Os webhooks de pagamento usam URLs personalizadas com o domínio sortebem.com.br:

- **Webhook Asaas**: `https://sortebem.com.br/api/webhook/asaas`
- **Webhook PagSeguro**: `https://sortebem.com.br/api/webhook/pagseguro`

### Configuração de Proxy

Essas URLs fazem proxy para as Supabase Edge Functions. É necessário configurar no Nginx/servidor:

```nginx
# Exemplo de configuração Nginx
location /api/webhook/asaas {
    proxy_pass https://ctjdbnvcqcyitpydnmdt.supabase.co/functions/v1/webhook-asaas;
    proxy_set_header Host ctjdbnvcqcyitpydnmdt.supabase.co;
    proxy_set_header Authorization "Bearer YOUR_SUPABASE_ANON_KEY";
}

location /api/webhook/pagseguro {
    proxy_pass https://ctjdbnvcqcyitpydnmdt.supabase.co/functions/v1/webhook-pagseguro;
    proxy_set_header Host ctjdbnvcqcyitpydnmdt.supabase.co;
    proxy_set_header Authorization "Bearer YOUR_SUPABASE_ANON_KEY";
}
```

**Nota**: Verifique no painel do Supabase se essas Edge Functions estão configuradas. Caso contrário, os webhooks precisam ser implementados.

---

## ESTRUTURA DO BANCO

### users
id, name, email, whatsapp, phone, cpf, password_hash, role, is_active, created_at

### managers
id, user_id, code, cpf, commission_rate, kyc_status, balance, total_commission, is_active, created_at

### establishments
id, user_id, manager_id, name, cnpj, phone, address, city, state, code, slug, commission_rate, balance, total_sales, kyc_status, is_active, created_at

### charities
id, name, description, logo_url, pix_key, website, instagram, is_active, total_received, created_at

### rounds
id, number, type, status, card_price, max_cards, cards_sold, prize_pool, charity_amount, platform_amount, commission_amount, drawn_numbers, starts_at, ends_at, selling_ends_at, is_selling, drawing_started_at, finished_at, created_at

### purchases
id, round_id, user_id, establishment_id, quantity, unit_price, total_amount, payment_method, payment_status, transaction_code, gateway, pix_code, pix_qrcode, customer_name, customer_email, customer_phone, customer_cpf, paid_at, created_at

### cards
id, code, round_id, purchase_id, numbers, status, is_winner, created_at

---

## NOTAS IMPORTANTES

1. SEMPRE usar response.data para acessar os dados
2. Campos podem vir vazios - usar fallback: manager.name || 'Sem nome'
3. LEFT JOIN é usado em todas as queries - dados relacionados podem ser null
4. Status de rodada: scheduled → selling → drawing → finished
5. Status de pagamento: pending → paid | expired | cancelled | refunded
