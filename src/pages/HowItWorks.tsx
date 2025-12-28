import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Gift, 
  Trophy, 
  Clock, 
  Heart, 
  CreditCard, 
  Smartphone,
  CheckCircle,
  ArrowRight,
  Play,
  Users,
  Tv
} from 'lucide-react';
import PublicLayout from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/button';

const HowItWorks = () => {
  const steps = [
    {
      number: 1,
      icon: Gift,
      title: 'Compre suas cartelas',
      description: 'Escolha a quantidade de cartelas e pague via Pix. Sem cadastro necessário!',
    },
    {
      number: 2,
      icon: Clock,
      title: 'Aguarde o sorteio',
      description: 'Rodadas acontecem a cada 10 minutos. Acompanhe ao vivo pelo site ou TV.',
    },
    {
      number: 3,
      icon: CheckCircle,
      title: 'Marque os números',
      description: 'Marque manualmente ou ative a marcação automática para não perder nada.',
    },
    {
      number: 4,
      icon: Trophy,
      title: 'Resgate seu prêmio',
      description: 'Se ganhar, use o código da cartela para sacar via Pix instantaneamente.',
    },
  ];

  const features = [
    {
      icon: Clock,
      title: 'Rodadas Rápidas',
      description: 'A cada 10 minutos você tem uma nova chance de ganhar. Não precisa esperar!',
    },
    {
      icon: Trophy,
      title: 'Rodada Especial',
      description: 'A cada 60 minutos, uma rodada com prêmios maiores alimentada pelas rodadas anteriores.',
    },
    {
      icon: Heart,
      title: '20% para Caridade',
      description: 'Parte de cada cartela vai diretamente para a instituição beneficente do mês.',
    },
    {
      icon: CreditCard,
      title: 'Pix Instantâneo',
      description: 'Pagamento e recebimento de prêmios via Pix, sem complicação.',
    },
    {
      icon: Smartphone,
      title: 'Sem Cadastro',
      description: 'Você não precisa criar conta. Compre, jogue e ganhe com apenas seu código.',
    },
    {
      icon: Tv,
      title: 'Modo TV',
      description: 'Acompanhe os sorteios em tela grande no estabelecimento parceiro.',
    },
  ];

  const faqs = [
    {
      question: 'Preciso me cadastrar para jogar?',
      answer: 'Não! Você pode comprar cartelas sem criar conta. Basta pagar via Pix e guardar o código da cartela.',
    },
    {
      question: 'Como sei se ganhei?',
      answer: 'Acompanhe o sorteio ao vivo pela página da sua cartela. Quando completar o padrão de vitória, o sistema valida automaticamente.',
    },
    {
      question: 'Como recebo meu prêmio?',
      answer: 'Acesse a página "Resgatar Prêmio", informe o código da cartela e sua chave Pix. O valor é transferido em até 24 horas.',
    },
    {
      question: 'O que é a Rodada Especial?',
      answer: 'A cada 60 minutos acontece uma rodada com prêmio maior, alimentada por parte das arrecadações das 6 rodadas anteriores.',
    },
    {
      question: 'E se houver empate?',
      answer: 'Em caso de empate, o sistema sorteia uma "Pedra" extra (número de 1 a 75). O vencedor é quem tiver esse número na cartela.',
    },
    {
      question: 'Para onde vai o dinheiro da caridade?',
      answer: '20% de cada cartela vendida vai para a instituição beneficente do mês, escolhida e auditada pela plataforma.',
    },
  ];

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="bg-gradient-hero py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
              <Play className="w-4 h-4" />
              <span className="text-sm font-medium">Tutorial Completo</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Como Funciona o{' '}
              <span className="text-gradient">SORTBEM</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Sorteios beneficentes simples, rápidos e transparentes. 
              Entenda como participar e ajudar quem precisa.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">
            Passo a Passo
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                <div className="bg-card border border-border rounded-2xl p-6 h-full">
                  <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center mb-4">
                    <step.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div className="absolute -top-4 -left-2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                    {step.number}
                  </div>
                  <h3 className="font-semibold text-lg text-foreground mb-2">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2">
                    <ArrowRight className="w-6 h-6 text-border" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/checkout">
              <Button variant="hero" size="xl">
                <Gift className="w-5 h-5" />
                Comprar Cartelas Agora
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 md:py-24 bg-secondary">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-foreground mb-4">
            Diferenciais do SORTBEM
          </h2>
          <p className="text-lg text-muted-foreground text-center max-w-2xl mx-auto mb-12">
            Uma plataforma pensada para ser justa, transparente e fazer a diferença na vida das pessoas.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
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

      {/* FAQ */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">
            Perguntas Frequentes
          </h2>

          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="bg-card border border-border rounded-xl p-6"
              >
                <h3 className="font-semibold text-foreground mb-2">
                  {faq.question}
                </h3>
                <p className="text-muted-foreground">{faq.answer}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 bg-gradient-primary">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto space-y-6"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground">
              Pronto para começar?
            </h2>
            <p className="text-xl text-primary-foreground/80">
              Participe agora e faça parte de uma comunidade que transforma vidas!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/checkout">
                <Button 
                  size="xl" 
                  className="bg-background text-primary hover:bg-background/90"
                >
                  <Gift className="w-5 h-5" />
                  Comprar Cartelas
                </Button>
              </Link>
              <Link to="/seja-parceiro">
                <Button 
                  variant="outline" 
                  size="xl"
                  className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10"
                >
                  <Users className="w-5 h-5" />
                  Seja um Parceiro
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default HowItWorks;
