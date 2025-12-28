import { useState } from 'react';
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

const mockRounds = [
  { id: 'R001', type: 'regular', status: 'live', startTime: new Date(), prizePool: 15000, totalCards: 2847, soldCards: 2847, unsoldCards: 153, winner: null, tieBreak: null },
  { id: 'R000', type: 'regular', status: 'finished', startTime: new Date(Date.now() - 10 * 60000), prizePool: 12500, totalCards: 2341, soldCards: 2341, unsoldCards: 659, winner: 'Padaria do João', tieBreak: null },
  { id: 'R-SP01', type: 'special', status: 'upcoming', startTime: new Date(Date.now() + 45 * 60000), prizePool: 85000, totalCards: 0, soldCards: 0, unsoldCards: 10000, winner: null, tieBreak: null },
  { id: 'R-SP00', type: 'special', status: 'finished', startTime: new Date(Date.now() - 60 * 60000), prizePool: 78500, totalCards: 8934, soldCards: 8934, unsoldCards: 1066, winner: 'Mercado Central', tieBreak: 42 },
];

const mockHistory = [
  { id: 'R099', date: '27/12/2024 15:30', type: 'Regular', winner: 'Padaria do João', winningCard: 'C-78432', prize: 'R$ 12.500', soldCards: 2341, unsoldCards: 659, pattern: 'Linha', tieBreak: null, drawnNumbers: [5, 12, 23, 31, 42, 47, 56, 68, 73, 9, 18, 27, 36, 45, 54] },
  { id: 'R098', date: '27/12/2024 15:20', type: 'Regular', winner: 'Mercado Central', winningCard: 'C-12987', prize: 'R$ 11.800', soldCards: 2156, unsoldCards: 844, pattern: 'Coluna', tieBreak: null, drawnNumbers: [3, 15, 28, 34, 41, 52, 63, 71, 8, 19, 26, 37, 44, 55, 66] },
  { id: 'R097', date: '27/12/2024 15:10', type: 'Regular', winner: 'Bar do Zé', winningCard: 'C-45623', prize: 'R$ 13.200', soldCards: 2567, unsoldCards: 433, pattern: 'Linha', tieBreak: 42, drawnNumbers: [7, 14, 25, 33, 46, 51, 62, 74, 6, 17, 24, 35, 43, 58, 67] },
  { id: 'R-SP05', date: '27/12/2024 15:00', type: 'Especial', winner: 'Padaria do João', winningCard: 'C-99001', prize: 'R$ 78.500', soldCards: 8934, unsoldCards: 1066, pattern: 'Cheia', tieBreak: null, drawnNumbers: [2, 11, 22, 30, 44, 53, 61, 75, 4, 16, 29, 38, 47, 59, 70, 1, 13, 21, 32, 48] },
];

export default function AdminRounds() {
  const [liveRound] = useState(mockRounds.find(r => r.status === 'live'));
  const [viewingRound, setViewingRound] = useState<any>(null);

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
            {liveRound ? (
              <Card className="border-primary">
                <CardHeader><div className="flex items-center justify-between"><CardTitle className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-destructive animate-pulse" />Rodada {liveRound.id} - AO VIVO</CardTitle><div className="flex gap-2"><Button variant="outline" size="sm" onClick={handlePause}><Pause className="w-4 h-4" />Pausar</Button><Button variant="destructive" size="sm" onClick={handleForceEnd}>Finalizar</Button></div></div></CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-5 gap-4">
                    <div className="bg-muted rounded-xl p-4 text-center"><Trophy className="w-8 h-8 text-primary mx-auto mb-2" /><p className="text-sm text-muted-foreground">Pool de Prêmios</p><p className="text-xl font-bold text-foreground">{formatCurrency(liveRound.prizePool)}</p></div>
                    <div className="bg-muted rounded-xl p-4 text-center"><Users className="w-8 h-8 text-primary mx-auto mb-2" /><p className="text-sm text-muted-foreground">Cartelas Vendidas</p><p className="text-xl font-bold text-foreground">{liveRound.soldCards.toLocaleString()}</p></div>
                    <div className="bg-muted rounded-xl p-4 text-center"><Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" /><p className="text-sm text-muted-foreground">Não Vendidas</p><p className="text-xl font-bold text-foreground">{liveRound.unsoldCards.toLocaleString()}</p></div>
                    <div className="bg-muted rounded-xl p-4 text-center"><Hash className="w-8 h-8 text-primary mx-auto mb-2" /><p className="text-sm text-muted-foreground">Números Sorteados</p><p className="text-xl font-bold text-foreground">15 / 75</p></div>
                    <div className="bg-muted rounded-xl p-4 text-center"><Clock className="w-8 h-8 text-primary mx-auto mb-2" /><p className="text-sm text-muted-foreground">Tempo Restante</p><p className="text-xl font-bold text-foreground">05:32</p></div>
                  </div>
                  <div className="mt-6"><h4 className="font-medium mb-3">Números Sorteados:</h4><div className="flex flex-wrap gap-2">{[5, 23, 47, 12, 68, 31, 9, 56, 73, 2, 44, 18, 65, 7, 33].map(num => (<span key={num} className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">{num}</span>))}</div></div>
                </CardContent>
              </Card>
            ) : (<Card><CardContent className="py-12 text-center text-muted-foreground"><Clock className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>Nenhuma rodada ao vivo no momento</p></CardContent></Card>)}
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {mockRounds.filter(r => r.status === 'upcoming').map(round => (
                <Card key={round.id}><CardHeader><div className="flex items-center justify-between"><CardTitle className="flex items-center gap-2"><Badge variant={round.type === 'special' ? 'default' : 'secondary'}>{round.type === 'special' ? '⭐ Especial' : 'Regular'}</Badge>Rodada {round.id}</CardTitle></div></CardHeader><CardContent><div className="space-y-2 text-sm"><div className="flex justify-between"><span className="text-muted-foreground">Início Previsto:</span><span className="font-medium">{round.startTime.toLocaleTimeString('pt-BR')}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Pool Estimado:</span><span className="font-medium text-primary">{formatCurrency(round.prizePool)}</span></div></div></CardContent></Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="history"><Card><CardHeader><CardTitle>Histórico de Rodadas</CardTitle></CardHeader><CardContent><DataTable data={mockHistory} columns={historyColumns} /></CardContent></Card></TabsContent>
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
