import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, Sparkles } from 'lucide-react';

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
  const [showNewNumber, setShowNewNumber] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    if (drawnNumbers.length > 0) {
      const newNumber = drawnNumbers[drawnNumbers.length - 1];
      if (newNumber !== lastNumber) {
        setShowNewNumber(true);
        setLastNumber(newNumber);
        
        // Reset animation after delay
        const timer = setTimeout(() => setShowNewNumber(false), 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [drawnNumbers, lastNumber]);

  // Floating particles animation
  const getParticleAnimation = (i: number) => ({
    opacity: [0, 1, 0],
    y: [-20, -60],
    x: [0, (i % 2 === 0 ? 1 : -1) * (10 + i * 5)],
    transition: {
      duration: 1,
      delay: i * 0.1,
      ease: "easeOut" as const
    }
  });

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

      {/* Last Number with Enhanced Animation */}
      {lastNumber && (
        <div className="flex justify-center mb-6 relative">
          {/* Floating Particles */}
          <AnimatePresence>
            {showNewNumber && (
              <>
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={`particle-${i}`}
                    initial={{ opacity: 0, y: 0 }}
                    animate={getParticleAnimation(i)}
                    className="absolute top-1/2 left-1/2"
                    style={{ 
                      marginLeft: -4, 
                      marginTop: -4,
                    }}
                  >
                    <Sparkles className="w-4 h-4 text-primary" />
                  </motion.div>
                ))}
              </>
            )}
          </AnimatePresence>

          {/* Glow Ring */}
          <AnimatePresence>
            {showNewNumber && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ 
                  scale: [1, 1.5, 1.8], 
                  opacity: [0.6, 0.3, 0] 
                }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="absolute w-32 h-32 md:w-40 md:h-40 rounded-full bg-primary/30"
              />
            )}
          </AnimatePresence>

          {/* Main Number Ball */}
          <motion.div
            key={lastNumber}
            initial={{ scale: 0, rotate: -180, opacity: 0 }}
            animate={{ 
              scale: showNewNumber ? [1, 1.1, 1] : 1, 
              rotate: 0, 
              opacity: 1 
            }}
            transition={{ 
              type: "spring", 
              stiffness: 260, 
              damping: 20 
            }}
            className="relative w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-primary flex items-center justify-center shadow-glow z-10"
          >
            {/* Inner glow effect */}
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-white/30 to-transparent" />
            
            <span className="text-4xl md:text-5xl font-bold text-primary-foreground relative z-10">
              {lastNumber}
            </span>
          </motion.div>

          {/* Outer Rotating Ring */}
          {showNewNumber && (
            <motion.div
              initial={{ rotate: 0, opacity: 0 }}
              animate={{ rotate: 360, opacity: [0, 1, 0] }}
              transition={{ duration: 1.5, ease: "linear" }}
              className="absolute w-36 h-36 md:w-44 md:h-44 rounded-full border-2 border-dashed border-primary/50"
            />
          )}
        </div>
      )}

      {/* Drawn Numbers Grid with Stagger Animation */}
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground text-center">
          Números sorteados ({drawnNumbers.length})
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          <AnimatePresence mode="popLayout">
            {drawnNumbers.map((number, index) => (
              <motion.span
                key={`${number}-${index}`}
                initial={{ scale: 0, rotate: -90 }}
                animate={{ 
                  scale: 1, 
                  rotate: 0,
                  transition: {
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                    delay: index === drawnNumbers.length - 1 ? 0 : index * 0.02
                  }
                }}
                exit={{ scale: 0, rotate: 90 }}
                className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold transition-colors
                  ${index === drawnNumbers.length - 1 
                    ? 'bg-primary text-primary-foreground shadow-lg ring-2 ring-primary/50 ring-offset-2 ring-offset-background' 
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
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="text-3xl font-bold text-warning"
              >
                PEDRA: {tieBreak.stoneNumber}
              </motion.span>
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
