import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/dashboard/DataTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Clock, Users, Hash, Play, Pause, RotateCcw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const mockRounds = [
  { id: 'R001', type: 'regular', status: 'live', startTime: new Date(), prizePool: 15000, totalCards: 2847, winner: null, tieBreak: null },
  { id: 'R000', type: 'regular', status: 'finished', startTime: new Date(Date.now() - 10 * 60000), prizePool: 12500, totalCards: 2341, winner: 'Padaria do João', tieBreak: null },
  { id: 'R-SP01', type: 'special', status: 'upcoming', startTime: new Date(Date.now() + 45 * 60000), prizePool: 85000, totalCards: 0, winner: null, tieBreak: null },
  { id: 'R-SP00', type: 'special', status: 'finished', startTime: new Date(Date.now() - 60 * 60000), prizePool: 78500, totalCards: 8934, winner: 'Mercado Central', tieBreak: 42 },
];

const mockHistory = [
  { id: 'R099', date: '27/12/2024 15:30', type: 'Regular', winner: 'Padaria do João', prize: 'R$ 12.500', cards: 2341, pattern: 'Linha', tieBreak: '-' },
  { id: 'R098', date: '27/12/2024 15:20', type: 'Regular', winner: 'Mercado Central', prize: 'R$ 11.800', cards: 2156, pattern: 'Coluna', tieBreak: '-' },
  { id: 'R097', date: '27/12/2024 15:10', type: 'Regular', winner: 'Bar do Zé', prize: 'R$ 13.200', cards: 2567, pattern: 'Linha', tieBreak: '42' },
  { id: 'R-SP05', date: '27/12/2024 15:00', type: 'Especial', winner: 'Padaria do João', prize: 'R$ 78.500', cards: 8934, pattern: 'Cheia', tieBreak: '-' },
  { id: 'R096', date: '27/12/2024 14:50', type: 'Regular', winner: 'Loja ABC', prize: 'R$ 10.900', cards: 1987, pattern: 'Diagonal', tieBreak: '-' },
];

export default function AdminRounds() {
  const [liveRound, setLiveRound] = useState(mockRounds.find(r => r.status === 'live'));

  const handlePause = () => {
    toast({ title: 'Rodada pausada', description: 'O sorteio foi pausado temporariamente.' });
  };

  const handleForceEnd = () => {
    toast({ title: 'Rodada finalizada', description: 'A rodada foi encerrada manualmente.' });
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const historyColumns = [
    { key: 'id', label: 'ID' },
    { key: 'date', label: 'Data/Hora' },
    { key: 'type', label: 'Tipo', render: (r: any) => <Badge variant={r.type === 'Especial' ? 'default' : 'secondary'}>{r.type}</Badge> },
    { key: 'winner', label: 'Vencedor (Estabelecimento)' },
    { key: 'prize', label: 'Prêmio' },
    { key: 'cards', label: 'Cartelas' },
    { key: 'pattern', label: 'Padrão' },
    { key: 'tieBreak', label: 'Pedra', render: (r: any) => r.tieBreak !== '-' ? <Badge variant="outline">🎱 {r.tieBreak}</Badge> : '-' },
  ];

  return (
    <DashboardLayout userType="admin" userName="Administrador" notifications={5}>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gerenciamento de Rodadas</h2>
          <p className="text-muted-foreground">Acompanhe e gerencie as rodadas do sistema</p>
        </div>

        <Tabs defaultValue="live" className="space-y-6">
          <TabsList>
            <TabsTrigger value="live">Ao Vivo</TabsTrigger>
            <TabsTrigger value="upcoming">Próximas</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="live" className="space-y-4">
            {liveRound ? (
              <Card className="border-primary">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-destructive animate-pulse" />
                      Rodada {liveRound.id} - AO VIVO
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
                  <div className="grid md:grid-cols-4 gap-4">
                    <div className="bg-muted rounded-xl p-4 text-center">
                      <Trophy className="w-8 h-8 text-primary mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Pool de Prêmios</p>
                      <p className="text-xl font-bold text-foreground">{formatCurrency(liveRound.prizePool)}</p>
                    </div>
                    <div className="bg-muted rounded-xl p-4 text-center">
                      <Users className="w-8 h-8 text-primary mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Cartelas Vendidas</p>
                      <p className="text-xl font-bold text-foreground">{liveRound.totalCards.toLocaleString()}</p>
                    </div>
                    <div className="bg-muted rounded-xl p-4 text-center">
                      <Hash className="w-8 h-8 text-primary mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Números Sorteados</p>
                      <p className="text-xl font-bold text-foreground">15 / 75</p>
                    </div>
                    <div className="bg-muted rounded-xl p-4 text-center">
                      <Clock className="w-8 h-8 text-primary mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Tempo Restante</p>
                      <p className="text-xl font-bold text-foreground">05:32</p>
                    </div>
                  </div>
                  <div className="mt-6">
                    <h4 className="font-medium mb-3">Números Sorteados:</h4>
                    <div className="flex flex-wrap gap-2">
                      {[5, 23, 47, 12, 68, 31, 9, 56, 73, 2, 44, 18, 65, 7, 33].map(num => (
                        <span key={num} className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                          {num}
                        </span>
                      ))}
                    </div>
                  </div>
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
            <div className="grid md:grid-cols-2 gap-4">
              {mockRounds.filter(r => r.status === 'upcoming').map(round => (
                <Card key={round.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Badge variant={round.type === 'special' ? 'default' : 'secondary'}>
                          {round.type === 'special' ? '⭐ Especial' : 'Regular'}
                        </Badge>
                        Rodada {round.id}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Início Previsto:</span>
                        <span className="font-medium">{round.startTime.toLocaleTimeString('pt-BR')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Pool Estimado:</span>
                        <span className="font-medium text-primary">{formatCurrency(round.prizePool)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Rodadas</CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable data={mockHistory} columns={historyColumns} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
