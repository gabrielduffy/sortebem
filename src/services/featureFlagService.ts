// Feature Flag Service
// Gerencia feature flags para rollout gradual de funcionalidades
import { supabase } from '../lib/supabase';

interface FeatureFlag {
  key: string;
  enabled: boolean;
  description: string;
  updated_at: string;
}

class FeatureFlagService {
  private cache: Map<string, { enabled: boolean; cachedAt: number }> = new Map();
  private cacheDuration = 60000; // 1 minuto de cache

  /**
   * Verifica se uma feature flag está habilitada
   * Usa cache para evitar queries desnecessárias
   */
  async isEnabled(key: string): Promise<boolean> {
    // Verificar cache
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.cachedAt < this.cacheDuration) {
      return cached.enabled;
    }

    try {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('enabled')
        .eq('key', key)
        .single();

      if (error) {
        console.warn(`Feature flag ${key} not found, defaulting to false`);
        return false;
      }

      const enabled = data?.enabled ?? false;

      // Atualizar cache
      this.cache.set(key, {
        enabled,
        cachedAt: Date.now(),
      });

      return enabled;
    } catch (error) {
      console.error(`Error checking feature flag ${key}:`, error);
      return false;
    }
  }

  /**
   * Obtém todas as feature flags
   */
  async getAll(): Promise<FeatureFlag[]> {
    try {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('*')
        .order('key');

      if (error) {
        console.error('Error fetching feature flags:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching feature flags:', error);
      return [];
    }
  }

  /**
   * Atualiza uma feature flag (apenas admins)
   */
  async toggle(key: string, enabled: boolean): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('feature_flags')
        .update({ enabled })
        .eq('key', key);

      if (error) {
        console.error(`Error toggling feature flag ${key}:`, error);
        return false;
      }

      // Limpar cache
      this.cache.delete(key);

      return true;
    } catch (error) {
      console.error(`Error toggling feature flag ${key}:`, error);
      return false;
    }
  }

  /**
   * Limpa o cache de feature flags
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Força recarregamento de uma feature flag específica
   */
  async refresh(key: string): Promise<boolean> {
    this.cache.delete(key);
    return this.isEnabled(key);
  }
}

export const featureFlagService = new FeatureFlagService();
export type { FeatureFlag };
