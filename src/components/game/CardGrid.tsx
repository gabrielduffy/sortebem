import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Check, Trophy, Sparkles } from 'lucide-react';
import { useConfetti } from '@/hooks/useConfetti';

interface CardGridProps {
  numbers: number[][];
  markedNumbers: number[];
  drawnNumbers: number[];
  autoMark: boolean;
  onToggleMark: (number: number) => void;
  cardStatus: 'active' | 'won' | 'lost';
}

const CardGrid = ({ 
  numbers, 
  markedNumbers, 
  drawnNumbers, 
  autoMark,
  onToggleMark,
  cardStatus 
}: CardGridProps) => {
  const [localMarked, setLocalMarked] = useState<number[]>(markedNumbers);
  const [lastMarkedNumber, setLastMarkedNumber] = useState<number | null>(null);
  const previousStatusRef = useRef(cardStatus);
  const { celebrateWin } = useConfetti();

  useEffect(() => {
    if (autoMark) {
      const autoMarkedNumbers = numbers.flat().filter(n => n !== 0 && drawnNumbers.includes(n));
      
      // Find newly marked number for animation
      const newlyMarked = autoMarkedNumbers.find(n => !localMarked.includes(n));
      if (newlyMarked) {
        setLastMarkedNumber(newlyMarked);
        setTimeout(() => setLastMarkedNumber(null), 600);
      }
      
      setLocalMarked(autoMarkedNumbers);
    }
  }, [autoMark, drawnNumbers, numbers]);

  useEffect(() => {
    if (!autoMark) {
      setLocalMarked(markedNumbers);
    }
  }, [markedNumbers, autoMark]);

  // Trigger confetti when status changes to 'won'
  useEffect(() => {
    if (cardStatus === 'won' && previousStatusRef.current !== 'won') {
      celebrateWin();
    }
    previousStatusRef.current = cardStatus;
  }, [cardStatus, celebrateWin]);

  const handleCellClick = (number: number) => {
    if (number === 0 || autoMark) return;
    setLastMarkedNumber(number);
    setTimeout(() => setLastMarkedNumber(null), 400);
    onToggleMark(number);
  };

  const isMarked = (number: number) => localMarked.includes(number);
  const isDrawn = (number: number) => drawnNumbers.includes(number);
  const isNewlyMarked = (number: number) => number === lastMarkedNumber;

  const columnHeaders = ['S', 'O', 'R', 'T', 'E'];

  // Get animation state for cell
  const getCellAnimation = (marked: boolean, newlyMarked: boolean) => {
    if (newlyMarked) {
      return { scale: [1, 1.2, 1] };
    }
    if (cardStatus === 'won' && marked) {
      return { 
        scale: [1, 1.05, 1],
        transition: { duration: 0.8, repeat: Infinity, ease: "easeInOut" as const }
      };
    }
    return { scale: 1 };
  };

  return (
    <div className="relative bg-card border-4 border-primary rounded-2xl overflow-hidden shadow-xl">
      {/* Win Overlay */}
      <AnimatePresence>
        {cardStatus === 'won' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 pointer-events-none"
          >
            {/* Animated glow effect */}
            <motion.div
              animate={{ 
                opacity: [0.3, 0.6, 0.3],
                scale: [1, 1.02, 1]
              }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity,
                ease: "easeInOut" 
              }}
              className="absolute inset-0 bg-gradient-to-br from-success/20 via-transparent to-primary/20"
            />
            
            {/* Floating sparkles */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 0 }}
                animate={{ 
                  opacity: [0, 1, 0],
                  y: [-20, -80],
                  x: Math.sin(i * 60 * Math.PI / 180) * 50
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.3,
                  ease: "easeOut"
                }}
                className="absolute"
                style={{ 
                  left: `${15 + i * 15}%`, 
                  top: '60%' 
                }}
              >
                <Sparkles className="w-6 h-6 text-primary" />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="bg-gradient-primary p-3 relative z-10">
        <div className="grid grid-cols-5 gap-1">
          {columnHeaders.map((letter, index) => (
            <motion.div
              key={index}
              animate={cardStatus === 'won' ? { 
                y: [0, -3, 0],
                transition: { 
                  duration: 0.5, 
                  repeat: Infinity, 
                  delay: index * 0.1 
                }
              } : {}}
              className="text-center text-primary-foreground font-bold text-xl md:text-2xl"
            >
              {letter}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="p-2 md:p-3 bg-background relative z-10">
        <div className="grid grid-cols-5 gap-1 md:gap-2">
          {numbers.map((row, rowIndex) =>
            row.map((number, colIndex) => {
              const isCenter = rowIndex === 2 && colIndex === 2;
              const marked = isMarked(number);
              const drawn = isDrawn(number);
              const newlyMarked = isNewlyMarked(number);
              
              return (
                <motion.button
                  key={`${rowIndex}-${colIndex}`}
                  onClick={() => handleCellClick(number)}
                  disabled={isCenter || autoMark}
                  animate={getCellAnimation(marked, newlyMarked)}
                  transition={{ duration: 0.3 }}
                  whileTap={{ scale: 0.95 }}
                  className={`
                    aspect-square rounded-lg md:rounded-xl flex items-center justify-center
                    text-lg md:text-xl font-bold transition-all duration-200 relative overflow-hidden
                    ${isCenter 
                      ? 'bg-gradient-primary cursor-default' 
                      : marked
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : drawn
                          ? 'bg-primary/20 text-primary border-2 border-primary cursor-pointer hover:bg-primary/30'
                          : 'bg-secondary text-secondary-foreground cursor-pointer hover:bg-secondary/80'
                    }
                  `}
                >
                  {/* Ripple effect on mark */}
                  <AnimatePresence>
                    {newlyMarked && marked && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0.8 }}
                        animate={{ scale: 3, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0 bg-primary-foreground rounded-full"
                      />
                    )}
                  </AnimatePresence>

                  {isCenter ? (
                    <motion.div
                      animate={cardStatus === 'won' ? { 
                        rotate: [0, 10, -10, 0],
                        scale: [1, 1.1, 1]
                      } : {}}
                      transition={{ 
                        duration: 0.5, 
                        repeat: cardStatus === 'won' ? Infinity : 0,
                        repeatDelay: 1
                      }}
                    >
                      <Heart className="w-6 h-6 md:w-8 md:h-8 text-primary-foreground" />
                    </motion.div>
                  ) : marked ? (
                    <motion.div
                      initial={newlyMarked ? { scale: 0, rotate: -180 } : { scale: 1 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 15 }}
                    >
                      <Check className="w-6 h-6 md:w-8 md:h-8" />
                    </motion.div>
                  ) : (
                    <span className="relative z-10">{number}</span>
                  )}
                </motion.button>
              );
            })
          )}
        </div>
      </div>

      {/* Footer - Win Banner */}
      <AnimatePresence>
        {cardStatus === 'won' && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="bg-gradient-to-r from-success via-success to-primary text-primary-foreground p-4 text-center relative z-10 overflow-hidden"
          >
            {/* Animated background stripes */}
            <motion.div
              animate={{ x: [0, 100] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, white 10px, white 20px)',
                backgroundSize: '200% 100%'
              }}
            />
            
            <div className="flex items-center justify-center gap-3 relative z-10">
              <motion.div
                animate={{ 
                  rotate: [0, 15, -15, 0],
                  y: [0, -5, 0]
                }}
                transition={{ 
                  duration: 1, 
                  repeat: Infinity,
                  repeatDelay: 0.5
                }}
              >
                <Trophy className="w-8 h-8" />
              </motion.div>
              <p className="font-bold text-xl md:text-2xl">VOCÊ GANHOU!</p>
              <motion.div
                animate={{ 
                  rotate: [0, -15, 15, 0],
                  y: [0, -5, 0]
                }}
                transition={{ 
                  duration: 1, 
                  repeat: Infinity,
                  repeatDelay: 0.5,
                  delay: 0.2
                }}
              >
                <Trophy className="w-8 h-8" />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CardGrid;
