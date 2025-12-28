import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/dashboard/DataTable';
import { QRCodeCard } from '@/components/dashboard/QRCodeCard';
import { StatCard } from '@/components/dashboard/StatCard';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Plus, Building2, TrendingUp, Trophy, Eye } from 'lucide-react';

const mockEstablishments = [
  { id: '1', tradeName: 'Padaria do João', cnpj: '12.345.678/0001-90', sales: 45780, commission: 2289, kycStatus: 'approved', isActive: true },
  { id: '2', tradeName: 'Mercado Central', cnpj: '98.765.432/0001-10', sales: 32450, commission: 1622, kycStatus: 'approved', isActive: true },
  { id: '3', tradeName: 'Bar do Zé', cnpj: '45.678.912/0001-30', sales: 12300, commission: 615, kycStatus: 'pending', isActive: false },
];

export default function ManagerNetwork() {
  const [establishments] = useState(mockEstablishments);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewingEst, setViewingEst] = useState<any>(null);

  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const columns = [
    { key: 'tradeName', label: 'Nome Fantasia' },
    { key: 'cnpj', label: 'CNPJ' },
    { key: 'sales', label: 'Vendas', render: (e: any) => formatCurrency(e.sales) },
    { key: 'commission', label: 'Sua Comissão', render: (e: any) => formatCurrency(e.commission) },
    { key: 'kycStatus', label: 'KYC', render: (e: any) => <Badge variant={e.kycStatus === 'approved' ? 'default' : 'secondary'}>{e.kycStatus === 'approved' ? 'Aprovado' : 'Pendente'}</Badge> },
    { key: 'isActive', label: 'Status', render: (e: any) => <Badge variant={e.isActive ? 'default' : 'outline'}>{e.isActive ? 'Ativo' : 'Inativo'}</Badge> },
    { key: 'actions', label: '', render: (e: any) => <Button variant="ghost" size="sm" onClick={() => setViewingEst(e)}><Eye className="w-4 h-4" /></Button> },
  ];

  return (
    <DashboardLayout userType="manager" userName="Carlos Gerente" notifications={3}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Minha Rede</h2>
            <p className="text-muted-foreground">Gerencie seus estabelecimentos</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <StatCard title="Estabelecimentos" value={establishments.length} icon={Building2} />
          <StatCard title="Faturamento da Rede" value={formatCurrency(establishments.reduce((a, e) => a + e.sales, 0))} icon={TrendingUp} />
          <StatCard title="Suas Comissões" value={formatCurrency(establishments.reduce((a, e) => a + e.commission, 0))} icon={Trophy} />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader><CardTitle>Estabelecimentos</CardTitle></CardHeader>
              <CardContent><DataTable data={establishments} columns={columns} /></CardContent>
            </Card>
          </div>
          <QRCodeCard title="Link de Captação" subtitle="Compartilhe para cadastrar novos estabelecimentos" url={`${window.location.origin}/seja-parceiro?ref=MGR2024`} code="MGR2024" />
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
              </div>
            )}
            <DialogFooter><Button variant="outline" onClick={() => setViewingEst(null)}>Fechar</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
