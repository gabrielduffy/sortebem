import { useState, useEffect, forwardRef } from 'react';
import { Timer, Clock } from 'lucide-react';

interface CountdownTimerProps {
  targetTime: Date;
  label: string;
  variant?: 'default' | 'special' | 'compact';
  onComplete?: () => void;
}

const CountdownTimer = forwardRef<HTMLDivElement, CountdownTimerProps>(
  ({ targetTime, label, variant = 'default', onComplete }, ref) => {
    const [timeLeft, setTimeLeft] = useState({ minutes: 0, seconds: 0 });

    useEffect(() => {
      const calculateTimeLeft = () => {
        const now = new Date().getTime();
        const target = targetTime.getTime();
        const difference = target - now;

        if (difference <= 0) {
          onComplete?.();
          return { minutes: 0, seconds: 0 };
        }

        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        return { minutes, seconds };
      };

      setTimeLeft(calculateTimeLeft());

      const timer = setInterval(() => {
        setTimeLeft(calculateTimeLeft());
      }, 1000);

      return () => clearInterval(timer);
    }, [targetTime, onComplete]);

    const formatNumber = (num: number) => num.toString().padStart(2, '0');

    if (variant === 'compact') {
      return (
        <div ref={ref} className="flex items-center gap-2 text-primary">
          <Clock className="w-4 h-4" />
          <span className="font-mono font-bold">
            {formatNumber(timeLeft.minutes)}:{formatNumber(timeLeft.seconds)}
          </span>
        </div>
      );
    }

    const isSpecial = variant === 'special';

    return (
      <div
        ref={ref}
        className={`rounded-2xl p-4 sm:p-6 ${isSpecial ? 'bg-gradient-primary text-primary-foreground' : 'bg-card border border-border'}`}
      >
        <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4">
          <Timer className={`w-4 h-4 sm:w-5 sm:h-5 ${isSpecial ? 'text-primary-foreground' : 'text-primary'}`} />
          <span className={`text-xs sm:text-sm font-medium ${isSpecial ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
            {label}
          </span>
        </div>
        
        <div className="flex items-center justify-center gap-2">
          {/* Minutes */}
          <div className={`flex flex-col items-center ${isSpecial ? 'bg-primary-foreground/20' : 'bg-primary/10'} rounded-xl px-3 py-2 sm:px-4 sm:py-3`}>
            <span className={`text-2xl sm:text-3xl md:text-4xl font-bold font-mono ${isSpecial ? 'text-primary-foreground' : 'text-primary'}`}>
              {formatNumber(timeLeft.minutes)}
            </span>
            <span className={`text-[10px] sm:text-xs ${isSpecial ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>min</span>
          </div>
          
          <span className={`text-2xl sm:text-3xl font-bold ${isSpecial ? 'text-primary-foreground' : 'text-primary'} animate-pulse`}>:</span>
          
          {/* Seconds */}
          <div className={`flex flex-col items-center ${isSpecial ? 'bg-primary-foreground/20' : 'bg-primary/10'} rounded-xl px-3 py-2 sm:px-4 sm:py-3`}>
            <span className={`text-2xl sm:text-3xl md:text-4xl font-bold font-mono ${isSpecial ? 'text-primary-foreground' : 'text-primary'}`}>
              {formatNumber(timeLeft.seconds)}
            </span>
            <span className={`text-[10px] sm:text-xs ${isSpecial ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>seg</span>
          </div>
        </div>
      </div>
    );
  }
);

CountdownTimer.displayName = 'CountdownTimer';

export default CountdownTimer;
