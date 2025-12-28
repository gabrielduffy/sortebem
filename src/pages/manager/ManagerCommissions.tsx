import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/dashboard/DataTable';
import { StatCard } from '@/components/dashboard/StatCard';
import { Wallet, TrendingUp, Calendar, Download, DollarSign, Building2 } from 'lucide-react';

const mockCommissions = [
  { id: '1', establishment: 'Padaria do João', sales: 15000, rate: 5, commission: 750, date: '27/12/2024', status: 'paid' },
  { id: '2', establishment: 'Mercado Central', sales: 12500, rate: 5, commission: 625, date: '27/12/2024', status: 'paid' },
  { id: '3', establishment: 'Bar do Zé', sales: 8200, rate: 5, commission: 410, date: '26/12/2024', status: 'pending' },
  { id: '4', establishment: 'Loja ABC', sales: 5400, rate: 5, commission: 270, date: '26/12/2024', status: 'pending' },
  { id: '5', establishment: 'Padaria do João', sales: 18000, rate: 5, commission: 900, date: '25/12/2024', status: 'paid' },
  { id: '6', establishment: 'Mercado Central', sales: 9800, rate: 5, commission: 490, date: '25/12/2024', status: 'paid' },
];

const mockSummary = {
  totalCommission: 7289,
  pendingCommission: 680,
  paidCommission: 6609,
  establishments: 4,
  avgRate: 5,
};

export default function ManagerCommissions() {
  const [period, setPeriod] = useState('month');

  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const columns = [
    { key: 'establishment', label: 'Estabelecimento' },
    { key: 'sales', label: 'Vendas', render: (c: any) => formatCurrency(c.sales) },
    { key: 'rate', label: 'Taxa', render: (c: any) => `${c.rate}%` },
    { key: 'commission', label: 'Comissão', render: (c: any) => <span className="font-semibold text-primary">{formatCurrency(c.commission)}</span> },
    { key: 'date', label: 'Data' },
    { 
      key: 'status', 
      label: 'Status', 
      render: (c: any) => (
        <Badge variant={c.status === 'paid' ? 'default' : 'secondary'}>
          {c.status === 'paid' ? 'Pago' : 'Pendente'}
        </Badge>
      )
    },
  ];

  return (
    <DashboardLayout userType="manager" userName="Carlos Gerente" notifications={3}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Minhas Comissões</h2>
            <p className="text-muted-foreground">Acompanhe seus ganhos por estabelecimento</p>
          </div>
          <div className="flex gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-40">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Esta semana</SelectItem>
                <SelectItem value="month">Este mês</SelectItem>
                <SelectItem value="year">Este ano</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="w-4 h-4" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          <StatCard title="Total de Comissões" value={formatCurrency(mockSummary.totalCommission)} icon={Wallet} trend={{ value: 12, isPositive: true }} />
          <StatCard title="Pendente" value={formatCurrency(mockSummary.pendingCommission)} icon={DollarSign} />
          <StatCard title="Pago" value={formatCurrency(mockSummary.paidCommission)} icon={TrendingUp} />
          <StatCard title="Estabelecimentos" value={mockSummary.establishments} icon={Building2} subtitle={`Taxa média: ${mockSummary.avgRate}%`} />
        </div>

        {/* Chart placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>Evolução das Comissões</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-muted rounded-xl flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Gráfico de evolução das comissões</p>
                <p className="text-sm">(Em desenvolvimento)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Comissões</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable data={mockCommissions} columns={columns} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
