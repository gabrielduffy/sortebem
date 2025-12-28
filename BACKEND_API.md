# SORTEBEM - Documentação da API Backend

## URL Base
https://api.sortebem.com.br

## Padrão de Resposta
Todas as respostas seguem o formato:
```json
{
  "ok": true,
  "data": { ... }
}
```
Ou em caso de erro:
```json
{
  "ok": false,
  "error": "Mensagem de erro"
}
```

## Autenticação
Header: `Authorization: Bearer <token>`
Token obtido via POST /auth/login

---

## ENDPOINTS PRINCIPAIS

### Autenticação
- POST /auth/login - { email, password } → { token, user }
- POST /auth/register - { name, email, whatsapp, password } → { token, user }

### Gerentes (/managers)
- GET /managers - Lista gerentes (Admin)
- POST /managers - Cria gerente (Admin)
  Body: { name, email, whatsapp, password, cpf, commission_rate }
- PUT /managers/:id/kyc - Atualiza KYC { kyc_status: 'approved'|'rejected' }

### Estabelecimentos (/establishments)
- GET /establishments - Lista estabelecimentos (Admin)
- POST /establishments - Cria estabelecimento (Admin)
  Body: { name, email, whatsapp, password, establishment_name, cnpj, phone, address, city, state, manager_id }

### Instituições (/charities)
- GET /charities - Lista instituições (Admin)
- GET /charities/active - Instituição ativa do mês (Público)
- POST /charities - Cria instituição (Admin)
  Body: { name, description, logo_url, pix_key }
- POST /charities/:id/activate - Ativa para o mês { month, year }

### Rodadas (/rounds)
- GET /rounds - Lista rodadas ativas
- GET /rounds/current - Rodada atual em venda
- GET /rounds/live - Rodada em sorteio
- GET /rounds/:id/numbers - Números sorteados
- POST /rounds - Cria rodada (Admin) { type: 'regular'|'special' }

### Compras (/purchases)
- POST /purchases - Cria compra
  Body PIX: { round_id, quantity, payment_method: 'pix', customer: { name, email, phone, cpf } }
  Body Cartão: { round_id, quantity, payment_method: 'credit_card', card_token, installments, customer, card_holder }
- GET /purchases/:id/status - Verifica status
- GET /purchases/:id/cards - Lista cartelas (após pago)

### Cartelas (/cards)
- GET /cards/:code - Busca cartela por código

### Configurações (/settings)
- GET /settings - Todas as configurações (Admin)
- GET /settings/public - Configurações públicas
- PUT /settings/:key - Atualiza configuração { value: ... }

### Estatísticas (/stats)
- GET /stats/admin - Estatísticas gerais (Admin)
- GET /stats/tv - Dados para modo TV (Público)

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
