import { useState } from 'react';
import { Plus, Monitor, Trash2, RefreshCw, Copy, Eye, EyeOff } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DataTable } from '@/components/dashboard/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { mockEstablishment } from '@/services/mockData';

interface PosTerminal {
  id: string;
  terminalId: string;
  apiKey: string;
  isActive: boolean;
  lastActivity?: string;
  createdAt: string;
  salesCount: number;
}

interface PosSale {
  id: string;
  terminalId: string;
  date: string;
  time: string;
  quantity: number;
  amount: number;
  method: 'card' | 'pix';
}

const mockTerminals: PosTerminal[] = [
  { 
    id: '1', 
    terminalId: 'POS-001-PDJ', 
    apiKey: 'sk_live_abc123xyz789...', 
    isActive: true, 
    lastActivity: '2024-12-28 14:32',
    createdAt: '2024-11-15',
    salesCount: 234
  },
  { 
    id: '2', 
    terminalId: 'POS-002-PDJ', 
    apiKey: 'sk_live_def456uvw012...', 
    isActive: true, 
    lastActivity: '2024-12-28 13:45',
    createdAt: '2024-11-20',
    salesCount: 189
  },
  { 
    id: '3', 
    terminalId: 'POS-003-PDJ', 
    apiKey: 'sk_live_ghi789rst345...', 
    isActive: false, 
    createdAt: '2024-12-01',
    salesCount: 0
  },
];

const mockPosSales: PosSale[] = [
  { id: '1', terminalId: 'POS-001-PDJ', date: '2024-12-28', time: '14:32', quantity: 3, amount: 15, method: 'card' },
  { id: '2', terminalId: 'POS-002-PDJ', date: '2024-12-28', time: '13:45', quantity: 5, amount: 25, method: 'pix' },
  { id: '3', terminalId: 'POS-001-PDJ', date: '2024-12-28', time: '12:20', quantity: 2, amount: 10, method: 'card' },
  { id: '4', terminalId: 'POS-001-PDJ', date: '2024-12-27', time: '18:15', quantity: 8, amount: 40, method: 'pix' },
  { id: '5', terminalId: 'POS-002-PDJ', date: '2024-12-27', time: '16:30', quantity: 4, amount: 20, method: 'card' },
];

