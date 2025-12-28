import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { QRCodeCard } from '@/components/dashboard/QRCodeCard';
import { DataTable } from '@/components/dashboard/DataTable';
import { Building2, Wallet, Trophy, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const mockManagerData = { establishments: 12, activeEstablishments: 10, totalRevenue: 145780, commission: 7289, wins: 45 };
const mockEstablishments = [
  { id: '1', tradeName: 'Padaria do João', sales: 2847, commission: 426, status: 'approved', isActive: true },
  { id: '2', tradeName: 'Mercado Central', sales: 1923, commission: 288, status: 'approved', isActive: true },
  { id: '3', tradeName: 'Bar do Zé', sales: 892, commission: 133, status: 'pending', isActive: false },
];

export default function ManagerDashboard() {
  const columns = [
    { key: 'tradeName', label: 'Estabelecimento' },
    { key: 'sales', label: 'Vendas (mês)', render: (e: any) => e.sales },
    { key: 'commission', label: 'Sua Comissão', render: (e: any) => `R$ ${e.commission.toFixed(2)}` },
    { key: 'status', label: 'KYC', render: (e: any) => <Badge variant={e.status === 'approved' ? 'default' : 'secondary'}>{e.status === 'approved' ? 'Aprovado' : 'Pendente'}</Badge> },
    { key: 'isActive', label: 'Status', render: (e: any) => <Badge variant={e.isActive ? 'default' : 'outline'}>{e.isActive ? 'Ativo' : 'Inativo'}</Badge> },
  ];

  return (
    <DashboardLayout userType="manager" userName="Carlos Gerente" notifications={3}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Estabelecimentos" value={mockManagerData.establishments} subtitle={`${mockManagerData.activeEstablishments} ativos`} icon={Building2} />
        <StatCard title="Faturamento da Rede" value={`R$ ${mockManagerData.totalRevenue.toLocaleString('pt-BR')}`} icon={TrendingUp} trend={{ value: 18, isPositive: true }} />
        <StatCard title="Suas Comissões" value={`R$ ${mockManagerData.commission.toLocaleString('pt-BR')}`} icon={Wallet} />
        <StatCard title="Vitórias na Rede" value={mockManagerData.wins} icon={Trophy} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h3 className="font-semibold text-foreground mb-4">Seus Estabelecimentos</h3>
          <DataTable data={mockEstablishments} columns={columns} />
        </div>
        <div>
          <QRCodeCard title="Link de Captação" subtitle="Compartilhe para cadastrar novos estabelecimentos" url={`${window.location.origin}/seja-parceiro?ref=MGR2024`} code="MGR2024" />
        </div>
      </div>
    </DashboardLayout>
  );
}
