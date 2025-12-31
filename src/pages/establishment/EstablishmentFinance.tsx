import { useState, useEffect } from 'react';
import { Download, Wallet, TrendingUp, Gift, ArrowUpRight, DollarSign } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/dashboard/StatCard';
import { DataTable } from '@/components/dashboard/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { apiService } from '@/services/api';
import { toast } from '@/hooks/use-toast';

export default function EstablishmentFinance() {
  const [loading, setLoading] = useState(true);
  const [financials, setFinancials] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [withdrawAmount, setWithdrawAmount] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const [establishment, setEstablishment] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const estRes = await apiService.getCurrentEstablishment();
      if (estRes.ok && estRes.data) {
        setEstablishment(estRes.data);

        const statsRes = await apiService.getEstablishmentStats();
        if (statsRes.ok) setStats(statsRes.data);

        const response = await apiService.getEstablishmentFinancials();
        if (response.ok) {
          setTransactions(response.data || []);
        }
      }
    } catch (error) {
      console.error('Error loading establishment finance:', error);
      toast({ title: 'Erro', description: 'Erro ao carregar dados financeiros', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: 'Valor inválido', description: 'Informe um valor para o saque.', variant: 'destructive' });
      return;
    }

    try {
      const response = await apiService.requestWithdrawal(amount);
      if (response.ok) {
        toast({ title: 'Sucesso!', description: 'Solicitação de saque enviada.' });
        setWithdrawAmount('');
        loadData();
      } else {
        toast({ title: 'Erro', description: response.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao solicitar saque.', variant: 'destructive' });
    }
  };

  const formatCurrency = (val: number) => `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  const columns = [
    {
      key: 'created_at',
      label: 'Data',
      render: (tx: any) => new Date(tx.created_at).toLocaleDateString('pt-BR')
    },
    { key: 'description', label: 'Descrição' },
    {
      key: 'amount',
      label: 'Valor',
      render: (tx: any) => (
        <span className={tx.amount < 0 ? 'text-destructive' : 'text-success font-semibold'}>
          {formatCurrency(tx.amount)}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (tx: any) => (
        <Badge variant={tx.status === 'completed' ? 'default' : 'secondary'}>
          {tx.status === 'completed' ? 'Concluído' : 'Pendente'}
        </Badge>
      )
    },
  ];

  if (loading) {
    return (
      <DashboardLayout
        userType="establishment"
        userName={establishment?.name || 'Estabelecimento'}
        notifications={0}
      >
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Financeiro</h2>
          <p className="text-muted-foreground">Extrato e gestão de comissões</p>
        </div>
        <Button variant="outline" onClick={() => loadData()}>
          Atualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Saldo Disponível"
          value={formatCurrency(establishment?.balance || 0)}
          icon={Wallet}
          className="bg-primary/5 border-primary/20"
        />
        <StatCard
          title="Total Vendas"
          value={formatCurrency(stats?.salesMonthAmount || 0)}
          icon={TrendingUp}
        />
        <StatCard
          title="Bônus"
          value={formatCurrency(stats?.bonus || 0)}
          icon={Gift}
        />
        <StatCard
          title="Total Sacado"
          value={formatCurrency(Math.abs(transactions.filter(t => t.description.includes('Saque') && t.status === 'completed').reduce((acc, t) => acc + t.amount, 0)))}
          icon={ArrowUpRight}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Extrato de Transações</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                data={transactions}
                columns={columns}
                emptyMessage="Nenhuma transação encontrada."
              />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Solicitar Saque</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Saldo disponível</p>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(financials?.balance || 0)}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Valor do saque</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                <Input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="0,00"
                  className="pl-9"
                />
              </div>
            </div>

            <Button className="w-full" onClick={handleWithdraw}>
              <DollarSign className="w-4 h-4 mr-2" />
              Solicitar Saque
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Saques são processados em até 24 horas úteis via Asaas
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
