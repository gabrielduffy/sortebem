// Mock data collections for SORTBEM platform

export interface Manager {
  id: string;
  fullName: string;
  cpf: string;
  whatsapp: string;
  email: string;
  address: string;
  pixKey: string;
  pixKeyType: 'cpf' | 'cnpj' | 'phone' | 'email' | 'random';
  kycStatus: 'pending' | 'approved' | 'rejected';
  referralCode: string;
  createdAt: Date;
  totalEstablishments: number;
  totalCommission: number;
}

export interface Establishment {
  id: string;
  cnpj: string;
  companyName: string;
  tradeName: string;
  address: string;
  legalRepName: string;
  legalRepCpf: string;
  whatsapp: string;
  email: string;
  pixKey: string;
  pixKeyType: 'cpf' | 'cnpj' | 'phone' | 'email' | 'random';
  kycStatus: 'pending' | 'approved' | 'rejected';
  managerId?: string;
  slug: string;
  referralCode: string;
  createdAt: Date;
  totalSales: number;
  totalCommission: number;
  isActive: boolean;
}

export interface Round {
  id: string;
  type: 'regular' | 'special';
  status: 'upcoming' | 'live' | 'finished';
  startTime: Date;
  endTime?: Date;
  drawnNumbers: number[];
  winnerId?: string;
  prizePool: number;
  totalCards: number;
  maxCards: number;
}

export interface Card {
  id: string;
  code: string;
  numbers: number[][];
  roundId: string;
  purchaseId: string;
  establishmentId: string;
  status: 'active' | 'won' | 'lost';
  markedNumbers: number[];
  autoMark: boolean;
  createdAt: Date;
}

export interface Purchase {
  id: string;
  establishmentId: string;
  cardCodes: string[];
  amount: number;
  quantity: number;
  paymentMethod: 'pix' | 'pos_card' | 'pos_pix';
  paymentStatus: 'pending' | 'confirmed' | 'failed';
  pixCode?: string;
  buyerWhatsapp?: string;
  createdAt: Date;
}

export interface Winner {
  id: string;
  roundId: string;
  cardId: string;
  establishmentId: string;
  establishmentName: string;
  prizeAmount: number;
  pattern: 'line' | 'column' | 'full' | 'diagonal';
  tieBreakNumber?: number;
  createdAt: Date;
}

export interface Charity {
  id: string;
  name: string;
  logo: string;
  description: string;
  isActive: boolean;
  month: number;
  year: number;
  totalRaised: number;
}

export interface Settings {
  cardPriceRegular: number;
  cardPriceSpecial: number;
  platformPercent: number;
  charityPercent: number;
  establishmentCommission: number;
  managerCommission: number;
  prizePoolPercent: number;
  specialPoolPercent: number;
  bonusPoolPercent: number;
  tieBreakWindowMs: number;
  minNumber: number;
  maxNumber: number;
  maxCardsPerRound: number;
  winPatterns: string[];
}

export interface DrawSettings {
  // Aparência
  cardFont: string;
  cardFontSize: number;
  codeFontSize: number;
  cardBgColor: string;
  numberColor: string;
  markedNumberColor: string;
  markedBgColor: string;
  enableAnimations: boolean;
  
  // Tempo e Ritmo
  intervalBetweenNumbers: number;
  animationDuration: number;
  initialDelay: number;
  maxRoundTime: number;
  autoPauseEnabled: boolean;
  autoPauseTimeout: number;
  
  // Voz IA
  voiceEnabled: boolean;
  voiceProvider: string;
  voiceId: string;
  voiceLanguage: string;
  voiceSpeed: number;
  voiceVolume: number;
  voiceFormat: 'number_x' | 'only_number' | 'column_number';
  
  // Regras
  minNumber: number;
  maxNumber: number;
  winPatterns: string[];
  multiplePatterns: boolean;
  maxCardsPerRound: number;
  maxCardsPerUser: number | null;
  
  // Desempate
  tieBreakMethod: 'stone' | 'first_claim' | 'split_prize';
  tieBreakWindowMs: number;
  stoneMin: number;
  stoneMax: number;
  showStonePublicly: boolean;
  tieBreakAnimation: boolean;
  
  // Modo TV
  tvFont: string;
  tvFontSize: number;
  tvBgColor: string;
  tvNumberColor: string;
  showWinnersHistory: boolean;
  winnersHistoryCount: number;
  winnerDisplayTime: number;
  autoRotateInfo: boolean;
}

