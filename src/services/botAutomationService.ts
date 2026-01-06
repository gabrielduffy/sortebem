// Bot Automation Service
// Gerencia a automação de inserção de jogadores/bots nas rodadas

import { supabase } from '@/lib/supabase';
import { groqService } from './groqService';

export interface BotAutomationConfig {
  id: number;
  establishment_id: number;
  enabled: boolean;
  min_bots_per_round: number;
  max_bots_per_round: number;
  min_cards_per_bot: number;
  max_cards_per_bot: number;
  trigger_type: 'round_open' | 'scheduled' | 'manual';
  schedule_cron?: string;
  last_run_at?: string;
  created_at: string;
  updated_at: string;
}

export interface BotAutomationLog {
  id: number;
  config_id: number;
  round_id: number;
  bots_created: number;
  cards_generated: number;
  total_amount: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error_message?: string;
  started_at: string;
  completed_at?: string;
  created_at: string;
}

export interface AutomationResult {
  success: boolean;
  bots_created: number;
  cards_generated: number;
  total_amount: number;
  error?: string;
}

class BotAutomationService {
  private defaultEstablishmentId: number | null = null;

  /**
   * Obtém o ID do estabelecimento Online padrão
   */
  async getOnlineEstablishmentId(): Promise<number> {
    if (this.defaultEstablishmentId) {
      return this.defaultEstablishmentId;
    }

    const { data, error } = await supabase
      .from('establishments')
      .select('id')
      .eq('slug', 'online')
      .single();

    if (error || !data) {
      throw new Error('Estabelecimento Online não encontrado');
    }

    this.defaultEstablishmentId = data.id;
    return data.id;
  }

