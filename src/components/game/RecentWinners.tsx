import { Trophy, Clock, Store } from 'lucide-react';
import { motion } from 'framer-motion';

interface Winner {
  id: string;
  establishmentName: string;
  prizeAmount: number;
  pattern: string;
  tieBreakNumber?: number;
  createdAt: Date;
}

interface RecentWinnersProps {
  winners: Winner[];
  showTieBreak?: boolean;
}

const RecentWinners = ({ winners, showTieBreak = true }: RecentWinnersProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000 / 60);
    
    if (diff < 1) return 'Agora mesmo';
    if (diff < 60) return `Há ${diff} min`;
    
    const hours = Math.floor(diff / 60);
    if (hours < 24) return `Há ${hours}h`;
    
    return date.toLocaleDateString('pt-BR');
  };

  const getPatternLabel = (pattern: string) => {
    const labels: Record<string, string> = {
      line: 'Linha',
      column: 'Coluna',
      full: 'Cartela Cheia',
      diagonal: 'Diagonal',
    };
    return labels[pattern] || pattern;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-foreground">
        <Trophy className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Últimos Ganhadores</h3>
      </div>

      <div className="space-y-3">
        {winners.map((winner, index) => (
          <motion.div
            key={winner.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Store className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    {winner.establishmentName}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{formatTime(winner.createdAt)}</span>
                    <span>•</span>
                    <span>{getPatternLabel(winner.pattern)}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg text-primary">
                  {formatCurrency(winner.prizeAmount)}
                </p>
                {showTieBreak && winner.tieBreakNumber && (
                  <span className="text-xs bg-warning/10 text-warning px-2 py-0.5 rounded">
                    Pedra: {winner.tieBreakNumber}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default RecentWinners;
