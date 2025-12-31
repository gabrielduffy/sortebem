// API Service for SORTEBEM - Supabase Version
import { supabase } from '../lib/supabase'
import { authService } from './authService'

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
        user_id: user?.id || null,
        customer_name: data.customer?.name || null,
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
   * Check purchase status
   */
  async checkPurchaseStatus(purchaseId: string): Promise<ApiResponse> {
    try {
      const { data, error } = await supabase
        .from('purchases')
        .select('payment_status, pix_code, pix_qrcode')
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
   * Update setting (admin only)
   */
  async updateSetting(key: string, value: any): Promise<ApiResponse> {
    try {
      const { data, error } = await supabase
        .from('settings')
        .update({ value })
        .eq('key', key)
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
   * Update gateway settings (admin only)
   */
  async updateGatewaySettings(data: any): Promise<ApiResponse> {
    try {
      const { data: setting, error } = await supabase
        .from('settings')
        .update({ value: data })
        .eq('key', 'gateway')
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
   * Update WhatsApp settings (admin only)
   */
  async updateWhatsAppSettings(data: any): Promise<ApiResponse> {
    try {
      const { data: setting, error } = await supabase
        .from('settings')
        .update({ value: data })
        .eq('key', 'whatsapp')
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
          id: authData.user.id,
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
          user_id: authData.user.id,
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
    manager_id: number;
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
          id: authData.user.id,
          name: data.name,
          email: data.email,
          phone: data.phone,
          role: 'establishment',
        });

      if (userError) {
        return { ok: false, error: userError.message };
      }

      // Finally create establishment record
      const { data: establishment, error: estError } = await supabase
        .from('establishments')
        .insert({
          user_id: authData.user.id,
          manager_id: data.manager_id,
          name: data.name,
          cnpj: data.cnpj,
          phone: data.phone,
          address: data.address,
          city: data.city,
          state: data.state,
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
}

export const apiService = new ApiService();
export type { User, LoginResponse };
