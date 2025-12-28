import { useState } from 'react';
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
import { mockEstablishment } from '@/services/mockData';

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

const mockSales: Sale[] = [
  { id: '1', date: '2024-12-28', time: '14:32', quantity: 5, amount: 25, method: 'pix', status: 'confirmed', cardCodes: ['SB-A7K3M9P2', 'SB-B8L4N0Q3'] },
  { id: '2', date: '2024-12-28', time: '14:28', quantity: 2, amount: 10, method: 'pos_card', status: 'confirmed', cardCodes: ['SB-C9M5O1R4'] },
  { id: '3', date: '2024-12-28', time: '14:15', quantity: 10, amount: 50, method: 'pix', status: 'confirmed', cardCodes: ['SB-D0N6P2S5'] },
  { id: '4', date: '2024-12-28', time: '14:02', quantity: 3, amount: 15, method: 'pos_pix', status: 'confirmed', cardCodes: ['SB-E1O7Q3T6'] },
  { id: '5', date: '2024-12-28', time: '13:55', quantity: 8, amount: 40, method: 'pix', status: 'pending', cardCodes: ['SB-F2P8R4U7'] },
  { id: '6', date: '2024-12-27', time: '18:42', quantity: 4, amount: 20, method: 'pix', status: 'confirmed', cardCodes: ['SB-G3Q9S5V8'] },
  { id: '7', date: '2024-12-27', time: '16:20', quantity: 6, amount: 30, method: 'pos_card', status: 'confirmed', cardCodes: ['SB-H4R0T6W9'] },
  { id: '8', date: '2024-12-27', time: '14:15', quantity: 2, amount: 10, method: 'pix', status: 'failed', cardCodes: [] },
  { id: '9', date: '2024-12-26', time: '20:30', quantity: 15, amount: 75, method: 'pix', status: 'confirmed', cardCodes: ['SB-I5S1U7X0'] },
  { id: '10', date: '2024-12-26', time: '19:45', quantity: 7, amount: 35, method: 'pos_pix', status: 'confirmed', cardCodes: ['SB-J6T2V8Y1'] },
];

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
    case 'confirmed': return 'Confirmado';
    case 'pending': return 'Pendente';
    case 'failed': return 'Falhou';
    default: return status;
  }
};

export default function EstablishmentSales() {
  const [dateFilter, setDateFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');

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

  const filteredSales = mockSales.filter(sale => {
    if (methodFilter !== 'all' && sale.method !== methodFilter) return false;
    return true;
  });

  const totalAmount = filteredSales.reduce((sum, sale) => sum + sale.amount, 0);
  const totalCards = filteredSales.reduce((sum, sale) => sum + sale.quantity, 0);

  return (
    <DashboardLayout userType="establishment" userName={mockEstablishment.tradeName} notifications={2}>
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
