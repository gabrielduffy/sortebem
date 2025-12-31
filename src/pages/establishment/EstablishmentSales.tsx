import { useState, useEffect } from 'react';
import { Download, Filter, Calendar } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DataTable } from '@/components/dashboard/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiService } from '@/services/api';
import { toast } from '@/hooks/use-toast';

interface Sale {
  id: string;
  date: string;
  time: string;
  quantity: number;
  amount: number;
  method: 'pix' | 'pos_card' | 'pos_pix';
  status: 'confirmed' | 'pending' | 'failed';
  cardCodes: string[];
}

// Mocks removed

const getMethodLabel = (method: string) => {
  switch (method) {
    case 'pix': return 'PIX';
    case 'pos_card': return 'POS Cartão';
    case 'pos_pix': return 'POS PIX';
    default: return method;
  }
};

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'confirmed': return 'default';
    case 'pending': return 'secondary';
    case 'failed': return 'destructive';
    default: return 'secondary';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'confirmed':
    case 'paid': return 'Confirmado';
    case 'pending': return 'Pendente';
    case 'failed':
    case 'cancelled': return 'Falhou';
    default: return status;
  }
};

export default function EstablishmentSales() {
  const [establishment, setEstablishment] = useState<any>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');

  const loadSales = async () => {
    try {
      setLoading(true);
      const estRes = await apiService.getCurrentEstablishment();
      if (estRes.ok && estRes.data) {
        setEstablishment(estRes.data);
        const result = await apiService.getEstablishmentTransactions(estRes.data.id);
        if (result.ok) {
          setSales((result.data || []).map((s: any) => ({
            id: s.id,
            date: new Date(s.created_at).toISOString().split('T')[0],
            time: new Date(s.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            quantity: s.quantity || 1,
            amount: s.total_amount,
            method: s.payment_method?.toLowerCase() === 'credit_card' ? 'pos_card' : 'pix',
            status: s.payment_status === 'paid' ? 'confirmed' : s.payment_status === 'pending' ? 'pending' : 'failed',
            cardCodes: s.transaction_code ? [s.transaction_code] : []
          })));
        }
      }
    } catch (error) {
      console.error(error);
      toast({ title: 'Erro', description: 'Erro ao carregar vendas', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, []);

  const columns = [
    {
      key: 'date',
      label: 'Data/Hora',
      render: (sale: Sale) => (
        <div>
          <p className="font-medium">{new Date(sale.date).toLocaleDateString('pt-BR')}</p>
          <p className="text-sm text-muted-foreground">{sale.time}</p>
        </div>
      )
    },
    { key: 'quantity', label: 'Qtd. Cartelas' },
    {
      key: 'amount',
      label: 'Valor',
      render: (sale: Sale) => `R$ ${sale.amount.toFixed(2)}`
    },
    {
      key: 'method',
      label: 'Método',
      render: (sale: Sale) => (
        <Badge variant="outline">{getMethodLabel(sale.method)}</Badge>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (sale: Sale) => (
        <Badge variant={getStatusVariant(sale.status) as any}>
          {getStatusLabel(sale.status)}
        </Badge>
      )
    },
    {
      key: 'cardCodes',
      label: 'Cartelas',
      render: (sale: Sale) => (
        <span className="text-sm font-mono text-muted-foreground">
          {sale.cardCodes.length > 0 ? sale.cardCodes.slice(0, 2).join(', ') + (sale.cardCodes.length > 2 ? '...' : '') : '-'}
        </span>
      )
    },
  ];

  const filteredSales = sales.filter(sale => {
    if (methodFilter !== 'all' && sale.method !== methodFilter) return false;
    // Add date filtering logic here if needed
    return true;
  });

  const totalAmount = filteredSales.reduce((sum, sale) => sum + (sale.status === 'confirmed' ? sale.amount : 0), 0);
  const totalCards = filteredSales.reduce((sum, sale) => sum + (sale.status === 'confirmed' ? sale.quantity : 0), 0);

  return (
    <DashboardLayout
      userType="establishment"
      userName={establishment?.name || 'Estabelecimento'}
      notifications={2}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Vendas</h2>
          <p className="text-muted-foreground">Histórico de vendas de cartelas</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">Total de Vendas</p>
          <p className="text-2xl font-bold text-foreground">{filteredSales.length}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">Total em Cartelas</p>
          <p className="text-2xl font-bold text-foreground">{totalCards}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">Valor Total</p>
          <p className="text-2xl font-bold text-primary">R$ {totalAmount.toFixed(2)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="week">Últimos 7 dias</SelectItem>
              <SelectItem value="month">Este mês</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={methodFilter} onValueChange={setMethodFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Método" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pix">PIX</SelectItem>
              <SelectItem value="pos_card">POS Cartão</SelectItem>
              <SelectItem value="pos_pix">POS PIX</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <DataTable
        data={filteredSales}
        columns={columns}
        pageSize={10}
        emptyMessage="Nenhuma venda encontrada."
      />
    </DashboardLayout>
  );
}
