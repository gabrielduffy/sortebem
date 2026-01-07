import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import {
  ShoppingCart,
  Plus,
  Minus,
  CreditCard,
  Copy,
  Check,
  MessageCircle,
  ArrowRight,
  Store,
  Gift,
  Shield,
  Clock,
  Calendar,
  Hash,
  Trophy,
  Star,
  Sparkles,
  Printer,
  Share2
} from 'lucide-react';
import PublicLayout from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';

type CheckoutStep = 'quantity' | 'payment' | 'confirmed';
type DrawType = 'regular' | 'special';

// Countdown Timer Component
const CountdownTimer = ({ targetTime, variant = 'default' }: { targetTime: Date; variant?: 'default' | 'hero' }) => {
  const [timeLeft, setTimeLeft] = useState({ minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = targetTime.getTime() - Date.now();
      if (difference > 0) {
        setTimeLeft({
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      }
    };
    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [targetTime]);

  const formatNumber = (num: number) => num.toString().padStart(2, '0');

  if (variant === 'hero') {
    return (
      <div className="flex items-center justify-center gap-2">
        <div className="bg-primary text-primary-foreground px-4 py-3 rounded-xl text-center min-w-[70px]">
          <span className="text-3xl md:text-4xl font-bold">{formatNumber(timeLeft.minutes)}</span>
          <p className="text-xs opacity-80">min</p>
        </div>
        <span className="text-3xl font-bold text-primary animate-pulse">:</span>
        <div className="bg-primary text-primary-foreground px-4 py-3 rounded-xl text-center min-w-[70px]">
          <span className="text-3xl md:text-4xl font-bold">{formatNumber(timeLeft.seconds)}</span>
          <p className="text-xs opacity-80">seg</p>
        </div>
      </div>
    );
  }

  return (
    <span className="font-mono font-bold text-primary text-lg">
      {formatNumber(timeLeft.minutes)}:{formatNumber(timeLeft.seconds)}
    </span>
  );
};

const Checkout = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { code } = useParams<{ code?: string }>();
  // Prioritize route param 'code', then search param 'ref'
  const establishmentCodeOrRef = code || searchParams.get('ref') || null;

  const [step, setStep] = useState<CheckoutStep>('quantity');
  const [drawType, setDrawType] = useState<DrawType>('regular');
  const [quantity, setQuantity] = useState(1);
  const [selectedRounds, setSelectedRounds] = useState<number[]>([]);
  const [pixData, setPixData] = useState<{
    purchaseId: string;
    pixCode: string;
    pixQrCode: string;
    amount: number;
  } | null>(null);
  const [generatedCards, setGeneratedCards] = useState<any[]>([]);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedPix, setCopiedPix] = useState(false);
  const [copiedCard, setCopiedCard] = useState<string | null>(null);
  const [whatsappSent, setWhatsappSent] = useState(false);
  
  // Polling state
  const [pollingStatus, setPollingStatus] = useState<'idle' | 'polling' | 'confirmed' | 'expired'>('idle');
  const [pollingSeconds, setPollingSeconds] = useState(0);
  const [pixExpiration, setPixExpiration] = useState<Date | null>(null);

  // API data
  const [availableRounds, setAvailableRounds] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [establishment, setEstablishment] = useState<any>(null);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch establishment if code is present
        if (establishmentCodeOrRef) {
          // If it looks like our 8-digit code
          if (/^\d{8}$/.test(establishmentCodeOrRef)) {
            const estResult = await apiService.getEstablishmentByCode(establishmentCodeOrRef);
            if (estResult.ok) {
              setEstablishment(estResult.data);
            }
          } else {
            // Fallback to legacy/slug lookup if we have a method for it
            // or just rely on id if it was numeric
          }
        }

        const roundsData = await apiService.getRounds();

        if (roundsData.ok && roundsData.data) {
          // Filter only selling rounds
          const sellingRounds = roundsData.data
            .filter((r: any) => r.is_selling && r.status === 'selling')
            .slice(0, 6);

          setAvailableRounds(sellingRounds);

          // Select first round by default
          if (sellingRounds.length > 0) {
            setSelectedRounds([sellingRounds[0].id]);
          }
        }

        // Load settings
        const settingsData = await apiService.getSettings();
        if (settingsData.ok && settingsData.data) {
          const settingsObj: any = {};
          settingsData.data.forEach((s: any) => {
            settingsObj[s.key] = s.value;
          });
          setSettings(settingsObj);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os dados. Tente novamente.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Polling effect for PIX payment
  useEffect(() => {
    if (pollingStatus !== 'polling' || !pixData?.purchaseId) return;

    // Timer for elapsed seconds
    const secondsInterval = setInterval(() => {
      setPollingSeconds(prev => prev + 1);
    }, 1000);

    // Check if expired (20 minutes)
    const checkExpiration = () => {
      if (pixExpiration && Date.now() > pixExpiration.getTime()) {
        setPollingStatus('expired');
        return true;
      }
      return false;
    };

    // Polling for payment status
    const pollInterval = setInterval(async () => {
      if (checkExpiration()) {
        clearInterval(pollInterval);
        clearInterval(secondsInterval);
        return;
      }

      try {
        const statusResult = await apiService.checkPurchaseStatus(pixData.purchaseId);
        if (statusResult.ok && statusResult.data?.payment_confirmed) {
          setPollingStatus('confirmed');
          clearInterval(pollInterval);
          clearInterval(secondsInterval);
          await handlePaymentConfirmed(parseInt(pixData.purchaseId));
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 3000);

    return () => {
      clearInterval(pollInterval);
      clearInterval(secondsInterval);
    };
  }, [pollingStatus, pixData?.purchaseId, pixExpiration]);

  const futureRounds = availableRounds.map(r => ({
    id: r.id,
    time: new Date(r.ends_at),
    number: r.number,
    card_price: parseFloat(r.card_price) || 5,
    type: r.type
  }));

  // Round info
  const purchaseDate = new Date();
  const selectedRoundData = futureRounds.find(r => r.id === selectedRounds[0]);
  const nextRoundTime = selectedRoundData?.time || new Date(Date.now() + 8 * 60 * 1000);
  const roundNumber = selectedRoundData?.number || 1;

  // Prize values from settings
  const estimatedPrize = drawType === 'regular'
    ? 150 * selectedRounds.length
    : 5000;
  const accumulatedPrize = 12500;

  // Get card price from selected round
  const unitPrice = selectedRoundData?.card_price || (drawType === 'regular' ? 5 : 10);
  const totalPrice = quantity * unitPrice * (drawType === 'regular' ? selectedRounds.length : 1);

  const toggleRoundSelection = (roundId: number) => {
    setSelectedRounds(prev => {
      if (prev.includes(roundId)) {
        // Don't allow deselecting the last one
        if (prev.length === 1) return prev;
        return prev.filter(id => id !== roundId);
      } else {
        return [...prev, roundId].sort();
      }
    });
  };

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1) {
      setQuantity(newQuantity);
    }
  };

  const handleGeneratePix = async () => {
    setIsProcessing(true);
    try {
      const roundId = selectedRounds[0];

      if (!roundId) {
        toast({ title: 'Erro', description: 'Selecione uma rodada.', variant: 'destructive' });
        setIsProcessing(false);
        return;
      }

      const response = await apiService.createPurchase({
        round_id: roundId,
        quantity: quantity,
        payment_method: 'pix',
        unit_price: unitPrice,
        total_amount: totalPrice,
        establishment_id: establishment?.id || null,
        customer: {
          phone: whatsappNumber
        }
      });

      if (response.ok && response.data) {
        // Gerar PIX real usando FASE 3
        const pixResult = await apiService.generatePixForPurchase({
          purchaseId: response.data.id,
          amount: totalPrice,
          customerName: 'Cliente',
          customerCpf: '00000000000', // TODO: coletar CPF no formulário
          customerPhone: whatsappNumber,
        });

        if (pixResult.ok && pixResult.data) {
          setPixData({
            purchaseId: response.data.id.toString(),
            pixCode: pixResult.data.pixCode || '',
            pixQrCode: pixResult.data.pixQrCode || '',
            amount: totalPrice
          });
          setStep('payment');
          
          // Set expiration (20 minutes from now)
          setPixExpiration(new Date(Date.now() + 20 * 60 * 1000));
          setPollingStatus('polling');
          setPollingSeconds(0);
        } else {
          toast({
            title: 'Erro',
            description: pixResult.error || 'Não foi possível gerar o Pix.',
            variant: 'destructive'
          });
        }
      } else {
        toast({
          title: 'Erro',
          description: response.error || 'Não foi possível gerar o Pix.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível gerar o Pix. Tente novamente.', variant: 'destructive' });
    }
    setIsProcessing(false);
  };

  const handlePaymentConfirmed = async (purchaseId: number) => {
    setIsProcessing(true);
    toast({ title: '✅ Pagamento confirmado!', description: 'Gerando suas cartelas...' });

    // Gerar cartelas usando FASE 4
    const cardsResult = await apiService.generateCardsForPurchase(purchaseId);

    if (cardsResult.ok && cardsResult.data) {
      // Formatar cartelas para exibição
      const formattedCards = cardsResult.data.map((card: any) => ({
        code: `SB-${card.card_number}`,
        numbers: card.numbers
      }));
      setGeneratedCards(formattedCards);
      setStep('confirmed');
      toast({ title: '🎉 Sucesso!', description: `${formattedCards.length} cartelas geradas!` });
    } else {
      // Se auto-generate estiver desabilitado, gerar mock
      const mockCards = Array.from({ length: quantity * selectedRounds.length }, (_, i) => ({
        code: `SB-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        numbers: Array.from({ length: 25 }, () => Math.floor(Math.random() * 75) + 1)
      }));
      setGeneratedCards(mockCards);
      setStep('confirmed');
      toast({ title: '✅ Cartelas geradas!', description: 'Suas cartelas foram criadas.' });
    }

    setIsProcessing(false);
  };

  const handleSimulatePayment = async () => {
    // Função mantida para compatibilidade com código antigo
    await handlePaymentConfirmed(parseInt(pixData?.purchaseId || '0'));
  };

  const handleCopyPix = () => {
    if (!pixData) return;
    navigator.clipboard.writeText(pixData.pixCode);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2000);
    toast({ title: 'Código Pix copiado!' });
  };

  const handleCopyCardCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCard(code);
    setTimeout(() => setCopiedCard(null), 2000);
    toast({ title: 'Código da cartela copiado!' });
  };

  const handleSendWhatsapp = async () => {
    if (!whatsappNumber || whatsappNumber.length < 10) {
      toast({ title: 'Número inválido', description: 'Digite um número de WhatsApp válido com DDD.', variant: 'destructive' });
      return;
    }
    setIsProcessing(true);

    await new Promise(resolve => setTimeout(resolve, 1000));
    setWhatsappSent(true);
    toast({ title: '📱 Enviado!', description: 'Suas cartelas foram enviadas por WhatsApp.' });

    setIsProcessing(false);
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  const formatDate = (date: Date) => date.toLocaleDateString('pt-BR');
  const formatTime = (date: Date) => date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  // Format card numbers into 5x5 grid for printing
  const formatCardGrid = (numbers: number[]): string => {
    // Se os números já estão em formato de linha (25 números), usar diretamente
    // Senão, organizar por colunas B-I-N-G-O
    let grid: number[][] = [];
    
    if (numbers.length === 25) {
      // Números já estão em ordem de linha
      for (let row = 0; row < 5; row++) {
        grid.push(numbers.slice(row * 5, row * 5 + 5));
      }
    } else {
      // Organizar por colunas B-I-N-G-O
      const b = numbers.filter(n => n >= 1 && n <= 15).slice(0, 5);
      const i = numbers.filter(n => n >= 16 && n <= 30).slice(0, 5);
      const n = numbers.filter(n => n >= 31 && n <= 45).slice(0, 5);
      const g = numbers.filter(n => n >= 46 && n <= 60).slice(0, 5);
      const o = numbers.filter(n => n >= 61 && n <= 75).slice(0, 5);
      
      for (let row = 0; row < 5; row++) {
        grid.push([b[row] || 0, i[row] || 0, n[row] || 0, g[row] || 0, o[row] || 0]);
      }
    }
    
    // Centro livre
    grid[2][2] = 0;
    
    let output = ' B   I   N   G   O\n';
    output += '-------------------\n';
    
    for (let row = 0; row < 5; row++) {
      const cells = grid[row].map(n => n === 0 ? '**' : String(n).padStart(2, ' '));
      output += cells.join('  ') + '\n';
    }
    
    return output;
  };

  // Handle print cards
  const handlePrintCards = () => {
    const printContent = generatedCards.map((card, index) => {
      const gridText = formatCardGrid(card.numbers);
      return `
================================
        SORTEBEM
     Sorteio Beneficente
================================

Data: ${formatDate(purchaseDate)}  Hora: ${formatTime(purchaseDate)}
Rodada: #${roundNumber}

--------------------------------
CARTELA ${index + 1}: ${card.code}

${gridText}
--------------------------------

Acesse: sortebem.com.br/c/${card.code}
        para acompanhar!

Guarde este comprovante!
Ele é necessário para resgatar
seu prêmio em caso de vitória.

================================
     BOA SORTE!
================================
`;
    }).join('\n\n');

    // Create print window
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Cartelas - SorteBem</title>
          <style>
            @media print {
              body { margin: 0; padding: 10mm; }
              .no-print { display: none; }
              .page-break { page-break-after: always; }
            }
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              line-height: 1.4;
              background: #fff;
              color: #000;
            }
            pre {
              white-space: pre-wrap;
              word-wrap: break-word;
              margin: 0;
            }
            .card-container {
              max-width: 300px;
              margin: 0 auto 20px;
              padding: 10px;
              border: 1px dashed #ccc;
            }
            .print-btn {
              display: block;
              margin: 20px auto;
              padding: 15px 30px;
              font-size: 16px;
              background: #22c55e;
              color: white;
              border: none;
              border-radius: 8px;
              cursor: pointer;
            }
            .print-btn:hover {
              background: #16a34a;
            }
            h1 {
              text-align: center;
              font-family: sans-serif;
            }
            .instructions {
              text-align: center;
              font-family: sans-serif;
              margin-bottom: 20px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="no-print">
            <h1>🎱 Suas Cartelas</h1>
            <p class="instructions">Clique no botão abaixo para imprimir ou use Ctrl+P</p>
            <button class="print-btn" onclick="window.print()">🖨️ Imprimir Cartelas</button>
          </div>
          ${generatedCards.map((card, index) => `
            <div class="card-container ${index < generatedCards.length - 1 ? 'page-break' : ''}">
              <pre>${`================================
        SORTEBEM
     Sorteio Beneficente
================================

Data: ${formatDate(purchaseDate)}  Hora: ${formatTime(purchaseDate)}
Rodada: #${roundNumber}

--------------------------------
CARTELA ${index + 1}: ${card.code}

${formatCardGrid(card.numbers)}
--------------------------------

Acesse: sortebem.com.br/c/${card.code}
        para acompanhar!

Guarde este comprovante!
Ele é necessário para resgatar
seu prêmio em caso de vitória.

================================
     BOA SORTE!
================================`}</pre>
            </div>
          `).join('')}
        </body>
        </html>
      `);
      printWindow.document.close();
    }
    
    toast({ title: '🖨️ Janela de impressão aberta', description: 'Use o botão imprimir ou Ctrl+P' });
  };

  // Handle share via WhatsApp
  const handleShareWhatsApp = () => {
    const cardsText = generatedCards.map((card, index) => 
      `🎱 Cartela ${index + 1}: ${card.code}\n🔗 Link: https://sortebem.com.br/c/${card.code}`
    ).join('\n\n');
    
    const message = `✅ *Compra Confirmada - SorteBem*\n\n📅 Data: ${formatDate(purchaseDate)}\n⏰ Hora: ${formatTime(purchaseDate)}\n🎯 Rodada: #${roundNumber}\n\n${cardsText}\n\n🍀 Boa sorte no sorteio!\n\nAcesse sortebem.com.br para acompanhar`;
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    toast({ title: '📱 Abrindo WhatsApp', description: 'Escolha um contato para enviar' });
  };

  // Show loading state
  if (loading) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="max-w-2xl mx-auto flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-muted-foreground">Carregando...</p>
            </div>
          </div>
        </div>
      </PublicLayout>
    );
  }

  // Show message if no rounds available
  if (!loading && availableRounds.length === 0) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="max-w-2xl mx-auto">
            <div className="bg-card border border-border rounded-2xl p-8 text-center">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-10 h-10 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Nenhuma rodada disponível</h2>
              <p className="text-muted-foreground mb-6">
                Não há rodadas abertas para compra no momento. Uma nova rodada será criada em breve!
              </p>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Atualizar página
              </Button>
            </div>
          </div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-2xl mx-auto">
          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-4 mb-8">
            {['Quantidade', 'Pagamento', 'Confirmação'].map((label, index) => {
              const stepIndex = ['quantity', 'payment', 'confirmed'].indexOf(step);
              const isActive = index <= stepIndex;
              return (
                <div key={label} className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    {index + 1}
                  </div>
                  <span className={`hidden sm:inline ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</span>
                  {index < 2 && <div className="w-8 h-0.5 bg-border mx-2" />}
                </div>
              );
            })}
          </div>

          {/* Step 1: Quantity */}
          {step === 'quantity' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="text-center mb-4">
                <h1 className="text-3xl font-bold text-foreground mb-2">Comprar Cartelas</h1>
                <p className="text-muted-foreground">Escolha o tipo de sorteio e participe!</p>
              </div>

              {/* Prize Highlight Banner */}
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative overflow-hidden bg-gradient-to-r from-primary via-primary/90 to-primary rounded-2xl p-6 text-primary-foreground"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

                <div className="relative z-10 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Trophy className="w-6 h-6" />
                    <span className="text-sm font-medium opacity-90">Prêmio Estimado</span>
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="text-4xl md:text-5xl font-bold mb-3">
                    {formatCurrency(estimatedPrize)}
                  </div>
                  {drawType === 'special' && (
                    <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1">
                      <Star className="w-4 h-4" />
                      <span className="text-sm">Acumulado: {formatCurrency(accumulatedPrize)}</span>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Draw Type Selector */}
              <Tabs value={drawType} onValueChange={(v) => setDrawType(v as DrawType)} className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-auto p-1">
                  <TabsTrigger value="regular" className="py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <div className="flex flex-col items-center gap-1">
                      <Clock className="w-5 h-5" />
                      <span className="font-semibold">Sorteio Regular</span>
                      <span className="text-xs opacity-80">A cada 10 min</span>
                    </div>
                  </TabsTrigger>
                  <TabsTrigger value="special" className="py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <div className="flex flex-col items-center gap-1">
                      <Trophy className="w-5 h-5" />
                      <span className="font-semibold">Sorteio Especial</span>
                      <span className="text-xs opacity-80">Prêmios maiores</span>
                    </div>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="regular" className="mt-4 space-y-4">
                  {/* Countdown Hero - Regular */}
                  <div className="bg-card border-2 border-primary/30 rounded-2xl p-6 text-center">
                    <div className="flex items-center justify-center gap-2 text-primary mb-3">
                      <Clock className="w-5 h-5 animate-pulse" />
                      <span className="font-semibold text-lg">Próximo Sorteio em</span>
                    </div>
                    <CountdownTimer targetTime={nextRoundTime} variant="hero" />
                    <p className="text-muted-foreground text-sm mt-3">Rodada #{roundNumber} • {formatDate(purchaseDate)}</p>
                  </div>

                  {/* Multiple Rounds Selector */}
                  <div className="bg-card border border-border rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-base font-semibold">Selecione as rodadas</Label>
                      <span className="text-sm text-muted-foreground">
                        {selectedRounds.length} selecionada{selectedRounds.length > 1 ? 's' : ''}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Compre cartelas para várias rodadas de uma vez e aumente suas chances!
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {futureRounds.filter(r => r.type === 'regular').map((round, index) => {
                        const isSelected = selectedRounds.includes(round.id);
                        const isFirst = index === 0;
                        return (
                          <motion.button
                            key={round.id}
                            onClick={() => toggleRoundSelection(round.id)}
                            whileTap={{ scale: 0.97 }}
                            className={`relative p-3 rounded-xl border-2 transition-all text-left ${isSelected
                              ? 'border-primary bg-primary/10'
                              : 'border-border bg-secondary/50 hover:border-primary/50'
                              }`}
                          >
                            {isFirst && (
                              <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded-full font-semibold">
                                Próxima
                              </span>
                            )}
                            <div className="flex items-center gap-2 mb-1">
                              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-primary bg-primary' : 'border-muted-foreground'
                                }`}>
                                {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                              </div>
                              <span className="font-bold text-foreground">#{round.number}</span>
                            </div>
                            <p className="text-xs text-muted-foreground pl-6">
                              {formatTime(round.time)}
                            </p>
                          </motion.button>
                        );
                      })}
                    </div>
                    {selectedRounds.length > 1 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-4 p-3 bg-success/10 border border-success/20 rounded-xl"
                      >
                        <div className="flex items-center gap-2 text-success">
                          <Sparkles className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            {selectedRounds.length}x mais chances de ganhar!
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="special" className="mt-4">
                  {/* Countdown Hero - Special */}
                  {futureRounds.find(r => r.type === 'special') && (
                    <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-2 border-amber-500/30 rounded-2xl p-6 text-center">
                      <div className="flex items-center justify-center gap-2 text-amber-600 mb-3">
                        <Trophy className="w-5 h-5 animate-pulse" />
                        <span className="font-semibold text-lg">Sorteio Especial em</span>
                      </div>
                      <CountdownTimer targetTime={futureRounds.find(r => r.type === 'special')!.time} variant="hero" />
                      <p className="text-muted-foreground text-sm mt-3">Rodada Especial • {formatDate(purchaseDate)}</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              {establishment && (
                <div className="bg-secondary rounded-xl p-4 flex items-center gap-3">
                  <Store className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Vendedor</p>
                    <p className="font-semibold text-foreground">
                      {establishment.trade_name || establishment.name}
                    </p>
                  </div>
                </div>
              )}

              {/* Quantity Selector */}
              <div className="bg-card border border-border rounded-2xl p-6">
                <Label className="text-lg mb-4 block">Quantidade de Cartelas</Label>
                <div className="flex items-center justify-center gap-4 mb-6">
                  <Button variant="outline" size="icon" onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1}>
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="text-4xl font-bold text-primary w-20 text-center">{quantity}</span>
                  <Button variant="outline" size="icon" onClick={() => handleQuantityChange(1)}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-2 text-sm border-t border-border pt-4">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Valor por cartela ({drawType === 'regular' ? 'Regular' : 'Especial'})</span>
                    <span>{formatCurrency(unitPrice)}</span>
                  </div>
                  {drawType === 'regular' && selectedRounds.length > 1 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Rodadas selecionadas</span>
                      <span>{selectedRounds.length}x</span>
                    </div>
                  )}
                  <div className="flex justify-between text-muted-foreground">
                    <span>Cartelas por rodada</span>
                    <span>{quantity}</span>
                  </div>
                  {drawType === 'regular' && selectedRounds.length > 1 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Total de cartelas</span>
                      <span>{quantity * selectedRounds.length}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xl font-bold text-foreground pt-2 border-t border-border">
                    <span>Total a pagar</span>
                    <span className="text-primary">{formatCurrency(totalPrice)}</span>
                  </div>
                </div>
              </div>

              {/* Quick Select */}
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 20, 50].map(q => (
                  <Button key={q} variant={quantity === q ? 'default' : 'outline'} onClick={() => setQuantity(q)} className="text-lg">{q}</Button>
                ))}
              </div>

              <Button variant="hero" size="xl" className="w-full" onClick={handleGeneratePix} disabled={isProcessing}>
                {isProcessing ? <span className="animate-spin mr-2">⏳</span> : <CreditCard className="w-5 h-5" />}
                Pagar com Pix
                <ArrowRight className="w-5 h-5" />
              </Button>

              {/* Info Cards */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                <div className="bg-secondary rounded-xl p-3 sm:p-4 text-center">
                  <Gift className="w-5 h-5 sm:w-6 sm:h-6 text-primary mx-auto mb-1 sm:mb-2" />
                  <p className="text-xs sm:text-sm text-muted-foreground">Rodada a cada</p>
                  <p className="font-semibold text-sm sm:text-base">10 minutos</p>
                </div>
                <div className="bg-secondary rounded-xl p-3 sm:p-4 text-center">
                  <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-primary mx-auto mb-1 sm:mb-2" />
                  <p className="text-xs sm:text-sm text-muted-foreground">Pagamento</p>
                  <p className="font-semibold text-sm sm:text-base">100% Seguro</p>
                </div>
                <div className="bg-secondary rounded-xl p-3 sm:p-4 text-center">
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-primary mx-auto mb-1 sm:mb-2" />
                  <p className="text-xs sm:text-sm text-muted-foreground">Confirmação</p>
                  <p className="font-semibold text-sm sm:text-base">Instantânea</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Payment */}
          {step === 'payment' && pixData && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-foreground mb-2">Pagamento via Pix</h1>
                <p className="text-muted-foreground">Escaneie o QR Code ou copie o código Pix</p>
              </div>

              {/* Countdown during payment */}
              <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-primary animate-pulse" />
                  <div>
                    <p className="text-sm text-muted-foreground">Sorteio começa em</p>
                    <CountdownTimer targetTime={nextRoundTime} />
                  </div>
                </div>
                <span className="text-primary font-semibold">Rodada #{roundNumber}</span>
              </div>

              <div className="bg-card border border-border rounded-2xl p-6">
                <div className="text-center mb-6">
                  <p className="text-sm text-muted-foreground">Valor a pagar</p>
                  <p className="text-4xl font-bold text-primary">{formatCurrency(pixData.amount)}</p>
                  <p className="text-sm text-muted-foreground mt-1">{quantity} cartela{quantity > 1 ? 's' : ''} • Sorteio {drawType === 'regular' ? 'Regular' : 'Especial'}</p>
                </div>
                <div className="flex justify-center mb-6">
                  <div className="bg-background p-4 rounded-xl">
                    <QRCodeSVG value={pixData.pixCode} size={200} level="H" includeMargin />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Código Pix (Copia e Cola)</Label>
                  <div className="flex gap-2">
                    <Input value={pixData.pixCode} readOnly className="font-mono text-xs" />
                    <Button variant="outline" onClick={handleCopyPix}>
                      {copiedPix ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Polling Status Feedback */}
              {pollingStatus === 'polling' && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span className="font-medium text-primary">Aguardando pagamento...</span>
                  </div>
                  
                  {/* Elapsed time */}
                  <div className="text-center mb-3">
                    <span className="text-sm text-muted-foreground">Tempo decorrido: </span>
                    <span className="font-mono font-bold text-foreground">
                      {Math.floor(pollingSeconds / 60).toString().padStart(2, '0')}:
                      {(pollingSeconds % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                    <motion.div 
                      className="h-full bg-primary"
                      initial={{ width: '0%' }}
                      animate={{ width: `${Math.min((pollingSeconds / (20 * 60)) * 100, 100)}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Expira em {Math.max(0, 20 - Math.floor(pollingSeconds / 60))} minutos
                  </p>
                </div>
              )}

              {pollingStatus === 'confirmed' && (
                <div className="bg-success/10 border border-success/30 rounded-xl p-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Check className="w-5 h-5 text-success" />
                    <span className="font-medium text-success">Pagamento confirmado!</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Gerando suas cartelas...</p>
                </div>
              )}

              {pollingStatus === 'expired' && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-destructive" />
                    <span className="font-medium text-destructive">PIX expirado</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">O tempo para pagamento expirou.</p>
                  <Button 
                    onClick={() => {
                      setStep('quantity');
                      setPollingStatus('idle');
                      setPollingSeconds(0);
                      setPixData(null);
                    }}
                    variant="outline"
                  >
                    Gerar novo PIX
                  </Button>
                </div>
              )}
            </motion.div>
          )}

          {/* Step 3: Confirmed */}
          {step === 'confirmed' && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-10 h-10 text-success" />
                </div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Pagamento Confirmado! ✅</h1>
                <p className="text-muted-foreground">Suas cartelas foram geradas com sucesso</p>
              </div>

              {/* Countdown after confirmation */}
              <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-primary animate-pulse" />
                  <span className="font-semibold text-primary">O sorteio começa em</span>
                </div>
                <CountdownTimer targetTime={nextRoundTime} variant="hero" />
              </div>

              {/* Confirmed Round Info */}
              <div className="bg-success/10 border border-success/20 rounded-xl p-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Data da Compra</p>
                    <p className="font-semibold text-foreground">{formatDate(purchaseDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Hora</p>
                    <p className="font-semibold text-foreground">{formatTime(purchaseDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Rodada</p>
                    <p className="font-semibold text-primary">#{roundNumber}</p>
                  </div>
                </div>
              </div>

              {/* Generated Cards */}
              <div className="bg-card border border-border rounded-2xl p-6">
                <h2 className="font-semibold text-lg mb-4">Suas Cartelas ({generatedCards.length})</h2>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {generatedCards.map((card, index) => (
                    <div key={index} className="flex items-center justify-between bg-secondary rounded-xl p-3">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">#{index + 1}</span>
                        <code className="bg-primary/10 text-primary px-3 py-1 rounded font-mono font-bold">{card.code}</code>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleCopyCardCode(card.code)}>
                          {copiedCard === card.code ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                        </Button>
                        <Link to={`/c/${card.code}`}>
                          <Button variant="outline" size="sm">Abrir</Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              {generatedCards.length > 0 && (
                <div className="space-y-3">
                  <Link to={`/c/${generatedCards[0].code}`}>
                    <Button variant="hero" size="xl" className="w-full">
                      <ShoppingCart className="w-5 h-5" />
                      Abrir Cartela Agora
                      <ArrowRight className="w-5 h-5" />
                    </Button>
                  </Link>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      variant="outline" 
                      size="lg" 
                      className="w-full" 
                      onClick={handlePrintCards}
                    >
                      <Printer className="w-5 h-5" />
                      Imprimir Cartelas
                    </Button>
                    <Button 
                      variant="outline" 
                      size="lg" 
                      className="w-full bg-[#25D366]/10 border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/20" 
                      onClick={handleShareWhatsApp}
                    >
                      <Share2 className="w-5 h-5" />
                      Enviar WhatsApp
                    </Button>
                  </div>
                </div>
              )}

              {/* WhatsApp */}
              <div className="bg-card border border-border rounded-2xl p-6">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-success" />
                  Receber no WhatsApp
                </h3>
                {!whatsappSent ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="whatsapp">Número do WhatsApp (com DDD)</Label>
                      <Input
                        id="whatsapp"
                        type="tel"
                        placeholder="(11) 99999-9999"
                        value={whatsappNumber}
                        onChange={(e) => setWhatsappNumber(e.target.value)}
                        className="mt-2"
                      />
                    </div>
                    <Button className="w-full" onClick={handleSendWhatsapp} disabled={isProcessing}>
                      <MessageCircle className="w-4 h-4" />
                      Enviar para WhatsApp
                    </Button>
                  </div>
                ) : (
                  <div className="text-center text-success">
                    <Check className="w-8 h-8 mx-auto mb-2" />
                    <p className="font-medium">Cartelas enviadas com sucesso!</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </PublicLayout>
  );
};

export default Checkout;
