import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DataTable } from '@/components/dashboard/DataTable';
import { toast } from '@/hooks/use-toast';
import { Eye, Check, X, Building2, ShoppingCart, Wallet } from 'lucide-react';

const mockEstablishments = [
  { id: '1', tradeName: 'Padaria do João', cnpj: '12.345.678/0001-90', whatsapp: '11999999999', manager: 'Carlos Gerente', kycStatus: 'approved', sales: 45780, commission: 6867, isActive: true },
  { id: '2', tradeName: 'Mercado Central', cnpj: '98.765.432/0001-10', whatsapp: '11988888888', manager: 'Carlos Gerente', kycStatus: 'approved', sales: 32450, commission: 4867, isActive: true },
  { id: '3', tradeName: 'Bar do Zé', cnpj: '45.678.912/0001-30', whatsapp: '11977777777', manager: 'Maria Silva', kycStatus: 'pending', sales: 12300, commission: 1845, isActive: false },
  { id: '4', tradeName: 'Loja ABC', cnpj: '78.912.345/0001-50', whatsapp: '11966666666', manager: '-', kycStatus: 'rejected', sales: 0, commission: 0, isActive: false },
];

export default function AdminEstablishments() {
  const [establishments, setEstablishments] = useState(mockEstablishments);
  const [viewingEstablishment, setViewingEstablishment] = useState<any>(null);

  const handleApproveKYC = (id: string) => {
    setEstablishments(prev => prev.map(e => e.id === id ? { ...e, kycStatus: 'approved', isActive: true } : e));
    toast({ title: 'KYC aprovado!', description: 'O estabelecimento foi aprovado com sucesso.' });
  };

  const handleRejectKYC = (id: string) => {
    setEstablishments(prev => prev.map(e => e.id === id ? { ...e, kycStatus: 'rejected', isActive: false } : e));
    toast({ title: 'KYC reprovado', description: 'O estabelecimento foi reprovado.' });
  };

  const handleToggleActive = (id: string) => {
    setEstablishments(prev => prev.map(e => e.id === id ? { ...e, isActive: !e.isActive } : e));
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const columns = [
    { key: 'tradeName', label: 'Nome Fantasia' },
    { key: 'cnpj', label: 'CNPJ' },
    { key: 'manager', label: 'Gerente' },
    { key: 'sales', label: 'Vendas', render: (e: any) => formatCurrency(e.sales) },
    { key: 'commission', label: 'Comissão', render: (e: any) => formatCurrency(e.commission) },
    { 
      key: 'kycStatus', 
      label: 'KYC', 
      render: (e: any) => (
        <Badge variant={e.kycStatus === 'approved' ? 'default' : e.kycStatus === 'pending' ? 'secondary' : 'destructive'}>
          {e.kycStatus === 'approved' ? 'Aprovado' : e.kycStatus === 'pending' ? 'Pendente' : 'Reprovado'}
        </Badge>
      )
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (e: any) => (
        <Badge variant={e.isActive ? 'default' : 'outline'}>{e.isActive ? 'Ativo' : 'Inativo'}</Badge>
      )
    },
    {
      key: 'actions',
      label: 'Ações',
      render: (e: any) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setViewingEstablishment(e)}>
            <Eye className="w-4 h-4" />
          </Button>
          {e.kycStatus === 'pending' && (
            <>
              <Button variant="ghost" size="sm" className="text-success" onClick={() => handleApproveKYC(e.id)}>
                <Check className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleRejectKYC(e.id)}>
                <X className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      )
    }
  ];

  return (
    <DashboardLayout userType="admin" userName="Administrador" notifications={5}>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Estabelecimentos</h2>
          <p className="text-muted-foreground">Gerencie os estabelecimentos da plataforma</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold text-foreground">{establishments.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Vendas Totais</p>
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(establishments.reduce((acc, e) => acc + e.sales, 0))}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Comissões Pagas</p>
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(establishments.reduce((acc, e) => acc + e.commission, 0))}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Estabelecimentos</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable data={establishments} columns={columns} />
          </CardContent>
        </Card>

        {/* View Dialog */}
        <Dialog open={!!viewingEstablishment} onOpenChange={() => setViewingEstablishment(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalhes do Estabelecimento</DialogTitle>
            </DialogHeader>
            {viewingEstablishment && (
              <div className="grid md:grid-cols-2 gap-4 py-4">
                <div>
                  <Label className="text-muted-foreground">Nome Fantasia</Label>
                  <p className="font-medium">{viewingEstablishment.tradeName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">CNPJ</Label>
                  <p className="font-medium">{viewingEstablishment.cnpj}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">WhatsApp</Label>
                  <p className="font-medium">{viewingEstablishment.whatsapp}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Gerente</Label>
                  <p className="font-medium">{viewingEstablishment.manager}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Vendas</Label>
                  <p className="font-medium text-primary">{formatCurrency(viewingEstablishment.sales)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Comissão</Label>
                  <p className="font-medium text-primary">{formatCurrency(viewingEstablishment.commission)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status KYC</Label>
                  <Badge variant={viewingEstablishment.kycStatus === 'approved' ? 'default' : viewingEstablishment.kycStatus === 'pending' ? 'secondary' : 'destructive'}>
                    {viewingEstablishment.kycStatus === 'approved' ? 'Aprovado' : viewingEstablishment.kycStatus === 'pending' ? 'Pendente' : 'Reprovado'}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Ativo</Label>
                  <Badge variant={viewingEstablishment.isActive ? 'default' : 'outline'}>
                    {viewingEstablishment.isActive ? 'Sim' : 'Não'}
                  </Badge>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewingEstablishment(null)}>Fechar</Button>
              {viewingEstablishment?.kycStatus === 'pending' && (
                <>
                  <Button variant="destructive" onClick={() => { handleRejectKYC(viewingEstablishment.id); setViewingEstablishment(null); }}>Reprovar</Button>
                  <Button variant="hero" onClick={() => { handleApproveKYC(viewingEstablishment.id); setViewingEstablishment(null); }}>Aprovar KYC</Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
