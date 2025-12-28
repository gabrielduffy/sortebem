// Mock API services for SORTBEM platform

import {
  mockSettings,
  mockCharity,
  mockCurrentRound,
  mockSpecialRound,
  mockCard,
  mockEstablishment,
  mockRecentWinners,
  mockNotifications,
  generateCardNumbers,
  generateCardCode,
  type Card,
  type Purchase,
  type Withdrawal,
  type Round,
  type Winner,
  type Notification,
  type Charity,
  type Settings,
  type Establishment,
  type PosTerminal,
  type PosSale,
} from './mockData';

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Round & Draw services
export const getCurrentRound = async (): Promise<Round> => {
  await delay(200);
  return { ...mockCurrentRound, drawnNumbers: [...mockCurrentRound.drawnNumbers] };
};

export const getSpecialRound = async (): Promise<Round> => {
  await delay(200);
  return { ...mockSpecialRound };
};

export const getLiveDraw = async (roundId: string): Promise<number[]> => {
  await delay(100);
  // Simulate live draw by returning incrementally more numbers
  const allNumbers = [5, 23, 47, 12, 68, 31, 9, 56, 73, 2, 44, 18, 65, 7, 33, 51, 29, 70, 14, 60];
  const currentCount = Math.min(mockCurrentRound.drawnNumbers.length + 1, allNumbers.length);
  return allNumbers.slice(0, currentCount);
};

// Purchase services
export const createPixPurchase = async (
  quantity: number,
  establishmentId: string
): Promise<{ purchaseId: string; pixCode: string; pixQrCode: string; amount: number }> => {
  await delay(500);
  const amount = quantity * mockSettings.cardPriceRegular;
  return {
    purchaseId: `purchase-${Date.now()}`,
    pixCode: `00020126580014br.gov.bcb.pix0136${Date.now()}520400005303986540${amount.toFixed(2)}5802BR`,
    pixQrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=pix-${Date.now()}`,
    amount,
  };
};

export const pollPurchaseStatus = async (purchaseId: string): Promise<'pending' | 'confirmed' | 'failed'> => {
  await delay(300);
  // Simulate random confirmation after a few polls
  const random = Math.random();
  if (random > 0.7) return 'confirmed';
  return 'pending';
};

// Card services
export const generateCards = async (
  purchaseId: string,
  quantity: number,
  establishmentId: string
): Promise<Card[]> => {
  await delay(300);
  const cards: Card[] = [];
  for (let i = 0; i < quantity; i++) {
    cards.push({
      id: `card-${Date.now()}-${i}`,
      code: generateCardCode(),
      numbers: generateCardNumbers(),
      roundId: mockCurrentRound.id,
      purchaseId,
      establishmentId,
      status: 'active',
      markedNumbers: [],
      autoMark: false,
      createdAt: new Date(),
    });
  }
  return cards;
};

export const getCardByCode = async (code: string): Promise<Card | null> => {
  await delay(300);
  if (code.startsWith('SB-')) {
    return {
      ...mockCard,
      code,
      numbers: generateCardNumbers(),
    };
  }
  return null;
};

export const toggleAutoMark = async (cardId: string, enabled: boolean): Promise<boolean> => {
  await delay(100);
  return enabled;
};

export const submitWinClaim = async (cardId: string): Promise<{ success: boolean; message: string }> => {
  await delay(500);
  const random = Math.random();
  if (random > 0.8) {
    return { success: true, message: 'Parabéns! Sua cartela foi validada. Você ganhou!' };
  }
  return { success: false, message: 'Ainda faltam números para completar o padrão de vitória.' };
};

// WhatsApp services
export const saveBuyerWhatsapp = async (purchaseId: string, whatsapp: string): Promise<boolean> => {
  await delay(200);
  return true;
};

export const sendCardsWhatsapp = async (cardCodes: string[], whatsapp: string): Promise<boolean> => {
  await delay(500);
  console.log(`Sending cards ${cardCodes.join(', ')} to ${whatsapp}`);
  return true;
};

// Tie Break services
export const getTieBreakStatus = async (roundId: string): Promise<{ 
  hasTie: boolean; 
  stoneNumber?: number; 
  winnerId?: string;
  winnerEstablishment?: string;
}> => {
  await delay(200);
  const random = Math.random();
  if (random > 0.9) {
    return {
      hasTie: true,
      stoneNumber: Math.floor(Math.random() * 75) + 1,
      winnerId: 'card-tiebreak',
      winnerEstablishment: 'Mercado Central',
    };
  }
  return { hasTie: false };
};

// Withdrawal services
export const checkCardPrize = async (code: string): Promise<{ hasPrize: boolean; amount: number }> => {
  await delay(400);
  // Mock: 20% chance of being a winner
  if (Math.random() > 0.8) {
    return { hasPrize: true, amount: Math.floor(Math.random() * 10000) + 1000 };
  }
  return { hasPrize: false, amount: 0 };
};

export const requestWithdraw = async (
  cardCode: string,
  pixKeyType: string,
  pixKey: string
): Promise<Withdrawal> => {
  await delay(500);
  return {
    id: `withdraw-${Date.now()}`,
    cardCode,
    amount: Math.floor(Math.random() * 10000) + 1000,
    pixKeyType,
    pixKey,
    status: 'pending',
    createdAt: new Date(),
  };
};

export const getWithdrawHistory = async (cardCode: string): Promise<Withdrawal[]> => {
  await delay(300);
  return [
    {
      id: 'withdraw-001',
      cardCode: 'SB-XXXXX123',
      amount: 5000,
      pixKeyType: 'cpf',
      pixKey: '***.***.789-00',
      status: 'completed',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
  ];
};

// Notification services
export const listNotifications = async (userId: string): Promise<Notification[]> => {
  await delay(200);
  return mockNotifications.filter(n => n.userId === userId);
};

export const markNotificationRead = async (notificationId: string): Promise<boolean> => {
  await delay(100);
  return true;
};

// TV Mode services
export const getTVData = async (establishmentSlug: string): Promise<{
  establishment: Establishment;
  currentRound: Round;
  recentWinners: Winner[];
}> => {
  await delay(300);
  return {
    establishment: { ...mockEstablishment, slug: establishmentSlug },
    currentRound: { ...mockCurrentRound },
    recentWinners: [...mockRecentWinners],
  };
};

// POS services
export const registerPosTerminal = async (
  establishmentId: string,
  terminalId: string
): Promise<PosTerminal> => {
  await delay(300);
  return {
    id: `pos-${Date.now()}`,
    terminalId,
    establishmentId,
    apiKey: `pk_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    isActive: true,
    createdAt: new Date(),
  };
};

