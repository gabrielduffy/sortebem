import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Wallet, Trophy, TrendingUp, Monitor, ExternalLink, Clock } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { SalesChart } from '@/components/dashboard/SalesChart';
import { QRCodeCard } from '@/components/dashboard/QRCodeCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiService } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import { DataTable } from '@/components/dashboard/DataTable';

// Removed mockDashboardData, using real state instead.

// Mocks removed

const chartData = [
  { name: 'Seg', vendas: 85, comissoes: 12.75 },
  { name: 'Ter', vendas: 92, comissoes: 13.80 },
  { name: 'Qua', vendas: 78, comissoes: 11.70 },
  { name: 'Qui', vendas: 105, comissoes: 15.75 },
  { name: 'Sex', vendas: 132, comissoes: 19.80 },
  { name: 'Sáb', vendas: 158, comissoes: 23.70 },
  { name: 'Dom', vendas: 127, comissoes: 19.05 },
];

export default function EstablishmentDashboard() {
  const [establishment, setEstablishment] = useState<any>(null);
  const [stats, setStats] = useState({
    salesToday: 0, salesTodayAmount: 0, salesMonth: 0, salesMonthAmount: 0,
    commission: 0, bonus: 0, wins: 0, winAmount: 0,
  });
  const [roundHistory, setRoundHistory] = useState<any[]>([]);
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextRoundTime, setNextRoundTime] = useState(423);

  useEffect(() => {
    fetchDashboardData();
    const timer = setInterval(() => {
      setNextRoundTime(prev => prev > 0 ? prev - 1 : 600);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const estRes = await apiService.getCurrentEstablishment();
      if (estRes.ok && estRes.data) {
        setEstablishment(estRes.data);

        // 1. Stats
        const statsRes = await apiService.getEstablishmentStats();
        if (statsRes.ok) setStats(statsRes.data);

        // 2. Round History (filtered by establishment)
        const roundRes = await apiService.getRoundHistorySummary();
        if (roundRes.ok) setRoundHistory(roundRes.data || []);

        // 3. Recent Sales
        const salesRes = await apiService.getEstablishmentTransactions(estRes.data.id);
        if (salesRes.ok) {
          setRecentSales((salesRes.data || []).slice(0, 5).map((s: any) => ({
            id: s.id,
            created_at: s.created_at,
            quantity: s.quantity || 1,
            amount: s.total_amount,
            payment_method: s.payment_method?.toUpperCase() || 'PIX'
          })));
        }
      }
    } catch (error) {
      console.error('Error loading establishment dashboard:', error);
      toast({ title: 'Erro', description: 'Erro ao carregar dados do dashboard.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const saleUrl = establishment ? `${window.location.origin}/checkout?ref=${establishment.code}` : '';
  const tvUrl = establishment ? `${window.location.origin}/tv/${establishment.slug}` : '';

  const roundColumns = [
    { key: 'date', label: 'Data', render: (r: any) => new Date(r.date).toLocaleDateString('pt-BR') },
    { key: 'ticket', label: 'Cartela', render: (r: any) => <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">#{r.ticket}</code> },
    { key: 'amount', label: 'Prêmio', render: (r: any) => <span className="font-bold text-foreground">R$ {(r.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span> },
    {
      key: 'status', label: 'Resgate', render: (r: any) => (
        <Badge variant={r.status === 'completed' ? 'default' : r.status === 'pending' ? 'secondary' : 'outline'}>
          {r.status === 'completed' ? 'Pago' : r.status === 'pending' ? 'Pendente' : 'Não Solicitado'}
        </Badge>
      )
    }
  ];

  if (loading) {
    return (
      <DashboardLayout userType="establishment" userName="Carregando..." notifications={0}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      userType="establishment"
      userName={establishment?.name || 'Estabelecimento'}
      notifications={2}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Vendas Hoje" value={stats.salesToday} subtitle={`R$ ${stats.salesTodayAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={ShoppingCart} />
        <StatCard title="Vendas do Mês" value={stats.salesMonth} subtitle={`R$ ${stats.salesMonthAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={TrendingUp} />
        <StatCard title="Comissões" value={`R$ ${stats.commission.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} subtitle={`+ R$ ${stats.bonus} bônus`} icon={Wallet} />
        <StatCard title="Vitórias" value={stats.wins} subtitle={`R$ ${stats.winAmount.toLocaleString('pt-BR')} em prêmios`} icon={Trophy} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Chart */}
          <SalesChart
            title="Vendas da Semana"
            data={chartData}
            type="bar"
            height={250}
            dataKeys={[
              { key: 'vendas', label: 'Cartelas', color: 'hsl(var(--primary))' },
            ]}
          />

          {/* Next Round Timer */}
          <div className="bg-gradient-to-r from-primary to-primary-light rounded-xl p-6 text-primary-foreground">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary-foreground/80 font-medium">Próxima Rodada</p>
                <p className="text-4xl font-bold font-mono mt-1">{formatTime(nextRoundTime)}</p>
              </div>
              <Clock className="h-12 w-12 text-primary-foreground/60" />
            </div>
            <div className="mt-4 flex gap-3">
              <Link to={tvUrl} target="_blank">
                <Button variant="secondary" size="sm" className="bg-white/20 hover:bg-white/30 text-white border-0">
                  <Monitor className="h-4 w-4 mr-2" />
                  Abrir Modo TV
                </Button>
              </Link>
            </div>
          </div>

          {/* Recent Sales */}
          <div className="bg-card rounded-xl border border-border">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Vendas Recentes</h3>
              <Link to="/estabelecimento/vendas">
                <Button variant="ghost" size="sm">Ver todas <ExternalLink className="h-4 w-4 ml-1" /></Button>
              </Link>
            </div>
            <div className="divide-y divide-border">
              {recentSales.map((sale) => (
                <div key={sale.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <ShoppingCart className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{sale.quantity || 1} cartelas</p>
                      <p className="text-sm text-muted-foreground">{new Date(sale.created_at).toLocaleTimeString('pt-BR')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">R$ {(sale.amount || 0).toFixed(2)}</p>
                    <Badge variant={sale.payment_method === 'PIX' ? 'default' : 'secondary'}>{sale.payment_method}</Badge>
                  </div>
                </div>
              ))}
              {recentSales.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">Nenhuma venda hoje.</div>
              )}
            </div>
          </div>

          {/* Round History */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Histórico de Rodadas e Prêmios
              </h3>
            </div>
            <div className="p-0">
              <DataTable data={roundHistory} columns={roundColumns} emptyMessage="Nenhum prêmio registrado neste estabelecimento." />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <QRCodeCard title="Link de Venda" subtitle="Compartilhe para vender cartelas" url={saleUrl} code={establishment?.referral_code || establishment?.code || '-'} />
          <QRCodeCard title="Modo TV" subtitle="Exiba em telas do estabelecimento" url={tvUrl} code={establishment?.slug || '-'} />

          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="font-semibold text-foreground mb-4">Status da Conta</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Verificação KYC</span>
                <Badge variant={establishment?.kyc_status === 'approved' ? 'default' : 'secondary'}>
                  {establishment?.kyc_status === 'approved' ? 'Aprovado' : establishment?.kyc_status === 'pending' ? 'Pendente' : 'Reprovado'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={establishment?.is_active ? 'default' : 'destructive'}>{establishment?.is_active ? 'Ativo' : 'Inativo'}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">CNPJ</span>
                <span className="text-sm font-mono text-foreground">{establishment?.cnpj}</span>
              </div>
            </div>
            <Link to="/estabelecimento/perfil" className="block mt-4">
              <Button variant="outline" className="w-full">Editar Perfil</Button>
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
