import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { SalesChart } from '@/components/dashboard/SalesChart';
import { LayoutDashboard, Users, Building2, Gift, Trophy, Wallet, TrendingUp, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { apiService } from '@/services/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await apiService.getAdminStats();
        if (response.ok && response.stats) {
          setStats(response.stats);
        }
      } catch (error) {
        console.error('Error loading admin stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return (
      <DashboardLayout userType="admin" userName="Administrador" notifications={0}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    );
  }

  const adminData = stats || {
    totalRevenue: 0, charityRaised: 0, prizePool: 0, platformRevenue: 0,
    totalManagers: 0, totalEstablishments: 0, totalCards: 0, activeRounds: 0
  };

  const chartData = stats?.chartData || [];

  return (
    <DashboardLayout userType="admin" userName="Administrador" notifications={0}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Faturamento Total" value={`R$ ${(adminData.totalRevenue / 1000).toFixed(0)}k`} icon={TrendingUp} trend={{ value: 23, isPositive: true }} />
        <StatCard title="Arrecadado Caridade" value={`R$ ${(adminData.charityRaised / 1000).toFixed(0)}k`} icon={Gift} />
        <StatCard title="Pool de Prêmios" value={`R$ ${(adminData.prizePool / 1000).toFixed(0)}k`} icon={Trophy} />
        <StatCard title="Receita Plataforma" value={`R$ ${(adminData.platformRevenue / 1000).toFixed(0)}k`} icon={Wallet} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Gerentes" value={adminData.totalManagers} icon={Users} />
        <StatCard title="Estabelecimentos" value={adminData.totalEstablishments} icon={Building2} />
        <StatCard title="Cartelas Emitidas" value={`${(adminData.totalCards / 1000).toFixed(0)}k`} icon={LayoutDashboard} />
        <StatCard title="Rodadas Ativas" value={adminData.activeRounds} icon={Clock} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <SalesChart
          title="Evolução de Vendas e Comissões"
          data={chartData}
          type="area"
          dataKeys={[
            { key: 'vendas', label: 'Vendas', color: 'hsl(var(--primary))' },
            { key: 'comissoes', label: 'Comissões', color: 'hsl(var(--success))' },
          ]}
        />
        <SalesChart
          title="Arrecadação para Caridade"
          data={chartData}
          type="bar"
          dataKeys={[
            { key: 'arrecadacao', label: 'Arrecadação', color: 'hsl(var(--accent))' },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="font-semibold text-foreground mb-4">Ações Rápidas</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link to="/admin/configuracoes"><Button variant="outline" className="w-full justify-start">⚙️ Configurações</Button></Link>
            <Link to="/admin/instituicao"><Button variant="outline" className="w-full justify-start">🎁 Instituição do Mês</Button></Link>
            <Link to="/admin/rodadas"><Button variant="outline" className="w-full justify-start">🏆 Rodadas</Button></Link>
            <Link to="/admin/whatsapp"><Button variant="outline" className="w-full justify-start">💬 WhatsApp</Button></Link>
            <Link to="/admin/pos"><Button variant="outline" className="w-full justify-start">📱 POS</Button></Link>
            <Link to="/admin/logs"><Button variant="outline" className="w-full justify-start">📋 Logs</Button></Link>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="font-semibold text-foreground mb-4">Instituição do Mês</h3>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
              <Gift className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Instituto Criança Feliz</p>
              <p className="text-sm text-muted-foreground">Dezembro 2024</p>
              <p className="text-lg font-bold text-primary mt-1">R$ 127.845,50 arrecadados</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
