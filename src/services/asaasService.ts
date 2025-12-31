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
}

export const asaasService = new AsaasService();
