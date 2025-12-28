import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/dashboard/DataTable';
import { toast } from '@/hooks/use-toast';
import { Save, MessageSquare, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

const mockLogs = [
  { id: '1', phone: '11999999999', cards: 'SB-A7K3M9P2, SB-B8L4N0Q3', status: 'sent', date: '27/12/2024 15:30' },
  { id: '2', phone: '11988888888', cards: 'SB-C9M5O1R4', status: 'delivered', date: '27/12/2024 15:25' },
  { id: '3', phone: '11977777777', cards: 'SB-D0N6P2S5, SB-E1O7Q3T6', status: 'failed', date: '27/12/2024 15:20' },
  { id: '4', phone: '11966666666', cards: 'SB-F2P8R4U7', status: 'delivered', date: '27/12/2024 15:15' },
];

export default function AdminWhatsApp() {
  const [config, setConfig] = useState({
    apiUrl: 'https://api.whatsapp.evolution.com',
    apiKey: '••••••••••••••••',
    senderNumber: '5511999999999',
    isConnected: true,
  });

  const handleSave = () => {
    toast({ title: 'Configurações salvas!', description: 'As configurações do WhatsApp foram atualizadas.' });
  };

  const handleTestConnection = () => {
    toast({ title: 'Conexão OK!', description: 'O WhatsApp está conectado e funcionando.' });
  };

  const columns = [
    { key: 'phone', label: 'Telefone' },
    { key: 'cards', label: 'Cartelas' },
    { 
      key: 'status', 
      label: 'Status', 
      render: (l: any) => (
        <Badge variant={l.status === 'delivered' ? 'default' : l.status === 'sent' ? 'secondary' : 'destructive'}>
          {l.status === 'delivered' ? '✓ Entregue' : l.status === 'sent' ? '⏳ Enviado' : '✗ Falhou'}
        </Badge>
      )
    },
    { key: 'date', label: 'Data/Hora' },
  ];

  return (
    <DashboardLayout userType="admin" userName="Administrador" notifications={5}>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Integração WhatsApp</h2>
          <p className="text-muted-foreground">Configure a integração com WhatsApp para envio de cartelas</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Config */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                Configurações da API
              </CardTitle>
              <CardDescription>Configure os dados de conexão com a API do WhatsApp</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>URL da API</Label>
                <Input 
                  value={config.apiUrl}
                  onChange={(e) => setConfig({...config, apiUrl: e.target.value})}
                  placeholder="https://api.whatsapp.com"
                />
              </div>
              <div>
                <Label>API Key</Label>
                <Input 
                  type="password"
                  value={config.apiKey}
                  onChange={(e) => setConfig({...config, apiKey: e.target.value})}
                  placeholder="Sua chave de API"
                />
              </div>
              <div>
                <Label>Número Remetente</Label>
                <Input 
                  value={config.senderNumber}
                  onChange={(e) => setConfig({...config, senderNumber: e.target.value})}
                  placeholder="5511999999999"
                />
              </div>
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-2">
                  {config.isConnected ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-success" />
                      <span className="text-success font-medium">Conectado</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-destructive" />
                      <span className="text-destructive font-medium">Desconectado</span>
                    </>
                  )}
                </div>
                <Button variant="outline" onClick={handleTestConnection}>
                  <RefreshCw className="w-4 h-4" />
                  Testar Conexão
                </Button>
              </div>
              <Button variant="hero" className="w-full" onClick={handleSave}>
                <Save className="w-4 h-4" />
                Salvar Configurações
              </Button>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-3xl font-bold text-foreground">1.247</p>
                    <p className="text-sm text-muted-foreground">Enviados Hoje</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-success">98.5%</p>
                    <p className="text-sm text-muted-foreground">Taxa de Entrega</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-foreground">18</p>
                    <p className="text-sm text-muted-foreground">Falhas</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Mensagem Padrão</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted rounded-xl p-4 text-sm">
                  <p className="mb-2">🎉 <strong>Suas cartelas SORTEBEM!</strong></p>
                  <p className="mb-2">Olá! Aqui estão suas cartelas para o próximo sorteio:</p>
                  <p className="text-primary font-mono mb-2">[CÓDIGOS DAS CARTELAS]</p>
                  <p className="mb-2">📱 Acesse: sortebem.com.br/c/[CÓDIGO]</p>
                  <p className="text-muted-foreground">Boa sorte! 🍀</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Logs */}
        <Card>
          <CardHeader>
            <CardTitle>Logs de Envio</CardTitle>
            <CardDescription>Histórico recente de mensagens enviadas</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable data={mockLogs} columns={columns} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
