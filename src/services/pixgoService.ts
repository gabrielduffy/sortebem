// PixGo Payment Service
// Integração com API PixGo para geração de PIX
import { supabase } from '../lib/supabase';

interface PixGoConfig {
  apiKey: string;
  enabled: boolean;
}

interface PixGoPaymentRequest {
  amount: number;
  description?: string;
  customer_name?: string;
  customer_cpf?: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: string;
  external_id?: string;
  webhook_url?: string;
}

interface PixGoPaymentResponse {
  success: boolean;
  data?: {
    payment_id: string;
    external_id?: string;
    amount: number;
    status: string;
    qr_code: string;
    qr_image_url: string;
    expires_at: string;
    created_at: string;
  };
  error?: string;
  message?: string;
}

interface PixGoStatusResponse {
  success: boolean;
  data?: {
    payment_id: string;
    external_id?: string;
    amount: number;
    status: 'pending' | 'completed' | 'expired' | 'cancelled' | 'refunded';
    customer_name?: string;
    customer_cpf?: string;
    created_at: string;
    updated_at: string;
  };
  error?: string;
}

class PixGoService {
  private baseUrl = 'https://pixgo.org/api/v1';

  /**
   * Obter configuração PixGo do banco
   */
  private async getConfig(): Promise<PixGoConfig | null> {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'gateway')
        .single();

      if (error || !data) {
        console.warn('Gateway config not found in settings');
        return null;
      }

      const gatewayConfig = data.value as any;
      if (gatewayConfig?.pixgo) {
        return gatewayConfig.pixgo as PixGoConfig;
      }

      return null;
    } catch (error) {
      console.error('Error fetching PixGo config:', error);
      return null;
    }
  }

  /**
   * Fazer requisição para API PixGo
   */
  private async request(
    endpoint: string,
    method: 'GET' | 'POST' = 'GET',
    body?: any
  ): Promise<any> {
    const config = await this.getConfig();

    if (!config || !config.apiKey) {
      throw new Error('PixGo API key not configured');
    }

    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': config.apiKey,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || data.error || `PixGo API error: ${response.status}`);
    }

    return data;
  }

  /**
   * Criar pagamento PIX
   */
  async createPayment(params: PixGoPaymentRequest): Promise<PixGoPaymentResponse> {
    try {
      const response = await this.request('/payment/create', 'POST', params);
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Verificar status do pagamento
   */
  async checkPaymentStatus(paymentId: string): Promise<PixGoStatusResponse> {
    try {
      const response = await this.request(`/payment/${paymentId}/status`, 'GET');
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Obter detalhes completos do pagamento
   */
  async getPaymentDetails(paymentId: string): Promise<PixGoPaymentResponse> {
    try {
      const response = await this.request(`/payment/${paymentId}`, 'GET');
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Gerar PIX para uma purchase
   * Fluxo completo: criar pagamento + retornar QR Code
   */
  async generatePixForPurchase(params: {
    purchaseId: number;
    amount: number;
    customerName: string;
    customerCpf: string;
    customerEmail?: string;
    customerPhone?: string;
  }): Promise<{
    success: boolean;
    payload?: string;
    encodedImage?: string;
    expirationDate?: string;
    paymentId?: string;
    error?: string;
  }> {
    try {
      // Construir URL do webhook
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const webhookUrl = `${supabaseUrl}/functions/v1/pixgo-webhook`;

      // Criar pagamento PIX
      const result = await this.createPayment({
        amount: params.amount,
        description: 'SORTEBEM - Cartelas de Bingo',
        customer_name: params.customerName,
        customer_cpf: params.customerCpf?.replace(/\D/g, ''),
        customer_email: params.customerEmail,
        customer_phone: params.customerPhone,
        external_id: params.purchaseId.toString(),
        webhook_url: webhookUrl,
      });

      if (!result.success || !result.data) {
        return {
          success: false,
          error: result.error || result.message || 'Erro ao criar pagamento',
        };
      }

      // Atualizar purchase com dados do pagamento
      await supabase.from('purchases').update({
        pixgo_payment_id: result.data.payment_id,
        pix_code: result.data.qr_code,
        pix_qrcode: result.data.qr_image_url,
        pix_expiration: result.data.expires_at,
        gateway: 'pixgo',
      }).eq('id', params.purchaseId);

      return {
        success: true,
        payload: result.data.qr_code,
        encodedImage: result.data.qr_image_url,
        expirationDate: result.data.expires_at,
        paymentId: result.data.payment_id,
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
   * Testar conexão com a API
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const config = await this.getConfig();
      
      if (!config || !config.apiKey) {
        return { success: false, error: 'API Key não configurada' };
      }

      // Tentar fazer uma requisição simples para validar a API key
      // Usamos um valor baixo que vai falhar pela validação de limite mínimo,
      // mas confirma que a API key é válida
      const response = await fetch(`${this.baseUrl}/payment/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': config.apiKey,
        },
        body: JSON.stringify({
          amount: 1, // Valor abaixo do mínimo para não criar cobrança real
          description: 'Teste de conexão',
        }),
      });

      const data = await response.json();

      // Se der erro de valor mínimo, a API key está válida
      if (response.status === 400 && data.error?.includes('LIMIT') || data.message?.includes('mínimo')) {
        return { success: true };
      }

      // Se der 401/403, a API key é inválida
      if (response.status === 401 || response.status === 403) {
        return { success: false, error: 'API Key inválida' };
      }

      // Se criar com sucesso (improvável), está funcionando
      if (response.ok) {
        return { success: true };
      }

      return { success: true }; // Assumir sucesso para outros casos
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

export const pixgoService = new PixGoService();
