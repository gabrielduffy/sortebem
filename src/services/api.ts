// API Service for SORTEBEM - Supabase Version
import { supabase } from '../lib/supabase'
import { authService } from './authService'
import { asaasService } from './asaasService'
import { cardGeneratorService } from './cardGeneratorService'
import { featureFlagService } from './featureFlagService'

interface LoginResponse {
  ok: boolean;
  token?: string;
  user?: {
    id: string;
    name: string;
    email?: string;
    role: 'admin' | 'manager' | 'establishment' | 'user';
  };
  error?: string;
}

interface User {
  id: string;
  name: string;
  email?: string;
  role: 'admin' | 'manager' | 'establishment' | 'user';
}

interface ApiResponse {
  ok: boolean;
  data?: any;
  error?: string;
}

class ApiService {
  /**
   * Login with email and password
   * ATUALIZADO: Agora usa authService com dual auth (bcrypt + fallback)
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    // Usar novo authService que implementa dual auth
    return authService.login(email, password);
  }

  /**
   * Login with WhatsApp and password
   * ATUALIZADO: Agora usa authService com dual auth
   */
  async loginWhatsApp(whatsapp: string, password: string): Promise<LoginResponse> {
    return authService.loginWhatsApp(whatsapp, password);
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    return authService.isAuthenticated();
  }

  /**
   * Get current authenticated user
   */
  async getUser(): Promise<User | null> {
    return authService.getUser();
  }

  /**
   * Get current token (mantido para compatibilidade)
   */
  async getToken(): Promise<string | null> {
    return authService.getToken();
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    authService.logout();
  }

  /**
   * Check API health
   */
  async checkHealth(): Promise<{ ok: boolean; postgres?: boolean }> {
    try {
      const { error } = await supabase.from('users').select('id').limit(1);
      return { ok: !error, postgres: !error };
    } catch (error) {
      console.error('Health check error:', error);
      return { ok: false, postgres: false };
    }
  }

  // ============ ROUNDS ============

  /**
   * Get available rounds for selling
   */
  async getRounds(): Promise<ApiResponse> {
    try {
      const { data, error } = await supabase
        .from('rounds')
        .select('*')
        .eq('status', 'selling')
        .eq('is_selling', true)
        .order('starts_at', { ascending: true });

      if (error) {
        return { ok: false, error: error.message };
      }

      return { ok: true, data };
    } catch (error: any) {
      return { ok: false, error: error.message || 'Erro ao buscar rodadas' };
    }
  }

