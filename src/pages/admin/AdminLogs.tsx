import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/dashboard/DataTable';
import { Search, Download, Filter } from 'lucide-react';

const mockLogs = [
  { id: '1', timestamp: '27/12/2024 15:32:45', type: 'system', action: 'Rodada #001 iniciada', user: 'Sistema', ip: '-' },
  { id: '2', timestamp: '27/12/2024 15:30:12', type: 'purchase', action: 'Compra de 5 cartelas - R$ 25,00', user: 'Padaria do João', ip: '189.45.123.45' },
  { id: '3', timestamp: '27/12/2024 15:28:33', type: 'auth', action: 'Login realizado', user: 'carlos@gerente.com', ip: '200.123.45.67' },
  { id: '4', timestamp: '27/12/2024 15:25:18', type: 'config', action: 'Configurações alteradas - Valor cartela', user: 'Administrador', ip: '192.168.1.100' },
  { id: '5', timestamp: '27/12/2024 15:22:05', type: 'winner', action: 'Vitória declarada - R$ 12.500 - Mercado Central', user: 'Sistema', ip: '-' },
  { id: '6', timestamp: '27/12/2024 15:20:00', type: 'system', action: 'Rodada #000 finalizada', user: 'Sistema', ip: '-' },
  { id: '7', timestamp: '27/12/2024 15:18:45', type: 'pos', action: 'Venda POS - Terminal T001 - 3 cartelas', user: 'Padaria do João', ip: '-' },
  { id: '8', timestamp: '27/12/2024 15:15:30', type: 'whatsapp', action: 'Cartelas enviadas - 11999999999', user: 'Sistema', ip: '-' },
  { id: '9', timestamp: '27/12/2024 15:12:22', type: 'withdrawal', action: 'Saque solicitado - R$ 5.000 - PIX', user: 'SB-A7K3M9P2', ip: '177.89.123.45' },
  { id: '10', timestamp: '27/12/2024 15:10:00', type: 'system', action: 'Rodada #000 iniciada', user: 'Sistema', ip: '-' },
];

const logTypes: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  system: { label: 'Sistema', variant: 'secondary' },
  purchase: { label: 'Compra', variant: 'default' },
  auth: { label: 'Autenticação', variant: 'outline' },
  config: { label: 'Configuração', variant: 'secondary' },
  winner: { label: 'Vitória', variant: 'default' },
  pos: { label: 'POS', variant: 'outline' },
  whatsapp: { label: 'WhatsApp', variant: 'outline' },
  withdrawal: { label: 'Saque', variant: 'default' },
};

export default function AdminLogs() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const filteredLogs = mockLogs.filter(log => {
    const matchesSearch = log.action.toLowerCase().includes(search.toLowerCase()) ||
                         log.user.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || log.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const columns = [
    { key: 'timestamp', label: 'Data/Hora' },
    { 
      key: 'type', 
      label: 'Tipo', 
      render: (l: any) => (
        <Badge variant={logTypes[l.type]?.variant || 'secondary'}>
          {logTypes[l.type]?.label || l.type}
        </Badge>
      )
    },
    { key: 'action', label: 'Ação' },
    { key: 'user', label: 'Usuário' },
    { key: 'ip', label: 'IP' },
  ];

  return (
    <DashboardLayout userType="admin" userName="Administrador" notifications={5}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Logs / Auditoria</h2>
            <p className="text-muted-foreground">Histórico de eventos do sistema</p>
          </div>
          <Button variant="outline">
            <Download className="w-4 h-4" />
            Exportar CSV
          </Button>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-foreground">1.247</p>
              <p className="text-sm text-muted-foreground">Eventos Hoje</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-foreground">342</p>
              <p className="text-sm text-muted-foreground">Compras</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-foreground">89</p>
              <p className="text-sm text-muted-foreground">Logins</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-foreground">24</p>
              <p className="text-sm text-muted-foreground">Vitórias</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar por ação ou usuário..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="system">Sistema</SelectItem>
                  <SelectItem value="purchase">Compra</SelectItem>
                  <SelectItem value="auth">Autenticação</SelectItem>
                  <SelectItem value="config">Configuração</SelectItem>
                  <SelectItem value="winner">Vitória</SelectItem>
                  <SelectItem value="pos">POS</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="withdrawal">Saque</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Eventos Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable data={filteredLogs} columns={columns} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
