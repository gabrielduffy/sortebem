import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Trophy, Clock, Store, Volume2, VolumeX, Zap, Heart, Sparkles } from 'lucide-react';
import { apiService } from '@/services/api';

const TVMode = () => {
  const { slugEstabelecimento } = useParams<{ slugEstabelecimento: string }>();
  const [data, setData] = useState<any>(null);
  const [charity, setCharity] = useState<any>(null);
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
        if (tvData.ok && tvData.data) {
          setData(tvData.data);
        }

        // Load charity data (active charity)
        const charitiesData = await apiService.getCharities();
        if (charitiesData.ok && charitiesData.data) {
          const activeCharity = charitiesData.data.find((c: any) => c.is_active || c.isActive);
          if (activeCharity) {
            setCharity(activeCharity);
          }
        }

        // Load live round
        const liveRoundData = await apiService.getLiveRound();
        if (liveRoundData.ok && liveRoundData.data) {
          setLiveRound(liveRoundData.data);

          // Load drawn numbers if round is live
          if (liveRoundData.data.status === 'drawing') {
            const numbersData = await apiService.getDrawnNumbers(liveRoundData.data.id);
            if (numbersData.ok && numbersData.data) {
              setDrawnNumbers(numbersData.data);

              // Set last number
              if (numbersData.data.length > 0) {
                setLastNumber(numbersData.data[numbersData.data.length - 1]);
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

  // Real countdown timer
  const [timeLeft, setTimeLeft] = useState({ minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!liveRound?.ends_at && !liveRound?.selling_ends_at) return;

    const calculateTimeLeft = () => {
      const targetTime = new Date(liveRound.selling_ends_at || liveRound.ends_at);
      const difference = targetTime.getTime() - Date.now();

      if (difference > 0) {
        setTimeLeft({
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      } else {
        setTimeLeft({ minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [liveRound]);

  const getTimeLeft = () => {
    return `${timeLeft.minutes.toString().padStart(2, '0')}:${timeLeft.seconds.toString().padStart(2, '0')}`;
  };

  // Get sales URL for QR Code
  const salesUrl = `${window.location.origin}/checkout?ref=${slugEstabelecimento}`;

  // Ticker messages
  const tickerMessages = [
    `🎯 Próximo sorteio em ${getTimeLeft()} • Prêmio: ${formatCurrency(liveRound?.prize_pool || 0)}`,
    `🏆 Últimos ganhadores: ${(data?.recentWinners || []).slice(0, 3).map((w: any) => formatCurrency(w.prize_amount || 0)).join(' • ')}`,
    `💝 Ajudando: ${charity?.name || 'Instituição Beneficente'}`,
    `🎁 Rodadas a cada 10 minutos • Cartelas a partir de R$ 5,00`,
    `📱 Participe pelo QR Code ou acesse www.sortebem.com.br`,
  ];

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-tv flex items-center justify-center">
        <div className="animate-spin w-16 h-16 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-tv text-background overflow-hidden flex flex-col">
      {/* Header */}
      <header className="bg-background/5 backdrop-blur-sm border-b border-background/10 py-4">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-3 gap-4 items-center">
            {/* Left: Establishment Logo + Name */}
            <div className="flex items-center gap-3">
              {data?.establishment?.logo_url || data?.establishment?.logoUrl ? (
                <img
                  src={data.establishment.logo_url || data.establishment.logoUrl}
                  alt={data.establishment.name}
                  className="w-14 h-14 rounded-xl object-cover bg-background/10 border border-background/20"
                />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-background/10 border border-background/20 flex items-center justify-center">
                  <Store className="w-7 h-7 text-primary" />
                </div>
              )}
              <div>
                <p className="text-sm text-background/60 uppercase tracking-wide">Estabelecimento</p>
                <p className="text-lg font-bold text-background line-clamp-1">
                  {data?.establishment?.trade_name || data?.establishment?.tradeName || data?.establishment?.name || 'Estabelecimento'}
                </p>
              </div>
            </div>

            {/* Center: SORTEBEM Logo */}
            <div className="flex flex-col items-center justify-center">
              <div className="flex items-center gap-2 mb-1">
                <Heart className="w-8 h-8 text-primary" />
                <h1 className="text-3xl font-bold text-primary">SORTEBEM</h1>
              </div>
              <div className="flex items-center gap-2 bg-destructive/20 px-3 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                <span className="font-semibold text-sm text-background">AO VIVO</span>
              </div>
            </div>

            {/* Right: Charity Logo + Name + Amount Raised */}
            <div className="flex items-center gap-3 justify-end">
              <div className="text-right">
                <p className="text-sm text-background/60 uppercase tracking-wide">Ajudando</p>
                <p className="text-lg font-bold text-primary line-clamp-1">
                  {charity?.name || 'Instituição Beneficente'}
                </p>
                <p className="text-sm text-background/80">
                  Arrecadado: <span className="font-bold text-primary">{formatCurrency(charity?.total_raised || 0)}</span>
                </p>
              </div>
              {charity?.logo_url || charity?.logoUrl ? (
                <img
                  src={charity.logo_url || charity.logoUrl}
                  alt={charity.name}
                  className="w-14 h-14 rounded-xl object-cover bg-background/10 border border-background/20"
                />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-background/10 border border-background/20 flex items-center justify-center">
                  <Heart className="w-7 h-7 text-primary" />
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content with QR Code Sidebar */}
      <main className="flex-1 container mx-auto px-6 py-6 grid grid-cols-4 gap-6">
        {/* Left/Center: Main Content (3 columns) */}
        <div className="col-span-3 space-y-6">
          <div className="grid grid-cols-3 gap-6">
            {/* Countdown */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-background/10 backdrop-blur-sm rounded-2xl p-6 text-center"
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-primary" />
                <span className="text-base text-background/70">Próxima Rodada</span>
              </div>
              <p className="text-base text-background/60 mb-3">
                #{liveRound?.number || liveRound?.round_number || '-'}
              </p>
              <p className="text-5xl font-bold font-mono text-primary">
                {getTimeLeft()}
              </p>
            </motion.div>

            {/* Last Number (Center, 2 columns wide) */}
            <div className="col-span-2 flex justify-center items-center">
              <AnimatePresence mode="wait">
                {lastNumber && (
                  <motion.div
                    key={lastNumber}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className="w-36 h-36 rounded-full bg-gradient-primary flex items-center justify-center shadow-glow relative"
                  >
                    <span className="text-7xl font-bold text-primary-foreground">
                      {lastNumber}
                    </span>
                    {/* Pulse ring */}
                    <motion.div
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.5, 0, 0.5]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="absolute inset-0 rounded-full border-4 border-primary"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Tie Break Alert */}
          <AnimatePresence>
            {tieBreak?.active && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-warning/20 border-2 border-warning rounded-2xl p-4 text-center"
              >
                <div className="flex items-center justify-center gap-3 mb-2">
                  <Zap className="w-6 h-6 text-warning" />
                  <span className="text-2xl font-bold text-warning">DESEMPATE POR PEDRA</span>
                  <Zap className="w-6 h-6 text-warning" />
                </div>
                <p className="text-5xl font-bold text-warning mb-2">
                  PEDRA: {tieBreak.stoneNumber}
                </p>
                {tieBreak.winnerEstablishment && (
                  <p className="text-xl text-background/80">
                    Vencedor: <strong className="text-background">{tieBreak.winnerEstablishment}</strong>
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Drawn Numbers Grid */}
          <div className="bg-background/10 backdrop-blur-sm rounded-2xl p-4">
            <p className="text-center text-background/70 mb-3 text-base">
              Números Sorteados ({drawnNumbers.length})
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {drawnNumbers.map((number, index) => (
                <motion.span
                  key={`${number}-${index}`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className={`w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold
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
          <div className="bg-background/10 backdrop-blur-sm rounded-2xl p-4">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Trophy className="w-5 h-5 text-primary" />
              <span className="text-base text-background/70 font-semibold">Últimos Ganhadores</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {(data?.recentWinners || []).slice(0, 3).map((winner: any, index: number) => (
                <motion.div
                  key={winner.id || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-background/10 rounded-xl p-3 text-center"
                >
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Store className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-background text-sm line-clamp-1">
                      {winner.establishment_name || winner.establishmentName || 'Estabelecimento'}
                    </span>
                  </div>
                  <p className="text-xl font-bold text-primary">
                    {formatCurrency(winner.prize_amount || winner.prizeAmount || 0)}
                  </p>
                  {(winner.tie_break_number || winner.tieBreakNumber) && (
                    <span className="text-xs bg-warning/20 text-warning px-2 py-0.5 rounded mt-1 inline-block">
                      Pedra: {winner.tie_break_number || winner.tieBreakNumber}
                    </span>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar: QR Code + Prize */}
        <div className="col-span-1 space-y-4">
          {/* Prize Pool */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-primary rounded-2xl p-6 text-center shadow-glow"
          >
            <Trophy className="w-10 h-10 mx-auto mb-3 text-primary-foreground" />
            <p className="text-base text-primary-foreground/80 mb-2">Prêmio Atual</p>
            <p className="text-4xl font-bold text-primary-foreground">
              {formatCurrency(data?.currentRound?.prize_pool || data?.currentRound?.prizePool || liveRound?.prize_pool || 0)}
            </p>
          </motion.div>

          {/* QR Code - Sales */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-background/10 backdrop-blur-sm rounded-2xl p-4 text-center"
          >
            <div className="flex items-center justify-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-primary" />
              <p className="font-bold text-background text-sm">PARTICIPE AGORA!</p>
            </div>
            <div className="bg-white p-3 rounded-xl inline-block mb-3">
              <QRCodeSVG
                value={salesUrl}
                size={160}
                level="H"
                includeMargin={false}
              />
            </div>
            <p className="text-xs text-background/70 mb-2">Escaneie o QR Code</p>
            <p className="text-sm font-bold text-primary">Compre suas cartelas!</p>
          </motion.div>

          {/* Mute Button */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="w-full p-4 rounded-2xl bg-background/10 hover:bg-background/20 transition-colors flex items-center justify-center gap-2"
          >
            {isMuted ? (
              <>
                <VolumeX className="w-5 h-5 text-background/70" />
                <span className="text-sm text-background/70">Som Desligado</span>
              </>
            ) : (
              <>
                <Volume2 className="w-5 h-5 text-primary" />
                <span className="text-sm text-primary font-semibold">Som Ligado</span>
              </>
            )}
          </button>
        </div>
      </main>

      {/* Footer Ticker */}
      <footer className="bg-background/5 backdrop-blur-sm border-t border-background/10 py-3 overflow-hidden">
        <motion.div
          animate={{ x: ['0%', '-100%'] }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="flex gap-8 whitespace-nowrap"
        >
          {/* Duplicate messages for seamless loop */}
          {[...tickerMessages, ...tickerMessages].map((message, index) => (
            <span key={index} className="text-background/80 text-base font-medium">
              {message}
            </span>
          ))}
        </motion.div>
      </footer>
    </div>
  );
};

export default TVMode;
