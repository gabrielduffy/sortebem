// Groq AI Service
// Integração com Groq AI para geração de conteúdo e analytics
import { supabase } from '../lib/supabase';

interface GroqConfig {
  apiKey: string;
  enabled: boolean;
}

interface GroqPrompt {
  id: number;
  name: string;
  description: string;
  system_prompt: string;
  user_prompt_template: string;
  model: string;
  temperature: number;
  max_tokens: number;
  is_active: boolean;
  category: string;
}

interface GroqChatRequest {
  model: string;
  messages: {
    role: 'system' | 'user' | 'assistant';
    content: string;
  }[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stream?: boolean;
}

interface GroqChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface GroqResult {
  success: boolean;
  content?: string;
  error?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  duration_ms?: number;
}

class GroqService {
  private baseUrl = 'https://api.groq.com/openai/v1';

  /**
   * Obter configuração Groq do banco
   */
  private async getConfig(): Promise<GroqConfig | null> {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'groq_config')
        .single();

      if (error || !data) {
        console.warn('Groq config not found in settings');
        return null;
      }

      return data.value as GroqConfig;
    } catch (error) {
      console.error('Error fetching Groq config:', error);
      return null;
    }
  }

  /**
   * Fazer requisição para API Groq
   */
  private async request(
    endpoint: string,
    method: 'GET' | 'POST' = 'POST',
    body?: any
  ): Promise<any> {
    const config = await this.getConfig();

    if (!config || !config.apiKey) {
      throw new Error('Groq API key not configured');
    }

    if (!config.enabled) {
      throw new Error('Groq integration is disabled');
    }

    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `Groq API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Chat completion usando Groq
   */
  async chat(request: GroqChatRequest): Promise<GroqChatResponse> {
    try {
      const response = await this.request('/chat/completions', 'POST', request);
      return response;
    } catch (error: any) {
      throw new Error(`Groq chat error: ${error.message}`);
    }
  }

  /**
   * Buscar prompt por nome
   */
  async getPromptByName(name: string): Promise<GroqPrompt | null> {
    try {
      const { data, error } = await supabase
        .from('groq_prompts')
        .select('*')
        .eq('name', name)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        console.warn(`Prompt ${name} not found`);
        return null;
      }

      return data as GroqPrompt;
    } catch (error) {
      console.error('Error fetching prompt:', error);
      return null;
    }
  }

  /**
   * Renderizar template de prompt substituindo variáveis
   * Ex: "Olá {{name}}" com {name: "João"} => "Olá João"
   */
  private renderTemplate(template: string, variables: Record<string, any>): string {
    let rendered = template;

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      rendered = rendered.replace(regex, String(value));
    }

    return rendered;
  }

  /**
   * Executar prompt por nome com variáveis
   */
  async executePrompt(
    promptName: string,
    variables: Record<string, any> = {},
    options?: {
      userId?: number;
      establishmentId?: number;
      overrideModel?: string;
      overrideTemperature?: number;
      overrideMaxTokens?: number;
    }
  ): Promise<GroqResult> {
    const startTime = Date.now();

    try {
      // 1. Buscar prompt
      const prompt = await this.getPromptByName(promptName);

      if (!prompt) {
        return {
          success: false,
          error: `Prompt "${promptName}" not found or inactive`,
        };
      }

      // 2. Renderizar template
      const userPrompt = this.renderTemplate(prompt.user_prompt_template, variables);

      // 3. Montar requisição
      const chatRequest: GroqChatRequest = {
        model: options?.overrideModel || prompt.model,
        messages: [
          {
            role: 'system',
            content: prompt.system_prompt,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        temperature: options?.overrideTemperature ?? prompt.temperature,
        max_tokens: options?.overrideMaxTokens ?? prompt.max_tokens,
      };

      // 4. Fazer requisição
      const response = await this.chat(chatRequest);

      const duration = Date.now() - startTime;

      // 5. Logar uso
      await this.logUsage({
        promptId: prompt.id,
        promptName: prompt.name,
        model: chatRequest.model,
        userId: options?.userId,
        establishmentId: options?.establishmentId,
        request: chatRequest,
        response: response,
        tokensPrompt: response.usage.prompt_tokens,
        tokensCompletion: response.usage.completion_tokens,
        durationMs: duration,
        success: true,
      });

      // 6. Retornar resultado
      return {
        success: true,
        content: response.choices[0]?.message?.content || '',
        usage: {
          prompt_tokens: response.usage.prompt_tokens,
          completion_tokens: response.usage.completion_tokens,
          total_tokens: response.usage.total_tokens,
        },
        duration_ms: duration,
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;

      // Logar erro
      await this.logUsage({
        promptId: null,
        promptName: promptName,
        model: 'unknown',
        userId: options?.userId,
        establishmentId: options?.establishmentId,
        request: { variables },
        response: null,
        tokensPrompt: 0,
        tokensCompletion: 0,
        durationMs: duration,
        success: false,
        errorMessage: error.message,
      });

      return {
        success: false,
        error: error.message,
        duration_ms: duration,
      };
    }
  }

  /**
   * Logar uso da API Groq
   */
  private async logUsage(params: {
    promptId: number | null;
    promptName: string;
    model: string;
    userId?: number;
    establishmentId?: number;
    request: any;
    response: any;
    tokensPrompt: number;
    tokensCompletion: number;
    durationMs: number;
    success: boolean;
    errorMessage?: string;
  }): Promise<void> {
    try {
      const { error } = await supabase.rpc('log_groq_usage', {
        p_prompt_id: params.promptId,
        p_prompt_name: params.promptName,
        p_model: params.model,
        p_user_id: params.userId || null,
        p_establishment_id: params.establishmentId || null,
        p_request: params.request,
        p_response: params.response,
        p_tokens_prompt: params.tokensPrompt,
        p_tokens_completion: params.tokensCompletion,
        p_duration_ms: params.durationMs,
        p_success: params.success,
        p_error_message: params.errorMessage || null,
      });

      if (error) {
        console.error('Error logging Groq usage:', error);
      }
    } catch (error) {
      console.error('Error logging Groq usage:', error);
    }
  }

  /**
   * Gerar nome de jogador usando AI
   */
  async generatePlayerName(): Promise<string | null> {
    const result = await this.executePrompt('generate_player_name');

    if (!result.success || !result.content) {
      return null;
    }

    return result.content.trim();
  }

  /**
   * Gerar múltiplos nomes de jogadores
   */
  async generateMultiplePlayerNames(
    quantity: number,
    establishmentName: string,
    establishmentId?: number
  ): Promise<string[]> {
    const result = await this.executePrompt(
      'generate_multiple_players',
      {
        quantity: quantity.toString(),
        establishment_name: establishmentName,
      },
      {
        establishmentId,
      }
    );

    if (!result.success || !result.content) {
      console.error('Failed to generate player names:', result.error);
      return [];
    }

    try {
      // Tentar parsear JSON
      const names = JSON.parse(result.content);

      if (Array.isArray(names)) {
        return names.filter(name => typeof name === 'string');
      }

      return [];
    } catch (error) {
      console.error('Failed to parse player names:', error);
      return [];
    }
  }

  /**
   * Analisar performance de rodada
   */
  async analyzeRoundPerformance(params: {
    cardsSold: number;
    revenue: number;
    prize: number;
    winners: number;
    establishmentId?: number;
    userId?: number;
  }): Promise<string | null> {
    const result = await this.executePrompt(
      'analyze_round_performance',
      {
        cards_sold: params.cardsSold.toString(),
        revenue: params.revenue.toFixed(2),
        prize: params.prize.toFixed(2),
        winners: params.winners.toString(),
      },
      {
        establishmentId: params.establishmentId,
        userId: params.userId,
      }
    );

    if (!result.success || !result.content) {
      return null;
    }

    return result.content;
  }

  /**
   * Sugerir preço de cartela
   */
  async suggestCardPrice(params: {
    avgPrice: number;
    avgSalesRate: number;
    prize: number;
    establishmentId?: number;
  }): Promise<string | null> {
    const result = await this.executePrompt(
      'suggest_card_price',
      {
        avg_price: params.avgPrice.toFixed(2),
        avg_sales_rate: params.avgSalesRate.toFixed(1),
        prize: params.prize.toFixed(2),
      },
      {
        establishmentId: params.establishmentId,
      }
    );

    if (!result.success || !result.content) {
      return null;
    }

    return result.content;
  }

  /**
   * Listar todos os prompts ativos
   */
  async listPrompts(category?: string): Promise<GroqPrompt[]> {
    try {
      let query = supabase
        .from('groq_prompts')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching prompts:', error);
        return [];
      }

      return (data || []) as GroqPrompt[];
    } catch (error) {
      console.error('Error fetching prompts:', error);
      return [];
    }
  }

  /**
   * Testar prompt com variáveis customizadas
   */
  async testPrompt(params: {
    promptName: string;
    variables: Record<string, any>;
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }): Promise<GroqResult> {
    return await this.executePrompt(
      params.promptName,
      params.variables,
      {
        overrideModel: params.model,
        overrideTemperature: params.temperature,
        overrideMaxTokens: params.maxTokens,
      }
    );
  }

  /**
   * Obter estatísticas de uso
   */
  async getUsageStats(days: number = 30): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('v_groq_usage_stats')
        .select('*')
        .gte('date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching usage stats:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching usage stats:', error);
      return [];
    }
  }
}

export const groqService = new GroqService();
