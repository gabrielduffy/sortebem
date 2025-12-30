import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { SalesChart } from '@/components/dashboard/SalesChart';
import { QRCodeCard } from '@/components/dashboard/QRCodeCard';
import { DataTable } from '@/components/dashboard/DataTable';
import { Building2, Wallet, Trophy, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { apiService } from '@/services/api';
import { toast } from '@/hooks/use-toast';

export default function ManagerDashboard() {
  const [manager, setManager] = useState<any>(null);
  const [establishments, setEstablishments] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    establishments: 0,
    activeEstablishments: 0,
    totalRevenue: 0,
    commission: 0,
    wins: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // 1. Get current manager info
      const mgrResponse = await apiService.getCurrentManager();
      if (mgrResponse.ok) {
        setManager(mgrResponse.data);

        // 2. Get manager's establishments
        const estsResponse = await apiService.getManagerEstablishments(mgrResponse.data.id);
        if (estsResponse.ok) {
          setEstablishments(estsResponse.data);
        }
      }

      // 3. Get manager's stats
      const statsResponse = await apiService.getManagerStats();
      if (statsResponse.ok) {
        setStats(statsResponse.data);
      }
    } catch (error) {
      console.error('Error loading manager dashboard:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados do dashboard.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: 'tradeName', label: 'Estabelecimento' },
    { key: 'total_sales', label: 'Vendas (total)', render: (e: any) => `R$ ${(e.total_sales || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` },
    { key: 'total_commission', label: 'Sua Comissão', render: (e: any) => `R$ ${(e.total_commission || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` },
    {
      key: 'kyc_status', label: 'KYC', render: (e: any) => (
        <Badge variant={e.kyc_status === 'approved' ? 'default' : e.kyc_status === 'pending' ? 'secondary' : 'destructive'}>
          {e.kyc_status === 'approved' ? 'Aprovado' : e.kyc_status === 'pending' ? 'Pendente' : 'Reprovado'}
        </Badge>
      )
    },
    { key: 'is_active', label: 'Status', render: (e: any) => <Badge variant={e.is_active ? 'default' : 'outline'}>{e.is_active ? 'Ativo' : 'Inativo'}</Badge> },
  ];

  const chartData = [
    { name: 'Jan', vendas: 0, comissoes: 0 },
    { name: 'Fev', vendas: 0, comissoes: 0 },
    { name: 'Mar', vendas: 0, comissoes: 0 },
    { name: 'Abr', vendas: 0, comissoes: 0 },
    { name: 'Mai', vendas: 0, comissoes: 0 },
    { name: 'Jun', vendas: stats.totalRevenue, comissoes: stats.commission },
  ];

  if (loading) {
    return (
      <DashboardLayout userType="manager" userName="Carregando..." notifications={0}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    );
  }

  const referralUrl = manager ? `${window.location.origin}/seja-parceiro?ref=${manager.referral_code}` : '';

  return (
    <DashboardLayout userType="manager" userName={manager?.name || 'Gerente'} notifications={3}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Estabelecimentos" value={stats.establishments} subtitle={`${stats.activeEstablishments} ativos`} icon={Building2} />
        <StatCard title="Faturamento da Rede" value={`R$ ${stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={TrendingUp} />
        <StatCard title="Suas Comissões" value={`R$ ${stats.commission.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={Wallet} />
        <StatCard title="Vitórias na Rede" value={stats.wins} icon={Trophy} />
      </div>

      <div className="mb-6">
        <SalesChart
          title="Evolução de Vendas e Comissões da Rede"
          data={chartData}
          type="line"
          dataKeys={[
            { key: 'vendas', label: 'Vendas', color: 'hsl(var(--primary))' },
            { key: 'comissoes', label: 'Comissões', color: 'hsl(var(--success))' },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h3 className="font-semibold text-foreground mb-4">Seus Estabelecimentos</h3>
          <DataTable data={establishments} columns={columns} />
        </div>
        <div>
          {manager && (
            <QRCodeCard
              title="Link de Captação"
              subtitle="Compartilhe para cadastrar novos estabelecimentos"
              url={referralUrl}
              code={manager.referral_code}
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
