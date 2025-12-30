import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/dashboard/DataTable';
import { StatCard } from '@/components/dashboard/StatCard';
import { Wallet, TrendingUp, Calendar, Download, DollarSign, Building2 } from 'lucide-react';
import { apiService } from '@/services/api';
import { toast } from '@/hooks/use-toast';

export default function ManagerCommissions() {
  const [period, setPeriod] = useState('month');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [withdrawAmount, setWithdrawAmount] = useState('');

  const [manager, setManager] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsRes, transRes, mgrRes] = await Promise.all([
        apiService.getManagerStats(),
        apiService.getManagerTransactions(),
        apiService.getCurrentManager()
      ]);

      if (statsRes.ok) setStats(statsRes.data);
      if (mgrRes.ok) setManager(mgrRes.data);
      if (transRes.ok) {
        // Map withdrawals to transaction format
        const formatted = (transRes.data || []).map((t: any) => ({
          id: t.id,
          description: `Solicitação de Saque`,
          amount: t.amount,
          type: 'withdrawal',
          created_at: t.created_at,
          status: t.status
        }));
        setTransactions(formatted);
      }
    } catch (error) {
      console.error('Error loading manager commissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: 'Valor inválido', description: 'Informe um valor válido para o saque.', variant: 'destructive' });
      return;
    }

    try {
      const response = await apiService.requestWithdrawal(amount);
      if (response.ok) {
        toast({ title: 'Saque solicitado!', description: 'Sua solicitação está em processamento.' });
        setWithdrawAmount('');
        loadData();
      } else {
        toast({ title: 'Erro', description: response.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível solicitar o saque.', variant: 'destructive' });
    }
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const columns = [
    { key: 'description', label: 'Descrição' },
    { key: 'amount', label: 'Valor', render: (c: any) => <span className={c.type === 'withdrawal' ? 'text-destructive font-semibold' : 'text-success font-semibold'}>{formatCurrency(c.amount)}</span> },
    { key: 'created_at', label: 'Data', render: (c: any) => new Date(c.created_at).toLocaleDateString('pt-BR') },
    {
      key: 'status',
      label: 'Status',
      render: (c: any) => (
        <Badge variant={c.status === 'completed' || c.status === 'paid' ? 'default' : 'secondary'}>
          {c.status === 'completed' || c.status === 'paid' ? 'Concluído' : 'Pendente'}
        </Badge>
      )
    },
  ];

  if (loading) {
    return (
      <DashboardLayout userType="manager" userName="Gerente" notifications={0}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="manager" userName={manager?.name || 'Gerente'} notifications={3}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Minhas Comissões</h2>
            <p className="text-muted-foreground">Acompanhe seus ganhos e solicite saques</p>
          </div>
          <div className="flex gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-40">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Este mês</SelectItem>
                <SelectItem value="year">Este ano</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => loadData()}>
              Atualizar
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          <StatCard title="Total de Comissões" value={formatCurrency(stats?.commission || 0)} icon={Wallet} />
          <StatCard title="Pendente" value={formatCurrency(stats?.pending_commission || 0)} icon={DollarSign} />
          <StatCard title="Saldo Disponível" value={formatCurrency(stats?.balance || 0)} icon={TrendingUp} className="bg-primary/5 border-primary/20" />
          <StatCard title="Estabelecimentos" value={stats?.establishments || 0} icon={Building2} />
        </div>

        {/* Table & Withdrawal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Histórico Financeiro</CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable data={transactions} columns={columns} emptyMessage="Nenhuma transação encontrada." />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Solicitar Saque</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Saldo disponível</p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(stats?.balance || 0)}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Valor do saque</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                    <Input
                      type="number"
                      placeholder="0,00"
                      className="pl-9"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                    />
                  </div>
                </div>

                <Button variant="hero" className="w-full" onClick={handleWithdraw}>
                  <DollarSign className="w-4 h-4 mr-2" />
                  Solicitar Saque
                </Button>
                <p className="text-[10px] text-center text-muted-foreground">
                  O valor será enviado para sua chave PIX cadastrada.
                </p>
              </CardContent>
            </Card>

            <Card className="border-warning bg-warning/5">
              <CardContent className="pt-6">
                <h4 className="font-semibold text-sm mb-2">Atenção</h4>
                <p className="text-xs text-muted-foreground">
                  Certifique-se de que seus dados bancários no perfil estão atualizados para evitar atrasos no pagamento.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
