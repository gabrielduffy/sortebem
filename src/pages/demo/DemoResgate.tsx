import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy,
  Wallet,
  CreditCard,
  Mail,
  Phone,
  Hash,
  Check,
  Clock,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import PublicLayout from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { mockWinningCard } from '@/data/mockDemo';

type RedeemStep = 'form' | 'success';

const DemoResgate = () => {
  const [step, setStep] = useState<RedeemStep>('form');
  const [pixKeyType, setPixKeyType] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const prizeAmount = 1694.00;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !cpf || !pixKeyType || !pixKey) {
      toast({
        title: 'Preencha todos os campos',
        description: 'Informe todos os dados para solicitar o resgate.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    toast({
      title: '⏳ Processando...',
      description: 'Validando seus dados',
    });

    setTimeout(() => {
      setIsLoading(false);
      setStep('success');
      toast({
        title: '✅ Resgate solicitado!',
        description: 'Seu prêmio será transferido em até 24 horas úteis.',
      });
    }, 2000);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getPixKeyPlaceholder = () => {
    const placeholders: Record<string, string> = {
      cpf: '000.000.000-00',
      cnpj: '00.000.000/0000-00',
      phone: '(11) 99999-9999',
      email: 'email@exemplo.com',
      random: 'chave-aleatoria-uuid',
    };
    return placeholders[pixKeyType] || 'Digite sua chave Pix';
  };

  const getPixKeyIcon = () => {
    const icons: Record<string, any> = {
      cpf: CreditCard,
      cnpj: CreditCard,
      phone: Phone,
      email: Mail,
      random: Hash,
    };
    const Icon = icons[pixKeyType] || Wallet;
    return <Icon className="w-4 h-4" />;
  };

  return (
    <PublicLayout>
      {/* DEMO Badge */}
      <div className="fixed top-4 left-4 bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-bold z-50 shadow-lg">
        🎬 MODO DEMO
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Resgatar Prêmio
            </h1>
            <p className="text-muted-foreground">
              Preencha seus dados para receber o prêmio
            </p>
          </motion.div>

          {/* Step: Form */}
          {step === 'form' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Prize Banner */}
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative overflow-hidden bg-gradient-primary rounded-2xl p-8 text-center"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-foreground/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary-foreground/10 rounded-full translate-y-1/2 -translate-x-1/2" />

                <div className="relative z-10">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Sparkles className="w-6 h-6 text-primary-foreground" />
                    <Trophy className="w-8 h-8 text-primary-foreground" />
                    <Sparkles className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <p className="text-primary-foreground/80 text-lg mb-2">Parabéns! Você ganhou</p>
                  <p className="text-5xl md:text-6xl font-bold text-primary-foreground mb-3">
                    {formatCurrency(prizeAmount)}
                  </p>
                  <div className="inline-flex items-center gap-2 bg-primary-foreground/20 rounded-full px-4 py-2">
                    <code className="font-mono font-bold text-primary-foreground">{mockWinningCard.code}</code>
                  </div>
                </div>
              </motion.div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 space-y-6">
                <h3 className="font-semibold text-lg mb-4">Dados para Resgate</h3>

                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    placeholder="Seu nome completo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                {/* CPF */}
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    required
                  />
                </div>

                {/* Pix Key Type */}
                <div className="space-y-2">
                  <Label>Tipo de Chave Pix</Label>
                  <Select value={pixKeyType} onValueChange={setPixKeyType} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cpf">CPF</SelectItem>
                      <SelectItem value="cnpj">CNPJ</SelectItem>
                      <SelectItem value="phone">Celular</SelectItem>
                      <SelectItem value="email">E-mail</SelectItem>
                      <SelectItem value="random">Chave Aleatória</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Pix Key */}
                <div className="space-y-2">
                  <Label htmlFor="pixKey">Chave Pix</Label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {getPixKeyIcon()}
                    </div>
                    <Input
                      id="pixKey"
                      placeholder={getPixKeyPlaceholder()}
                      value={pixKey}
                      onChange={(e) => setPixKey(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="hero"
                  size="xl"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Processando...
                    </>
                  ) : (
                    <>
                      <Wallet className="w-5 h-5" />
                      Solicitar Saque
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </Button>
              </form>

              {/* Info Card */}
              <div className="bg-secondary rounded-xl p-4">
                <p className="text-sm text-muted-foreground text-center">
                  <strong className="text-foreground">Importante:</strong> O prêmio será transferido para a chave Pix
                  informada em até 24 horas úteis após a validação dos dados.
                </p>
              </div>
            </motion.div>
          )}

          {/* Step: Success */}
          {step === 'success' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              {/* Success Banner */}
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="w-24 h-24 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-6"
                >
                  <Check className="w-12 h-12 text-success" />
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-4xl font-bold text-foreground mb-4"
                >
                  ✅ Resgate Solicitado!
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-xl text-muted-foreground mb-8"
                >
                  Seu prêmio de <strong className="text-primary">{formatCurrency(prizeAmount)}</strong> será
                  transferido em até 24 horas úteis
                </motion.p>
              </div>

              {/* Status Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-card border border-border rounded-2xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">Status do Resgate</h3>
                  <span className="px-3 py-1 bg-warning/10 text-warning rounded-full text-sm font-medium">
                    Processando
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Timeline */}
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-success flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">Solicitação recebida</p>
                        <p className="text-sm text-muted-foreground">Seus dados foram registrados com sucesso</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-warning flex items-center justify-center shrink-0 mt-0.5">
                        <Clock className="w-4 h-4 text-white animate-pulse" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">Validação em andamento</p>
                        <p className="text-sm text-muted-foreground">Verificando dados e chave Pix</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                        <Wallet className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-muted-foreground">Transferência</p>
                        <p className="text-sm text-muted-foreground">Aguardando validação</p>
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="border-t border-border pt-4 mt-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Cartela</p>
                        <code className="font-mono font-bold text-foreground">{mockWinningCard.code}</code>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Valor</p>
                        <p className="font-bold text-primary">{formatCurrency(prizeAmount)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Chave Pix</p>
                        <p className="font-medium text-foreground">{pixKeyType.toUpperCase()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Prazo</p>
                        <p className="font-medium text-foreground">24h úteis</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="grid grid-cols-2 gap-4"
              >
                <Button
                  variant="outline"
                  onClick={() => window.location.href = '/demo/checkout'}
                >
                  Comprar Novamente
                </Button>
                <Button
                  variant="default"
                  onClick={() => window.location.href = '/demo/cartela'}
                >
                  Ver Cartela
                </Button>
              </motion.div>

              {/* Success Message */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-success/10 border border-success/20 rounded-xl p-6 text-center"
              >
                <Trophy className="w-12 h-12 text-success mx-auto mb-3" />
                <h3 className="font-bold text-lg text-success mb-2">Parabéns pela vitória!</h3>
                <p className="text-sm text-muted-foreground">
                  Continue participando dos sorteios SORTEBEM e ajudando instituições beneficentes.
                  Juntos, transformamos vidas! ❤️
                </p>
              </motion.div>
            </motion.div>
          )}
        </div>
      </div>
    </PublicLayout>
  );
};

export default DemoResgate;