export default function EstablishmentPOS() {
  const [terminals, setTerminals] = useState(mockTerminals);
  const [newTerminalId, setNewTerminalId] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showApiKey, setShowApiKey] = useState<{ [key: string]: boolean }>({});

  const handleAddTerminal = () => {
    if (!newTerminalId.trim()) {
      toast({ title: "Erro", description: "Informe o ID do terminal", variant: "destructive" });
      return;
    }
    
    const newTerminal: PosTerminal = {
      id: String(terminals.length + 1),
      terminalId: newTerminalId,
      apiKey: `sk_live_${Math.random().toString(36).substring(2, 15)}...`,
      isActive: true,
      createdAt: new Date().toISOString().split('T')[0],
      salesCount: 0,
    };
    
    setTerminals([...terminals, newTerminal]);
    setNewTerminalId('');
    setDialogOpen(false);
    toast({ title: "Terminal cadastrado!", description: "API Key gerada com sucesso." });
  };

  const toggleTerminal = (id: string) => {
    setTerminals(terminals.map(t => 
      t.id === id ? { ...t, isActive: !t.isActive } : t
    ));
  };

  const copyApiKey = (apiKey: string) => {
    navigator.clipboard.writeText(apiKey);
    toast({ title: "Copiado!", description: "API Key copiada para a área de transferência." });
  };

  const terminalColumns = [
    { key: 'terminalId', label: 'ID do Terminal' },
    { 
      key: 'apiKey', 
      label: 'API Key',
      render: (terminal: PosTerminal) => (
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm">
            {showApiKey[terminal.id] ? terminal.apiKey : '••••••••••••••••'}
          </span>
          <button 
            onClick={() => setShowApiKey({ ...showApiKey, [terminal.id]: !showApiKey[terminal.id] })}
            className="text-muted-foreground hover:text-foreground"
          >
            {showApiKey[terminal.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          <button 
            onClick={() => copyApiKey(terminal.apiKey)}
            className="text-muted-foreground hover:text-foreground"
          >
            <Copy className="h-4 w-4" />
          </button>
        </div>
      )
    },
    { 
      key: 'isActive', 
      label: 'Status',
      render: (terminal: PosTerminal) => (
        <div className="flex items-center gap-2">
          <Switch 
            checked={terminal.isActive} 
            onCheckedChange={() => toggleTerminal(terminal.id)}
          />
          <Badge variant={terminal.isActive ? 'default' : 'secondary'}>
            {terminal.isActive ? 'Ativo' : 'Inativo'}
          </Badge>
        </div>
      )
    },
    { 
      key: 'lastActivity', 
      label: 'Última Atividade',
      render: (terminal: PosTerminal) => terminal.lastActivity || 'Nunca'
    },
    { key: 'salesCount', label: 'Vendas' },
  ];

  const salesColumns = [
    { key: 'terminalId', label: 'Terminal' },
    { 
      key: 'date', 
      label: 'Data/Hora',
      render: (sale: PosSale) => (
        <div>
          <p>{new Date(sale.date).toLocaleDateString('pt-BR')}</p>
          <p className="text-sm text-muted-foreground">{sale.time}</p>
        </div>
      )
    },
    { key: 'quantity', label: 'Cartelas' },
    { 
      key: 'amount', 
      label: 'Valor',
      render: (sale: PosSale) => `R$ ${sale.amount.toFixed(2)}`
    },
    { 
      key: 'method', 
      label: 'Método',
      render: (sale: PosSale) => (
        <Badge variant="outline">
          {sale.method === 'card' ? 'Cartão' : 'PIX'}
        </Badge>
      )
    },
  ];

  return (
    <DashboardLayout userType="establishment" userName={mockEstablishment.tradeName} notifications={2}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Terminais POS (Smart 2)</h2>
          <p className="text-muted-foreground">Gerencie seus terminais de venda</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Terminal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cadastrar Terminal POS</DialogTitle>
              <DialogDescription>
                Informe o ID do terminal Moderninha Smart 2 para gerar a API Key.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="terminalId">ID do Terminal</Label>
                <Input
                  id="terminalId"
                  placeholder="Ex: POS-004-PDJ"
                  value={newTerminalId}
                  onChange={(e) => setNewTerminalId(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  O ID pode ser encontrado na etiqueta do terminal ou no app PagBank.
                </p>
              </div>
              <Button onClick={handleAddTerminal} className="w-full">
                Gerar API Key
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Terminals */}
      <div className="mb-8">
        <h3 className="font-semibold text-foreground mb-4">Terminais Cadastrados</h3>
        <DataTable
          data={terminals}
          columns={terminalColumns}
          emptyMessage="Nenhum terminal cadastrado."
        />
      </div>

      {/* Installation Guide */}
      <div className="bg-card rounded-xl border border-border p-6 mb-8">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Monitor className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Como instalar o APK na Smart 2</h3>
            <p className="text-muted-foreground mt-1 mb-4">
              Siga as instruções para configurar seu terminal para vendas de cartelas.
            </p>
            <ol className="space-y-2 text-sm text-muted-foreground">
              <li>1. Baixe o APK SORTBEM no site oficial</li>
              <li>2. Transfira o arquivo para a Smart 2 via USB ou download direto</li>
              <li>3. Instale o aplicativo nas configurações do terminal</li>
              <li>4. Abra o app e insira a API Key gerada acima</li>
              <li>5. Configure a impressão de cartelas e QR Codes</li>
              <li>6. Pronto! O terminal já pode vender cartelas</li>
            </ol>
            <Button variant="outline" className="mt-4">
              Baixar Manual Completo
            </Button>
          </div>
        </div>
      </div>

      {/* Sales Log */}
      <div>
        <h3 className="font-semibold text-foreground mb-4">Vendas via POS</h3>
        <DataTable
          data={mockPosSales}
          columns={salesColumns}
          pageSize={10}
          emptyMessage="Nenhuma venda via POS ainda."
        />
      </div>
    </DashboardLayout>
  );
}
