// Asaas Payment Service
// Integração com API Asaas para geração de PIX e cobranças
import { supabase } from '../lib/supabase';
import { featureFlagService } from './featureFlagService';

interface AsaasConfig {
  apiKey: string;
  environment: 'sandbox' | 'production';
  enabled: boolean;
}

interface AsaasCustomer {
  name: string;
  cpfCnpj: string;
  email?: string;
  phone?: string;
  mobilePhone?: string;
}

interface AsaasCharge {
  customer: string; // Customer ID
  billingType: 'PIX' | 'BOLETO' | 'CREDIT_CARD';
  value: number;
  dueDate: string; // YYYY-MM-DD
  description?: string;
  externalReference?: string; // Nossa purchase_id
}

interface AsaasPixResponse {
  success: boolean;
  encodedImage?: string; // Base64 QR Code image
  payload?: string; // PIX copia e cola
  expirationDate?: string;
  error?: string;
}

class AsaasService {
  private baseUrl = 'https://api.asaas.com/v3';
  private sandboxUrl = 'https://sandbox.asaas.com/api/v3';

  /**
   * Obter configuração Asaas do banco
   */
  private async getConfig(): Promise<AsaasConfig | null> {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'asaas_config')
        .single();

      if (error || !data) {
        console.warn('Asaas config not found in settings');
        return null;
      }

