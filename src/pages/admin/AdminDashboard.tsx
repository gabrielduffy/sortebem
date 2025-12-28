import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { LayoutDashboard, Users, Building2, Gift, Trophy, Wallet, TrendingUp, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const mockAdminData = {
  totalRevenue: 1457800, charityRaised: 291560, prizePool: 583120, platformRevenue: 145780,
  totalManagers: 45, totalEstablishments: 312, totalCards: 284700, activeRounds: 1
};

export default function AdminDashboard() {
  return (
    <DashboardLayout userType="admin" userName="Administrador" notifications={5}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Faturamento Total" value={`R$ ${(mockAdminData.totalRevenue / 1000).toFixed(0)}k`} icon={TrendingUp} trend={{ value: 23, isPositive: true }} />
        <StatCard title="Arrecadado Caridade" value={`R$ ${(mockAdminData.charityRaised / 1000).toFixed(0)}k`} icon={Gift} />
        <StatCard title="Pool de Prêmios" value={`R$ ${(mockAdminData.prizePool / 1000).toFixed(0)}k`} icon={Trophy} />
        <StatCard title="Receita Plataforma" value={`R$ ${(mockAdminData.platformRevenue / 1000).toFixed(0)}k`} icon={Wallet} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Gerentes" value={mockAdminData.totalManagers} icon={Users} />
        <StatCard title="Estabelecimentos" value={mockAdminData.totalEstablishments} icon={Building2} />
        <StatCard title="Cartelas Emitidas" value={`${(mockAdminData.totalCards / 1000).toFixed(0)}k`} icon={LayoutDashboard} />
        <StatCard title="Rodadas Ativas" value={mockAdminData.activeRounds} icon={Clock} />
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
