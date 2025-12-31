import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { asaasService } from '@/services/asaasService';
import { Trophy, DollarSign, Key, CheckCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface WinnerWithdrawalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  winner: {
    id: number;
    prize_amount: number;
    card_code: string;
    round_id: number;
    status: string;
  };
  onSuccess?: () => void;
}

export function WinnerWithdrawalDialog({ open, onOpenChange, winner, onSuccess }: WinnerWithdrawalDialogProps) {
  const [pixKey, setPixKey] = useState('');
  const [confirmedPixKey, setConfirmedPixKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'input' | 'confirm' | 'processing' | 'success'>('input');

  const resetDialog = () => {
    setPixKey('');
    setConfirmedPixKey('');
    setStep('input');
  };

  const handleSubmit = async () => {
    // Validação
    if (!pixKey || !confirmedPixKey) {
      toast({
        title: 'Preencha todos os campos',
        description: 'Informe e confirme sua chave PIX',
        variant: 'destructive'
      });
      return;
    }

    if (pixKey !== confirmedPixKey) {
      toast({
        title: 'Chaves PIX não conferem',
        description: 'As chaves PIX devem ser idênticas',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    setStep('processing');

    try {
      // Chamar função do banco
      const { data, error } = await supabase.rpc('process_automatic_withdrawal', {
        p_winner_id: winner.id,
        p_pix_key: pixKey
      });

      if (error) {
        throw error;
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Erro ao processar saque');
      }

      // Sucesso
      setStep('success');

      toast({
        title: '✅ Saque solicitado com sucesso!',
        description: `Seu prêmio de R$ ${winner.prize_amount.toFixed(2)} será transferido em até 1 hora útil.`
      });

      setTimeout(() => {
        onSuccess?.();
        onOpenChange(false);
        resetDialog();
      }, 3000);

    } catch (error: any) {
      console.error('Error processing withdrawal:', error);
      setStep('input');

      toast({
        title: 'Erro ao processar saque',
        description: error.message || 'Não foi possível processar seu saque. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onOpenChange(false);
      resetDialog();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Sacar Prêmio
          </DialogTitle>
          <DialogDescription>
            Parabéns! Informe sua chave PIX para receber o prêmio.
          </DialogDescription>
        </DialogHeader>

        {step === 'input' && (
          <div className="space-y-4">
            {/* Prize Amount */}
            <Alert className="bg-green-50 border-green-200">
              <DollarSign className="h-4 w-4 text-green-600" />
              <AlertDescription className="ml-2">
                <span className="font-semibold text-green-900">
                  Prêmio: R$ {winner.prize_amount.toFixed(2)}
                </span>
                <br />
                <span className="text-sm text-green-700">
                  Cartela: {winner.card_code}
                </span>
              </AlertDescription>
            </Alert>

            {/* PIX Key Input */}
            <div className="space-y-2">
              <Label>Chave PIX *</Label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                  placeholder="Digite sua chave PIX (CPF, email, telefone, etc)"
                  className="pl-10"
                  disabled={loading}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                A chave PIX pode ser CPF, CNPJ, e-mail, telefone ou chave aleatória
              </p>
            </div>

            {/* Confirm PIX Key */}
            <div className="space-y-2">
              <Label>Confirmar Chave PIX *</Label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  value={confirmedPixKey}
                  onChange={(e) => setConfirmedPixKey(e.target.value)}
                  placeholder="Digite novamente sua chave PIX"
                  className="pl-10"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Warning */}
            <Alert>
              <AlertDescription className="text-sm">
                ⚠️ <strong>Atenção:</strong> Verifique se a chave PIX está correta.
                O prêmio será transferido para a chave informada e não poderá ser revertido.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {step === 'processing' && (
          <div className="py-8 text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
            <div>
              <p className="font-semibold">Processando seu saque...</p>
              <p className="text-sm text-muted-foreground">Aguarde enquanto validamos os dados</p>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-lg">Saque solicitado com sucesso!</p>
              <p className="text-sm text-muted-foreground mt-2">
                Seu prêmio será transferido em até 1 hora útil para a chave PIX informada.
              </p>
              <p className="text-xs text-muted-foreground mt-4">
                Chave PIX: <strong>{pixKey}</strong>
              </p>
            </div>
          </div>
        )}

        {step !== 'success' && (
          <DialogFooter>
            <Button variant="outline" onClick={handleClose} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={loading || !pixKey || !confirmedPixKey}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <DollarSign className="w-4 h-4 mr-2" />
                  Solicitar Saque
                </>
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
