import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';

interface LiveDrawProps {
  drawnNumbers: number[];
  isLive: boolean;
  tieBreak?: {
    active: boolean;
    stoneNumber?: number;
    winnerEstablishment?: string;
  };
}

const LiveDraw = ({ drawnNumbers, isLive, tieBreak }: LiveDrawProps) => {
  const [lastNumber, setLastNumber] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    if (drawnNumbers.length > 0) {
      setLastNumber(drawnNumbers[drawnNumbers.length - 1]);
    }
  }, [drawnNumbers]);

  return (
    <div className="bg-card border border-border rounded-2xl p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {isLive && (
            <span className="flex items-center gap-2 px-3 py-1 bg-destructive/10 text-destructive rounded-full text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
              AO VIVO
            </span>
          )}
          <h3 className="font-semibold text-foreground">Sorteio</h3>
        </div>
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
        >
          {isMuted ? (
            <VolumeX className="w-5 h-5 text-muted-foreground" />
          ) : (
            <Volume2 className="w-5 h-5 text-primary" />
          )}
        </button>
      </div>

      {/* Last Number */}
      {lastNumber && (
        <div className="flex justify-center mb-6">
          <motion.div
            key={lastNumber}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-primary flex items-center justify-center shadow-glow"
          >
            <span className="text-4xl md:text-5xl font-bold text-primary-foreground">
              {lastNumber}
            </span>
          </motion.div>
        </div>
      )}

      {/* Drawn Numbers Grid */}
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground text-center">
          Números sorteados ({drawnNumbers.length})
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          <AnimatePresence mode="popLayout">
            {drawnNumbers.map((number, index) => (
              <motion.span
                key={`${number}-${index}`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold
                  ${index === drawnNumbers.length - 1 
                    ? 'bg-primary text-primary-foreground shadow-md' 
                    : 'bg-primary/10 text-primary'
                  }`}
              >
                {number}
              </motion.span>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Tie Break */}
      {tieBreak?.active && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 bg-warning/10 border border-warning/20 rounded-xl"
        >
          <h4 className="font-semibold text-warning text-center mb-2">
            ⚡ DESEMPATE POR PEDRA
          </h4>
          {tieBreak.stoneNumber && (
            <div className="flex flex-col items-center gap-2">
              <span className="text-3xl font-bold text-warning">
                PEDRA: {tieBreak.stoneNumber}
              </span>
              {tieBreak.winnerEstablishment && (
                <p className="text-sm text-warning/80">
                  Vencedor: <strong>{tieBreak.winnerEstablishment}</strong>
                </p>
              )}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default LiveDraw;
