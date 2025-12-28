import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Copy, Share2, MessageCircle, Check, Trophy, Clock } from 'lucide-react';
import PublicLayout from '@/components/layout/PublicLayout';
import CardGrid from '@/components/game/CardGrid';
import LiveDraw from '@/components/game/LiveDraw';
import CountdownTimer from '@/components/game/CountdownTimer';
import { getCardByCode, toggleAutoMark, submitWinClaim, getTieBreakStatus } from '@/services/mockApi';
import { mockCurrentRound } from '@/services/mockData';
import { toast } from '@/hooks/use-toast';

const CardView = () => {
  const { codigo } = useParams<{ codigo: string }>();
  const [card, setCard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [autoMark, setAutoMark] = useState(false);
  const [markedNumbers, setMarkedNumbers] = useState<number[]>([]);
  const [drawnNumbers, setDrawnNumbers] = useState<number[]>(mockCurrentRound.drawnNumbers);
  const [roundStatus, setRoundStatus] = useState<'waiting' | 'live' | 'finished'>('live');
  const [tieBreak, setTieBreak] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadCard = async () => {
      if (!codigo) return;
      setLoading(true);
      const cardData = await getCardByCode(codigo);
      if (cardData) {
        setCard(cardData);
      }
      setLoading(false);
    };
    loadCard();
  }, [codigo]);

  // Simulate live draw
  useEffect(() => {
    if (roundStatus !== 'live') return;
    
    const allNumbers = [5, 23, 47, 12, 68, 31, 9, 56, 73, 2, 44, 18, 65, 7, 33, 51, 29, 70, 14, 60];
    let currentIndex = drawnNumbers.length;
    
    const interval = setInterval(async () => {
      if (currentIndex < allNumbers.length) {
        setDrawnNumbers(allNumbers.slice(0, currentIndex + 1));
        currentIndex++;
        
        // Check for tie break occasionally
        if (currentIndex > 15) {
          const tieStatus = await getTieBreakStatus(mockCurrentRound.id);
          if (tieStatus.hasTie) {
            setTieBreak(tieStatus);
          }
        }
      } else {
        setRoundStatus('finished');
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [roundStatus]);

  const handleToggleMark = (number: number) => {
    setMarkedNumbers(prev => 
      prev.includes(number) 
        ? prev.filter(n => n !== number)
        : [...prev, number]
    );
  };

  const handleAutoMarkToggle = async (enabled: boolean) => {
    setAutoMark(enabled);
    if (card) {
      await toggleAutoMark(card.id, enabled);
    }
    toast({
      title: enabled ? 'Marcação automática ativada' : 'Marcação automática desativada',
      description: enabled 
        ? 'Os números sorteados serão marcados automaticamente.' 
        : 'Você pode marcar manualmente os números.',
    });
  };

  const handleClaimWin = async () => {
    if (!card) return;
    const result = await submitWinClaim(card.id);
    toast({
      title: result.success ? '🎉 Parabéns!' : 'Ainda não...',
      description: result.message,
      variant: result.success ? 'default' : 'destructive',
    });
  };

  const handleCopyCode = () => {
    if (!codigo) return;
    navigator.clipboard.writeText(codigo);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: 'Código copiado!',
      description: 'Use este código para resgatar seu prêmio.',
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Minha Cartela SORTBEM',
        text: `Acompanhe minha cartela ${codigo} no sorteio!`,
        url: window.location.href,
      });
    }
  };

  if (loading) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </PublicLayout>
    );
  }

  if (!card) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Cartela não encontrada
          </h1>
          <p className="text-muted-foreground">
            Verifique o código e tente novamente.
          </p>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Sua Cartela
          </h1>
          <div className="flex items-center justify-center gap-3">
            <code className="bg-primary/10 text-primary px-4 py-2 rounded-lg font-mono font-bold text-lg">
              {codigo}
            </code>
            <button
              onClick={handleCopyCode}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              {copied ? (
                <Check className="w-5 h-5 text-success" />
              ) : (
                <Copy className="w-5 h-5 text-muted-foreground" />
              )}
            </button>
            <button
              onClick={handleShare}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <Share2 className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Card Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Auto Mark Toggle */}
            <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Label htmlFor="auto-mark" className="font-medium cursor-pointer">
                  Marcação Automática
                </Label>
                <span className="text-sm text-muted-foreground">
                  {autoMark ? 'Ativada' : 'Desativada'}
                </span>
              </div>
              <Switch
                id="auto-mark"
                checked={autoMark}
                onCheckedChange={handleAutoMarkToggle}
              />
            </div>

            {/* Card Grid */}
            <CardGrid
              numbers={card.numbers}
              markedNumbers={markedNumbers}
              drawnNumbers={drawnNumbers}
              autoMark={autoMark}
              onToggleMark={handleToggleMark}
              cardStatus={card.status}
            />

            {/* Claim Button */}
            <Button
              variant="hero"
              size="xl"
              className="w-full"
              onClick={handleClaimWin}
              disabled={roundStatus !== 'live'}
            >
              <Trophy className="w-5 h-5" />
              Declarar Vitória
            </Button>

            {/* Status */}
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              {roundStatus === 'waiting' && (
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Clock className="w-5 h-5" />
                  <span>Aguardando início da rodada...</span>
                </div>
              )}
              {roundStatus === 'live' && (
                <div className="flex items-center justify-center gap-2 text-primary">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="font-medium">Sorteio em andamento</span>
                </div>
              )}
              {roundStatus === 'finished' && (
                <div className="text-muted-foreground">
                  Rodada finalizada
                </div>
              )}
            </div>
          </motion.div>

          {/* Live Draw Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <CountdownTimer
              targetTime={new Date(Date.now() + 8 * 60 * 1000)}
              label="Próxima Rodada"
              variant="compact"
            />

            <LiveDraw
              drawnNumbers={drawnNumbers}
              isLive={roundStatus === 'live'}
              tieBreak={tieBreak}
            />

            {/* WhatsApp Share */}
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3 text-muted-foreground">
                <MessageCircle className="w-5 h-5 text-success" />
                <span className="text-sm">
                  Receba atualizações via WhatsApp após a compra
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default CardView;