export const listPosTerminals = async (establishmentId: string): Promise<PosTerminal[]> => {
  await delay(200);
  return [
    {
      id: 'pos-001',
      terminalId: 'SMART2-001',
      establishmentId,
      apiKey: 'pk_live_xxxxxxxxxxxx',
      isActive: true,
      lastActivity: new Date(Date.now() - 30 * 60 * 1000),
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    },
  ];
};

export const listPosSales = async (terminalId: string): Promise<PosSale[]> => {
  await delay(200);
  return [
    {
      id: 'pos-sale-001',
      terminalId,
      purchaseId: 'purchase-pos-001',
      cardsPrinted: 5,
      createdAt: new Date(Date.now() - 10 * 60 * 1000),
    },
    {
      id: 'pos-sale-002',
      terminalId,
      purchaseId: 'purchase-pos-002',
      cardsPrinted: 3,
      createdAt: new Date(Date.now() - 25 * 60 * 1000),
    },
  ];
};

// Settings services
export const getSettings = async (): Promise<Settings> => {
  await delay(200);
  return { ...mockSettings };
};

export const updateSettings = async (settings: Partial<Settings>): Promise<Settings> => {
  await delay(300);
  return { ...mockSettings, ...settings };
};

// Charity services
export const getCurrentCharity = async (): Promise<Charity> => {
  await delay(200);
  return { ...mockCharity };
};

export const getCharityRaisedAmount = async (): Promise<number> => {
  await delay(100);
  // Simulate real-time increase
  return mockCharity.totalRaised + Math.random() * 100;
};

// Winners services
export const getRecentWinners = async (limit: number = 10): Promise<Winner[]> => {
  await delay(200);
  return mockRecentWinners.slice(0, limit);
};

// Establishment services
export const getEstablishmentBySlug = async (slug: string): Promise<Establishment | null> => {
  await delay(200);
  if (slug) {
    return { ...mockEstablishment, slug };
  }
  return null;
};

export const getEstablishmentStats = async (establishmentId: string): Promise<{
  todaySales: number;
  monthSales: number;
  totalCommission: number;
  totalWins: number;
}> => {
  await delay(200);
  return {
    todaySales: 2450,
    monthSales: 45780,
    totalCommission: 6867,
    totalWins: 12,
  };
};
