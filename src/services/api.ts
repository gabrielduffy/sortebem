// API Service for SORTEBEM
const API_BASE_URL = 'https://api.sortebem.com.br';

interface LoginResponse {
  ok: boolean;
  token?: string;
  user?: {
    id: string;
    name: string;
    email?: string;
    role: 'admin' | 'manager' | 'establishment';
  };
  error?: string;
}

interface User {
  id: string;
  name: string;
  email?: string;
  role: 'admin' | 'manager' | 'establishment';
}

class ApiService {
  private token: string | null = null;

  constructor() {
    // Load token from localStorage on initialization
    this.token = localStorage.getItem('auth_token');
  }

  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data: LoginResponse = await response.json();

      if (data.ok && data.token && data.user) {
        this.setToken(data.token);
        this.setUser(data.user);
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);
      return {
        ok: false,
        error: 'Erro ao conectar com o servidor. Tente novamente.',
      };
    }
  }

  /**
   * Login with WhatsApp and password
   */
  async loginWhatsApp(whatsapp: string, password: string): Promise<LoginResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login-whatsapp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ whatsapp, password }),
      });

      const data: LoginResponse = await response.json();

      if (data.ok && data.token && data.user) {
        this.setToken(data.token);
        this.setUser(data.user);
      }

      return data;
    } catch (error) {
      console.error('Login WhatsApp error:', error);
      return {
        ok: false,
        error: 'Erro ao conectar com o servidor. Tente novamente.',
      };
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.token !== null && this.getUser() !== null;
  }

  /**
   * Get current authenticated user
   */
  getUser(): User | null {
    const userStr = localStorage.getItem('auth_user');
    if (!userStr) return null;

    try {
      return JSON.parse(userStr) as User;
    } catch {
      return null;
    }
  }

  /**
   * Get current token
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Set authentication token
   */
  private setToken(token: string): void {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  /**
   * Set user data
   */
  private setUser(user: User): void {
    localStorage.setItem('auth_user', JSON.stringify(user));
  }

  /**
   * Logout user
   */
  logout(): void {
    this.token = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  }

  /**
   * Make authenticated API request
   */
  async fetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
  }

  /**
   * Check API health
   */
  async checkHealth(): Promise<{ ok: boolean; postgres?: boolean; redis?: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return await response.json();
    } catch (error) {
      console.error('Health check error:', error);
      return { ok: false };
    }
  }

  // ============ ROUNDS ============

  /**
   * Get available rounds for selling
   */
  async getRounds() {
    const response = await this.fetch('/rounds');
    return await response.json();
  }

  /**
   * Get live round
   */
  async getLiveRound() {
    const response = await this.fetch('/rounds/live');
    return await response.json();
  }

  /**
   * Get round by ID
   */
  async getRound(id: number) {
    const response = await this.fetch(`/rounds/${id}`);
    return await response.json();
  }

  /**
   * Get drawn numbers for a round
   */
  async getDrawnNumbers(roundId: number) {
    const response = await this.fetch(`/rounds/${roundId}/numbers`);
    return await response.json();
  }

  /**
   * Create new round (admin only)
   */
  async createRound(data: any) {
    const response = await this.fetch('/rounds', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return await response.json();
  }

  // ============ PURCHASES ============

  /**
   * Create purchase
   */
  async createPurchase(data: { round_id: number; quantity: number; customer_whatsapp?: string }) {
    const response = await this.fetch('/purchases', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return await response.json();
  }

  /**
   * Check purchase status
   */
  async checkPurchaseStatus(purchaseId: string) {
    const response = await this.fetch(`/purchases/${purchaseId}/check-status`, {
      method: 'POST',
    });
    return await response.json();
  }

  /**
   * Get purchase details
   */
  async getPurchase(purchaseId: string) {
    const response = await this.fetch(`/purchases/${purchaseId}`);
    return await response.json();
  }

  // ============ CARDS ============

  /**
   * Get card by code
   */
  async getCard(code: string) {
    const response = await this.fetch(`/cards/${code}`);
    return await response.json();
  }

  // ============ SETTINGS ============

  /**
   * Get public settings
   */
  async getPublicSettings() {
    const response = await fetch(`${API_BASE_URL}/settings/public`);
    return await response.json();
  }

  /**
   * Get all settings (admin only)
   */
  async getSettings() {
    const response = await this.fetch('/settings');
    return await response.json();
  }

  /**
   * Update setting (admin only)
   */
  async updateSetting(key: string, value: any) {
    const response = await this.fetch('/settings', {
      method: 'PUT',
      body: JSON.stringify({ key, value }),
    });
    return await response.json();
  }

  // ============ STATS ============

  /**
   * Get admin statistics
   */
  async getAdminStats() {
    const response = await this.fetch('/stats/admin');
    return await response.json();
  }

  /**
   * Get TV mode data
   */
  async getTVData(slug: string) {
    const response = await fetch(`${API_BASE_URL}/stats/tv/${slug}`);
    return await response.json();
  }

  /**
   * Get establishment stats
   */
  async getEstablishmentStats() {
    const response = await this.fetch('/stats/establishment');
    return await response.json();
  }

  /**
   * Get manager stats
   */
  async getManagerStats() {
    const response = await this.fetch('/stats/manager');
    return await response.json();
  }
}

export const apiService = new ApiService();
export type { User, LoginResponse };
