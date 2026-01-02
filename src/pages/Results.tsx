import { useState, useEffect } from 'react';
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
  AlertCircle,
  Calendar,
  Award
} from 'lucide-react';
import PublicLayout from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiService } from '@/services/api';
import { toast } from '@/hooks/use-toast';

interface PrizeData {
  hasPrize: boolean;
  amount: number;
  status?: string;
  alreadyClaimed?: boolean;
  paidAt?: string;
  claimedAt?: string;
}

interface FinishedRound {
  id: number;
  number: number;
  type: string;
  prize_pool: number;
  finished_at: string;
  winners: {
    card_code: string;
    prize_amount: number;
    status: string;
  }[];
}

const Results = () => {
  const [cardCode, setCardCode] = useState('');
  const [prizeData, setPrizeData] = useState<PrizeData | null>(null);
  const [pixKeyType, setPixKeyType] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [withdrawRequested, setWithdrawRequested] = useState(false);
  const [finishedRounds, setFinishedRounds] = useState<FinishedRound[]>([]);
  const [loadingRounds, setLoadingRounds] = useState(true);

  useEffect(() => {
    loadFinishedRounds();
  }, []);

  const loadFinishedRounds = async () => {
    setLoadingRounds(true);
    const result = await apiService.getFinishedRoundsWithWinners();
    if (result.ok) {
      setFinishedRounds(result.data || []);
    }
    setLoadingRounds(false);
  };

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
    setPrizeData(null);

    const result = await apiService.checkCardPrize(cardCode);

    if (result.ok && result.data) {
      setPrizeData(result.data);
    } else {
      setPrizeData({ hasPrize: false, amount: 0 });
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
    const res = await apiService.requestPrizeWithdrawal({
      cardCode,
      pixKeyType,
      pixKey,
      amount: prizeData?.amount || 0
    });

    if (res.ok) {
      setWithdrawRequested(true);
      toast({
        title: '✅ Saque solicitado!',
        description: 'Seu prêmio será transferido em até 24 horas.',
      });
    } else {
      toast({ title: 'Erro', description: res.error || 'Falha ao solicitar saque.', variant: 'destructive' });
    }
    setIsLoading(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const maskCardCode = (code: string) => {
    if (code.length <= 6) return code;
    return code.substring(0, 5) + '***' + code.substring(code.length - 2);
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

  const resetCheck = () => {
    setCardCode('');
    setPrizeData(null);
    setPixKey('');
    setPixKeyType('');
    setWithdrawRequested(false);
  };

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
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
              Conferir Resultados
            </h1>
            <p className="text-muted-foreground">
              Verifique se sua cartela foi premiada e confira os últimos sorteios
            </p>
          </motion.div>

          {/* Card Check Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="bg-card border border-border rounded-2xl p-6">
              <Label htmlFor="card-code" className="text-lg mb-4 block font-semibold">
                Código da Cartela
              </Label>
              <div className="flex gap-2">
                <Input
                  id="card-code"
                  placeholder="SB-XXXXXXXX"
                  value={cardCode}
                  onChange={(e) => setCardCode(e.target.value.toUpperCase())}
                  className="font-mono text-lg"
                  onKeyDown={(e) => e.key === 'Enter' && handleCheckCard()}
                />
                <Button onClick={handleCheckCard} disabled={isLoading} size="lg">
                  {isLoading ? (
                    <span className="animate-spin">⏳</span>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Verificar
                    </>
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                O código está na sua cartela. Exemplo: <code className="bg-primary/10 px-2 py-0.5 rounded">SB-A7K3M9P2</code>
              </p>
            </div>
          </motion.div>

          {/* Result Section */}
          {prizeData && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-8"
            >
              {/* Not Winner */}
              {!prizeData.hasPrize && (
                <div className="bg-muted rounded-xl p-6 text-center">
                  <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold text-lg text-foreground mb-2">
                    Cartela não premiada
                  </h3>
                  <p className="text-muted-foreground">
                    Esta cartela não foi contemplada nesta rodada. Continue tentando!
                  </p>
                  <Button variant="outline" className="mt-4" onClick={resetCheck}>
                    Verificar outra cartela
                  </Button>
                </div>
              )}

              {/* Winner - Already Claimed */}
              {prizeData.hasPrize && prizeData.alreadyClaimed && (
                <div className="bg-success/10 border border-success/20 rounded-xl p-6 text-center">
                  <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-success" />
                  </div>
                  <h3 className="font-semibold text-lg text-foreground mb-2">
                    🎉 Cartela Vencedora!
                  </h3>
                  <p className="text-3xl font-bold text-success mb-2">
                    {formatCurrency(prizeData.amount)}
                  </p>
                  <p className="text-muted-foreground mb-4">
                    O prêmio desta cartela já foi resgatado.
                  </p>
                  {prizeData.paidAt && (
                    <p className="text-sm text-muted-foreground">
                      Pago em: {formatDate(prizeData.paidAt)}
                    </p>
                  )}
                  <Button variant="outline" className="mt-4" onClick={resetCheck}>
                    Verificar outra cartela
                  </Button>
                </div>
              )}

              {/* Winner - Not Claimed Yet */}
              {prizeData.hasPrize && !prizeData.alreadyClaimed && !withdrawRequested && (
                <div className="space-y-6">
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

                  <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                    <h3 className="font-semibold text-lg mb-4">Dados para Saque</h3>

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
                </div>
              )}

              {/* Withdraw Requested */}
              {prizeData.hasPrize && withdrawRequested && (
                <div className="bg-success/10 border border-success/20 rounded-2xl p-6 text-center">
                  <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-success" />
                  </div>
                  <h3 className="font-semibold text-lg text-foreground mb-2">
                    Saque Solicitado!
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Seu prêmio de <strong>{formatCurrency(prizeData.amount)}</strong> será transferido para a chave Pix informada em até 24 horas úteis.
                  </p>
                  <div className="bg-background rounded-lg p-3 inline-flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Status: Processando</span>
                  </div>
                  <Button variant="outline" className="mt-4 ml-2" onClick={resetCheck}>
                    Verificar outra cartela
                  </Button>
                </div>
              )}
            </motion.div>
          )}

          {/* Recent Rounds Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold text-foreground">Últimos Sorteios</h2>
            </div>

            {loadingRounds ? (
              <div className="bg-card border border-border rounded-2xl p-8 text-center">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                <p className="text-muted-foreground mt-2">Carregando...</p>
              </div>
            ) : finishedRounds.length === 0 ? (
              <div className="bg-card border border-border rounded-2xl p-8 text-center">
                <Award className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum sorteio finalizado ainda.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {finishedRounds.map((round) => (
                  <div
                    key={round.id}
                    className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        round.type === 'special' ? 'bg-warning/10' : 'bg-primary/10'
                      }`}>
                        <Trophy className={`w-6 h-6 ${
                          round.type === 'special' ? 'text-warning' : 'text-primary'
                        }`} />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">
                          Rodada #{round.number}
                          {round.type === 'special' && (
                            <span className="ml-2 text-xs bg-warning/20 text-warning px-2 py-0.5 rounded-full">
                              Especial
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(round.finished_at)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Prêmio</p>
                        <p className="font-bold text-foreground">
                          {formatCurrency(round.prize_pool || 0)}
                        </p>
                      </div>

                      {round.winners && round.winners.length > 0 ? (
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Vencedor</p>
                          <p className="font-mono text-sm text-success">
                            {maskCardCode(round.winners[0].card_code)}
                          </p>
                        </div>
                      ) : (
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Vencedor</p>
                          <p className="text-sm text-muted-foreground">-</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default Results;