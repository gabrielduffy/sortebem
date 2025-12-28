import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Gift, Trophy, Tv, Clock, TrendingUp, Play, Shield, Users, ArrowRight } from 'lucide-react';
import PublicLayout from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/button';
import CountdownTimer from '@/components/game/CountdownTimer';
import CharityHighlight from '@/components/charity/CharityHighlight';
import RecentWinners from '@/components/game/RecentWinners';
import { mockCharity, mockRecentWinners, mockCurrentRound, mockSpecialRound } from '@/services/mockData';

const Index = () => {
  const [charity, setCharity] = useState(mockCharity);
  const [currentRound] = useState(mockCurrentRound);
  const [specialRound] = useState(mockSpecialRound);

  // Simulate real-time charity amount increase
  useEffect(() => {
    const interval = setInterval(() => {
      setCharity(prev => ({
        ...prev,
        totalRaised: prev.totalRaised + Math.random() * 10,
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: Clock,
      title: 'Rodadas a cada 10 min',
      description: 'Sorteios rápidos e emocionantes acontecendo o tempo todo.',
    },
    {
      icon: Trophy,
      title: 'Rodada Especial',
      description: 'A cada 60 minutos, prêmios maiores aguardam você.',
    },
    {
      icon: Heart,
      title: '20% para Caridade',
      description: 'Parte de cada cartela vai para instituições beneficentes.',
    },
    {
      icon: Shield,
      title: '100% Transparente',
      description: 'Acompanhe em tempo real toda a arrecadação.',
    },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative bg-gradient-hero min-h-[90vh] flex items-center overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 py-12 md:py-20 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full">
                <Heart className="w-4 h-4" />
                <span className="text-sm font-medium">Sorteios Beneficentes</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                Ganhe prêmios enquanto{' '}
                <span className="text-gradient">transforma vidas</span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground max-w-lg">
                Participe de sorteios emocionantes e ajude instituições beneficentes. 
                Rodadas a cada 10 minutos com prêmios reais!
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/checkout">
                  <Button variant="hero" size="xl" className="w-full sm:w-auto">
                    <Gift className="w-5 h-5" />
                    Comprar Cartelas
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/como-funciona">
                  <Button variant="outline" size="xl" className="w-full sm:w-auto">
                    <Play className="w-5 h-5" />
                    Como Funciona
                  </Button>
                </Link>
              </div>

              {/* Stats */}
              <div className="flex gap-8 pt-4">
                <div>
                  <p className="text-2xl md:text-3xl font-bold text-primary">
                    {formatCurrency(currentRound.prizePool)}
                  </p>
                  <p className="text-sm text-muted-foreground">Pool Atual</p>
                </div>
                <div>
                  <p className="text-2xl md:text-3xl font-bold text-foreground">
                    {currentRound.totalCards.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">Cartelas Vendidas</p>
                </div>
              </div>
            </motion.div>

            {/* Right Content - Countdowns */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-6"
            >
              <CountdownTimer
                targetTime={new Date(Date.now() + 8 * 60 * 1000)}
                label="Próxima Rodada"
              />
              <CountdownTimer
                targetTime={specialRound.startTime}
                label="Rodada Especial"
                variant="special"
              />
              
              {/* Prize Pool Display */}
              <div className="bg-card border border-border rounded-2xl p-6 text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Prêmio da Rodada Especial
                </p>
                <p className="text-4xl md:text-5xl font-bold text-gradient">
                  {formatCurrency(specialRound.prizePool)}
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Charity Section */}
      <section className="py-16 md:py-24 bg-secondary">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <CharityHighlight
              name={charity.name}
              logo={charity.logo}
              description={charity.description}
              totalRaised={charity.totalRaised}
            />
            
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                Impacto Social Real
              </h2>
              <p className="text-lg text-muted-foreground">
                Cada cartela vendida contribui diretamente para instituições que 
                transformam vidas. Acompanhe em tempo real o impacto da sua participação.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-card border border-border rounded-xl p-4">
                  <TrendingUp className="w-8 h-8 text-primary mb-2" />
                  <p className="text-2xl font-bold text-foreground">20%</p>
                  <p className="text-sm text-muted-foreground">Para caridade</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                  <Users className="w-8 h-8 text-primary mb-2" />
                  <p className="text-2xl font-bold text-foreground">12</p>
                  <p className="text-sm text-muted-foreground">Instituições apoiadas</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Como Funciona
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Participar é simples e seguro. Compre suas cartelas, acompanhe o sorteio 
              e resgate seu prêmio via Pix!
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Winners */}
      <section className="py-16 md:py-24 bg-secondary">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Ganhadores Recentes
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                Veja os estabelecimentos vencedores das últimas rodadas. 
                O próximo pode ser o seu!
              </p>
              <Link to="/checkout">
                <Button variant="hero" size="lg">
                  Quero Participar
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
            <RecentWinners winners={mockRecentWinners} />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-primary">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto space-y-6"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground">
              Pronto para participar?
            </h2>
            <p className="text-xl text-primary-foreground/80">
              Compre suas cartelas agora e concorra a prêmios incríveis 
              enquanto ajuda quem mais precisa.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/checkout">
                <Button 
                  size="xl" 
                  className="bg-background text-primary hover:bg-background/90 shadow-xl"
                >
                  <Gift className="w-5 h-5" />
                  Comprar Cartelas
                </Button>
              </Link>
              <Link to="/resgatar">
                <Button 
                  variant="outline" 
                  size="xl"
                  className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10"
                >
                  <Trophy className="w-5 h-5" />
                  Resgatar Prêmio
                </Button>
              </Link>
              <Link to="/tv/demo">
                <Button 
                  variant="outline" 
                  size="xl"
                  className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10"
                >
                  <Tv className="w-5 h-5" />
                  Modo TV
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default Index;
