import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Copy, Share2, Check, Trophy, Clock } from 'lucide-react';
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
  const [tieBreak, setTieBreak] = useState<any>(null);
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
        const response = await apiService.getLiveRound();
        if (response.ok && response.data) {
          setLiveRound(response.data);
          setRoundStatus(response.data.status === 'drawing' ? 'live' : 'waiting');

          // Load drawn numbers if round is live
          if (response.data.status === 'drawing') {
            const numbersResponse = await apiService.getDrawnNumbers(response.data.id);
            if (numbersResponse.ok && numbersResponse.data) {
              setDrawnNumbers(numbersResponse.data);
            }
          }
        }
      } catch (error) {
        console.error('Error loading live round:', error);
      }
    };

    loadLiveRound();

    // Poll for updates every 3 seconds
    const interval = setInterval(loadLiveRound, 3000);

    return () => clearInterval(interval);
  }, [card]);

  const handleToggleMark = (number: number) => {
    setMarkedNumbers(prev => prev.includes(number) ? prev.filter(n => n !== number) : [...prev, number]);
  };

  const handleAutoMarkToggle = async (enabled: boolean) => {
    setAutoMark(enabled);
    // TODO: Implement API call to toggle auto-mark
    toast({ title: enabled ? 'Marcação automática ativada' : 'Marcação automática desativada' });
  };

  const handleClaimWin = async () => {
    if (!card) return;
    // TODO: Implement API call to claim win
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
    if (navigator.share) navigator.share({ title: 'Minha Cartela SORTEBEM', text: `Acompanhe minha cartela ${codigo} no sorteio!`, url: window.location.href });
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
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Cartela não encontrada</h1>
          <p className="text-muted-foreground">Verifique o código e tente novamente.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-4 max-w-lg">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <code className="bg-primary/10 text-primary px-3 py-1 rounded-lg font-mono font-bold text-sm">{codigo}</code>
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
          <CountdownTimer targetTime={new Date(Date.now() + 8 * 60 * 1000)} label="Próxima Rodada" variant="compact" />
          <LiveDraw drawnNumbers={drawnNumbers} isLive={roundStatus === 'live'} tieBreak={tieBreak} />
        </motion.div>

        {/* Card Section - BELOW */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          {/* Auto Mark Toggle */}
          <div className="bg-card border border-border rounded-xl p-3 flex items-center justify-between">
            <Label htmlFor="auto-mark" className="font-medium cursor-pointer text-sm">Marcação Automática</Label>
            <Switch id="auto-mark" checked={autoMark} onCheckedChange={handleAutoMarkToggle} />
          </div>

          {/* Card Grid */}
          <CardGrid numbers={card.numbers} markedNumbers={markedNumbers} drawnNumbers={drawnNumbers} autoMark={autoMark} onToggleMark={handleToggleMark} cardStatus={card.status} />

          {/* Claim Button */}
          <Button variant="hero" size="lg" className="w-full" onClick={handleClaimWin} disabled={roundStatus !== 'live'}>
            <Trophy className="w-5 h-5" />
            Declarar Vitória
          </Button>

          {/* Status */}
          <div className="bg-card border border-border rounded-xl p-3 text-center text-sm">
            {roundStatus === 'waiting' && <div className="flex items-center justify-center gap-2 text-muted-foreground"><Clock className="w-4 h-4" /><span>Aguardando início...</span></div>}
            {roundStatus === 'live' && <div className="flex items-center justify-center gap-2 text-primary"><span className="w-2 h-2 rounded-full bg-primary animate-pulse" /><span className="font-medium">Sorteio ao vivo</span></div>}
            {roundStatus === 'finished' && <div className="text-muted-foreground">Rodada finalizada</div>}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CardView;
