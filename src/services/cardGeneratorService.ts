// Card Generator Service
// Geração automática de cartelas de bingo após confirmação de pagamento
import { supabase } from '../lib/supabase';

interface GeneratedCard {
  purchase_id: number;
  round_id: number;
  card_number: string;
  numbers: number[];
  is_special: boolean;
}

class CardGeneratorService {
  /**
   * Gerar número de cartela único (6 dígitos)
   */
  private async generateUniqueCardNumber(roundId: number): Promise<string> {
    let attempts = 0;
    const maxAttempts = 100;

    while (attempts < maxAttempts) {
      // Gerar número aleatório de 6 dígitos
      const cardNumber = Math.floor(100000 + Math.random() * 900000).toString();

      // Verificar se já existe
      const { data, error } = await supabase
        .from('cards')
        .select('id')
        .eq('round_id', roundId)
        .eq('card_number', cardNumber)
        .limit(1);

      if (error) {
        throw new Error(`Error checking card number: ${error.message}`);
      }

      if (!data || data.length === 0) {
        return cardNumber;
      }

      attempts++;
    }

    throw new Error('Failed to generate unique card number after 100 attempts');
  }

  /**
   * Gerar números aleatórios para uma cartela (sem repetição)
   * Cartela de bingo: 25 números (5x5)
   * Números de 1 a 75
   */
  private generateCardNumbers(): number[] {
    const numbers: number[] = [];
    const availableNumbers = Array.from({ length: 75 }, (_, i) => i + 1);

    // Embaralhar usando Fisher-Yates
    for (let i = availableNumbers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [availableNumbers[i], availableNumbers[j]] = [availableNumbers[j], availableNumbers[i]];
    }

    // Pegar os primeiros 25 números
    return availableNumbers.slice(0, 25).sort((a, b) => a - b);
  }

  /**
   * Validar se uma cartela tem números duplicados
   */
  private validateCard(numbers: number[]): boolean {
    const unique = new Set(numbers);
    return unique.size === numbers.length;
  }

  /**
   * Verificar se cartela já existe (mesma combinação de números)
   * Implementação simples: converte array para string ordenada
   */
  private async isDuplicateCard(roundId: number, numbers: number[]): Promise<boolean> {
    const sorted = [...numbers].sort((a, b) => a - b);

    const { data, error } = await supabase
      .from('cards')
      .select('numbers')
      .eq('round_id', roundId);

    if (error || !data) return false;

    return data.some(card => {
      const cardNumbers = Array.isArray(card.numbers) ? card.numbers : [];
      const cardSorted = [...cardNumbers].sort((a, b) => a - b);
      return JSON.stringify(sorted) === JSON.stringify(cardSorted);
    });
  }

  /**
   * Gerar uma cartela única
   */
  private async generateSingleCard(
    purchaseId: number,
    roundId: number,
    isSpecial: boolean
  ): Promise<GeneratedCard> {
    let attempts = 0;
    const maxAttempts = 50;

    while (attempts < maxAttempts) {
      const numbers = this.generateCardNumbers();

      // Validar
      if (!this.validateCard(numbers)) {
        attempts++;
        continue;
      }

      // Verificar duplicatas (opcional, pode ser desabilitado para performance)
      const isDuplicate = await this.isDuplicateCard(roundId, numbers);
      if (isDuplicate) {
        attempts++;
        continue;
      }

      // Gerar número único
      const cardNumber = await this.generateUniqueCardNumber(roundId);

      return {
        purchase_id: purchaseId,
        round_id: roundId,
        card_number: cardNumber,
        numbers,
        is_special: isSpecial,
      };
    }

    throw new Error('Failed to generate unique card after 50 attempts');
  }

  /**
   * Gerar múltiplas cartelas para uma purchase
   */
  async generateCardsForPurchase(purchaseId: number): Promise<{
    success: boolean;
    cards?: any[];
    error?: string;
  }> {
    try {
      // 1. Buscar informações da purchase
      const { data: purchase, error: purchaseError } = await supabase
        .from('purchases')
        .select('*, rounds(*)')
        .eq('id', purchaseId)
        .single();

      if (purchaseError || !purchase) {
        throw new Error('Purchase not found');
      }

      if (purchase.status !== 'confirmed') {
        throw new Error('Purchase not confirmed yet');
      }

      // Verificar se já tem cartelas
      const { data: existingCards } = await supabase
        .from('cards')
        .select('id')
        .eq('purchase_id', purchaseId);

      if (existingCards && existingCards.length > 0) {
        console.log(`Purchase ${purchaseId} already has ${existingCards.length} cards`);
        return {
          success: true,
          cards: existingCards,
        };
      }

      // 2. Gerar cartelas
      const quantity = purchase.quantity || 1;
      const roundId = purchase.round_id;
      const isSpecial = purchase.rounds?.type === 'special';

      console.log(`Generating ${quantity} cards for purchase ${purchaseId}, round ${roundId}`);

      const cardsToInsert: GeneratedCard[] = [];

      for (let i = 0; i < quantity; i++) {
        const card = await this.generateSingleCard(purchaseId, roundId, isSpecial);
        cardsToInsert.push(card);
      }

      // 3. Inserir todas as cartelas no banco
      const { data: insertedCards, error: insertError } = await supabase
        .from('cards')
        .insert(cardsToInsert)
        .select();

      if (insertError) {
        throw new Error(`Error inserting cards: ${insertError.message}`);
      }

      // 4. Atualizar purchase
      await supabase
        .from('purchases')
        .update({
          cards_generated: true,
          cards_generated_at: new Date().toISOString(),
        })
        .eq('id', purchaseId);

      console.log(`✅ Generated ${insertedCards.length} cards for purchase ${purchaseId}`);

      return {
        success: true,
        cards: insertedCards,
      };
    } catch (error: any) {
      console.error('Error generating cards:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Obter cartelas de uma purchase
   */
  async getCardsByPurchase(purchaseId: number): Promise<any[]> {
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .eq('purchase_id', purchaseId)
      .order('card_number');

    if (error) {
      console.error('Error fetching cards:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Formatar número da cartela para exibição
   * Ex: "123456" -> "SB-123456"
   */
  formatCardNumber(cardNumber: string): string {
    return `SB-${cardNumber}`;
  }

  /**
   * Gerar cartelas em lote (para admin)
   * Útil para gerar cartelas antecipadamente
   */
  async bulkGenerateCards(params: {
    roundId: number;
    quantity: number;
    isSpecial: boolean;
  }): Promise<{
    success: boolean;
    cards?: any[];
    error?: string;
  }> {
    try {
      // Criar purchase fictícia para admin
      const { data: adminPurchase, error: purchaseError } = await supabase
        .from('purchases')
        .insert({
          round_id: params.roundId,
          quantity: params.quantity,
          payment_method: 'admin_generated',
          status: 'confirmed',
          paid_at: new Date().toISOString(),
          payment_confirmed: true,
        })
        .select()
        .single();

      if (purchaseError || !adminPurchase) {
        throw new Error('Failed to create admin purchase');
      }

      // Gerar cartelas
      return await this.generateCardsForPurchase(adminPurchase.id);
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

export const cardGeneratorService = new CardGeneratorService();
