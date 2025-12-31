import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { CalendarClock, DollarSign, Users, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CreateManualRoundDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateManualRoundDialog({ open, onOpenChange, onSuccess }: CreateManualRoundDialogProps) {
  const [loading, setLoading] = useState(false);
  const [establishments, setEstablishments] = useState<any[]>([]);

  // Form state
  const [selectedEstablishments, setSelectedEstablishments] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [drawDate, setDrawDate] = useState('');
  const [drawTime, setDrawTime] = useState('');
  const [prize, setPrize] = useState('');
  const [cardPrice, setCardPrice] = useState('');
  const [winnerCriteria, setWinnerCriteria] = useState('full_card');
  const [tiebreakRule, setTiebreakRule] = useState('stone');
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
      }
    } catch (error) {
      console.error('Error loading establishments:', error);
    }
  };

  const toggleEstablishment = (establishmentId: string) => {
    setSelectedEstablishments(prev => {
      if (prev.includes(establishmentId)) {
        return prev.filter(id => id !== establishmentId);
      } else {
        return [...prev, establishmentId];
      }
    });
    setSelectAll(false);
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedEstablishments(establishments.map(e => e.id.toString()));
    } else {
      setSelectedEstablishments([]);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (selectedEstablishments.length === 0 && !selectAll) {
      toast({ title: 'Selecione pelo menos um estabelecimento', variant: 'destructive' });
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
      const establishmentsToCreate = selectAll
        ? establishments.map(e => e.id)
        : selectedEstablishments.map(id => parseInt(id));

      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      // Criar rodada para cada estabelecimento selecionado
      for (const estId of establishmentsToCreate) {
        try {
          const { data, error } = await supabase.rpc('create_manual_round', {
            p_establishment_id: estId,
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
            errorCount++;
            errors.push(`Estabelecimento ${estId}: ${error.message}`);
            continue;
          }

          if (data && !data.success) {
            errorCount++;
            if (data.conflicting_rounds && Array.isArray(data.conflicting_rounds)) {
              errors.push(`Estabelecimento ${estId}: Conflito de horário`);
            } else {
              errors.push(`Estabelecimento ${estId}: ${data.error || 'Erro desconhecido'}`);
            }
            continue;
          }

          successCount++;
        } catch (err: any) {
          errorCount++;
          errors.push(`Estabelecimento ${estId}: ${err.message}`);
        }
      }

      // Mostrar resultado
      if (successCount > 0 && errorCount === 0) {
        toast({
          title: `${successCount} rodada(s) criada(s) com sucesso!`,
          description: `Rodadas agendadas para ${new Date(drawDate + ' ' + drawTime).toLocaleString('pt-BR')}`
        });

        // Reset form
        setPrize('');
        setCardPrice('');
        setDescription('');
        setMinParticipants('');
        setMaxParticipants('');
        setSelectedEstablishments([]);
        setSelectAll(false);

        onSuccess();
        onOpenChange(false);
      } else if (successCount > 0 && errorCount > 0) {
        toast({
          title: `${successCount} rodada(s) criada(s), ${errorCount} erro(s)`,
          description: errors.slice(0, 3).join('; '),
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Erro ao criar rodadas',
          description: errors.slice(0, 3).join('; '),
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      console.error('Error creating rounds:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível criar as rodadas',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="w-5 h-5" />
            Criar Rodada Manual
          </DialogTitle>
          <DialogDescription>
            Configure os detalhes da rodada. Você pode criar para um ou mais estabelecimentos simultaneamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Establishments Selection */}
          <div className="space-y-2">
            <Label>Estabelecimentos *</Label>

            <div className="flex items-center space-x-2 mb-2">
              <Checkbox
                id="select-all"
                checked={selectAll}
                onCheckedChange={handleSelectAll}
              />
              <Label htmlFor="select-all" className="cursor-pointer font-semibold">
                Selecionar Todos ({establishments.length})
              </Label>
            </div>

            {!selectAll && (
              <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                {establishments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum estabelecimento ativo encontrado</p>
                ) : (
                  establishments.map(est => (
                    <div key={est.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`est-${est.id}`}
                        checked={selectedEstablishments.includes(est.id.toString())}
                        onCheckedChange={() => toggleEstablishment(est.id.toString())}
                      />
                      <Label htmlFor={`est-${est.id}`} className="cursor-pointer flex-1">
                        {est.name}
                      </Label>
                    </div>
                  ))
                )}
              </div>
            )}

            {selectedEstablishments.length > 0 && !selectAll && (
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedEstablishments.map(id => {
                  const est = establishments.find(e => e.id.toString() === id);
                  return (
                    <Badge key={id} variant="secondary" className="text-xs">
                      {est?.name}
                    </Badge>
                  );
                })}
              </div>
            )}
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
              <Select value={tiebreakRule} onValueChange={setTiebreakRule} disabled>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stone">Pedra Maior</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Desempate sempre por Pedra Maior (quem tirar o número maior vence)
              </p>
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
            {loading ? 'Criando...' : selectAll ? `Criar para Todos (${establishments.length})` : `Criar Rodada${selectedEstablishments.length > 1 ? 's' : ''} (${selectedEstablishments.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
