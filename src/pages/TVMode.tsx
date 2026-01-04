import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Trophy, Clock, Store, Volume2, VolumeX, Zap, Heart, Sparkles, Mic } from 'lucide-react';
import { apiService } from '@/services/api';
import { useElevenLabsTTS } from '@/hooks/useElevenLabsTTS';

const TVMode = () => {
  const { code, slugEstabelecimento } = useParams<{ code?: string; slugEstabelecimento?: string }>();
  const identifier = code || slugEstabelecimento;

  const [tvData, setTvData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
  const [tickerMessages, setTickerMessages] = useState<any[]>([]);
  
  const lastAnnouncedNumberRef = useRef<number | null>(null);
  
  // ElevenLabs TTS hook
  const { 
    speakNumber, 
    speakWinner, 
    speakTieBreak, 
    isSpeaking, 
    isEnabled: ttsEnabled 
  } = useElevenLabsTTS({
    enabled: !isMuted,
    onSpeaking: () => console.log('TTS: Speaking...'),
    onFinished: () => console.log('TTS: Finished'),
    onError: (error) => console.error('TTS Error:', error)
  });

  useEffect(() => {
    if (!identifier) return;

    const loadData = async () => {
      try {
        let response;
        if (code) {
          response = await apiService.getTVDataByCode(code);
        } else {
          response = await apiService.getTVData(slugEstabelecimento!);
        }

        if (response.ok && response.data) {
          setTvData(response.data);
        }

        const charitiesData = await apiService.getCharities();
        if (charitiesData.ok && charitiesData.data) {
          const activeCharity = charitiesData.data.find((c: any) => c.is_active || c.isActive);
          if (activeCharity) {
            setCharity(activeCharity);
          }
        }

        const tickerData = await apiService.getActiveTickerMessages();
        if (tickerData.ok && tickerData.data) {
          setTickerMessages(tickerData.data);
        }

        const liveRoundData = await apiService.getLiveRound();
        if (liveRoundData.ok && liveRoundData.data) {
          setLiveRound(liveRoundData.data);

          if (liveRoundData.data.status === 'drawing') {
            const numbersData = await apiService.getDrawnNumbers(liveRoundData.data.id);
            if (numbersData.ok && numbersData.data) {
              const newNumbers = numbersData.data as number[];
              setDrawnNumbers(newNumbers);
              
              if (newNumbers.length > 0) {
                const newLastNumber = newNumbers[newNumbers.length - 1];
                setLastNumber(newLastNumber);
                
                // Announce new number via TTS if not muted and it's a new number
                if (newLastNumber !== lastAnnouncedNumberRef.current) {
                  lastAnnouncedNumberRef.current = newLastNumber;
                  speakNumber(newLastNumber);
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading TV data:', error);
        setError('Erro ao carregar dados da TV');
      } finally {
        setLoading(false);
      }
    };

    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, [identifier, speakNumber]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

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

  const salesUrl = code
    ? `${window.location.origin}/est/${code}`
    : `${window.location.origin}/checkout?ref=${slugEstabelecimento}`;

  const formattedTickerMessages = tickerMessages.map(t => `${t.icon || ''} ${t.message}`.trim());

  if (loading && !tvData) {
    return (
      <div className="min-h-screen bg-gradient-tv flex items-center justify-center">
        <div className="animate-spin w-12 h-12 md:w-16 md:h-16 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error && !tvData) {
    return (
      <div className="min-h-screen bg-gradient-tv flex items-center justify-center p-4">
        <div className="text-white text-center">
          <p className="text-xl md:text-2xl font-bold mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary text-white px-6 py-2 rounded-lg"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  const establishment = tvData?.establishment;

  return (
    <div className="min-h-screen bg-gradient-tv text-background overflow-hidden flex flex-col">
      {/* Header */}
      <header className="bg-background/5 backdrop-blur-sm border-b border-background/10 py-2 md:py-4">
        <div className="container mx-auto px-3 md:px-6">
          {/* Mobile Header */}
          <div className="flex md:hidden items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Heart className="w-6 h-6 text-primary" />
              <span className="text-xl font-bold text-primary">SORTEBEM</span>
            </div>
            <div className="flex items-center gap-2 bg-destructive/20 px-2 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
              <span className="font-semibold text-xs text-background">AO VIVO</span>
            </div>
          </div>

          {/* Desktop Header */}
          <div className="hidden md:grid grid-cols-3 gap-4 items-center">
            {/* Left: Establishment */}
            <div className="flex items-center gap-3">
              {establishment?.logo_url || establishment?.logoUrl ? (
                <img
                  src={establishment.logo_url || establishment.logoUrl}
                  alt={establishment.name}
                  className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl object-cover bg-background/10 border border-background/20"
                />
              ) : (
                <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl bg-background/10 border border-background/20 flex items-center justify-center">
                  <Store className="w-6 h-6 lg:w-7 lg:h-7 text-primary" />
                </div>
              )}
              <div>
                <p className="text-xs lg:text-sm text-background/60 uppercase tracking-wide">Estabelecimento</p>
                <p className="text-base lg:text-lg font-bold text-background line-clamp-1">
                  {establishment?.trade_name || establishment?.tradeName || establishment?.name || 'Estabelecimento'}
                </p>
              </div>
            </div>

            {/* Center: Logo */}
            <div className="flex flex-col items-center justify-center">
              <div className="flex items-center gap-2 mb-1">
                <Heart className="w-6 h-6 lg:w-8 lg:h-8 text-primary" />
                <h1 className="text-2xl lg:text-3xl font-bold text-primary">SORTEBEM</h1>
              </div>
              <div className="flex items-center gap-2 bg-destructive/20 px-3 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                <span className="font-semibold text-xs lg:text-sm text-background">AO VIVO</span>
              </div>
            </div>

            {/* Right: Charity */}
            <div className="flex items-center gap-3 justify-end">
              <div className="text-right">
                <p className="text-xs lg:text-sm text-background/60 uppercase tracking-wide">Ajudando</p>
                <p className="text-base lg:text-lg font-bold text-primary line-clamp-1">
                  {charity?.name || 'Instituição Beneficente'}
                </p>
                <p className="text-xs lg:text-sm text-background/80">
                  Arrecadado: <span className="font-bold text-primary">{formatCurrency(charity?.total_raised || 0)}</span>
                </p>
              </div>
              {charity?.logo_url || charity?.logoUrl ? (
                <img
                  src={charity.logo_url || charity.logoUrl}
                  alt={charity.name}
                  className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl object-cover bg-background/10 border border-background/20"
                />
              ) : (
                <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl bg-background/10 border border-background/20 flex items-center justify-center">
                  <Heart className="w-6 h-6 lg:w-7 lg:h-7 text-primary" />
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-3 md:px-6 py-3 md:py-6">
        {/* Mobile Layout */}
        <div className="md:hidden space-y-4">
          {/* Prize + Countdown Row */}
          <div className="grid grid-cols-2 gap-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-primary rounded-xl p-4 text-center shadow-glow"
            >
              <Trophy className="w-6 h-6 mx-auto mb-1 text-primary-foreground" />
              <p className="text-xs text-primary-foreground/80">Prêmio</p>
              <p className="text-2xl font-bold text-primary-foreground">
                {formatCurrency(tvData?.currentRound?.prize_pool || liveRound?.prize_pool || 0)}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-background/10 backdrop-blur-sm rounded-xl p-4 text-center"
            >
              <Clock className="w-5 h-5 text-primary mx-auto mb-1" />
              <p className="text-xs text-background/70">Próx. Rodada</p>
              <p className="text-2xl font-bold font-mono text-primary">
                {getTimeLeft()}
              </p>
            </motion.div>
          </div>

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
                  className="w-24 h-24 rounded-full bg-gradient-primary flex items-center justify-center shadow-glow relative"
                >
                  <span className="text-5xl font-bold text-primary-foreground">
                    {lastNumber}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Drawn Numbers */}
          <div className="bg-background/10 backdrop-blur-sm rounded-xl p-3">
            <p className="text-center text-background/70 mb-2 text-sm">
              Números Sorteados ({drawnNumbers.length})
            </p>
            <div className="flex flex-wrap gap-1.5 justify-center max-h-24 overflow-y-auto">
              {drawnNumbers.map((number, index) => (
                <motion.span
                  key={`${number}-${index}`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`w-8 h-8 rounded-md flex items-center justify-center text-sm font-bold
                    ${index === drawnNumbers.length - 1
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background/20 text-background'
                    }`}
                >
                  {number}
                </motion.span>
              ))}
            </div>
          </div>

          {/* QR Code */}
          <div className="bg-background/10 backdrop-blur-sm rounded-xl p-4 text-center">
            <p className="font-bold text-background text-sm mb-2">COMPRE SUAS CARTELAS!</p>
            <div className="bg-white p-2 rounded-lg inline-block">
              <QRCodeSVG value={salesUrl} size={100} level="H" includeMargin={false} />
            </div>
          </div>
        </div>

        {/* Desktop/TV Layout */}
        <div className="hidden md:grid grid-cols-4 gap-4 lg:gap-6">
          {/* Left Content (3 columns) */}
          <div className="col-span-3 space-y-4 lg:space-y-6">
            <div className="grid grid-cols-3 gap-4 lg:gap-6">
              {/* Countdown */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-background/10 backdrop-blur-sm rounded-2xl p-4 lg:p-6 text-center"
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Clock className="w-4 h-4 lg:w-5 lg:h-5 text-primary" />
                  <span className="text-sm lg:text-base text-background/70">Próxima Rodada</span>
                </div>
                <p className="text-sm lg:text-base text-background/60 mb-2 lg:mb-3">
                  #{liveRound?.number || liveRound?.round_number || '-'}
                </p>
                <p className="text-4xl lg:text-5xl font-bold font-mono text-primary">
                  {getTimeLeft()}
                </p>
              </motion.div>

              {/* Last Number */}
              <div className="col-span-2 flex justify-center items-center">
                <AnimatePresence mode="wait">
                  {lastNumber && (
                    <motion.div
                      key={lastNumber}
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                      className="w-28 h-28 lg:w-36 lg:h-36 rounded-full bg-gradient-primary flex items-center justify-center shadow-glow relative"
                    >
                      <span className="text-5xl lg:text-7xl font-bold text-primary-foreground">
                        {lastNumber}
                      </span>
                      <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
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
                    <Zap className="w-5 h-5 lg:w-6 lg:h-6 text-warning" />
                    <span className="text-xl lg:text-2xl font-bold text-warning">DESEMPATE POR PEDRA</span>
                    <Zap className="w-5 h-5 lg:w-6 lg:h-6 text-warning" />
                  </div>
                  <p className="text-4xl lg:text-5xl font-bold text-warning mb-2">
                    PEDRA: {tieBreak.stoneNumber}
                  </p>
                  {tieBreak.winnerEstablishment && (
                    <p className="text-lg lg:text-xl text-background/80">
                      Vencedor: <strong className="text-background">{tieBreak.winnerEstablishment}</strong>
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Drawn Numbers Grid */}
            <div className="bg-background/10 backdrop-blur-sm rounded-2xl p-3 lg:p-4">
              <p className="text-center text-background/70 mb-2 lg:mb-3 text-sm lg:text-base">
                Números Sorteados ({drawnNumbers.length})
              </p>
              <div className="flex flex-wrap gap-1.5 lg:gap-2 justify-center">
                {drawnNumbers.map((number, index) => (
                  <motion.span
                    key={`${number}-${index}`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className={`w-10 h-10 lg:w-12 lg:h-12 rounded-lg flex items-center justify-center text-base lg:text-lg font-bold
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
            <div className="bg-background/10 backdrop-blur-sm rounded-2xl p-3 lg:p-4">
              <div className="flex items-center justify-center gap-2 mb-2 lg:mb-3">
                <Trophy className="w-4 h-4 lg:w-5 lg:h-5 text-primary" />
                <span className="text-sm lg:text-base text-background/70 font-semibold">Últimos Ganhadores</span>
              </div>
              <div className="grid grid-cols-3 gap-2 lg:gap-3">
                {(tvData?.recentWinners || []).slice(0, 3).map((winner: any, index: number) => (
                  <motion.div
                    key={winner.id || index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-background/10 rounded-xl p-2 lg:p-3 text-center"
                  >
                    <div className="flex items-center justify-center gap-1 lg:gap-2 mb-1">
                      <Store className="w-3 h-3 lg:w-4 lg:h-4 text-primary" />
                      <span className="font-semibold text-background text-xs lg:text-sm line-clamp-1">
                        {winner.establishment_name || winner.establishmentName || 'Estabelecimento'}
                      </span>
                    </div>
                    <p className="text-lg lg:text-xl font-bold text-primary">
                      {formatCurrency(winner.prize_amount || winner.prizeAmount || 0)}
                    </p>
                    {(winner.tie_break_number || winner.tieBreakNumber) && (
                      <span className="text-[10px] lg:text-xs bg-warning/20 text-warning px-2 py-0.5 rounded mt-1 inline-block">
                        Pedra: {winner.tie_break_number || winner.tieBreakNumber}
                      </span>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="col-span-1 space-y-3 lg:space-y-4">
            {/* Prize Pool */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-primary rounded-2xl p-4 lg:p-6 text-center shadow-glow"
            >
              <Trophy className="w-8 h-8 lg:w-10 lg:h-10 mx-auto mb-2 lg:mb-3 text-primary-foreground" />
              <p className="text-sm lg:text-base text-primary-foreground/80 mb-1 lg:mb-2">Prêmio Atual</p>
              <p className="text-3xl lg:text-4xl font-bold text-primary-foreground">
                {formatCurrency(tvData?.currentRound?.prize_pool || liveRound?.prize_pool || 0)}
              </p>
            </motion.div>

            {/* QR Code */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-background/10 backdrop-blur-sm rounded-2xl p-3 lg:p-4 text-center"
            >
              <div className="flex items-center justify-center gap-2 mb-2 lg:mb-3">
                <Sparkles className="w-4 h-4 lg:w-5 lg:h-5 text-primary" />
                <p className="font-bold text-background text-xs lg:text-sm">PARTICIPE AGORA!</p>
              </div>
              <div className="bg-white p-2 lg:p-3 rounded-xl inline-block mb-2 lg:mb-3">
                <QRCodeSVG value={salesUrl} size={120} level="H" includeMargin={false} className="lg:hidden" />
                <QRCodeSVG value={salesUrl} size={160} level="H" includeMargin={false} className="hidden lg:block" />
              </div>
              <p className="text-[10px] lg:text-xs text-background/70 mb-1 lg:mb-2">Escaneie o QR Code</p>
              <p className="text-xs lg:text-sm font-bold text-primary">Compre suas cartelas!</p>
            </motion.div>

            {/* Mute Button */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="w-full p-3 lg:p-4 rounded-2xl bg-background/10 hover:bg-background/20 transition-colors flex items-center justify-center gap-2"
            >
              {isMuted ? (
                <>
                  <VolumeX className="w-4 h-4 lg:w-5 lg:h-5 text-background/70" />
                  <span className="text-xs lg:text-sm text-background/70">Som Desligado</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 lg:w-5 lg:h-5 text-primary" />
                  <span className="text-xs lg:text-sm text-primary font-semibold">Som Ligado</span>
                  {ttsEnabled && (
                    <Mic className={`w-3 h-3 lg:w-4 lg:h-4 text-primary ${isSpeaking ? 'animate-pulse' : ''}`} />
                  )}
                </>
              )}
            </button>
          </div>
        </div>
      </main>

      {/* Ticker */}
      {formattedTickerMessages.length > 0 && (
        <footer className="bg-primary py-2 lg:py-3 overflow-hidden">
          <div className="animate-marquee whitespace-nowrap">
            <span className="text-primary-foreground font-semibold text-sm lg:text-lg mx-4">
              {formattedTickerMessages.join(' • ')}
            </span>
            <span className="text-primary-foreground font-semibold text-sm lg:text-lg mx-4">
              {formattedTickerMessages.join(' • ')}
            </span>
          </div>
        </footer>
      )}
    </div>
  );
};

export default TVMode;
