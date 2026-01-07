// Mock data for DEMO pages
// Structure matches exactly the Supabase database structure

// Helper function to generate bingo card numbers (25 numbers, 1-75)
export const generateCardNumbers = (): number[][] => {
  const grid: number[][] = [];

  for (let col = 0; col < 5; col++) {
    const column: number[] = [];
    const min = col * 15 + 1;
    const max = col * 15 + 15;
    const available = Array.from({ length: 15 }, (_, i) => min + i);

    for (let row = 0; row < 5; row++) {
      if (col === 2 && row === 2) {
        // Center is FREE space (0)
        column.push(0);
      } else {
        const randomIndex = Math.floor(Math.random() * available.length);
        column.push(available[randomIndex]);
        available.splice(randomIndex, 1);
      }
    }

    for (let row = 0; row < 5; row++) {
      if (!grid[row]) grid[row] = [];
      grid[row][col] = column[row];
    }
  }

  return grid;
};

// Helper to generate flat array of card numbers
export const generateFlatCardNumbers = (): number[] => {
  const grid = generateCardNumbers();
  return grid.flat();
};

// Mock Live Round (status: drawing - sorteio acontecendo)
export const mockLiveRound = {
  id: 999,
  number: 42,
  type: 'regular',
  status: 'drawing',
  card_price: '10.00',
  cards_sold: 847,
  max_cards: 1000,
  prize_pool: 1694.00,
  charity_percentage: 30,
  establishment_percentage: 50,
  platform_percentage: 20,
  drawn_numbers: [5, 12, 23, 34, 45, 56, 67, 3, 14, 25, 36, 47, 58, 69, 71],
  winner_card_id: null,
  is_selling: false,
  is_drawing: true,
  starts_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  selling_ends_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
  ends_at: new Date(Date.now() + 8 * 60 * 1000).toISOString(),
  drawing_started_at: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
  drawing_ended_at: null,
  created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  updated_at: new Date().toISOString(),
};

// Mock Selling Round (para checkout)
export const mockSellingRound = {
  id: 1000,
  number: 43,
  type: 'regular',
  status: 'selling',
  card_price: '10.00',
  cards_sold: 234,
  max_cards: 1000,
  prize_pool: 585.00,
  charity_percentage: 30,
  establishment_percentage: 50,
  platform_percentage: 20,
  drawn_numbers: [],
  winner_card_id: null,
  is_selling: true,
  is_drawing: false,
  starts_at: new Date(Date.now() + 2 * 60 * 1000).toISOString(),
  selling_ends_at: new Date(Date.now() + 7 * 60 * 1000).toISOString(),
  ends_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  drawing_started_at: null,
  drawing_ended_at: null,
  created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  updated_at: new Date().toISOString(),
};

// Mock future rounds for checkout
export const mockFutureRounds = [
  mockSellingRound,
  {
    ...mockSellingRound,
    id: 1001,
    number: 44,
    starts_at: new Date(Date.now() + 12 * 60 * 1000).toISOString(),
    selling_ends_at: new Date(Date.now() + 17 * 60 * 1000).toISOString(),
    ends_at: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
  },
  {
    ...mockSellingRound,
    id: 1002,
    number: 45,
    starts_at: new Date(Date.now() + 22 * 60 * 1000).toISOString(),
    selling_ends_at: new Date(Date.now() + 27 * 60 * 1000).toISOString(),
    ends_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  },
  {
    ...mockSellingRound,
    id: 1003,
    number: 46,
    starts_at: new Date(Date.now() + 32 * 60 * 1000).toISOString(),
    selling_ends_at: new Date(Date.now() + 37 * 60 * 1000).toISOString(),
    ends_at: new Date(Date.now() + 40 * 60 * 1000).toISOString(),
  },
  {
    ...mockSellingRound,
    id: 1004,
    number: 47,
    starts_at: new Date(Date.now() + 42 * 60 * 1000).toISOString(),
    selling_ends_at: new Date(Date.now() + 47 * 60 * 1000).toISOString(),
    ends_at: new Date(Date.now() + 50 * 60 * 1000).toISOString(),
  },
  {
    ...mockSellingRound,
    id: 1005,
    number: 48,
    starts_at: new Date(Date.now() + 52 * 60 * 1000).toISOString(),
    selling_ends_at: new Date(Date.now() + 57 * 60 * 1000).toISOString(),
    ends_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  },
];

