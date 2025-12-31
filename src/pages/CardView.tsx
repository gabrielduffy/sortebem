import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Copy, Share2, Check, Trophy, Clock, AlertCircle } from 'lucide-react';
import CardGrid from '@/components/game/CardGrid';
import LiveDraw from '@/components/game/LiveDraw';
import CountdownTimer from '@/components/game/CountdownTimer';
import { toast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';

const CardView = () => {
  const { codigo } = useParams<{ codigo: string }>();
  const [card, setCard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [autoMark, setAutoMark] = useState(false);
  const [markedNumbers, setMarkedNumbers] = useState<number[]>([]);
  const [drawnNumbers, setDrawnNumbers] = useState<number[]>([]);
  const [roundStatus, setRoundStatus] = useState<'waiting' | 'live' | 'finished'>('waiting');
  const [liveRound, setLiveRound] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  // Load card data
  useEffect(() => {
    const loadCard = async () => {
      if (!codigo) return;
      setLoading(true);

      try {
        const response = await apiService.getCard(codigo);
        if (response.ok && response.data) {
          setCard(response.data);
        } else {
          setCard(null);
        }
      } catch (error) {
        console.error('Error loading card:', error);
        setCard(null);
      } finally {
        setLoading(false);
      }
    };

    loadCard();
  }, [codigo]);

  // Load live round data and poll for updates
  useEffect(() => {
    if (!card) return;

    const loadLiveRound = async () => {
      try {
        // Check if this card's round is live
        const roundResponse = await apiService.getRound(card.round_id);
        if (roundResponse.ok && roundResponse.data) {
          const round = roundResponse.data;
          
          if (round.status === 'drawing') {
            setLiveRound(round);
            setRoundStatus('live');
            setDrawnNumbers(round.drawn_numbers || []);
          } else if (round.status === 'finished') {
            setLiveRound(round);
            setRoundStatus('finished');
            setDrawnNumbers(round.drawn_numbers || []);
          } else {
            setLiveRound(round);
            setRoundStatus('waiting');
          }
        }
      } catch (error) {
        console.error('Error loading round:', error);
      }
    };

    loadLiveRound();

    // Poll for updates every 3 seconds
    const interval = setInterval(loadLiveRound, 3000);

    return () => clearInterval(interval);
  }, [card]);

  // Auto-mark drawn numbers
  useEffect(() => {
    if (autoMark && card && drawnNumbers.length > 0) {
      const cardNumbers = card.numbers || [];
      const toMark = drawnNumbers.filter(num => cardNumbers.includes(num));
      setMarkedNumbers(toMark);
    }
  }, [autoMark, drawnNumbers, card]);

  const handleToggleMark = (number: number) => {
    if (autoMark) return; // Don't allow manual marking when auto-mark is on
    setMarkedNumbers(prev => 
      prev.includes(number) 
        ? prev.filter(n => n !== number) 
        : [...prev, number]
    );
  };

  const handleAutoMarkToggle = (enabled: boolean) => {
    setAutoMark(enabled);
    if (enabled && card && drawnNumbers.length > 0) {
      // Auto-mark all drawn numbers that are on the card
      const cardNumbers = card.numbers || [];
      const toMark = drawnNumbers.filter(num => cardNumbers.includes(num));
      setMarkedNumbers(toMark);
    }
    toast({ 
      title: enabled ? 'Marcação automática ativada' : 'Marcação automática desativada' 
    });
  };

  const handleClaimWin = async () => {
    if (!card) return;
    toast({
      title: 'Funcionalidade em desenvolvimento',
      description: 'Reivindicação de prêmio será implementada em breve.'
    });
  };

  const handleCopyCode = () => {
    if (!codigo) return;
    navigator.clipboard.writeText(codigo);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'Código copiado!' });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ 
        title: 'Minha Cartela SORTEBEM', 
        text: `Acompanhe minha cartela ${codigo} no sorteio!`, 
        url: window.location.href 
      });
    } else {
      handleCopyCode();
      toast({ 
        title: 'Link copiado!', 
        description: 'Compartilhe com seus amigos' 
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!card) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-10 h-10 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Cartela não encontrada</h1>
          <p className="text-muted-foreground mb-6">
            O código <code className="bg-muted px-2 py-1 rounded">{codigo}</code> não foi encontrado em nosso sistema.
          </p>
          <p className="text-sm text-muted-foreground">
            Verifique se o código está correto ou entre em contato com o suporte.
          </p>
        </div>
      </div>
    );
  }

  // Calculate next round time
  const nextRoundTime = liveRound 
    ? new Date(liveRound.ends_at) 
    : new Date(Date.now() + 8 * 60 * 1000);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-4 max-w-lg">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="text-center mb-4"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <code className="bg-primary/10 text-primary px-3 py-1 rounded-lg font-mono font-bold text-sm">
              {codigo}
            </code>
            <button 
              onClick={handleCopyCode} 
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            >
              {copied ? (
                <Check className="w-4 h-4 text-success" />
              ) : (
                <Copy className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
            <button 
              onClick={handleShare} 
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            >
              <Share2 className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          {liveRound && (
            <p className="text-xs text-muted-foreground">
              Rodada #{liveRound.number} • {liveRound.type === 'special' ? 'Especial' : 'Regular'}
            </p>
          )}
        </motion.div>

        {/* Live Draw Section - ON TOP */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="space-y-3 mb-4"
        >
          <CountdownTimer 
            targetTime={nextRoundTime} 
            label={roundStatus === 'live' ? 'Término em' : 'Próxima Rodada'} 
            variant="compact" 
          />
          <LiveDraw 
            drawnNumbers={drawnNumbers} 
            isLive={roundStatus === 'live'} 
            tieBreak={null} 
          />
        </motion.div>

        {/* Card Section - BELOW */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="space-y-3"
        >
          {/* Auto Mark Toggle */}
          <div className="bg-card border border-border rounded-xl p-3 flex items-center justify-between">
            <Label 
              htmlFor="auto-mark" 
              className="font-medium cursor-pointer text-sm"
            >
              Marcação Automática
            </Label>
            <Switch 
              id="auto-mark" 
              checked={autoMark} 
              onCheckedChange={handleAutoMarkToggle} 
            />
          </div>

          {/* Card Grid */}
          <CardGrid 
            numbers={card.numbers || []} 
            markedNumbers={markedNumbers} 
            drawnNumbers={drawnNumbers} 
            autoMark={autoMark} 
            onToggleMark={handleToggleMark} 
            cardStatus={card.status || 'active'} 
          />

          {/* Stats */}
          {card.numbers && drawnNumbers.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-3">
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <div>
                  <p className="text-muted-foreground">Marcados</p>
                  <p className="text-lg font-bold text-primary">{markedNumbers.length}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Sorteados</p>
                  <p className="text-lg font-bold text-foreground">{drawnNumbers.length}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Na Cartela</p>
                  <p className="text-lg font-bold text-success">
                    {drawnNumbers.filter(num => card.numbers.includes(num)).length}
                  </p>
                </div>
              </div>
            </div>
          )}

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
                <span>Aguardando início do sorteio...</span>
              </div>
            )}
            {roundStatus === 'live' && (
              <div className="flex items-center justify-center gap-2 text-primary">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="font-medium">Sorteio ao vivo</span>
              </div>
            )}
            {roundStatus === 'finished' && (
              <div className="text-muted-foreground">
                Sorteio finalizado
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CardView;
