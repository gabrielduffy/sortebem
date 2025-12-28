import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Check } from 'lucide-react';

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

  useEffect(() => {
    if (autoMark) {
      const autoMarkedNumbers = numbers.flat().filter(n => n !== 0 && drawnNumbers.includes(n));
      setLocalMarked(autoMarkedNumbers);
    }
  }, [autoMark, drawnNumbers, numbers]);

  useEffect(() => {
    if (!autoMark) {
      setLocalMarked(markedNumbers);
    }
  }, [markedNumbers, autoMark]);

  const handleCellClick = (number: number) => {
    if (number === 0 || autoMark) return;
    onToggleMark(number);
  };

  const isMarked = (number: number) => localMarked.includes(number);
  const isDrawn = (number: number) => drawnNumbers.includes(number);

  const columnHeaders = ['S', 'O', 'R', 'T', 'B'];

  return (
    <div className="bg-card border-4 border-primary rounded-2xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="bg-gradient-primary p-3">
        <div className="grid grid-cols-5 gap-1">
          {columnHeaders.map((letter, index) => (
            <div
              key={index}
              className="text-center text-primary-foreground font-bold text-xl md:text-2xl"
            >
              {letter}
            </div>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="p-2 md:p-3 bg-background">
        <div className="grid grid-cols-5 gap-1 md:gap-2">
          {numbers.map((row, rowIndex) =>
            row.map((number, colIndex) => {
              const isCenter = rowIndex === 2 && colIndex === 2;
              const marked = isMarked(number);
              const drawn = isDrawn(number);
              
              return (
                <motion.button
                  key={`${rowIndex}-${colIndex}`}
                  onClick={() => handleCellClick(number)}
                  disabled={isCenter || autoMark}
                  whileTap={{ scale: 0.95 }}
                  className={`
                    aspect-square rounded-lg md:rounded-xl flex items-center justify-center
                    text-lg md:text-xl font-bold transition-all duration-200
                    ${isCenter 
                      ? 'bg-gradient-primary cursor-default' 
                      : marked
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : drawn
                          ? 'bg-primary/20 text-primary border-2 border-primary cursor-pointer hover:bg-primary/30'
                          : 'bg-secondary text-secondary-foreground cursor-pointer hover:bg-secondary/80'
                    }
                    ${cardStatus === 'won' && marked ? 'animate-pulse-glow' : ''}
                  `}
                >
                  {isCenter ? (
                    <Heart className="w-6 h-6 md:w-8 md:h-8 text-primary-foreground" />
                  ) : marked ? (
                    <Check className="w-6 h-6 md:w-8 md:h-8" />
                  ) : (
                    number
                  )}
                </motion.button>
              );
            })
          )}
        </div>
      </div>

      {/* Footer */}
      {cardStatus === 'won' && (
        <div className="bg-success text-success-foreground p-3 text-center">
          <p className="font-bold text-lg">🎉 VOCÊ GANHOU!</p>
        </div>
      )}
    </div>
  );
};

export default CardGrid;