  /**
   * Obtém configurações de automação
   */
  async getConfigs(): Promise<BotAutomationConfig[]> {
    const { data, error } = await supabase
      .from('bot_automation_config')
      .select('*')
      .order('id');

    if (error) {
      console.error('Error fetching bot configs:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Obtém configuração por estabelecimento
   */
  async getConfigByEstablishment(establishmentId: number): Promise<BotAutomationConfig | null> {
    const { data, error } = await supabase
      .from('bot_automation_config')
      .select('*')
      .eq('establishment_id', establishmentId)
      .single();

    if (error) {
      return null;
    }

    return data;
  }

  /**
   * Cria ou atualiza configuração de automação
   */
  async upsertConfig(config: Partial<BotAutomationConfig> & { establishment_id: number }): Promise<BotAutomationConfig | null> {
    const { data, error } = await supabase
      .from('bot_automation_config')
      .upsert(config, { onConflict: 'establishment_id' })
      .select()
      .single();

    if (error) {
      console.error('Error upserting bot config:', error);
      return null;
    }

    return data;
  }

  /**
   * Habilita/desabilita automação
   */
  async toggleEnabled(configId: number, enabled: boolean): Promise<boolean> {
    const { error } = await supabase
      .from('bot_automation_config')
      .update({ enabled })
      .eq('id', configId);

    return !error;
  }

  /**
   * Gera nomes de bots usando Groq AI
   */
  async generateBotNames(quantity: number, establishmentName: string): Promise<string[]> {
    try {
      const result = await groqService.generateMultiplePlayerNames(
        quantity,
        establishmentName
      );
      return result || [];
    } catch (error) {
      console.error('Error generating bot names:', error);
      // Fallback: gerar nomes simples
      return this.generateFallbackNames(quantity);
    }
  }

  /**
   * Gera nomes de fallback caso Groq falhe
   */
  private generateFallbackNames(quantity: number): string[] {
    const firstNames = [
      'Maria', 'João', 'Ana', 'Pedro', 'José', 'Paulo', 'Antônio', 'Carlos',
      'Lucas', 'Gabriel', 'Letícia', 'Beatriz', 'Fernanda', 'Mariana', 'Julia',
      'Ricardo', 'Felipe', 'Bruno', 'Diego', 'Thiago', 'Rafael', 'Marcos'
    ];
    const lastNames = [
      'Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves',
      'Pereira', 'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho'
    ];

    const names: string[] = [];
    for (let i = 0; i < quantity; i++) {
      const first = firstNames[Math.floor(Math.random() * firstNames.length)];
      const last = lastNames[Math.floor(Math.random() * lastNames.length)];
      names.push(`${first} ${last}`);
    }
    return names;
  }

  /**
   * Executa automação para uma rodada específica
   */
  async executeForRound(
    roundId: number,
    establishmentId: number,
    config?: Partial<BotAutomationConfig>
  ): Promise<AutomationResult> {
    try {
      // Buscar configuração se não fornecida
      const actualConfig = config || await this.getConfigByEstablishment(establishmentId);
      
      const minBots = actualConfig?.min_bots_per_round || 5;
      const maxBots = actualConfig?.max_bots_per_round || 20;
      const minCards = actualConfig?.min_cards_per_bot || 1;
      const maxCards = actualConfig?.max_cards_per_bot || 3;

      // Calcular quantidade aleatória de bots
      const botCount = Math.floor(Math.random() * (maxBots - minBots + 1)) + minBots;
      const cardsPerBot = Math.floor(Math.random() * (maxCards - minCards + 1)) + minCards;

      // Buscar nome do estabelecimento
      const { data: establishment } = await supabase
        .from('establishments')
        .select('name')
        .eq('id', establishmentId)
        .single();

      const establishmentName = establishment?.name || 'Sortebem Online';

      // Gerar nomes via Groq AI
      const botNames = await this.generateBotNames(botCount, establishmentName);

      if (botNames.length === 0) {
        return {
          success: false,
          bots_created: 0,
          cards_generated: 0,
          total_amount: 0,
          error: 'Falha ao gerar nomes de bots'
        };
      }

      // Executar automação via função do banco
      const { data, error } = await supabase.rpc('execute_bot_automation', {
        p_round_id: roundId,
        p_establishment_id: establishmentId,
        p_bot_names: botNames,
        p_cards_per_bot: cardsPerBot
      });

      if (error) {
        console.error('Error executing bot automation:', error);
        return {
          success: false,
          bots_created: 0,
          cards_generated: 0,
          total_amount: 0,
          error: error.message
        };
      }

      const result = data as any;

      // Registrar log
      await this.logExecution({
        round_id: roundId,
        config_id: actualConfig?.id,
        bots_created: result.bots_created || 0,
        cards_generated: result.cards_generated || 0,
        total_amount: result.total_amount || 0,
        status: result.success ? 'completed' : 'failed',
        error_message: result.error
      });

      return {
        success: result.success,
        bots_created: result.bots_created || 0,
        cards_generated: result.cards_generated || 0,
        total_amount: result.total_amount || 0,
        error: result.error
      };
    } catch (error: any) {
      console.error('Error in executeForRound:', error);
      return {
        success: false,
        bots_created: 0,
        cards_generated: 0,
        total_amount: 0,
        error: error.message
      };
    }
  }

  /**
   * Executa automação manual com parâmetros customizados
   */
  async executeManual(params: {
    roundId: number;
    establishmentId: number;
    botCount: number;
    cardsPerBot: number;
  }): Promise<AutomationResult> {
    try {
      const { roundId, establishmentId, botCount, cardsPerBot } = params;

      // Buscar nome do estabelecimento
      const { data: establishment } = await supabase
        .from('establishments')
        .select('name')
        .eq('id', establishmentId)
        .single();

      const establishmentName = establishment?.name || 'Sortebem Online';

      // Gerar nomes via Groq AI
      const botNames = await this.generateBotNames(botCount, establishmentName);

      if (botNames.length === 0) {
        return {
          success: false,
          bots_created: 0,
          cards_generated: 0,
          total_amount: 0,
          error: 'Falha ao gerar nomes de bots'
        };
      }

      // Executar automação
      const { data, error } = await supabase.rpc('execute_bot_automation', {
        p_round_id: roundId,
        p_establishment_id: establishmentId,
        p_bot_names: botNames,
        p_cards_per_bot: cardsPerBot
      });

      if (error) {
        return {
          success: false,
          bots_created: 0,
          cards_generated: 0,
          total_amount: 0,
          error: error.message
        };
      }

      const result = data as any;

      // Registrar log
      await this.logExecution({
        round_id: roundId,
        bots_created: result.bots_created || 0,
        cards_generated: result.cards_generated || 0,
        total_amount: result.total_amount || 0,
        status: result.success ? 'completed' : 'failed',
        error_message: result.error
      });

      return {
        success: result.success,
        bots_created: result.bots_created || 0,
        cards_generated: result.cards_generated || 0,
        total_amount: result.total_amount || 0,
        error: result.error
      };
    } catch (error: any) {
      return {
        success: false,
        bots_created: 0,
        cards_generated: 0,
        total_amount: 0,
        error: error.message
      };
    }
  }

  /**
   * Registra log de execução
   */
  private async logExecution(log: Partial<BotAutomationLog>): Promise<void> {
    try {
      await supabase.from('bot_automation_logs').insert({
        ...log,
        completed_at: log.status === 'completed' || log.status === 'failed' ? new Date().toISOString() : null
      });
    } catch (error) {
      console.error('Error logging automation:', error);
    }
  }

  /**
   * Obtém logs de automação
   */
  async getLogs(limit = 50): Promise<BotAutomationLog[]> {
    const { data, error } = await supabase
      .from('bot_automation_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching automation logs:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Obtém rodadas disponíveis para automação
   */
  async getAvailableRounds(): Promise<any[]> {
    const { data, error } = await supabase
      .from('rounds')
      .select('id, number, type, status, card_price, cards_sold, max_cards, selling_ends_at')
      .in('status', ['selling', 'scheduled', 'open'])
      .order('selling_ends_at', { ascending: true });

    if (error) {
      console.error('Error fetching available rounds:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Obtém estabelecimentos para seleção
   */
  async getEstablishments(): Promise<any[]> {
    const { data, error } = await supabase
      .from('establishments')
      .select('id, name, code, is_active')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching establishments:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Obtém estatísticas de automação
   */
  async getStats(): Promise<{
    total_bots_created: number;
    total_cards_generated: number;
    total_amount: number;
    executions_today: number;
    success_rate: number;
  }> {
    const today = new Date().toISOString().split('T')[0];

    const { data: allLogs } = await supabase
      .from('bot_automation_logs')
      .select('bots_created, cards_generated, total_amount, status, created_at');

    const { data: todayLogs } = await supabase
      .from('bot_automation_logs')
      .select('id')
      .gte('created_at', today);

    const logs = allLogs || [];
    const successfulLogs = logs.filter(l => l.status === 'completed');

    return {
      total_bots_created: logs.reduce((sum, l) => sum + (l.bots_created || 0), 0),
      total_cards_generated: logs.reduce((sum, l) => sum + (l.cards_generated || 0), 0),
      total_amount: logs.reduce((sum, l) => sum + parseFloat(l.total_amount || 0), 0),
      executions_today: todayLogs?.length || 0,
      success_rate: logs.length > 0 ? (successfulLogs.length / logs.length) * 100 : 100
    };
  }
}

export const botAutomationService = new BotAutomationService();
