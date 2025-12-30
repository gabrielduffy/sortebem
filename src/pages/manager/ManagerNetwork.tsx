import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/dashboard/DataTable';
import { QRCodeCard } from '@/components/dashboard/QRCodeCard';
import { StatCard } from '@/components/dashboard/StatCard';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Building2, TrendingUp, Trophy, Eye } from 'lucide-react';
import { apiService } from '@/services/api';

export default function ManagerNetwork() {
  const [establishments, setEstablishments] = useState<any[]>([]);
  const [manager, setManager] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [viewingEst, setViewingEst] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const [mgrRes, netRes] = await Promise.all([
        apiService.getCurrentManager(),
        apiService.getManagerNetwork()
      ]);

      if (mgrRes.ok) setManager(mgrRes.data);
      if (netRes.ok) setEstablishments(netRes.data);

    } catch (error) {
      console.error('Error loading network:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar dados da rede.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const columns = [
    { key: 'tradeName', label: 'Nome Fantasia' },
    { key: 'cnpj', label: 'CNPJ', render: (e: any) => e.cnpj || '-' },
    { key: 'sales', label: 'Vendas', render: (e: any) => formatCurrency(e.sales || 0) },
    { key: 'commission', label: 'Sua Comissão', render: (e: any) => formatCurrency(e.commission || 0) },
    { key: 'kycStatus', label: 'KYC', render: (e: any) => <Badge variant={e.kycStatus === 'approved' ? 'default' : 'secondary'}>{e.kycStatus === 'approved' ? 'Aprovado' : 'Pendente'}</Badge> },
    { key: 'isActive', label: 'Status', render: (e: any) => <Badge variant={e.isActive ? 'default' : 'outline'}>{e.isActive ? 'Ativo' : 'Inativo'}</Badge> },
    { key: 'actions', label: '', render: (e: any) => <Button variant="ghost" size="sm" onClick={() => setViewingEst(e)}><Eye className="w-4 h-4" /></Button> },
  ];

  const totalSales = establishments.reduce((a, e) => a + (e.sales || 0), 0);
  const totalComm = establishments.reduce((a, e) => a + (e.commission || 0), 0);
  const referralUrl = manager ? `${window.location.origin}/seja-parceiro?ref=${manager.referral_code}` : '';

  return (
    <DashboardLayout userType="manager" userName={manager?.name || 'Gerente'} notifications={3}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Minha Rede</h2>
            <p className="text-muted-foreground">Gerencie seus estabelecimentos</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <StatCard title="Estabelecimentos" value={establishments.length} icon={Building2} />
          <StatCard title="Faturamento da Rede" value={formatCurrency(totalSales)} icon={TrendingUp} />
          <StatCard title="Suas Comissões" value={formatCurrency(totalComm)} icon={Trophy} />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader><CardTitle>Estabelecimentos</CardTitle></CardHeader>
              <CardContent>
                {loading ? <div className="p-4 text-center">Carregando...</div> : <DataTable data={establishments} columns={columns} emptyMessage="Nenhum estabelecimento encontrado" />}
              </CardContent>
            </Card>
          </div>
          {manager && (
            <QRCodeCard title="Link de Captação" subtitle="Compartilhe para cadastrar novos estabelecimentos" url={referralUrl} code={manager.referral_code} />
          )}
        </div>

        <Dialog open={!!viewingEst} onOpenChange={() => setViewingEst(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Detalhes do Estabelecimento</DialogTitle></DialogHeader>
            {viewingEst && (
              <div className="grid grid-cols-2 gap-4 py-4">
                <div><Label className="text-muted-foreground">Nome</Label><p className="font-medium">{viewingEst.tradeName}</p></div>
                <div><Label className="text-muted-foreground">CNPJ</Label><p className="font-medium">{viewingEst.cnpj}</p></div>
                <div><Label className="text-muted-foreground">Vendas</Label><p className="font-medium text-primary">{formatCurrency(viewingEst.sales)}</p></div>
                <div><Label className="text-muted-foreground">Sua Comissão</Label><p className="font-medium text-primary">{formatCurrency(viewingEst.commission)}</p></div>
                <div><Label className="text-muted-foreground">Telefone</Label><p className="font-medium">{viewingEst.phone || '-'}</p></div>
                <div><Label className="text-muted-foreground">Endereço</Label><p className="font-medium text-sm">{viewingEst.address || '-'}</p></div>
              </div>
            )}
            <DialogFooter><Button variant="outline" onClick={() => setViewingEst(null)}>Fechar</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
