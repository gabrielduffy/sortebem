import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService, User } from '@/services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  loginWhatsApp: (whatsapp: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = () => {
      const storedUser = apiService.getUser();
      if (storedUser && apiService.isAuthenticated()) {
        setUser(storedUser);
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
    setLoading(true);
    try {
      const response = await apiService.login(email, password);

      if (response.ok && response.user) {
        setUser(response.user);
        return { ok: true };
      } else {
        return { ok: false, error: response.error || 'Credenciais inválidas' };
      }
    } catch (error) {
      return { ok: false, error: 'Erro ao fazer login. Tente novamente.' };
    } finally {
      setLoading(false);
    }
  };

  const loginWhatsApp = async (whatsapp: string, password: string): Promise<{ ok: boolean; error?: string }> => {
    setLoading(true);
    try {
      const response = await apiService.loginWhatsApp(whatsapp, password);

      if (response.ok && response.user) {
        setUser(response.user);
        return { ok: true };
      } else {
        return { ok: false, error: response.error || 'Credenciais inválidas' };
      }
    } catch (error) {
      return { ok: false, error: 'Erro ao fazer login. Tente novamente.' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    apiService.logout();
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: user !== null,
    loading,
    login,
    loginWhatsApp,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
