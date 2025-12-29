import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Copy, Share2, Check, Trophy, Clock } from 'lucide-react';
import CardGrid from '@/components/game/CardGrid';
import LiveDraw from '@/components/game/LiveDraw';
import CountdownTimer from '@/components/game/CountdownTimer';
import { toast } from '@/hooks/use-toast';
import { mockWinningCard, mockLiveRound, getNextRandomNumber } from '@/data/mockDemo';

const DemoCartela = () => {
  const [card] = useState(mockWinningCard);
  const [autoMark, setAutoMark] = useState(true);
  const [markedNumbers, setMarkedNumbers] = useState<number[]>([]);
  const [drawnNumbers, setDrawnNumbers] = useState<number[]>(mockLiveRound.drawn_numbers);
  const [roundStatus, setRoundStatus] = useState<'waiting' | 'live' | 'finished'>('live');
  const [copied, setCopied] = useState(false);
  const [cardStatus, setCardStatus] = useState<'active' | 'won' | 'lost'>('active');

  // Simulate drawing new numbers every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (drawnNumbers.length < 50) {
        const newNumber = getNextRandomNumber(drawnNumbers);
        if (newNumber > 0) {
          setDrawnNumbers(prev => [...prev, newNumber]);

          // Check if card won (simulate winning after 25 numbers)
          if (drawnNumbers.length >= 24) {
            const cardNumbers = card.numbers.flat().filter(n => n !== 0);
            const matchedNumbers = cardNumbers.filter(n => [...drawnNumbers, newNumber].includes(n));

            // Simulate win: if we have 24 or more matched numbers
            if (matchedNumbers.length >= 24) {
              setCardStatus('won');
              setRoundStatus('finished');
              toast({
                title: '🎉 VOCÊ GANHOU!',
                description: 'Parabéns! Você completou a cartela!',
              });
            }
          }
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [drawnNumbers, card.numbers]);

  const handleToggleMark = (number: number) => {
    setMarkedNumbers(prev => prev.includes(number) ? prev.filter(n => n !== number) : [...prev, number]);
  };

  const handleAutoMarkToggle = (enabled: boolean) => {
    setAutoMark(enabled);
    toast({ title: enabled ? 'Marcação automática ativada' : 'Marcação automática desativada' });
  };

  const handleClaimWin = () => {
    if (cardStatus === 'won') {
      toast({
        title: '🏆 Prêmio Confirmado!',
        description: 'Acesse /demo/resgate para resgatar seu prêmio',
      });
    } else {
      toast({
        title: 'Aguarde!',
        description: 'Complete a cartela primeiro para declarar vitória',
        variant: 'destructive',
      });
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(card.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'Código copiado!' });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Minha Cartela SORTEBEM',
        text: `Acompanhe minha cartela ${card.code} no sorteio!`,
        url: window.location.href
      });
    } else {
      toast({ title: 'Compartilhamento não suportado', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* DEMO Badge */}
      <div className="fixed top-4 left-4 bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-bold z-50 shadow-lg">
        🎬 MODO DEMO
      </div>

      <div className="container mx-auto px-4 py-4 max-w-lg">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <code className="bg-primary/10 text-primary px-3 py-1 rounded-lg font-mono font-bold text-sm">{card.code}</code>
            <button onClick={handleCopyCode} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
              {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
            </button>
            <button onClick={handleShare} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
              <Share2 className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </motion.div>

        {/* Live Draw Section - ON TOP */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 mb-4">
          <CountdownTimer
            targetTime={new Date(mockLiveRound.selling_ends_at)}
            label="Próxima Rodada"
            variant="compact"
          />
          <LiveDraw drawnNumbers={drawnNumbers} isLive={roundStatus === 'live'} />
        </motion.div>

        {/* Card Section - BELOW */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          {/* Auto Mark Toggle */}
          <div className="bg-card border border-border rounded-xl p-3 flex items-center justify-between">
            <Label htmlFor="auto-mark" className="font-medium cursor-pointer text-sm">Marcação Automática</Label>
            <Switch id="auto-mark" checked={autoMark} onCheckedChange={handleAutoMarkToggle} />
          </div>

          {/* Card Grid */}
          <CardGrid
            numbers={card.numbers}
            markedNumbers={markedNumbers}
            drawnNumbers={drawnNumbers}
            autoMark={autoMark}
            onToggleMark={handleToggleMark}
            cardStatus={cardStatus}
          />

          {/* Claim Button */}
          <Button
            variant="hero"
            size="lg"
            className="w-full"
            onClick={handleClaimWin}
            disabled={roundStatus !== 'live'}
          >
            <Trophy className="w-5 h-5" />
            Declarar Vitória
          </Button>

          {/* Status */}
          <div className="bg-card border border-border rounded-xl p-3 text-center text-sm">
            {roundStatus === 'waiting' && (
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Aguardando início...</span>
              </div>
            )}
            {roundStatus === 'live' && (
              <div className="flex items-center justify-center gap-2 text-primary">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="font-medium">Sorteio ao vivo</span>
              </div>
            )}
            {roundStatus === 'finished' && (
              <div className="text-muted-foreground">Rodada finalizada</div>
            )}
          </div>

          {/* Win Message */}
          {cardStatus === 'won' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-r from-success via-success to-primary text-primary-foreground rounded-xl p-6 text-center"
            >
              <Trophy className="w-12 h-12 mx-auto mb-3" />
              <h2 className="text-2xl font-bold mb-2">🎉 VOCÊ GANHOU! 🎉</h2>
              <p className="text-primary-foreground/90 mb-4">
                Parabéns! Você completou a cartela e ganhou o prêmio!
              </p>
              <Button
                variant="secondary"
                size="lg"
                className="w-full"
                onClick={() => window.location.href = '/demo/resgate'}
              >
                Resgatar Prêmio de R$ 1.694,00
              </Button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default DemoCartela;