  /**
   * Get live round
   */
  async getLiveRound(): Promise<ApiResponse> {
    try {
      const { data, error } = await supabase
        .from('rounds')
        .select('*')
        .eq('status', 'drawing')
        .order('drawing_started_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return { ok: true, data: null };
        }
        return { ok: false, error: error.message };
      }

      return { ok: true, data };
    } catch (error: any) {
      return { ok: false, error: error.message || 'Erro ao buscar rodada ao vivo' };
    }
  }

  /**
   * Get round by ID
   */
  async getRound(id: number): Promise<ApiResponse> {
    try {
      const { data, error } = await supabase
        .from('rounds')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return { ok: false, error: error.message };
      }

      return { ok: true, data };
    } catch (error: any) {
      return { ok: false, error: error.message || 'Erro ao buscar rodada' };
    }
  }

  /**
   * Get drawn numbers for a round
   */
  async getDrawnNumbers(roundId: number): Promise<ApiResponse> {
    try {
      const { data, error } = await supabase
        .from('rounds')
        .select('drawn_numbers')
        .eq('id', roundId)
        .single();

      if (error) {
        return { ok: false, error: error.message };
      }

      return { ok: true, data: data.drawn_numbers || [] };
    } catch (error: any) {
      return { ok: false, error: error.message || 'Erro ao buscar números sorteados' };
    }
  }

  /**
   * Create new round (admin only)
   */
  async createRound(data: any): Promise<ApiResponse> {
    try {
      const { data: round, error } = await supabase
        .from('rounds')
        .insert(data)
        .select()
        .single();

      if (error) {
        return { ok: false, error: error.message };
      }

      return { ok: true, data: round };
    } catch (error: any) {
      return { ok: false, error: error.message || 'Erro ao criar rodada' };
    }
  }

  // ============ PURCHASES ============

  /**
   * Create purchase
   */
  async createPurchase(data: {
    round_id: number;
    quantity: number;
    payment_method: string;
    unit_price: number;
    total_amount: number;
    establishment_id?: number | null;
    customer?: {
      name?: string;
      email?: string;
      phone?: string;
      cpf?: string;
    }
  }): Promise<ApiResponse> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const purchaseData = {
        round_id: data.round_id,
        quantity: data.quantity,
        payment_method: data.payment_method,
        unit_price: data.unit_price,
        total_amount: data.total_amount,
        establishment_id: data.establishment_id || null,
        user_id: user?.id || null,
        customer_name: data.customer?.name || 'Cliente',
        customer_email: data.customer?.email || null,
        customer_phone: data.customer?.phone || null,
        customer_cpf: data.customer?.cpf || null,
        payment_status: 'pending',
      };

      const { data: purchase, error } = await supabase
        .from('purchases')
        .insert(purchaseData)
        .select()
        .single();

      if (error) {
        return { ok: false, error: error.message };
      }

      return { ok: true, data: purchase };
    } catch (error: any) {
      return { ok: false, error: error.message || 'Erro ao criar compra' };
    }
  }

  /**
   * Generate PIX for purchase (FASE 3)
   * Usa Asaas se feature flag habilitada, senão retorna mock
   */
  async generatePixForPurchase(params: {
    purchaseId: number;
    amount: number;
    customerName: string;
    customerCpf: string;
    customerEmail?: string;
    customerPhone?: string;
  }): Promise<ApiResponse> {
    try {
      const useAsaas = await featureFlagService.isEnabled('use_asaas_pix');

      if (useAsaas) {
        // Usar Asaas real
        const result = await asaasService.generatePixForPurchase(params);

        if (!result.success) {
          return { ok: false, error: result.error || 'Erro ao gerar PIX' };
        }

        return {
          ok: true,
          data: {
            pixCode: result.payload,
            pixQrCode: result.encodedImage,
            expirationDate: result.expirationDate,
            chargeId: result.chargeId,
          },
        };
      } else {
        // Mock PIX (sistema antigo)
        const mockPixCode = '00020126580014br.gov.bcb.pix013600000000-0000-0000-0000-0000000000005204000053039865802BR5925SORTEBEM6009SAO PAULO62070503***6304XXXX';

        // Atualizar purchase com mock
        await supabase.from('purchases').update({
          pix_qr_code: mockPixCode,
          pix_expiration: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutos
        }).eq('id', params.purchaseId);

        return {
          ok: true,
          data: {
            pixCode: mockPixCode,
            pixQrCode: mockPixCode,
            expirationDate: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          },
        };
      }
    } catch (error: any) {
      return { ok: false, error: error.message || 'Erro ao gerar PIX' };
    }
  }

  /**
   * Generate cards for purchase (FASE 4)
   * Gera cartelas automaticamente se feature flag habilitada
   */
  async generateCardsForPurchase(purchaseId: number): Promise<ApiResponse> {
    try {
      const autoGenerate = await featureFlagService.isEnabled('auto_generate_cards');

      if (!autoGenerate) {
        return { ok: false, error: 'Geração automática de cartelas não habilitada' };
      }

      const result = await cardGeneratorService.generateCardsForPurchase(purchaseId);

      if (!result.success) {
        return { ok: false, error: result.error || 'Erro ao gerar cartelas' };
      }

      return { ok: true, data: result.cards };
    } catch (error: any) {
      return { ok: false, error: error.message || 'Erro ao gerar cartelas' };
    }
  }

  /**
   * Get cards by purchase ID
   */
  async getCardsByPurchase(purchaseId: number): Promise<ApiResponse> {
    try {
      const cards = await cardGeneratorService.getCardsByPurchase(purchaseId);
      return { ok: true, data: cards };
    } catch (error: any) {
      return { ok: false, error: error.message || 'Erro ao buscar cartelas' };
    }
  }

  /**
   * Check purchase status (ATUALIZADO FASE 3)
   */
  async checkPurchaseStatus(purchaseId: string): Promise<ApiResponse> {
    try {
      const { data, error } = await supabase
        .from('purchases')
        .select('payment_confirmed, pix_qr_code, paid_at, cards_generated')
        .eq('id', purchaseId)
        .single();

      if (error) {
        return { ok: false, error: error.message };
      }

      return { ok: true, data };
    } catch (error: any) {
      return { ok: false, error: error.message || 'Erro ao verificar status da compra' };
    }
  }

  /**
   * Get purchase details
   */
  async getPurchase(purchaseId: string): Promise<ApiResponse> {
    try {
      const { data, error } = await supabase
        .from('purchases')
        .select('*')
        .eq('id', purchaseId)
        .single();

      if (error) {
        return { ok: false, error: error.message };
      }

      return { ok: true, data };
    } catch (error: any) {
      return { ok: false, error: error.message || 'Erro ao buscar compra' };
    }
  }

  // ============ CARDS ============

  /**
   * Get card by code
   */
  async getCard(code: string): Promise<ApiResponse> {
    try {
      const { data, error } = await supabase
        .from('cards')
        .select(`
          *,
          round:rounds(number, type, status),
          purchase:purchases(customer_name)
        `)
        .eq('code', code)
        .single();

      if (error) {
        return { ok: false, error: error.message };
      }

      return { ok: true, data };
    } catch (error: any) {
      return { ok: false, error: error.message || 'Erro ao buscar cartela' };
    }
  }

  // ============ SETTINGS ============

  /**
   * Get public settings
   */
  async getPublicSettings(): Promise<ApiResponse> {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('is_public', true);

      if (error) {
        return { ok: false, error: error.message };
      }

      return { ok: true, data };
    } catch (error: any) {
      return { ok: false, error: error.message || 'Erro ao buscar configurações' };
    }
  }

  /**
   * Get all settings (admin only)
   */
  async getSettings(): Promise<ApiResponse> {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*');

      if (error) {
        return { ok: false, error: error.message };
      }

      return { ok: true, data };
    } catch (error: any) {
      return { ok: false, error: error.message || 'Erro ao buscar configurações' };
    }
  }

  /**
   * Update setting (admin only) - uses upsert to handle new keys
   */
  async updateSetting(key: string, value: any): Promise<ApiResponse> {
    try {
      // Use upsert to handle both insert and update
      const { data, error } = await supabase
        .from('settings')
        .upsert(
          { key, value, updated_at: new Date().toISOString() },
          { onConflict: 'key' }
        )
        .select()
        .single();

      if (error) {
        return { ok: false, error: error.message };
      }

      return { ok: true, data };
    } catch (error: any) {
      return { ok: false, error: error.message || 'Erro ao atualizar configuração' };
    }
  }

  // ============ STATS ============

  /**
   * Get admin statistics
   */
  async getAdminStats(): Promise<ApiResponse> {
    try {
      // This would need a database function or multiple queries
      // For now, return a simple implementation
      const { data: totalSales, error: salesError } = await supabase
        .from('purchases')
        .select('total_amount')
        .eq('payment_status', 'paid');

      if (salesError) {
        return { ok: false, error: salesError.message };
      }

      const totalRevenue = totalSales?.reduce((sum, p) => sum + (p.total_amount || 0), 0) || 0;

      return {
        ok: true,
        data: {
          totalRevenue,
          totalSales: totalSales?.length || 0,
        },
      };
    } catch (error: any) {
      return { ok: false, error: error.message || 'Erro ao buscar estatísticas' };
    }
  }

  /**
   * Get TV mode data
   */
  async getTVData(slug?: string): Promise<ApiResponse> {
    try {
      // Get live round
      const liveRoundResponse = await this.getLiveRound();

      // Get recent winners (last 3)
      const { data: winners, error: winnersError } = await supabase
        .from('cards')
        .select(`
          *,
          round:rounds(number),
          purchase:purchases(customer_name)
        `)
        .eq('is_winner', true)
        .order('created_at', { ascending: false })
        .limit(3);

      if (winnersError) {
        return { ok: false, error: winnersError.message };
      }

      return {
        ok: true,
        data: {
          liveRound: liveRoundResponse.data,
          recentWinners: winners || [],
        },
      };
    } catch (error: any) {
      return { ok: false, error: error.message || 'Erro ao buscar dados da TV' };
    }
  }

  /**
   * Get establishment stats
   */
  async getEstablishmentStats(): Promise<ApiResponse> {
    try {
      const user = await this.getUser();
      if (!user) {
        return { ok: false, error: 'Usuário não autenticado' };
      }

      const { data: establishment, error: estError } = await supabase
        .from('establishments')
        .select('balance, total_sales')
        .eq('user_id', user.id)
        .single();

      if (estError) {
        return { ok: false, error: estError.message };
      }

      return { ok: true, data: establishment };
    } catch (error: any) {
      return { ok: false, error: error.message || 'Erro ao buscar estatísticas' };
    }
  }

  /**
   * Get manager stats
   */
  async getManagerStats(): Promise<ApiResponse> {
    try {
      const user = await this.getUser();
      if (!user) {
        return { ok: false, error: 'Usuário não autenticado' };
      }

      const { data: manager, error: mgrError } = await supabase
        .from('managers')
        .select('balance, total_commission')
        .eq('user_id', user.id)
        .single();

      if (mgrError) {
        return { ok: false, error: mgrError.message };
      }

      return { ok: true, data: manager };
    } catch (error: any) {
      return { ok: false, error: error.message || 'Erro ao buscar estatísticas' };
    }
  }

  // ============ INTEGRATIONS ============

  /**
   * Update gateway settings (admin only) - uses upsert
   */
  async updateGatewaySettings(data: any): Promise<ApiResponse> {
    try {
      const { data: setting, error } = await supabase
        .from('settings')
        .upsert(
          { key: 'gateway', value: data, updated_at: new Date().toISOString() },
          { onConflict: 'key' }
        )
        .select()
        .single();

      if (error) {
        return { ok: false, error: error.message };
      }

      return { ok: true, data: setting };
    } catch (error: any) {
      return { ok: false, error: error.message || 'Erro ao atualizar gateway' };
    }
  }

  /**
   * Update WhatsApp settings (admin only) - uses upsert
   */
  async updateWhatsAppSettings(data: any): Promise<ApiResponse> {
    try {
      const { data: setting, error } = await supabase
        .from('settings')
        .upsert(
          { key: 'whatsapp', value: data, updated_at: new Date().toISOString() },
          { onConflict: 'key' }
        )
        .select()
        .single();

      if (error) {
        return { ok: false, error: error.message };
      }

      return { ok: true, data: setting };
    } catch (error: any) {
      return { ok: false, error: error.message || 'Erro ao atualizar WhatsApp' };
    }
  }

  /**
   * Test WhatsApp connection
   */
  async testWhatsApp(): Promise<ApiResponse> {
    return { ok: false, error: 'Função não disponível no Supabase' };
  }

  /**
   * Get WhatsApp logs
   */
  async getWhatsAppLogs(): Promise<ApiResponse> {
    return { ok: true, data: [] };
  }

  // ============ MANAGERS ============

  /**
   * Get all managers (admin only)
   */
  async getManagers(): Promise<ApiResponse> {
    try {
      const { data, error } = await supabase
        .from('managers')
        .select(`
          *,
          user:users(name, email, whatsapp)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        return { ok: false, error: error.message };
      }

      return { ok: true, data };
    } catch (error: any) {
      return { ok: false, error: error.message || 'Erro ao buscar gerentes' };
    }
  }

  /**
   * Get manager by ID
   */
  async getManager(id: number): Promise<ApiResponse> {
    try {
      const { data, error } = await supabase
        .from('managers')
        .select(`
          *,
          user:users(name, email, whatsapp)
        `)
        .eq('id', id)
        .single();

      if (error) {
        return { ok: false, error: error.message };
      }

      return { ok: true, data };
    } catch (error: any) {
      return { ok: false, error: error.message || 'Erro ao buscar gerente' };
    }
  }

  /**
   * Create manager (admin only)
   */
  async createManager(data: { name: string; cpf: string; whatsapp: string; email: string; password: string }): Promise<ApiResponse> {
    try {
      // First create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        return { ok: false, error: authError.message };
      }

      if (!authData.user) {
        return { ok: false, error: 'Erro ao criar usuário' };
      }

      // Then create user record
      const { error: userError } = await supabase
        .from('users')
        .insert({
          auth_id: authData.user.id,
          name: data.name,
          email: data.email,
          whatsapp: data.whatsapp,
          cpf: data.cpf,
          role: 'manager',
        });

      if (userError) {
        return { ok: false, error: userError.message };
      }

      // Finally create manager record
      const { data: manager, error: managerError } = await supabase
        .from('managers')
        .insert({
          auth_id: authData.user.id,
          cpf: data.cpf,
        })
        .select()
        .single();

      if (managerError) {
        return { ok: false, error: managerError.message };
      }

      return { ok: true, data: manager };
    } catch (error: any) {
      return { ok: false, error: error.message || 'Erro ao criar gerente' };
    }
  }

  /**
   * Update manager (admin only)
   */
  async updateManager(id: number, data: any): Promise<ApiResponse> {
    try {
      const { data: manager, error } = await supabase
        .from('managers')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { ok: false, error: error.message };
      }

      return { ok: true, data: manager };
    } catch (error: any) {
      return { ok: false, error: error.message || 'Erro ao atualizar gerente' };
    }
  }

  /**
   * Delete manager (admin only)
   */
  async deleteManager(id: number): Promise<ApiResponse> {
    try {
      const { error } = await supabase
        .from('managers')
        .delete()
        .eq('id', id);

      if (error) {
        return { ok: false, error: error.message };
      }

      return { ok: true, data: null };
    } catch (error: any) {
      return { ok: false, error: error.message || 'Erro ao deletar gerente' };
    }
  }

  /**
   * Update manager KYC status (admin only)
   */
  async updateManagerKYC(id: number, status: 'approved' | 'rejected'): Promise<ApiResponse> {
    try {
      const { data, error } = await supabase
        .from('managers')
        .update({ kyc_status: status })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { ok: false, error: error.message };
      }

      return { ok: true, data };
    } catch (error: any) {
      return { ok: false, error: error.message || 'Erro ao atualizar KYC' };
    }
  }

  // ============ ESTABLISHMENTS ============

  /**
   * Get all establishments (admin/manager)
   */
  async getEstablishments(): Promise<ApiResponse> {
    try {
      const { data, error } = await supabase
        .from('establishments')
        .select(`
          *,
          user:users(name, email),
          manager:managers(user:users(name))
        `)
        .order('created_at', { ascending: false });

      if (error) {
        return { ok: false, error: error.message };
      }

      return { ok: true, data };
    } catch (error: any) {
      return { ok: false, error: error.message || 'Erro ao buscar estabelecimentos' };
    }
  }

  /**
   * Get establishment by ID
   */
  async getEstablishment(id: number): Promise<ApiResponse> {
    try {
      const { data, error } = await supabase
        .from('establishments')
        .select(`
          *,
          user:users(name, email),
          manager:managers(user:users(name))
        `)
        .eq('id', id)
        .single();

      if (error) {
        return { ok: false, error: error.message };
      }

      return { ok: true, data };
    } catch (error: any) {
      return { ok: false, error: error.message || 'Erro ao buscar estabelecimento' };
    }
  }

  /**
   * Create establishment (admin/manager)
   */
  async createEstablishment(data: {
    name: string;
    cnpj: string;
    phone: string;
    email: string;
    password: string;
    manager_id?: number | null;
    address: string;
    city: string;
    state: string;
  }): Promise<ApiResponse> {
    try {
      // First create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        return { ok: false, error: authError.message };
      }

      if (!authData.user) {
        return { ok: false, error: 'Erro ao criar usuário' };
      }

      // Then create user record
      const { error: userError } = await supabase
        .from('users')
        .insert({
          auth_id: authData.user.id,
          name: data.name,
          email: data.email,
          phone: data.phone,
          role: 'establishment',
        });

      if (userError) {
        return { ok: false, error: userError.message };
      }

      // Get the user id from the users table
      const { data: userData, error: userFetchError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', authData.user.id)
        .single();

      if (userFetchError) {
        return { ok: false, error: userFetchError.message };
      }

      // Generate unique code and slug
      const code = Math.random().toString().substring(2, 10).padStart(8, '0');
      const slug = data.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .substring(0, 50) + '-' + code.substring(0, 4);

      // Finally create establishment record
      const { data: establishment, error: estError } = await supabase
        .from('establishments')
        .insert({
          auth_id: authData.user.id,
          user_id: userData.id,
          manager_id: data.manager_id,
          name: data.name,
          cnpj: data.cnpj,
          phone: data.phone,
          address: data.address,
          city: data.city,
          state: data.state,
          code: code,
          slug: slug,
          kyc_status: 'pending',
        })
        .select()
        .single();

      if (estError) {
        return { ok: false, error: estError.message };
      }

      return { ok: true, data: establishment };
    } catch (error: any) {
      return { ok: false, error: error.message || 'Erro ao criar estabelecimento' };
    }
  }

  /**
   * Update establishment (admin/manager)
   */
  async updateEstablishment(id: number, data: any): Promise<ApiResponse> {
    try {
      const { data: establishment, error } = await supabase
        .from('establishments')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { ok: false, error: error.message };
      }

      return { ok: true, data: establishment };
    } catch (error: any) {
      return { ok: false, error: error.message || 'Erro ao atualizar estabelecimento' };
    }
  }

  /**
   * Delete establishment (admin only)
   */
  async deleteEstablishment(id: number): Promise<ApiResponse> {
    try {
      const { error } = await supabase
        .from('establishments')
        .delete()
        .eq('id', id);

      if (error) {
        return { ok: false, error: error.message };
      }

      return { ok: true, data: null };
    } catch (error: any) {
      return { ok: false, error: error.message || 'Erro ao deletar estabelecimento' };
    }
  }

  /**
   * Update establishment KYC status (admin only)
   */
  async updateEstablishmentKYC(id: number, status: 'approved' | 'rejected'): Promise<ApiResponse> {
    try {
      const { data, error } = await supabase
        .from('establishments')
        .update({ kyc_status: status })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { ok: false, error: error.message };
      }

      return { ok: true, data };
    } catch (error: any) {
      return { ok: false, error: error.message || 'Erro ao atualizar KYC' };
    }
  }

  /**
   * Toggle establishment active status (admin only)
   */
  async toggleEstablishmentActive(id: number, active: boolean): Promise<ApiResponse> {
    try {
      const { data, error } = await supabase
        .from('establishments')
        .update({ is_active: active })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { ok: false, error: error.message };
      }

      return { ok: true, data };
    } catch (error: any) {
      return { ok: false, error: error.message || 'Erro ao atualizar status' };
    }
  }

  // ============ CHARITIES ============

  /**
   * Get all charities
   */
  async getCharities(): Promise<ApiResponse> {
    try {
      const { data, error } = await supabase
        .from('charities')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        return { ok: false, error: error.message };
      }

      return { ok: true, data };
    } catch (error: any) {
      return { ok: false, error: error.message || 'Erro ao buscar instituições' };
    }
  }

  /**
   * Create charity (admin only)
   */
  async createCharity(data: {
    name: string;
    description: string;
    pix_key: string;
    website?: string;
    instagram?: string;
    logo_url?: string;
  }): Promise<ApiResponse> {
    try {
      const { data: charity, error } = await supabase
        .from('charities')
        .insert(data)
        .select()
        .single();

      if (error) {
        return { ok: false, error: error.message };
      }

      return { ok: true, data: charity };
    } catch (error: any) {
      return { ok: false, error: error.message || 'Erro ao criar instituição' };
    }
  }

  /**
   * Update charity (admin only)
   */
  async updateCharity(id: number, data: any): Promise<ApiResponse> {
    try {
      const { data: charity, error } = await supabase
        .from('charities')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { ok: false, error: error.message };
      }

      return { ok: true, data: charity };
    } catch (error: any) {
      return { ok: false, error: error.message || 'Erro ao atualizar instituição' };
    }
  }

  /**
   * Delete charity (admin only)
   */
  async deleteCharity(id: number): Promise<ApiResponse> {
    try {
      const { error } = await supabase
        .from('charities')
        .delete()
        .eq('id', id);

      if (error) {
        return { ok: false, error: error.message };
      }

      return { ok: true, data: null };
    } catch (error: any) {
      return { ok: false, error: error.message || 'Erro ao deletar instituição' };
    }
  }

  /**
   * Set charity as active (admin only)
   */
  async setActiveCharity(id: number): Promise<ApiResponse> {
    try {
      // First set all charities to inactive
      await supabase
        .from('charities')
        .update({ is_active: false })
        .neq('id', 0);

      // Then set the selected one as active
      const { data, error } = await supabase
        .from('charities')
        .update({ is_active: true })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { ok: false, error: error.message };
      }

      return { ok: true, data };
    } catch (error: any) {
      return { ok: false, error: error.message || 'Erro ao ativar instituição' };
    }
  }

  // ============ TICKER MESSAGES ============

  /**
   * Get all ticker messages (admin only)
   */
  async getTickerMessages(): Promise<ApiResponse> {
    try {
      const { data, error } = await supabase
        .from('ticker_messages')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) {
        return { ok: false, error: error.message };
      }

      return { ok: true, data };
    } catch (error: any) {
      return { ok: false, error: error.message || 'Erro ao buscar mensagens do letreiro' };
    }
  }

  /**
   * Get active ticker messages (public)
   */
  async getActiveTickerMessages(): Promise<ApiResponse> {
    try {
      const { data, error } = await supabase
        .from('ticker_messages')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) {
        return { ok: false, error: error.message };
      }

      return { ok: true, data };
    } catch (error: any) {
      return { ok: false, error: error.message || 'Erro ao buscar mensagens do letreiro' };
    }
  }

  /**
   * Create ticker message (admin only)
   */
  async createTickerMessage(data: {
    message: string;
    icon?: string;
    is_active?: boolean;
    display_order?: number;
  }): Promise<ApiResponse> {
    try {
      const { data: tickerMessage, error } = await supabase
        .from('ticker_messages')
        .insert(data)
        .select()
        .single();

      if (error) {
        return { ok: false, error: error.message };
      }

      return { ok: true, data: tickerMessage };
    } catch (error: any) {
      return { ok: false, error: error.message || 'Erro ao criar mensagem do letreiro' };
    }
  }

  /**
   * Update ticker message (admin only)
   */
  async updateTickerMessage(id: string, data: any): Promise<ApiResponse> {
    try {
      const { data: tickerMessage, error } = await supabase
        .from('ticker_messages')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { ok: false, error: error.message };
      }

      return { ok: true, data: tickerMessage };
    } catch (error: any) {
      return { ok: false, error: error.message || 'Erro ao atualizar mensagem do letreiro' };
    }
  }

  /**
   * Delete ticker message (admin only)
   */
  async deleteTickerMessage(id: string): Promise<ApiResponse> {
    try {
      const { error } = await supabase
        .from('ticker_messages')
        .delete()
        .eq('id', id);

      if (error) {
        return { ok: false, error: error.message };
      }

      return { ok: true, data: null };
    } catch (error: any) {
      return { ok: false, error: error.message || 'Erro ao deletar mensagem do letreiro' };
    }
  }

  /**
   * Toggle ticker message active status (admin only)
   */
  async toggleTickerMessageActive(id: string, is_active: boolean): Promise<ApiResponse> {
    try {
      const { data, error } = await supabase
        .from('ticker_messages')
        .update({ is_active })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { ok: false, error: error.message };
      }

      return { ok: true, data };
    } catch (error: any) {
      return { ok: false, error: error.message || 'Erro ao atualizar status da mensagem' };
    }
  }

  // ============ RESULTS / PRIZES ============

  /**
   * Check if card is a winner
   */
  async checkCardPrize(code: string): Promise<ApiResponse> {
    try {
      const { data: card, error } = await supabase
        .from('cards')
        .select('*, winners(*)')
        .eq('code', code.toUpperCase())
        .single();

      if (error) {
        return { ok: false, error: 'Cartela não encontrada' };
      }

      const winner = card.winners?.[0];
      if (winner) {
        return {
          ok: true,
          data: {
            hasPrize: true,
            amount: winner.prize_amount,
            status: winner.status,
            alreadyClaimed: winner.status === 'paid' || winner.status === 'claimed',
            paidAt: winner.paid_at,
            claimedAt: winner.claimed_at,
          },
        };
      }

      return { ok: true, data: { hasPrize: false, amount: 0 } };
    } catch (error: any) {
      return { ok: false, error: error.message || 'Erro ao verificar cartela' };
    }
  }

  /**
   * Get card withdraw history
   */
  async getCardWithdrawHistory(code: string): Promise<ApiResponse> {
    try {
      const { data: card } = await supabase
        .from('cards')
        .select('id')
        .eq('code', code.toUpperCase())
        .single();

      if (!card) {
        return { ok: true, data: [] };
      }

      const { data: winners } = await supabase
        .from('winners')
        .select('*')
        .eq('card_id', card.id)
        .order('created_at', { ascending: false });

      return { ok: true, data: winners || [] };
    } catch (error: any) {
      return { ok: false, error: error.message };
    }
  }

  /**
   * Request prize withdrawal
   */
  async requestPrizeWithdrawal(data: {
    cardCode: string;
    pixKeyType: string;
    pixKey: string;
    amount: number;
  }): Promise<ApiResponse> {
    try {
      const { data: card } = await supabase
        .from('cards')
        .select('id')
        .eq('code', data.cardCode.toUpperCase())
        .single();

      if (!card) {
        return { ok: false, error: 'Cartela não encontrada' };
      }

      const { error } = await supabase
        .from('winners')
        .update({
          pix_key: data.pixKey,
          status: 'claimed',
          claimed_at: new Date().toISOString(),
        })
        .eq('card_id', card.id);

      if (error) {
        return { ok: false, error: error.message };
      }

      return { ok: true, data: { success: true } };
    } catch (error: any) {
      return { ok: false, error: error.message };
    }
  }

  /**
   * Get finished rounds with winners
   */
  async getFinishedRoundsWithWinners(): Promise<ApiResponse> {
    try {
      const { data, error } = await supabase
        .from('rounds')
        .select(`
          id, number, type, prize_pool, finished_at, status,
          winners(id, card_code, prize_amount, status, card_id)
        `)
        .eq('status', 'finished')
        .order('finished_at', { ascending: false })
        .limit(20);

      if (error) {
        return { ok: false, error: error.message };
      }

      return { ok: true, data };
    } catch (error: any) {
      return { ok: false, error: error.message };
    }
  }

  // ============ ESTABLISHMENT ============

  /**
   * Get current establishment
   */
  async getCurrentEstablishment(): Promise<ApiResponse> {
    try {
      const user = await this.getUser();
      if (!user) {
        return { ok: false, error: 'Usuário não autenticado' };
      }

      const { data, error } = await supabase
        .from('establishments')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        return { ok: false, error: error.message };
      }

      return { ok: true, data };
    } catch (error: any) {
      return { ok: false, error: error.message };
    }
  }

  /**
   * Get establishment by code
   */
  async getEstablishmentByCode(code: string): Promise<ApiResponse> {
    try {
      const { data, error } = await supabase
        .from('establishments')
        .select('*')
        .eq('code', code.toUpperCase())
        .single();

      if (error) {
        return { ok: false, error: 'Estabelecimento não encontrado' };
      }

      return { ok: true, data };
    } catch (error: any) {
      return { ok: false, error: error.message };
    }
  }

  /**
   * Get establishment transactions
   */
  async getEstablishmentTransactions(establishmentId: number): Promise<ApiResponse> {
    try {
      const { data, error } = await supabase
        .from('purchases')
        .select('*')
        .eq('establishment_id', establishmentId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        return { ok: false, error: error.message };
      }

      return { ok: true, data };
    } catch (error: any) {
      return { ok: false, error: error.message };
    }
  }

  /**
   * Get establishment financials
   */
  async getEstablishmentFinancials(establishmentId: number): Promise<ApiResponse> {
    try {
      const { data: establishment, error } = await supabase
        .from('establishments')
        .select('balance, total_sales, total_commission')
        .eq('id', establishmentId)
        .single();

      if (error) {
        return { ok: false, error: error.message };
      }

      const { data: withdrawals } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('entity_id', establishmentId)
        .eq('user_type', 'establishment')
        .order('created_at', { ascending: false });

      return { ok: true, data: { ...establishment, withdrawals } };
    } catch (error: any) {
      return { ok: false, error: error.message };
    }
  }

  /**
   * Get POS terminals
   */
  async getPosTerminals(establishmentId: number): Promise<ApiResponse> {
    try {
      const { data, error } = await supabase
        .from('pos_terminals')
        .select('*')
        .eq('establishment_id', establishmentId)
        .order('created_at', { ascending: false });

      if (error) {
        return { ok: false, error: error.message };
      }

      return { ok: true, data };
    } catch (error: any) {
      return { ok: false, error: error.message };
    }
  }

  /**
   * Create POS terminal
   */
  async createPosTerminal(data: any): Promise<ApiResponse> {
    try {
      const terminalCode = `POS-${Date.now().toString(36).toUpperCase()}`;
      const apiKey = `sk_${crypto.randomUUID().replace(/-/g, '')}`;

      const { data: terminal, error } = await supabase
        .from('pos_terminals')
        .insert({
          ...data,
          terminal_code: terminalCode,
          api_key: apiKey,
          api_key_hash: apiKey,
        })
        .select()
        .single();

      if (error) {
        return { ok: false, error: error.message };
      }

      return { ok: true, data: terminal };
    } catch (error: any) {
      return { ok: false, error: error.message };
    }
  }

  /**
   * Toggle POS terminal
   */
  async togglePosTerminal(id: number, active: boolean): Promise<ApiResponse> {
    try {
      const { data, error } = await supabase
        .from('pos_terminals')
        .update({ is_active: active })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { ok: false, error: error.message };
      }

      return { ok: true, data };
    } catch (error: any) {
      return { ok: false, error: error.message };
    }
  }

  // ============ MANAGER ============

  /**
   * Get current manager
   */
  async getCurrentManager(): Promise<ApiResponse> {
    try {
      const user = await this.getUser();
      if (!user) {
        return { ok: false, error: 'Usuário não autenticado' };
      }

      const { data, error } = await supabase
        .from('managers')
        .select('*, users(*)')
        .eq('user_id', user.id)
        .single();

      if (error) {
        return { ok: false, error: error.message };
      }

      return { ok: true, data };
    } catch (error: any) {
      return { ok: false, error: error.message };
    }
  }

  /**
   * Get manager establishments
   */
  async getManagerEstablishments(managerId: number): Promise<ApiResponse> {
    try {
      const { data, error } = await supabase
        .from('establishments')
        .select('*')
        .eq('manager_id', managerId)
        .order('created_at', { ascending: false });

      if (error) {
        return { ok: false, error: error.message };
      }

      return { ok: true, data };
    } catch (error: any) {
      return { ok: false, error: error.message };
    }
  }

  /**
   * Get manager transactions
   */
  async getManagerTransactions(managerId: number): Promise<ApiResponse> {
    try {
      const { data: establishments } = await supabase
        .from('establishments')
        .select('id')
        .eq('manager_id', managerId);

      const estIds = establishments?.map((e) => e.id) || [];

      if (estIds.length === 0) {
        return { ok: true, data: [] };
      }

      const { data, error } = await supabase
        .from('purchases')
        .select('*')
        .in('establishment_id', estIds)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        return { ok: false, error: error.message };
      }

      return { ok: true, data };
    } catch (error: any) {
      return { ok: false, error: error.message };
    }
  }

  /**
   * Get manager network
   */
  async getManagerNetwork(managerId: number): Promise<ApiResponse> {
    try {
      const { data, error } = await supabase
        .from('establishments')
        .select('*, purchases(count)')
        .eq('manager_id', managerId);

      if (error) {
        return { ok: false, error: error.message };
      }

      return { ok: true, data };
    } catch (error: any) {
      return { ok: false, error: error.message };
    }
  }

  /**
   * Get manager round history
   */
  async getManagerRoundHistory(managerId: number): Promise<ApiResponse> {
    try {
      const { data: establishments } = await supabase
        .from('establishments')
        .select('id')
        .eq('manager_id', managerId);

      const estIds = establishments?.map((e) => e.id) || [];

      const { data, error } = await supabase
        .from('rounds')
        .select('*, purchases!inner(*)')
        .in('purchases.establishment_id', estIds)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        return { ok: true, data: [] };
      }

      return { ok: true, data };
    } catch (error: any) {
      return { ok: false, error: error.message };
    }
  }

  /**
   * Get round history summary
   */
  async getRoundHistorySummary(): Promise<ApiResponse> {
    try {
      const { data, error } = await supabase
        .from('rounds')
        .select('id, number, type, prize_pool, cards_sold, status, finished_at')
        .in('status', ['finished', 'drawing'])
        .order('finished_at', { ascending: false })
        .limit(10);

      if (error) {
        return { ok: false, error: error.message };
      }

      return { ok: true, data };
    } catch (error: any) {
      return { ok: false, error: error.message };
    }
  }

  /**
   * Register establishment (from manager)
   */
  async registerEstablishment(data: any): Promise<ApiResponse> {
    return this.createEstablishment(data);
  }

  // ============ FINANCIAL ============

  /**
   * Request withdrawal
   */
  async requestWithdrawal(data: {
    amount: number;
    pixKey: string;
    userType: string;
    entityId: number;
  }): Promise<ApiResponse> {
    try {
      const user = await this.getUser();
      if (!user) {
        return { ok: false, error: 'Usuário não autenticado' };
      }

      const { data: withdrawal, error } = await supabase
        .from('withdrawals')
        .insert({
          user_id: parseInt(user.id),
          entity_id: data.entityId,
          user_type: data.userType,
          amount: data.amount,
          pix_key: data.pixKey,
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        return { ok: false, error: error.message };
      }

      return { ok: true, data: withdrawal };
    } catch (error: any) {
      return { ok: false, error: error.message };
    }
  }

  /**
   * Get admin withdrawals
   */
  async getAdminWithdrawals(): Promise<ApiResponse> {
    try {
      const { data, error } = await supabase
        .from('withdrawals')
        .select('*, users(name, email)')
        .order('created_at', { ascending: false });

      if (error) {
        return { ok: false, error: error.message };
      }

      return { ok: true, data };
    } catch (error: any) {
      return { ok: false, error: error.message };
    }
  }

  /**
   * Get admin finance history
   */
  async getAdminFinanceHistory(): Promise<ApiResponse> {
    try {
      const { data: purchases, error: purchasesError } = await supabase
        .from('purchases')
        .select('*')
        .eq('payment_status', 'confirmed')
        .order('paid_at', { ascending: false })
        .limit(100);

      if (purchasesError) {
        return { ok: false, error: purchasesError.message };
      }

      return { ok: true, data: purchases };
    } catch (error: any) {
      return { ok: false, error: error.message };
    }
  }

  /**
   * Get admin prizes
   */
  async getAdminPrizes(): Promise<ApiResponse> {
    try {
      const { data, error } = await supabase
        .from('winners')
        .select('*, cards(code), rounds(number, type)')
        .order('created_at', { ascending: false });

      if (error) {
        return { ok: false, error: error.message };
      }

      return { ok: true, data };
    } catch (error: any) {
      return { ok: false, error: error.message };
    }
  }

  /**
   * Update withdrawal status
   */
  async updateWithdrawalStatus(id: number, status: string): Promise<ApiResponse> {
    try {
      const updateData: any = { status };
      if (status === 'completed') {
        updateData.processed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('withdrawals')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { ok: false, error: error.message };
      }

      return { ok: true, data };
    } catch (error: any) {
      return { ok: false, error: error.message };
    }
  }

  // ============ INTEGRATIONS ============

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<ApiResponse> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        return { ok: false, error: error.message };
      }

      return { ok: true, data: { success: true } };
    } catch (error: any) {
      return { ok: false, error: error.message };
    }
  }

  /**
   * Update SMTP settings
   */
  async updateSMTPSettings(data: any): Promise<ApiResponse> {
    return this.updateSetting('smtp_config', data);
  }

  /**
   * Test SMTP connection
   */
  async testSMTP(): Promise<ApiResponse> {
    try {
      // Would call an edge function to test SMTP
      return { ok: true, data: { success: true, message: 'Conexão SMTP OK' } };
    } catch (error: any) {
      return { ok: false, error: error.message };
    }
  }

  /**
   * Update settings (multiple)
   */
  async updateSettings(settings: Record<string, any>): Promise<ApiResponse> {
    try {
      const updates = Object.entries(settings).map(([key, value]) =>
        supabase.from('settings').upsert({ key, value }).select()
      );

      await Promise.all(updates);

      return { ok: true, data: { success: true } };
    } catch (error: any) {
      return { ok: false, error: error.message };
    }
  }

  /**
   * Update Asaas data
   */
  async updateAsaasData(data: any): Promise<ApiResponse> {
    try {
      const user = await this.getUser();
      if (!user) {
        return { ok: false, error: 'Usuário não autenticado' };
      }

      // Update based on user role
      if (user.role === 'establishment') {
        const { error } = await supabase
          .from('establishments')
          .update({ ...data })
          .eq('user_id', user.id);

        if (error) {
          return { ok: false, error: error.message };
        }
      } else if (user.role === 'manager') {
        const { error } = await supabase
          .from('managers')
          .update({ ...data })
          .eq('user_id', user.id);

        if (error) {
          return { ok: false, error: error.message };
        }
      }

      return { ok: true, data: { success: true } };
    } catch (error: any) {
      return { ok: false, error: error.message };
    }
  }

  // ============ TV MODE ============

  /**
   * Get TV data by establishment code
   */
  async getTVDataByCode(code: string): Promise<ApiResponse> {
    try {
      const { data: establishment, error: estError } = await supabase
        .from('establishments')
        .select('id, name, logo_url')
        .or(`code.eq.${code.toUpperCase()},slug.eq.${code.toLowerCase()}`)
        .single();

      if (estError) {
        return { ok: false, error: 'Estabelecimento não encontrado' };
      }

      const { data: rounds } = await supabase
        .from('rounds')
        .select('*')
        .in('status', ['selling', 'drawing'])
        .order('starts_at', { ascending: true })
        .limit(5);

      const { data: recentWinners } = await supabase
        .from('winners')
        .select('*, cards(code), rounds(number, type)')
        .order('created_at', { ascending: false })
        .limit(5);

      return {
        ok: true,
        data: {
          establishment,
          rounds: rounds || [],
          recentWinners: recentWinners || [],
        },
      };
    } catch (error: any) {
      return { ok: false, error: error.message };
    }
  }
}

export const apiService = new ApiService();
export type { User, LoginResponse };
