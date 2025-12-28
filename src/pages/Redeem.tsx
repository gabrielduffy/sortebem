import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  Search, 
  Wallet, 
  CreditCard, 
  Mail, 
  Phone, 
  Hash, 
  Check,
  Clock,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import PublicLayout from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { checkCardPrize, requestWithdraw, getWithdrawHistory } from '@/services/mockApi';
import { toast } from '@/hooks/use-toast';

type RedeemStep = 'check' | 'withdraw' | 'history';

const Redeem = () => {
  const [step, setStep] = useState<RedeemStep>('check');
  const [cardCode, setCardCode] = useState('');
  const [prizeData, setPrizeData] = useState<{ hasPrize: boolean; amount: number } | null>(null);
  const [pixKeyType, setPixKeyType] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [withdrawHistory, setWithdrawHistory] = useState<any[]>([]);
  const [withdrawRequested, setWithdrawRequested] = useState(false);

  const handleCheckCard = async () => {
    if (!cardCode.trim()) {
      toast({
        title: 'Digite o código',
        description: 'Informe o código da cartela para verificar.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    const result = await checkCardPrize(cardCode);
    setPrizeData(result);

    if (result.hasPrize) {
      setStep('withdraw');
      const history = await getWithdrawHistory(cardCode);
      setWithdrawHistory(history);
    }

    setIsLoading(false);
  };

  const handleRequestWithdraw = async () => {
    if (!pixKeyType || !pixKey.trim()) {
      toast({
        title: 'Preencha os dados',
        description: 'Informe o tipo e a chave Pix para receber.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    await requestWithdraw(cardCode, pixKeyType, pixKey);
    setWithdrawRequested(true);
    setIsLoading(false);
    
    toast({
      title: '✅ Saque solicitado!',
      description: 'Seu prêmio será transferido em até 24 horas.',
    });
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
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-xl mx-auto">
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
              Informe o código da sua cartela vencedora
            </p>
          </motion.div>

          {/* Step: Check Card */}
          {step === 'check' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="bg-card border border-border rounded-2xl p-6">
                <Label htmlFor="card-code" className="text-lg mb-4 block">
                  Código da Cartela
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="card-code"
                    placeholder="SB-XXXXXXXX"
                    value={cardCode}
                    onChange={(e) => setCardCode(e.target.value.toUpperCase())}
                    className="font-mono text-lg"
                  />
                  <Button onClick={handleCheckCard} disabled={isLoading}>
                    {isLoading ? (
                      <span className="animate-spin">⏳</span>
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Not Winner Message */}
              {prizeData && !prizeData.hasPrize && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-muted rounded-xl p-6 text-center"
                >
                  <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold text-lg text-foreground mb-2">
                    Sem prêmio nesta cartela
                  </h3>
                  <p className="text-muted-foreground">
                    Esta cartela não foi contemplada. Continue tentando, 
                    o próximo sorteio acontece em breve!
                  </p>
                </motion.div>
              )}

              {/* Info */}
              <div className="bg-secondary rounded-xl p-4">
                <p className="text-sm text-muted-foreground text-center">
                  O código da cartela é exibido após a compra e enviado por WhatsApp. 
                  Exemplo: <code className="bg-primary/10 px-2 py-0.5 rounded">SB-A7K3M9P2</code>
                </p>
              </div>
            </motion.div>
          )}

          {/* Step: Withdraw */}
          {step === 'withdraw' && prizeData?.hasPrize && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Prize Amount */}
              <div className="bg-gradient-primary rounded-2xl p-6 text-center">
                <Trophy className="w-12 h-12 text-primary-foreground mx-auto mb-3" />
                <p className="text-primary-foreground/80 mb-2">Parabéns! Você ganhou</p>
                <p className="text-5xl font-bold text-primary-foreground mb-2">
                  {formatCurrency(prizeData.amount)}
                </p>
                <p className="text-sm text-primary-foreground/70">
                  Cartela: {cardCode}
                </p>
              </div>

              {!withdrawRequested ? (
                <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                  <h3 className="font-semibold text-lg mb-4">Dados para Saque</h3>
                  
                  {/* Pix Key Type */}
                  <div className="space-y-2">
                    <Label>Tipo de Chave Pix</Label>
                    <Select value={pixKeyType} onValueChange={setPixKeyType}>
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
                    <Label>Chave Pix</Label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {getPixKeyIcon()}
                      </div>
                      <Input
                        placeholder={getPixKeyPlaceholder()}
                        value={pixKey}
                        onChange={(e) => setPixKey(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <Button
                    variant="hero"
                    size="xl"
                    className="w-full"
                    onClick={handleRequestWithdraw}
                    disabled={isLoading}
                  >
                    <Wallet className="w-5 h-5" />
                    Solicitar Saque
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-success/10 border border-success/20 rounded-2xl p-6 text-center"
                >
                  <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-success" />
                  </div>
                  <h3 className="font-semibold text-lg text-foreground mb-2">
                    Saque Solicitado!
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Seu prêmio será transferido para a chave Pix informada em até 24 horas úteis.
                  </p>
                  <div className="bg-background rounded-lg p-3 inline-flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Status: Processando</span>
                  </div>
                </motion.div>
              )}

              {/* Withdraw History */}
              {withdrawHistory.length > 0 && (
                <div className="bg-card border border-border rounded-2xl p-6">
                  <h3 className="font-semibold text-lg mb-4">Histórico de Saques</h3>
                  <div className="space-y-3">
                    {withdrawHistory.map((w) => (
                      <div
                        key={w.id}
                        className="flex items-center justify-between bg-secondary rounded-lg p-3"
                      >
                        <div>
                          <p className="font-medium text-foreground">
                            {formatCurrency(w.amount)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {w.pixKeyType.toUpperCase()}: {w.pixKey}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium
                            ${w.status === 'completed' 
                              ? 'bg-success/10 text-success' 
                              : w.status === 'pending' 
                                ? 'bg-warning/10 text-warning'
                                : 'bg-muted text-muted-foreground'
                            }`}
                        >
                          {w.status === 'completed' ? 'Concluído' : 
                           w.status === 'pending' ? 'Pendente' : 
                           w.status === 'processing' ? 'Processando' : 'Falhou'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button
                variant="outline"
                onClick={() => {
                  setStep('check');
                  setPrizeData(null);
                  setCardCode('');
                  setPixKey('');
                  setPixKeyType('');
                  setWithdrawRequested(false);
                }}
              >
                Verificar outra cartela
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </PublicLayout>
  );
};

export default Redeem;
