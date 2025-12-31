import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { CalendarClock, DollarSign, Users } from 'lucide-react';

interface CreateManualRoundDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateManualRoundDialog({ open, onOpenChange, onSuccess }: CreateManualRoundDialogProps) {
  const [loading, setLoading] = useState(false);
  const [establishments, setEstablishments] = useState<any[]>([]);

  // Form state
  const [establishmentId, setEstablishmentId] = useState('');
  const [drawDate, setDrawDate] = useState('');
  const [drawTime, setDrawTime] = useState('');
  const [prize, setPrize] = useState('');
  const [cardPrice, setCardPrice] = useState('');
  const [winnerCriteria, setWinnerCriteria] = useState('full_card');
  const [tiebreakRule, setTiebreakRule] = useState('first_marked');
  const [minParticipants, setMinParticipants] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('');
  const [roundType, setRoundType] = useState('regular');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (open) {
      loadEstablishments();
      // Set default date/time to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setDrawDate(tomorrow.toISOString().split('T')[0]);
      setDrawTime('20:00');
    }
  }, [open]);

  const loadEstablishments = async () => {
    try {
      const { data } = await supabase
        .from('establishments')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (data) {
        setEstablishments(data);
        if (data.length > 0) {
          setEstablishmentId(data[0].id.toString());
        }
      }
    } catch (error) {
      console.error('Error loading establishments:', error);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!establishmentId) {
      toast({ title: 'Selecione um estabelecimento', variant: 'destructive' });
      return;
    }

    if (!drawDate || !drawTime) {
      toast({ title: 'Informe data e hora do sorteio', variant: 'destructive' });
      return;
    }

    if (!prize || parseFloat(prize) <= 0) {
      toast({ title: 'Informe um prêmio válido', variant: 'destructive' });
      return;
    }

    if (!cardPrice || parseFloat(cardPrice) <= 0) {
      toast({ title: 'Informe um preço de cartela válido', variant: 'destructive' });
      return;
    }

    setLoading(true);

    try {
      // Call create_manual_round function
      const { data, error } = await supabase.rpc('create_manual_round', {
        p_establishment_id: parseInt(establishmentId),
        p_draw_date: drawDate,
        p_draw_time: drawTime,
        p_prize: parseFloat(prize),
        p_card_price: parseFloat(cardPrice),
        p_winner_criteria: winnerCriteria,
        p_tiebreak_rule: tiebreakRule,
        p_min_participants: minParticipants ? parseInt(minParticipants) : null,
        p_max_participants: maxParticipants ? parseInt(maxParticipants) : null,
        p_type: roundType,
        p_description: description || null,
        p_created_by: null
      });

      if (error) {
        throw error;
      }

      if (data && !data.success) {
        // Check for conflicts
        if (data.conflicting_rounds && Array.isArray(data.conflicting_rounds)) {
          toast({
            title: 'Conflito de horário',
            description: `Já existe(m) ${data.conflicting_rounds.length} rodada(s) neste horário (±30min)`,
            variant: 'destructive'
          });
          return;
        }

        toast({
          title: 'Erro ao criar rodada',
          description: data.error || 'Erro desconhecido',
          variant: 'destructive'
        });
        return;
      }

      toast({
        title: 'Rodada criada com sucesso!',
        description: `Rodada agendada para ${new Date(drawDate + ' ' + drawTime).toLocaleString('pt-BR')}`
      });

      // Reset form
      setPrize('');
      setCardPrice('');
      setDescription('');
      setMinParticipants('');
      setMaxParticipants('');

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error creating round:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível criar a rodada',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="w-5 h-5" />
            Criar Rodada Manual
          </DialogTitle>
          <DialogDescription>
            Configure os detalhes da rodada. O sistema valida conflitos de horário automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Establishment */}
          <div className="space-y-2">
            <Label>Estabelecimento *</Label>
            <Select value={establishmentId} onValueChange={setEstablishmentId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {establishments.map(est => (
                  <SelectItem key={est.id} value={est.id.toString()}>
                    {est.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data do Sorteio *</Label>
              <Input
                type="date"
                value={drawDate}
                onChange={(e) => setDrawDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="space-y-2">
              <Label>Horário *</Label>
              <Input
                type="time"
                value={drawTime}
                onChange={(e) => setDrawTime(e.target.value)}
              />
            </div>
          </div>

          {/* Prize and Card Price */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prêmio (R$) *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={prize}
                  onChange={(e) => setPrize(e.target.value)}
                  placeholder="1000.00"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Preço da Cartela (R$) *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={cardPrice}
                  onChange={(e) => setCardPrice(e.target.value)}
                  placeholder="10.00"
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label>Tipo da Rodada</Label>
            <Select value={roundType} onValueChange={setRoundType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="regular">Regular</SelectItem>
                <SelectItem value="special">Especial</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Winner Criteria */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Critério de Vitória</Label>
              <Select value={winnerCriteria} onValueChange={setWinnerCriteria}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_card">Cartela Cheia</SelectItem>
                  <SelectItem value="line">Uma Linha</SelectItem>
                  <SelectItem value="two_lines">Duas Linhas</SelectItem>
                  <SelectItem value="pattern">Padrão Específico</SelectItem>
                  <SelectItem value="corners">Cantos</SelectItem>
                  <SelectItem value="blackout">Blackout</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Regra de Desempate</Label>
              <Select value={tiebreakRule} onValueChange={setTiebreakRule}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="first_marked">Primeiro a Marcar</SelectItem>
                  <SelectItem value="split_prize">Dividir Prêmio</SelectItem>
                  <SelectItem value="draw">Sorteio</SelectItem>
                  <SelectItem value="fastest_time">Tempo Mais Rápido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Participants */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Mínimo de Participantes (opcional)</Label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="number"
                  min="1"
                  value={minParticipants}
                  onChange={(e) => setMinParticipants(e.target.value)}
                  placeholder="Ex: 10"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Máximo de Participantes (opcional)</Label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="number"
                  min="1"
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(e.target.value)}
                  placeholder="Ex: 100"
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Descrição (opcional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Rodada especial de fim de ano com prêmio dobrado"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Criando...' : 'Criar Rodada'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
