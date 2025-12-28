import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { DataTable } from '@/components/dashboard/DataTable';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Clock, Users, Hash, Pause, Eye } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';

export default function AdminRounds() {
  const [rounds, setRounds] = useState<any[]>([]);
  const [liveRound, setLiveRound] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [viewingRound, setViewingRound] = useState<any>(null);

  useEffect(() => {
    const loadRounds = async () => {
      try {
        const response = await apiService.getRounds();
        if (response.ok && response.rounds) {
          setRounds(response.rounds);
          setLiveRound(response.rounds.find((r: any) => r.status === 'drawing' || r.status === 'live'));
        }
      } catch (error) {
        console.error('Error loading rounds:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar as rodadas.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    loadRounds();

    // Poll for updates every 5 seconds
    const interval = setInterval(loadRounds, 5000);

    return () => clearInterval(interval);
  }, []);

  const upcomingRounds = rounds.filter(r => r.status === 'selling' || r.status === 'scheduled');
  const finishedRounds = rounds.filter(r => r.status === 'finished');

  const handlePause = () => toast({ title: 'Rodada pausada', description: 'O sorteio foi pausado temporariamente.' });
  const handleForceEnd = () => toast({ title: 'Rodada finalizada', description: 'A rodada foi encerrada manualmente.' });
  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const historyColumns = [
    { key: 'id', label: 'ID' },
    { key: 'date', label: 'Data/Hora' },
    { key: 'type', label: 'Tipo', render: (r: any) => <Badge variant={r.type === 'Especial' ? 'default' : 'secondary'}>{r.type}</Badge> },
    { key: 'winner', label: 'Vencedor' },
    { key: 'prize', label: 'Prêmio' },
    { key: 'soldCards', label: 'Vendidas' },
    { key: 'unsoldCards', label: 'Não Vendidas' },
    { key: 'pattern', label: 'Padrão' },
    { key: 'tieBreak', label: 'Pedra', render: (r: any) => r.tieBreak ? <Badge variant="outline">🎱 {r.tieBreak}</Badge> : '-' },
    { key: 'actions', label: 'Ações', render: (r: any) => <Button variant="ghost" size="sm" onClick={() => setViewingRound(r)}><Eye className="w-4 h-4 mr-1" />Detalhes</Button> },
  ];

  return (
    <DashboardLayout userType="admin" userName="Administrador" notifications={5}>
      <div className="space-y-6">
        <div><h2 className="text-2xl font-bold text-foreground">Gerenciamento de Rodadas</h2><p className="text-muted-foreground">Acompanhe e gerencie as rodadas do sistema</p></div>

        <Tabs defaultValue="live" className="space-y-6">
          <TabsList><TabsTrigger value="live">Ao Vivo</TabsTrigger><TabsTrigger value="upcoming">Próximas</TabsTrigger><TabsTrigger value="history">Histórico</TabsTrigger></TabsList>

          <TabsContent value="live" className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : liveRound ? (
              <Card className="border-primary">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-destructive animate-pulse" />
                      Rodada #{liveRound.round_number || liveRound.id} - AO VIVO
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handlePause}>
                        <Pause className="w-4 h-4" />
                        Pausar
                      </Button>
                      <Button variant="destructive" size="sm" onClick={handleForceEnd}>
                        Finalizar
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-5 gap-4">
                    <div className="bg-muted rounded-xl p-4 text-center">
                      <Trophy className="w-8 h-8 text-primary mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Pool de Prêmios</p>
                      <p className="text-xl font-bold text-foreground">
                        {formatCurrency(liveRound.prize_pool || 0)}
                      </p>
                    </div>
                    <div className="bg-muted rounded-xl p-4 text-center">
                      <Users className="w-8 h-8 text-primary mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Cartelas Vendidas</p>
                      <p className="text-xl font-bold text-foreground">
                        {(liveRound.sold_cards || 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-muted rounded-xl p-4 text-center">
                      <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Não Vendidas</p>
                      <p className="text-xl font-bold text-foreground">
                        {((liveRound.total_cards || 0) - (liveRound.sold_cards || 0)).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-muted rounded-xl p-4 text-center">
                      <Hash className="w-8 h-8 text-primary mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Números Sorteados</p>
                      <p className="text-xl font-bold text-foreground">
                        {(liveRound.drawn_numbers?.length || 0)} / 75
                      </p>
                    </div>
                    <div className="bg-muted rounded-xl p-4 text-center">
                      <Clock className="w-8 h-8 text-primary mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Status</p>
                      <p className="text-xl font-bold text-foreground">Em Andamento</p>
                    </div>
                  </div>
                  {liveRound.drawn_numbers && liveRound.drawn_numbers.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-medium mb-3">Números Sorteados:</h4>
                      <div className="flex flex-wrap gap-2">
                        {liveRound.drawn_numbers.map((num: number, idx: number) => (
                          <span
                            key={idx}
                            className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold"
                          >
                            {num}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma rodada ao vivo no momento</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center min-h-[200px]">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : upcomingRounds.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                {upcomingRounds.map(round => (
                  <Card key={round.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <Badge variant={round.type === 'special' ? 'default' : 'secondary'}>
                            {round.type === 'special' ? '⭐ Especial' : 'Regular'}
                          </Badge>
                          Rodada #{round.round_number || round.id}
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Início Previsto:</span>
                          <span className="font-medium">
                            {new Date(round.scheduled_time || round.start_time).toLocaleTimeString('pt-BR')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Pool Estimado:</span>
                          <span className="font-medium text-primary">
                            {formatCurrency(round.prize_pool || 0)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma rodada programada</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Rodadas</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center min-h-[200px]">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : finishedRounds.length > 0 ? (
                  <DataTable
                    data={finishedRounds.map(r => ({
                      id: r.round_number || r.id,
                      date: new Date(r.end_time || r.start_time).toLocaleString('pt-BR'),
                      type: r.type === 'special' ? 'Especial' : 'Regular',
                      winner: r.winner_establishment || '-',
                      prize: formatCurrency(r.prize_amount || 0),
                      soldCards: r.sold_cards || 0,
                      unsoldCards: r.total_cards - (r.sold_cards || 0),
                      pattern: r.win_pattern || '-',
                      tieBreak: r.tie_break_number,
                      winningCard: r.winning_card_code,
                      drawnNumbers: r.drawn_numbers || []
                    }))}
                    columns={historyColumns}
                  />
                ) : (
                  <div className="py-12 text-center text-muted-foreground">
                    <p>Nenhuma rodada finalizada ainda</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Round Details Modal */}
        <Dialog open={!!viewingRound} onOpenChange={() => setViewingRound(null)}>
          <DialogContent className="max-w-3xl"><DialogHeader><DialogTitle>Detalhes da Rodada {viewingRound?.id}</DialogTitle></DialogHeader>
          {viewingRound && (
            <div className="space-y-6 py-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div><Label className="text-muted-foreground">Data/Hora</Label><p className="font-medium">{viewingRound.date}</p></div>
                <div><Label className="text-muted-foreground">Tipo</Label><Badge variant={viewingRound.type === 'Especial' ? 'default' : 'secondary'}>{viewingRound.type}</Badge></div>
                <div><Label className="text-muted-foreground">Padrão</Label><p className="font-medium">{viewingRound.pattern}</p></div>
                <div><Label className="text-muted-foreground">Prêmio Distribuído</Label><p className="font-medium text-primary">{viewingRound.prize}</p></div>
                <div><Label className="text-muted-foreground">Cartelas Vendidas</Label><p className="font-medium">{viewingRound.soldCards}</p></div>
                <div><Label className="text-muted-foreground">Cartelas Não Vendidas</Label><p className="font-medium">{viewingRound.unsoldCards}</p></div>
                <div><Label className="text-muted-foreground">Estabelecimento Vencedor</Label><p className="font-medium text-primary">{viewingRound.winner}</p></div>
                <div><Label className="text-muted-foreground">Cartela Vencedora</Label><p className="font-medium">{viewingRound.winningCard}</p></div>
                <div><Label className="text-muted-foreground">Houve Empate?</Label><Badge variant={viewingRound.tieBreak ? 'destructive' : 'secondary'}>{viewingRound.tieBreak ? `Sim - Pedra ${viewingRound.tieBreak}` : 'Não'}</Badge></div>
              </div>
              <div><Label className="text-muted-foreground">Números Sorteados</Label><div className="flex flex-wrap gap-2 mt-2">{viewingRound.drawnNumbers.map((num: number, i: number) => (<span key={i} className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">{num}</span>))}</div></div>
            </div>
          )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
