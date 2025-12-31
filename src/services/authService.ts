// Auth Service with Dual Authentication (bcrypt + fallback)
// Mantém compatibilidade com sistema antigo enquanto migra para bcrypt
import { supabase } from '../lib/supabase';
import { featureFlagService } from './featureFlagService';

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

class AuthService {
  /**
   * Login com email e senha
   * Usa função authenticate_user do PostgreSQL que implementa dual auth
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      // Chamar função PostgreSQL que faz dual auth
      const { data, error } = await supabase.rpc('authenticate_user', {
        p_email: email.toLowerCase(),
        p_password: password,
      });

      if (error) {
        console.error('Authentication error:', error);
        return {
          ok: false,
          error: 'Erro ao conectar com o servidor. Tente novamente.',
        };
      }

      // A função retorna um array com um objeto
      const result = Array.isArray(data) ? data[0] : data;

      if (!result || !result.success) {
        return {
          ok: false,
          error: result?.message || 'Credenciais inválidas',
        };
      }

      // Criar token (será JWT assinado se feature flag ativa)
      const token = await this.createToken({
        userId: result.user_id,
        role: result.user_role,
        email: result.user_email,
      });

      const user: User = {
        id: result.user_id.toString(),
        name: result.user_name,
        email: result.user_email,
        role: result.user_role,
      };

      // Armazenar em localStorage (compatibilidade)
      localStorage.setItem('auth_user', JSON.stringify(user));
      localStorage.setItem('auth_token', token);

      return {
        ok: true,
        token,
        user,
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        ok: false,
        error: 'Erro ao conectar com o servidor. Tente novamente.',
      };
    }
  }

  /**
   * Login com WhatsApp e senha
   */
  async loginWhatsApp(whatsapp: string, password: string): Promise<LoginResponse> {
    try {
      // Buscar email pelo WhatsApp
      const { data: users, error: searchError } = await supabase
        .from('users')
        .select('email')
        .eq('whatsapp', whatsapp)
        .limit(1);

      if (searchError || !users || users.length === 0) {
        return {
          ok: false,
          error: 'WhatsApp não encontrado',
        };
      }

      // Usar login por email
      return this.login(users[0].email, password);
    } catch (error) {
      console.error('Login WhatsApp error:', error);
      return {
        ok: false,
        error: 'Erro ao conectar com o servidor. Tente novamente.',
      };
    }
  }

  /**
   * Criar token JWT
   * Se feature flag 'use_signed_jwt' ativa, usa JWT assinado
   * Caso contrário, usa base64 simples (compatibilidade)
   */
  private async createToken(payload: any): Promise<string> {
    const useSignedJwt = await featureFlagService.isEnabled('use_signed_jwt');

    if (useSignedJwt) {
      // TODO: Implementar JWT assinado com jose library
      // Por enquanto, retorna base64 (será implementado no próximo commit)
      const tokenData = {
        ...payload,
        exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 dias
      };
      return btoa(JSON.stringify(tokenData));
    } else {
      // Sistema antigo: base64 simples
      const tokenData = {
        ...payload,
        exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
      };
      return btoa(JSON.stringify(tokenData));
    }
  }

  /**
   * Verificar se usuário está autenticado
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem('auth_token');
    const user = localStorage.getItem('auth_user');
    return !!(token && user);
  }

  /**
   * Obter usuário atual
   */
  getUser(): User | null {
    try {
      const userStr = localStorage.getItem('auth_user');
      if (!userStr) return null;
      return JSON.parse(userStr) as User;
    } catch {
      return null;
    }
  }

  /**
   * Obter token atual
   */
  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  /**
   * Logout
   */
  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  }
}

export const authService = new AuthService();
export type { User, LoginResponse };
