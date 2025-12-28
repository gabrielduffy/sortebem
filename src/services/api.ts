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
}

export const apiService = new ApiService();
export type { User, LoginResponse };
