import { Heart, TrendingUp, Users } from 'lucide-react';
import { motion } from 'framer-motion';

interface CharityHighlightProps {
  name: string;
  logo?: string;
  description: string;
  totalRaised: number;
  isAnimated?: boolean;
}

const CharityHighlight = ({ 
  name, 
  logo, 
  description, 
  totalRaised,
  isAnimated = true 
}: CharityHighlightProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <motion.div
      initial={isAnimated ? { opacity: 0, y: 20 } : undefined}
      animate={isAnimated ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.5 }}
      className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg"
    >
      {/* Header with gradient */}
      <div className="bg-gradient-primary p-4 flex items-center gap-3">
        <Heart className="w-6 h-6 text-primary-foreground" />
        <span className="text-primary-foreground font-semibold">
          Instituição do Mês
        </span>
      </div>

      <div className="p-6">
        {/* Logo and Name */}
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden">
            {logo ? (
              <img src={logo} alt={name} className="w-full h-full object-cover" />
            ) : (
              <Users className="w-8 h-8 text-primary" />
            )}
          </div>
          <div>
            <h3 className="font-bold text-lg text-foreground">{name}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
          </div>
        </div>

        {/* Total Raised */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="w-5 h-5 text-primary" />
              <span className="text-sm">Arrecadado este mês</span>
            </div>
          </div>
          <motion.p
            key={totalRaised}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            className="text-2xl md:text-3xl font-bold text-primary mt-2"
          >
            {formatCurrency(totalRaised)}
          </motion.p>
          <p className="text-xs text-muted-foreground mt-1">
            * Atualizado em tempo real
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default CharityHighlight;
