import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Clock, Store, Volume2, VolumeX, Zap, Heart } from 'lucide-react';
import { apiService } from '@/services/api';

const TVMode = () => {
  const { slugEstabelecimento } = useParams<{ slugEstabelecimento: string }>();
  const [data, setData] = useState<any>(null);
  const [drawnNumbers, setDrawnNumbers] = useState<number[]>([]);
  const [lastNumber, setLastNumber] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [tieBreak, setTieBreak] = useState<{
    active: boolean;
    stoneNumber?: number;
    winnerEstablishment?: string;
  } | null>(null);
  const [liveRound, setLiveRound] = useState<any>(null);

  // Load TV data and poll for updates
  useEffect(() => {
    if (!slugEstabelecimento) return;

    const loadData = async () => {
      try {
        // Load establishment data
        const tvData = await apiService.getTVData(slugEstabelecimento);
        if (tvData.ok) {
          setData(tvData);
        }

        // Load live round
        const liveRoundData = await apiService.getLiveRound();
        if (liveRoundData.ok && liveRoundData.round) {
          setLiveRound(liveRoundData.round);

          // Load drawn numbers if round is live
          if (liveRoundData.round.status === 'drawing') {
            const numbersData = await apiService.getDrawnNumbers(liveRoundData.round.id);
            if (numbersData.ok && numbersData.numbers) {
              setDrawnNumbers(numbersData.numbers);

              // Set last number
              if (numbersData.numbers.length > 0) {
                setLastNumber(numbersData.numbers[numbersData.numbers.length - 1]);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading TV data:', error);
      }
    };

    loadData();

    // Poll for updates every 3 seconds
    const interval = setInterval(loadData, 3000);

    return () => clearInterval(interval);
  }, [slugEstabelecimento]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getTimeLeft = () => {
    const minutes = Math.floor(Math.random() * 9) + 1;
    const seconds = Math.floor(Math.random() * 59);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-tv flex items-center justify-center">
        <div className="animate-spin w-16 h-16 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-tv text-background overflow-hidden">
      {/* Header */}
      <header className="bg-background/5 backdrop-blur-sm border-b border-background/10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                <Heart className="w-7 h-7 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-primary">SORTEBEM</h1>
                <p className="text-background/70 text-sm">{data.establishment.tradeName}</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              {/* Live indicator */}
              <div className="flex items-center gap-2 bg-destructive/20 px-4 py-2 rounded-full">
                <span className="w-3 h-3 rounded-full bg-destructive animate-pulse" />
                <span className="font-semibold text-lg">AO VIVO</span>
              </div>

              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-3 rounded-full bg-background/10 hover:bg-background/20 transition-colors"
              >
                {isMuted ? (
                  <VolumeX className="w-6 h-6" />
                ) : (
                  <Volume2 className="w-6 h-6 text-primary" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left - Countdown & Prize */}
          <div className="space-y-6">
            {/* Countdown */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-background/10 backdrop-blur-sm rounded-3xl p-8 text-center"
            >
              <div className="flex items-center justify-center gap-2 mb-4">
                <Clock className="w-6 h-6 text-primary" />
                <span className="text-xl text-background/70">Próxima Rodada</span>
              </div>
              <p className="text-6xl md:text-7xl font-bold font-mono text-primary">
                {getTimeLeft()}
              </p>
            </motion.div>

            {/* Prize Pool */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-primary rounded-3xl p-8 text-center shadow-glow"
            >
              <Trophy className="w-12 h-12 mx-auto mb-4 text-primary-foreground" />
              <p className="text-xl text-primary-foreground/80 mb-2">Prêmio Atual</p>
              <p className="text-5xl md:text-6xl font-bold text-primary-foreground">
                {formatCurrency(data.currentRound.prizePool)}
              </p>
            </motion.div>
          </div>

          {/* Center - Live Draw */}
          <div className="lg:col-span-2 space-y-6">
            {/* Last Number */}
            <div className="flex justify-center">
              <AnimatePresence mode="wait">
                {lastNumber && (
                  <motion.div
                    key={lastNumber}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className="w-40 h-40 md:w-48 md:h-48 rounded-full bg-gradient-primary flex items-center justify-center shadow-glow"
                  >
                    <span className="text-7xl md:text-8xl font-bold text-primary-foreground">
                      {lastNumber}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Tie Break Alert */}
            <AnimatePresence>
              {tieBreak?.active && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-warning/20 border-2 border-warning rounded-2xl p-6 text-center"
                >
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <Zap className="w-8 h-8 text-warning" />
                    <span className="text-3xl font-bold text-warning">DESEMPATE POR PEDRA</span>
                    <Zap className="w-8 h-8 text-warning" />
                  </div>
                  <p className="text-6xl font-bold text-warning mb-2">
                    PEDRA: {tieBreak.stoneNumber}
                  </p>
                  {tieBreak.winnerEstablishment && (
                    <p className="text-2xl text-background/80">
                      Vencedor: <strong className="text-background">{tieBreak.winnerEstablishment}</strong>
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Drawn Numbers Grid */}
            <div className="bg-background/10 backdrop-blur-sm rounded-3xl p-6">
              <p className="text-center text-background/70 mb-4 text-lg">
                Números Sorteados ({drawnNumbers.length})
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                {drawnNumbers.map((number, index) => (
                  <motion.span
                    key={`${number}-${index}`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className={`w-14 h-14 md:w-16 md:h-16 rounded-xl flex items-center justify-center text-xl md:text-2xl font-bold
                      ${index === drawnNumbers.length - 1 
                        ? 'bg-primary text-primary-foreground shadow-lg' 
                        : 'bg-background/20 text-background'
                      }`}
                  >
                    {number}
                  </motion.span>
                ))}
              </div>
            </div>

            {/* Recent Winners */}
            <div className="bg-background/10 backdrop-blur-sm rounded-3xl p-6">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Trophy className="w-6 h-6 text-primary" />
                <span className="text-xl text-background/70">Últimos Ganhadores</span>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                {data.recentWinners.slice(0, 3).map((winner: any, index: number) => (
                  <motion.div
                    key={winner.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-background/10 rounded-xl p-4 text-center"
                  >
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Store className="w-5 h-5 text-primary" />
                      <span className="font-semibold text-background line-clamp-1">
                        {winner.establishmentName}
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(winner.prizeAmount)}
                    </p>
                    {winner.tieBreakNumber && (
                      <span className="text-xs bg-warning/20 text-warning px-2 py-1 rounded mt-2 inline-block">
                        Pedra: {winner.tieBreakNumber}
                      </span>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-background/5 backdrop-blur-sm border-t border-background/10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between text-background/60">
            <Link to="/" className="hover:text-primary transition-colors">
              www.sortebem.com.br
            </Link>
            <p>Sorteios beneficentes que transformam vidas</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TVMode;
