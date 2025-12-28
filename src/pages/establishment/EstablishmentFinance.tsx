import { useState } from 'react';
import { Download, Wallet, TrendingUp, Gift, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { DataTable } from '@/components/dashboard/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { mockEstablishment } from '@/services/mockData';

interface Transaction {
  id: string;
  date: string;
  type: 'commission' | 'bonus' | 'withdrawal';
  description: string;
  amount: number;
  status: 'completed' | 'pending' | 'processing';
}

const mockTransactions: Transaction[] = [
  { id: '1', date: '2024-12-28', type: 'commission', description: 'Comissão de vendas - 127 cartelas', amount: 95.25, status: 'completed' },
  { id: '2', date: '2024-12-28', type: 'bonus', description: 'Bônus pool especial', amount: 150.00, status: 'completed' },
  { id: '3', date: '2024-12-27', type: 'commission', description: 'Comissão de vendas - 89 cartelas', amount: 66.75, status: 'completed' },
  { id: '4', date: '2024-12-27', type: 'withdrawal', description: 'Saque via PIX', amount: -500.00, status: 'completed' },
  { id: '5', date: '2024-12-26', type: 'commission', description: 'Comissão de vendas - 156 cartelas', amount: 117.00, status: 'completed' },
  { id: '6', date: '2024-12-26', type: 'bonus', description: 'Bônus meta semanal', amount: 200.00, status: 'completed' },
  { id: '7', date: '2024-12-25', type: 'commission', description: 'Comissão de vendas - 203 cartelas', amount: 152.25, status: 'completed' },
  { id: '8', date: '2024-12-24', type: 'withdrawal', description: 'Saque via PIX', amount: -300.00, status: 'processing' },
];

const mockFinancialSummary = {
  balance: 2135.25,
  pendingWithdrawal: 300.00,
  totalCommissions: 5847.50,
  totalBonus: 1250.00,
  totalWithdrawals: 4962.25,
};

export default function EstablishmentFinance() {
  const [withdrawAmount, setWithdrawAmount] = useState('');

  const columns = [
    { 
      key: 'date', 
      label: 'Data',
      render: (tx: Transaction) => new Date(tx.date).toLocaleDateString('pt-BR')
    },
    { 
      key: 'type', 
      label: 'Tipo',
      render: (tx: Transaction) => {
        const types = {
          commission: { label: 'Comissão', variant: 'default' },
          bonus: { label: 'Bônus', variant: 'secondary' },
          withdrawal: { label: 'Saque', variant: 'outline' },
        };
        const t = types[tx.type];
        return <Badge variant={t.variant as any}>{t.label}</Badge>;
      }
    },
    { key: 'description', label: 'Descrição' },
    { 
      key: 'amount', 
      label: 'Valor',
      render: (tx: Transaction) => (
        <span className={tx.amount < 0 ? 'text-red-600' : 'text-green-600'}>
          {tx.amount < 0 ? '-' : '+'} R$ {Math.abs(tx.amount).toFixed(2)}
        </span>
      )
    },
    { 
      key: 'status', 
      label: 'Status',
      render: (tx: Transaction) => {
        const statuses = {
          completed: { label: 'Concluído', variant: 'default' },
          pending: { label: 'Pendente', variant: 'secondary' },
          processing: { label: 'Processando', variant: 'outline' },
        };
        const s = statuses[tx.status];
        return <Badge variant={s.variant as any}>{s.label}</Badge>;
      }
    },
  ];

  return (
    <DashboardLayout userType="establishment" userName={mockEstablishment.tradeName} notifications={2}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Financeiro</h2>
          <p className="text-muted-foreground">Extrato e gestão de comissões</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Saldo Disponível"
          value={`R$ ${mockFinancialSummary.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={Wallet}
          className="bg-gradient-to-br from-primary/10 to-transparent"
        />
        <StatCard
          title="Comissões do Mês"
          value={`R$ ${mockFinancialSummary.totalCommissions.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={TrendingUp}
          trend={{ value: 15, isPositive: true }}
        />
        <StatCard
          title="Bônus do Mês"
          value={`R$ ${mockFinancialSummary.totalBonus.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={Gift}
        />
        <StatCard
          title="Total Sacado"
          value={`R$ ${mockFinancialSummary.totalWithdrawals.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          subtitle="Este mês"
          icon={ArrowUpRight}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transactions */}
        <div className="lg:col-span-2">
          <DataTable
            data={mockTransactions}
            columns={columns}
            pageSize={10}
            emptyMessage="Nenhuma transação encontrada."
          />
        </div>

        {/* Withdrawal Card */}
        <div className="space-y-6">
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="font-semibold text-foreground mb-4">Solicitar Saque</h3>
            
            <div className="p-4 bg-muted/50 rounded-lg mb-4">
              <p className="text-sm text-muted-foreground">Saldo disponível</p>
              <p className="text-2xl font-bold text-foreground">
                R$ {mockFinancialSummary.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>

            {mockFinancialSummary.pendingWithdrawal > 0 && (
              <div className="p-4 bg-yellow-500/10 rounded-lg mb-4 border border-yellow-500/20">
                <p className="text-sm text-yellow-700">Saque em processamento</p>
                <p className="font-semibold text-yellow-700">
                  R$ {mockFinancialSummary.pendingWithdrawal.toFixed(2)}
                </p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Valor do saque</label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="0,00"
                    className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background"
                  />
                </div>
              </div>

              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Chave PIX cadastrada</p>
                <p className="font-mono text-foreground">{mockEstablishment.pixKey}</p>
                <p className="text-xs text-muted-foreground">({mockEstablishment.pixKeyType.toUpperCase()})</p>
              </div>

              <Button className="w-full">
                Solicitar Saque
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Saques são processados em até 24 horas úteis
              </p>
            </div>
          </div>

          {/* Commission Info */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="font-semibold text-foreground mb-4">Suas Taxas</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Comissão por venda</span>
                <span className="font-semibold text-primary">15%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bônus pool especial</span>
                <span className="font-semibold text-primary">5%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Meta semanal</span>
                <span className="font-semibold text-foreground">500 cartelas</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bônus meta</span>
                <span className="font-semibold text-primary">R$ 200,00</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
