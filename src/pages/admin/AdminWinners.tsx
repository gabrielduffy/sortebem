import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import {
  Trophy,
  Users,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Swords,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Winner {
  id: number;
  round_id: number;
  card_code: string;
  prize_amount: number;
  status: string;
  is_tied: boolean;
  tiebreak_stone_number: number | null;
  tiebreak_position: number | null;
  user_id: number | null;
  pix_key: string | null;
  asaas_transfer_id: string | null;
  created_at: string;
  user_name?: string;
  user_email?: string;
}

interface TiebreakResult {
  success: boolean;
  round_id: number;
  tied_winners: number;
  winner_id: number;
  winning_stone: number;
  total_prize: number;
}

export default function AdminWinners() {
  const [loading, setLoading] = useState(true);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<Winner[]>([]);
  const [tiedWinners, setTiedWinners] = useState<{ [roundId: number]: Winner[] }>({});
  const [resolving, setResolving] = useState(false);
  const [selectedRoundForTiebreak, setSelectedRoundForTiebreak] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Buscar todos os vencedores
      const { data: winnersData, error: winnersError } = await supabase
        .from('winners')
        .select(`
          *,
          users:user_id (
            name,
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (winnersError) throw winnersError;

      const mappedWinners = winnersData?.map((w: any) => ({
        ...w,
        user_name: w.users?.name,
        user_email: w.users?.email
      })) || [];

      setWinners(mappedWinners);

      // Separar vencedores com saque pendente
      const pending = mappedWinners.filter(
        (w: Winner) => ['claimed', 'processing'].includes(w.status)
      );
      setPendingWithdrawals(pending);

      // Agrupar vencedores empatados por rodada
      const tied = mappedWinners.filter((w: Winner) => w.is_tied && w.status === 'pending');
      const groupedByRound: { [roundId: number]: Winner[] } = {};

      tied.forEach((w: Winner) => {
        if (!groupedByRound[w.round_id]) {
          groupedByRound[w.round_id] = [];
        }
        groupedByRound[w.round_id].push(w);
      });

      setTiedWinners(groupedByRound);

    } catch (error: any) {
      console.error('Error loading winners:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os vencedores',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResolveTiebreak = async (roundId: number) => {
    setResolving(true);

    try {
      const { data, error } = await supabase.rpc('resolve_tiebreak_with_stone', {
        p_round_id: roundId
      });

      if (error) throw error;

      const result = data as TiebreakResult;

      if (!result.success) {
        throw new Error('Falha ao resolver desempate');
      }

      toast({
        title: '🎲 Desempate resolvido!',
        description: `Vencedor: ID ${result.winner_id} com pedra ${result.winning_stone}. Prêmio: R$ ${result.total_prize.toFixed(2)}`
      });

      // Recarregar dados
      await loadData();

    } catch (error: any) {
      console.error('Error resolving tiebreak:', error);
      toast({
        title: 'Erro ao resolver desempate',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setResolving(false);
      setSelectedRoundForTiebreak(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: any } = {
      pending: { variant: 'secondary', label: 'Pendente', icon: Clock },
      claimed: { variant: 'default', label: 'Saque Solicitado', icon: ArrowRight },
      processing: { variant: 'default', label: 'Processando', icon: RefreshCw },
      paid: { variant: 'default', label: 'Pago', icon: CheckCircle },
      cancelled: { variant: 'destructive', label: 'Cancelado', icon: XCircle }
    };

    const config = variants[status] || { variant: 'secondary', label: status, icon: Clock };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant as any} className="gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const formatDate = (date: string) =>
    new Date(date).toLocaleString('pt-BR');

  return (
    <DashboardLayout userType="admin" userName="Administrador">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              Gerenciamento de Vencedores
            </h1>
            <p className="text-muted-foreground">
              Gerencie vencedores, desempates e saques
            </p>
          </div>
          <Button onClick={loadData} variant="outline" disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Vencedores</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{winners.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saques Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingWithdrawals.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Desempates Pendentes</CardTitle>
              <Swords className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Object.keys(tiedWinners).length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total em Prêmios</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(winners.reduce((sum, w) => sum + w.prize_amount, 0))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="tiebreak">
              Desempates ({Object.keys(tiedWinners).length})
            </TabsTrigger>
            <TabsTrigger value="withdrawals">
              Saques ({pendingWithdrawals.length})
            </TabsTrigger>
          </TabsList>

          {/* All Winners */}
          <TabsContent value="all" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Todos os Vencedores</CardTitle>
                <CardDescription>Histórico completo de vencedores</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Rodada</TableHead>
                      <TableHead>Cartela</TableHead>
                      <TableHead>Vencedor</TableHead>
                      <TableHead>Prêmio</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {winners.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                          Nenhum vencedor encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      winners.map((winner) => (
                        <TableRow key={winner.id}>
                          <TableCell className="font-mono">#{winner.id}</TableCell>
                          <TableCell>#{winner.round_id}</TableCell>
                          <TableCell className="font-mono">{winner.card_code}</TableCell>
                          <TableCell>
                            {winner.user_name || winner.user_email || `User #${winner.user_id}`}
                          </TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(winner.prize_amount)}
                          </TableCell>
                          <TableCell>{getStatusBadge(winner.status)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(winner.created_at)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tiebreaks */}
          <TabsContent value="tiebreak" className="space-y-4">
            {Object.keys(tiedWinners).length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <Swords className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum desempate pendente</p>
                </CardContent>
              </Card>
            ) : (
              Object.entries(tiedWinners).map(([roundId, tied]) => (
                <Card key={roundId}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Swords className="w-5 h-5" />
                          Rodada #{roundId} - Desempate
                        </CardTitle>
                        <CardDescription>
                          {tied.length} jogadores empatados
                        </CardDescription>
                      </div>
                      <Button
                        onClick={() => setSelectedRoundForTiebreak(parseInt(roundId))}
                        disabled={resolving}
                        className="gap-2"
                      >
                        <Swords className="w-4 h-4" />
                        Resolver por Pedra Maior
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Cartela</TableHead>
                          <TableHead>Vencedor</TableHead>
                          <TableHead>Prêmio Individual</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tied.map((winner) => (
                          <TableRow key={winner.id}>
                            <TableCell className="font-mono">{winner.card_code}</TableCell>
                            <TableCell>
                              {winner.user_name || winner.user_email || `User #${winner.user_id}`}
                            </TableCell>
                            <TableCell className="font-semibold">
                              {formatCurrency(winner.prize_amount)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        <strong>🎲 Desempate por Pedra Maior:</strong> Cada jogador receberá um número aleatório entre 1-99.
                        Quem tirar o número MAIOR vence e leva todo o prêmio.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Withdrawals */}
          <TabsContent value="withdrawals" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Saques Pendentes</CardTitle>
                <CardDescription>Vencedores aguardando pagamento</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cartela</TableHead>
                      <TableHead>Vencedor</TableHead>
                      <TableHead>Prêmio</TableHead>
                      <TableHead>Chave PIX</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Transfer ID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingWithdrawals.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          Nenhum saque pendente
                        </TableCell>
                      </TableRow>
                    ) : (
                      pendingWithdrawals.map((winner) => (
                        <TableRow key={winner.id}>
                          <TableCell className="font-mono">{winner.card_code}</TableCell>
                          <TableCell>
                            {winner.user_name || winner.user_email || `User #${winner.user_id}`}
                          </TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(winner.prize_amount)}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {winner.pix_key || '-'}
                          </TableCell>
                          <TableCell>{getStatusBadge(winner.status)}</TableCell>
                          <TableCell className="font-mono text-xs">
                            {winner.asaas_transfer_id || '-'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Tiebreak Confirmation Dialog */}
      <AlertDialog
        open={selectedRoundForTiebreak !== null}
        onOpenChange={(open) => !open && setSelectedRoundForTiebreak(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Swords className="w-5 h-5" />
              Resolver Desempate por Pedra Maior?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá sortear um número aleatório (1-99) para cada jogador empatado.
              <br /><br />
              <strong>O jogador com o número MAIOR vencerá e receberá todo o prêmio.</strong>
              <br /><br />
              Os demais jogadores serão marcados como perdedores do desempate.
              <br /><br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={resolving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedRoundForTiebreak && handleResolveTiebreak(selectedRoundForTiebreak)}
              disabled={resolving}
              className="bg-primary"
            >
              {resolving ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Resolvendo...
                </>
              ) : (
                <>
                  <Swords className="w-4 h-4 mr-2" />
                  Resolver Desempate
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