      return data.value as AsaasConfig;
    } catch (error) {
      console.error('Error fetching Asaas config:', error);
      return null;
    }
  }

  /**
   * Obter URL base (sandbox ou produção)
   */
  private async getApiUrl(): Promise<string> {
    const config = await this.getConfig();
    return config?.environment === 'production' ? this.baseUrl : this.sandboxUrl;
  }

  /**
   * Fazer requisição para API Asaas
   */
  private async request(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: any
  ): Promise<any> {
    const config = await this.getConfig();

    if (!config || !config.apiKey) {
      throw new Error('Asaas API key not configured');
    }

    const url = `${await this.getApiUrl()}${endpoint}`;

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'access_token': config.apiKey,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Asaas API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Criar ou obter cliente Asaas
   */
  async getOrCreateCustomer(customer: AsaasCustomer): Promise<string> {
    try {
      // Tentar buscar cliente existente pelo CPF
      const existingCustomers = await this.request(
        `/customers?cpfCnpj=${customer.cpfCnpj}`,
        'GET'
      );

      if (existingCustomers.data && existingCustomers.data.length > 0) {
        return existingCustomers.data[0].id;
      }

      // Criar novo cliente
      const newCustomer = await this.request('/customers', 'POST', customer);
      return newCustomer.id;
    } catch (error: any) {
      throw new Error(`Failed to get/create customer: ${error.message}`);
    }
  }

  /**
   * Criar cobrança PIX
   */
  async createPixCharge(charge: AsaasCharge): Promise<any> {
    try {
      const response = await this.request('/payments', 'POST', charge);
      return response;
    } catch (error: any) {
      throw new Error(`Failed to create charge: ${error.message}`);
    }
  }

  /**
   * Obter QR Code PIX de uma cobrança
   */
  async getPixQrCode(chargeId: string): Promise<AsaasPixResponse> {
    try {
      const response = await this.request(`/payments/${chargeId}/pixQrCode`, 'GET');

      return {
        success: true,
        encodedImage: response.encodedImage,
        payload: response.payload,
        expirationDate: response.expirationDate,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Gerar PIX para uma purchase
   * Fluxo completo: criar cliente + criar cobrança + obter QR Code
   */
  async generatePixForPurchase(params: {
    purchaseId: number;
    amount: number;
    customerName: string;
    customerCpf: string;
    customerEmail?: string;
    customerPhone?: string;
    dueDate?: string;
  }): Promise<AsaasPixResponse & { chargeId?: string }> {
    try {
      // 1. Criar ou obter cliente
      const customerId = await this.getOrCreateCustomer({
        name: params.customerName,
        cpfCnpj: params.customerCpf,
        email: params.customerEmail,
        mobilePhone: params.customerPhone,
      });

      // 2. Criar cobrança PIX
      const charge = await this.createPixCharge({
        customer: customerId,
        billingType: 'PIX',
        value: params.amount,
        dueDate: params.dueDate || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: `SORTEBEM - Cartelas de Bingo`,
        externalReference: params.purchaseId.toString(),
      });

      // 3. Obter QR Code PIX
      const pixData = await this.getPixQrCode(charge.id);

      // 4. Salvar informações no banco
      await supabase.from('purchases').update({
        asaas_charge_id: charge.id,
        asaas_customer_id: customerId,
        pix_qr_code: pixData.payload,
        pix_expiration: pixData.expirationDate,
      }).eq('id', params.purchaseId);

      return {
        ...pixData,
        chargeId: charge.id,
      };
    } catch (error: any) {
      console.error('Error generating PIX:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Verificar status de pagamento
   */
  async checkPaymentStatus(chargeId: string): Promise<{
    status: 'PENDING' | 'RECEIVED' | 'CONFIRMED' | 'OVERDUE' | 'REFUNDED' | 'RECEIVED_IN_CASH' | 'REFUND_REQUESTED' | 'CHARGEBACK_REQUESTED' | 'CHARGEBACK_DISPUTE' | 'AWAITING_CHARGEBACK_REVERSAL' | 'DUNNING_REQUESTED' | 'DUNNING_RECEIVED' | 'AWAITING_RISK_ANALYSIS';
    value?: number;
    netValue?: number;
    paymentDate?: string;
  }> {
    try {
      const payment = await this.request(`/payments/${chargeId}`, 'GET');

      return {
        status: payment.status,
        value: payment.value,
        netValue: payment.netValue,
        paymentDate: payment.paymentDate,
      };
    } catch (error: any) {
      throw new Error(`Failed to check payment status: ${error.message}`);
    }
  }

  /**
   * Processar webhook do Asaas
   * Deve ser chamado quando receber POST em /api/webhooks/asaas
   */
  async processWebhook(webhookData: any): Promise<boolean> {
    try {
      const { event, payment } = webhookData;

      // Registrar webhook no banco
      await supabase.from('payment_webhooks').insert({
        provider: 'asaas',
        event_type: event,
        payload: webhookData,
        processed: false,
      });

      // Se for confirmação de pagamento
      if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
        const externalReference = payment.externalReference;

        if (!externalReference) {
          console.warn('Webhook sem externalReference (purchase_id)');
          return false;
        }

        // Atualizar purchase como paga
        const { error } = await supabase
          .from('purchases')
          .update({
            status: 'confirmed',
            paid_at: new Date().toISOString(),
            payment_confirmed: true,
          })
          .eq('id', parseInt(externalReference));

        if (error) {
          console.error('Error updating purchase:', error);
          return false;
        }

        // Verificar feature flag de geração automática
        const autoGenerate = await featureFlagService.isEnabled('auto_generate_cards');

        if (autoGenerate) {
          // TODO: Chamar serviço de geração automática de cartelas
          console.log('🎫 Auto-generating cards for purchase:', externalReference);
        }

        return true;
      }

      return true;
    } catch (error: any) {
      console.error('Error processing webhook:', error);
      return false;
    }
  }

  /**
   * SUBCONTAS E KYC
   */

  /**
   * Criar subconta Asaas para estabelecimento ou gerente
   */
  async createSubAccount(params: {
    name: string;
    cpfCnpj: string;
    email: string;
    phone?: string;
    address?: {
      street: string;
      number: string;
      complement?: string;
      province: string;
      city: string;
      state: string;
      postalCode: string;
    };
    birthDate?: string; // YYYY-MM-DD (apenas para CPF)
    companyType?: 'MEI' | 'LIMITED' | 'INDIVIDUAL' | 'ASSOCIATION'; // Para CNPJ
  }): Promise<{ success: boolean; accountId?: string; walletId?: string; error?: string }> {
    try {
      const response = await this.request('/accounts', 'POST', params);

      return {
        success: true,
        accountId: response.id,
        walletId: response.walletId,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Obter status de KYC de uma subconta
   */
  async getAccountKycStatus(accountId: string): Promise<{
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'AWAITING_DOCUMENT';
    documentsNeeded?: string[];
  }> {
    try {
      const response = await this.request(`/accounts/${accountId}`, 'GET');

      return {
        status: response.status,
        documentsNeeded: response.documentsNeeded,
      };
    } catch (error: any) {
      throw new Error(`Failed to get KYC status: ${error.message}`);
    }
  }

  /**
   * SPLITS DE PAGAMENTO
   */

  /**
   * Criar cobrança PIX com split
   */
  async createPixChargeWithSplit(params: {
    customer: string;
    value: number;
    dueDate: string;
    description?: string;
    externalReference?: string;
    splits: Array<{
      walletId: string; // ID da carteira que vai receber
      percentualValue?: number; // Percentual (0-100)
      fixedValue?: number; // Valor fixo
    }>;
  }): Promise<any> {
    try {
      const chargeData: any = {
        customer: params.customer,
        billingType: 'PIX',
        value: params.value,
        dueDate: params.dueDate,
        description: params.description,
        externalReference: params.externalReference,
      };

      // Adicionar splits se fornecidos
      if (params.splits && params.splits.length > 0) {
        chargeData.split = params.splits.map(split => ({
          walletId: split.walletId,
          percentualValue: split.percentualValue,
          fixedValue: split.fixedValue,
        }));
      }

      const response = await this.request('/payments', 'POST', chargeData);
      return response;
    } catch (error: any) {
      throw new Error(`Failed to create split charge: ${error.message}`);
    }
  }

  /**
   * TRANSFERÊNCIAS (SAQUES)
   */

  /**
   * Criar transferência via PIX
   */
  async createPixTransfer(params: {
    value: number;
    pixAddressKey: string; // Chave PIX do destinatário
    description?: string;
    scheduleDate?: string; // YYYY-MM-DD (opcional, para agendar)
  }): Promise<{
    success: boolean;
    transferId?: string;
    status?: string;
    error?: string;
  }> {
    try {
      const response = await this.request('/transfers', 'POST', {
        value: params.value,
        pixAddressKey: params.pixAddressKey,
        description: params.description,
        scheduleDate: params.scheduleDate,
      });

      return {
        success: true,
        transferId: response.id,
        status: response.status,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Verificar status de transferência
   */
  async getTransferStatus(transferId: string): Promise<{
    status: 'PENDING' | 'BANK_PROCESSING' | 'DONE' | 'CANCELLED' | 'FAILED';
    value?: number;
    effectiveDate?: string;
    error?: string;
  }> {
    try {
      const response = await this.request(`/transfers/${transferId}`, 'GET');

      return {
        status: response.status,
        value: response.value,
        effectiveDate: response.effectiveDate,
      };
    } catch (error: any) {
      throw new Error(`Failed to get transfer status: ${error.message}`);
    }
  }

  /**
   * SAQUE AUTOMÁTICO PARA VENCEDOR
   */

  /**
   * Processar saque automático de prêmio
   */
  async processWinnerWithdrawal(params: {
    winnerId: number;
    amount: number;
    pixKey: string;
    winnerName: string;
  }): Promise<{
    success: boolean;
    transferId?: string;
    error?: string;
  }> {
    try {
      // Criar transferência
      const transferResult = await this.createPixTransfer({
        value: params.amount,
        pixAddressKey: params.pixKey,
        description: `Prêmio SorteBem - Vencedor #${params.winnerId}`,
      });

      if (!transferResult.success) {
        // Registrar erro no banco
        await supabase
          .from('winners')
          .update({
            auto_withdrawal_attempted: true,
            withdrawal_error: transferResult.error,
          })
          .eq('id', params.winnerId);

        return {
          success: false,
          error: transferResult.error,
        };
      }

      // Atualizar winner com ID da transferência
      await supabase
        .from('winners')
        .update({
          asaas_transfer_id: transferResult.transferId,
          status: 'processing',
          auto_withdrawal_attempted: true,
        })
        .eq('id', params.winnerId);

      return {
        success: true,
        transferId: transferResult.transferId,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * SALDO E EXTRATO
   */

  /**
   * Consultar saldo da conta
   */
  async getBalance(): Promise<{ balance: number }> {
    try {
      const response = await this.request('/finance/balance', 'GET');
      return {
        balance: response.balance,
      };
    } catch (error: any) {
      throw new Error(`Failed to get balance: ${error.message}`);
    }
  }
}

export const asaasService = new AsaasService();
