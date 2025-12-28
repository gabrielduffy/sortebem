import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShoppingCart, 
  Wallet, 
  Trophy, 
  TrendingUp,
  Monitor,
  ExternalLink,
  Clock
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { QRCodeCard } from '@/components/dashboard/QRCodeCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { mockEstablishment, mockRecentWinners } from '@/services/mockData';

// Mock data for dashboard
const mockDashboardData = {
  salesToday: 127,
  salesTodayAmount: 635,
  salesMonth: 2847,
  salesMonthAmount: 14235,
  commission: 2135.25,
  bonus: 450,
  wins: 12,
  winAmount: 45000,
};

const mockRecentSales = [
  { id: '1', time: '14:32', quantity: 5, amount: 25, method: 'PIX' },
  { id: '2', time: '14:28', quantity: 2, amount: 10, method: 'POS' },
  { id: '3', time: '14:15', quantity: 10, amount: 50, method: 'PIX' },
  { id: '4', time: '14:02', quantity: 3, amount: 15, method: 'PIX' },
  { id: '5', time: '13:55', quantity: 8, amount: 40, method: 'POS' },
];

export default function EstablishmentDashboard() {
  const [nextRoundTime, setNextRoundTime] = useState(423); // seconds

  useEffect(() => {
    const timer = setInterval(() => {
      setNextRoundTime(prev => prev > 0 ? prev - 1 : 600);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const establishment = mockEstablishment;
  const saleUrl = `${window.location.origin}/checkout?ref=${establishment.referralCode}`;
  const tvUrl = `${window.location.origin}/tv/${establishment.slug}`;

  return (
    <DashboardLayout userType="establishment" userName={establishment.tradeName} notifications={2}>
      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Vendas Hoje"
          value={mockDashboardData.salesToday}
          subtitle={`R$ ${mockDashboardData.salesTodayAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={ShoppingCart}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Vendas do Mês"
          value={mockDashboardData.salesMonth}
          subtitle={`R$ ${mockDashboardData.salesMonthAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={TrendingUp}
        />
        <StatCard
          title="Comissões"
          value={`R$ ${mockDashboardData.commission.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          subtitle={`+ R$ ${mockDashboardData.bonus} bônus`}
          icon={Wallet}
        />
        <StatCard
          title="Vitórias"
          value={mockDashboardData.wins}
          subtitle={`R$ ${mockDashboardData.winAmount.toLocaleString('pt-BR')} em prêmios`}
          icon={Trophy}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
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
                <Button variant="ghost" size="sm">
                  Ver todas <ExternalLink className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
            <div className="divide-y divide-border">
              {mockRecentSales.map((sale) => (
                <div key={sale.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <ShoppingCart className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{sale.quantity} cartelas</p>
                      <p className="text-sm text-muted-foreground">{sale.time}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">R$ {sale.amount.toFixed(2)}</p>
                    <Badge variant={sale.method === 'PIX' ? 'default' : 'secondary'}>
                      {sale.method}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Wins */}
          <div className="bg-card rounded-xl border border-border">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold text-foreground">Vitórias do Estabelecimento</h3>
            </div>
            <div className="divide-y divide-border">
              {mockRecentWinners.filter(w => w.establishmentId === establishment.id).length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Trophy className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
                  <p>Nenhuma vitória ainda neste período</p>
                </div>
              ) : (
                mockRecentWinners.filter(w => w.establishmentId === establishment.id).map((win) => (
                  <div key={win.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Rodada #{win.roundId.replace('round-', '')}</p>
                        <p className="text-sm text-muted-foreground">Padrão: {win.pattern}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">R$ {win.prizeAmount.toLocaleString('pt-BR')}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* QR Codes */}
          <QRCodeCard
            title="Link de Venda"
            subtitle="Compartilhe para vender cartelas"
            url={saleUrl}
            code={establishment.referralCode}
          />

          <QRCodeCard
            title="Modo TV"
            subtitle="Exiba em telas do estabelecimento"
            url={tvUrl}
            code={establishment.slug}
          />

          {/* KYC Status */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="font-semibold text-foreground mb-4">Status da Conta</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Verificação KYC</span>
                <Badge variant={establishment.kycStatus === 'approved' ? 'default' : 'secondary'}>
                  {establishment.kycStatus === 'approved' ? 'Aprovado' : 
                   establishment.kycStatus === 'pending' ? 'Pendente' : 'Reprovado'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={establishment.isActive ? 'default' : 'destructive'}>
                  {establishment.isActive ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">CNPJ</span>
                <span className="text-sm font-mono text-foreground">{establishment.cnpj}</span>
              </div>
            </div>
            <Link to="/estabelecimento/perfil" className="block mt-4">
              <Button variant="outline" className="w-full">
                Editar Perfil
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