// Mock Winning Card
export const mockWinningCard = {
  id: 'card-demo-001',
  code: 'SB-DEMO123',
  numbers: generateCardNumbers(),
  round_id: 999,
  purchase_id: 'purchase-demo-001',
  status: 'active',
  is_winner: false,
  prize_amount: null,
  created_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
  updated_at: new Date().toISOString(),
};

// Mock Generated Cards (after purchase)
export const mockGeneratedCards = [
  {
    id: 'card-demo-101',
    code: 'SB-DEMO101',
    numbers: generateCardNumbers(),
    round_id: 1000,
    purchase_id: 'purchase-demo-101',
    status: 'active',
    is_winner: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'card-demo-102',
    code: 'SB-DEMO102',
    numbers: generateCardNumbers(),
    round_id: 1000,
    purchase_id: 'purchase-demo-101',
    status: 'active',
    is_winner: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'card-demo-103',
    code: 'SB-DEMO103',
    numbers: generateCardNumbers(),
    round_id: 1000,
    purchase_id: 'purchase-demo-101',
    status: 'active',
    is_winner: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'card-demo-104',
    code: 'SB-DEMO104',
    numbers: generateCardNumbers(),
    round_id: 1000,
    purchase_id: 'purchase-demo-101',
    status: 'active',
    is_winner: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'card-demo-105',
    code: 'SB-DEMO105',
    numbers: generateCardNumbers(),
    round_id: 1000,
    purchase_id: 'purchase-demo-101',
    status: 'active',
    is_winner: false,
    created_at: new Date().toISOString(),
  },
];

// Mock Recent Winners (for TV Mode)
export const mockRecentWinners = [
  {
    id: 'winner-001',
    card_code: 'SB-ABC123',
    establishment_name: 'Bar do João',
    prize_amount: 850.00,
    round_number: 41,
    created_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
  },
  {
    id: 'winner-002',
    card_code: 'SB-XYZ789',
    establishment_name: 'Lanchonete Maria',
    prize_amount: 1200.00,
    round_number: 40,
    created_at: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
  },
  {
    id: 'winner-003',
    card_code: 'SB-QWE456',
    establishment_name: 'Padaria Central',
    prize_amount: 750.00,
    round_number: 39,
    tie_break_number: 7,
    created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
];

// Mock TV Mode Data
export const mockTVData = {
  liveRound: mockLiveRound,
  recentWinners: mockRecentWinners,
  establishment: {
    id: 1,
    name: 'Estabelecimento Demo',
    trade_name: 'Bar & Restaurante Demo',
    slug: 'bar-demo',
  },
  currentRound: {
    prize_pool: mockLiveRound.prize_pool,
    prizePool: mockLiveRound.prize_pool,
  },
};

// Mock Settings
export const mockSettings = {
  card_price_regular: '10.00',
  card_price_special: '15.00',
  regular_prize: 150,
  special_prize: 5000,
  accumulated_prize: 12500,
  charity_percentage: 30,
  establishment_percentage: 50,
  platform_percentage: 20,
};

// Mock Purchase Response (after creating purchase)
export const mockPurchaseResponse = {
  id: 'purchase-demo-101',
  purchase_id: 'purchase-demo-101',
  round_id: 1000,
  quantity: 5,
  total_amount: 25.00,
  payment_method: 'pix',
  payment_status: 'pending',
  customer_phone: null,
  pix: {
    code: 'PIX-DEMO-CODE-12345678901234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    qrcode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  },
  cards: mockGeneratedCards,
  created_at: new Date().toISOString(),
};

// Function to simulate drawing new numbers
export const getNextRandomNumber = (drawnNumbers: number[]): number => {
  const available = Array.from({ length: 75 }, (_, i) => i + 1)
    .filter(n => !drawnNumbers.includes(n));

  if (available.length === 0) return 0;

  return available[Math.floor(Math.random() * available.length)];
};

// Export all mock data
export default {
  mockLiveRound,
  mockSellingRound,
  mockFutureRounds,
  mockWinningCard,
  mockGeneratedCards,
  mockRecentWinners,
  mockTVData,
  mockSettings,
  mockPurchaseResponse,
  generateCardNumbers,
  generateFlatCardNumbers,
  getNextRandomNumber,
};