export interface Withdrawal {
  id: string;
  cardCode: string;
  amount: number;
  pixKeyType: string;
  pixKey: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  userType: 'admin' | 'manager' | 'establishment';
  category: 'sales' | 'rounds' | 'prizes' | 'system' | 'pos' | 'whatsapp';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

export interface TieBreak {
  id: string;
  roundId: string;
  cardIds: string[];
  stoneNumber: number;
  winnerId: string;
  resolvedAt: Date;
}

export interface WhatsappLog {
  id: string;
  phone: string;
  cardCodes: string[];
  status: 'sent' | 'delivered' | 'failed';
  createdAt: Date;
}

export interface PosTerminal {
  id: string;
  terminalId: string;
  establishmentId: string;
  apiKey: string;
  isActive: boolean;
  lastActivity?: Date;
  createdAt: Date;
}

export interface PosSale {
  id: string;
  terminalId: string;
  purchaseId: string;
  cardsPrinted: number;
  createdAt: Date;
}

// Mock data instances
export const mockSettings: Settings = {
  cardPriceRegular: 5.00,
  cardPriceSpecial: 10.00,
  platformPercent: 10,
  charityPercent: 20,
  establishmentCommission: 15,
  managerCommission: 5,
  prizePoolPercent: 40,
  specialPoolPercent: 5,
  bonusPoolPercent: 5,
  tieBreakWindowMs: 5000,
  minNumber: 1,
  maxNumber: 75,
  maxCardsPerRound: 10000,
  winPatterns: ['line', 'column', 'full', 'diagonal'],
};

export const mockCharity: Charity = {
  id: '1',
  name: 'Instituto Criança Feliz',
  logo: '/placeholder.svg',
  description: 'Ajudando crianças em situação de vulnerabilidade social através da educação e alimentação.',
  isActive: true,
  month: 12,
  year: 2024,
  totalRaised: 127845.50,
};

export const mockCurrentRound: Round = {
  id: 'round-001',
  type: 'regular',
  status: 'live',
  startTime: new Date(),
  drawnNumbers: [5, 23, 47, 12, 68, 31, 9, 56, 73, 2],
  prizePool: 15000,
  totalCards: 2847,
  maxCards: 10000,
};

export const mockSpecialRound: Round = {
  id: 'round-special-001',
  type: 'special',
  status: 'upcoming',
  startTime: new Date(Date.now() + 45 * 60 * 1000),
  drawnNumbers: [],
  prizePool: 85000,
  totalCards: 0,
  maxCards: 50000,
};

export const generateCardNumbers = (): number[][] => {
  const grid: number[][] = [];
  const usedNumbers = new Set<number>();
  
  for (let row = 0; row < 5; row++) {
    const rowNumbers: number[] = [];
    for (let col = 0; col < 5; col++) {
      if (row === 2 && col === 2) {
        rowNumbers.push(0); // Center is SORTBEM logo
      } else {
        let num: number;
        const min = col * 15 + 1;
        const max = (col + 1) * 15;
        do {
          num = Math.floor(Math.random() * (max - min + 1)) + min;
        } while (usedNumbers.has(num));
        usedNumbers.add(num);
        rowNumbers.push(num);
      }
    }
    grid.push(rowNumbers);
  }
  
  return grid;
};

export const generateCardCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'SB-';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const mockCard: Card = {
  id: 'card-001',
  code: 'SB-A7K3M9P2',
  numbers: generateCardNumbers(),
  roundId: 'round-001',
  purchaseId: 'purchase-001',
  establishmentId: 'est-001',
  status: 'active',
  markedNumbers: [],
  autoMark: false,
  createdAt: new Date(),
};

export const mockEstablishment: Establishment = {
  id: 'est-001',
  cnpj: '12.345.678/0001-90',
  companyName: 'Padaria do João LTDA',
  tradeName: 'Padaria do João',
  address: 'Rua das Flores, 123 - Centro, São Paulo - SP',
  legalRepName: 'João da Silva',
  legalRepCpf: '123.456.789-00',
  whatsapp: '11999999999',
  email: 'contato@padariadojoao.com',
  pixKey: '12345678000190',
  pixKeyType: 'cnpj',
  kycStatus: 'approved',
  managerId: 'manager-001',
  slug: 'padaria-do-joao',
  referralCode: 'PDJ2024',
  createdAt: new Date(),
  totalSales: 45780,
  totalCommission: 6867,
  isActive: true,
};

export const mockRecentWinners: Winner[] = [
  {
    id: 'win-001',
    roundId: 'round-099',
    cardId: 'card-099',
    establishmentId: 'est-001',
    establishmentName: 'Padaria do João',
    prizeAmount: 12500,
    pattern: 'full',
    createdAt: new Date(Date.now() - 10 * 60 * 1000),
  },
  {
    id: 'win-002',
    roundId: 'round-098',
    cardId: 'card-098',
    establishmentId: 'est-002',
    establishmentName: 'Mercado Central',
    prizeAmount: 8750,
    pattern: 'line',
    createdAt: new Date(Date.now() - 20 * 60 * 1000),
  },
  {
    id: 'win-003',
    roundId: 'round-097',
    cardId: 'card-097',
    establishmentId: 'est-003',
    establishmentName: 'Bar do Zé',
    prizeAmount: 15000,
    pattern: 'column',
    tieBreakNumber: 42,
    createdAt: new Date(Date.now() - 30 * 60 * 1000),
  },
];

export const mockNotifications: Notification[] = [
  {
    id: 'notif-001',
    userId: 'est-001',
    userType: 'establishment',
    category: 'sales',
    title: 'Nova venda realizada!',
    message: '5 cartelas vendidas - R$ 25,00',
    isRead: false,
    createdAt: new Date(),
  },
  {
    id: 'notif-002',
    userId: 'est-001',
    userType: 'establishment',
    category: 'prizes',
    title: 'Vitória! 🎉',
    message: 'Uma cartela do seu estabelecimento ganhou R$ 12.500!',
    isRead: false,
    createdAt: new Date(Date.now() - 5 * 60 * 1000),
  },
];
