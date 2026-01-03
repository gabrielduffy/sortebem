import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DataTable } from '@/components/dashboard/DataTable';
import { toast } from '@/hooks/use-toast';
import { Plus, Eye, Check, X, Building2, ShoppingCart, Wallet, Pencil, Trash2 } from 'lucide-react';
import { apiService } from '@/services/api';
import { maskCNPJ, maskPhone } from '@/utils/masks';
import { LogoIconPicker, LogoDisplay } from '@/components/admin/LogoIconPicker';

const emptyEstablishment = {
  id: 0,
  name: '',
  cnpj: '',
  phone: '',
  email: '',
  password: '',
  manager_id: null,
  manager_name: '',
  kyc_status: 'pending',
  total_sales: 0,
  total_commission: 0,
  is_active: false,
  logo_url: ''
};

export default function AdminEstablishments() {
  const [establishments, setEstablishments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [viewingEstablishment, setViewingEstablishment] = useState<any>(null);
  const [editingEstablishment, setEditingEstablishment] = useState<any>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [formData, setFormData] = useState(emptyEstablishment);

  useEffect(() => {
    fetchEstablishments();
  }, []);

  const fetchEstablishments = async () => {
    try {
      setLoading(true);
      const response = await apiService.getEstablishments();
      console.log('Establishments response:', response);
      if (response.ok && response.data) {
        setEstablishments(response.data);
      }
    } catch (error) {
      console.error('Error loading establishments:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os estabelecimentos.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveKYC = async (id: number) => {
    try {
      const response = await apiService.updateEstablishmentKYC(id, 'approved');
      if (response.ok) {
        toast({ title: 'KYC aprovado!', description: 'O estabelecimento foi aprovado com sucesso.' });
        fetchEstablishments();
      } else {
        toast({ title: 'Erro', description: response.error || 'Erro ao aprovar KYC.', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível aprovar KYC.', variant: 'destructive' });
    }
  };

  const handleRejectKYC = async (id: number) => {
    try {
      const response = await apiService.updateEstablishmentKYC(id, 'rejected');
      if (response.ok) {
        toast({ title: 'KYC reprovado', description: 'O estabelecimento foi reprovado.' });
        fetchEstablishments();
      } else {
        toast({ title: 'Erro', description: response.error || 'Erro ao reprovar KYC.', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível reprovar KYC.', variant: 'destructive' });
    }
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.cnpj || !formData.email || !formData.password) {
      toast({ title: 'Campos obrigatórios', description: 'Preencha todos os campos.', variant: 'destructive' });
      return;
    }

    try {
      setSaving(true);
      const response = await apiService.createEstablishment({
        name: formData.name,
        cnpj: formData.cnpj,
        phone: formData.phone,
        email: formData.email,
        password: formData.password,
        manager_id: formData.manager_id,
        address: '',
        city: '',
        state: ''
      });

      if (response.ok) {
        toast({ title: 'Estabelecimento criado!', description: 'O novo estabelecimento foi cadastrado com sucesso.' });
        setIsCreateOpen(false);
        setFormData(emptyEstablishment);
        fetchEstablishments();
      } else {
        toast({ title: 'Erro', description: response.error || 'Erro ao criar estabelecimento.', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível criar o estabelecimento.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!formData.name || !formData.cnpj || !formData.email) {
      toast({ title: 'Campos obrigatórios', description: 'Preencha todos os campos.', variant: 'destructive' });
      return;
    }

    try {
      setSaving(true);
      const response = await apiService.updateEstablishment(editingEstablishment.id, {
        name: formData.name,
        cnpj: formData.cnpj,
        phone: formData.phone,
        email: formData.email
      });

      if (response.ok) {
        toast({ title: 'Estabelecimento atualizado!', description: 'Os dados foram atualizados com sucesso.' });
        setEditingEstablishment(null);
        setFormData(emptyEstablishment);
        fetchEstablishments();
      } else {
        toast({ title: 'Erro', description: response.error || 'Erro ao atualizar estabelecimento.', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível atualizar o estabelecimento.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await apiService.deleteEstablishment(id);
      if (response.ok) {
        toast({ title: 'Estabelecimento excluído', description: 'O estabelecimento foi removido do sistema.' });
        setDeleteConfirm(null);
        fetchEstablishments();
      } else {
        toast({ title: 'Erro', description: response.error || 'Erro ao excluir estabelecimento.', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível excluir o estabelecimento.', variant: 'destructive' });
    }
  };

  const openEdit = (est: any) => {
    setFormData(est);
    setEditingEstablishment(est);
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const columns = [
    { key: 'name', label: 'Nome Fantasia', render: (e: any) => e.name || 'Sem nome' },
    { key: 'cnpj', label: 'CNPJ', render: (e: any) => e.cnpj || '-' },
    { key: 'manager_name', label: 'Gerente', render: (e: any) => e.manager_name || (e.manager?.user?.name) || '-' },
    { key: 'total_sales', label: 'Vendas', render: (e: any) => formatCurrency(e.total_sales || 0) },
    { key: 'total_commission', label: 'Comissão', render: (e: any) => formatCurrency(e.total_commission || 0) },
    {
      key: 'kyc_status', label: 'KYC', render: (e: any) => (
        <Badge variant={e.kyc_status === 'approved' ? 'default' : e.kyc_status === 'pending' ? 'secondary' : 'destructive'}>
          {e.kyc_status === 'approved' ? 'Aprovado' : e.kyc_status === 'pending' ? 'Pendente' : 'Reprovado'}
        </Badge>
      )
    },
    { key: 'is_active', label: 'Status', render: (e: any) => <Badge variant={e.is_active ? 'default' : 'outline'}>{e.is_active ? 'Ativo' : 'Inativo'}</Badge> },
    {
      key: 'actions', label: 'Ações', render: (e: any) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => setViewingEstablishment(e)}><Eye className="w-4 h-4" /></Button>
          <Button variant="ghost" size="sm" onClick={() => openEdit(e)}><Pencil className="w-4 h-4" /></Button>
          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDeleteConfirm(e.id)}><Trash2 className="w-4 h-4" /></Button>
          {e.kyc_status === 'pending' && (
            <>
              <Button variant="ghost" size="sm" className="text-success" onClick={() => handleApproveKYC(e.id)}><Check className="w-4 h-4" /></Button>
              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleRejectKYC(e.id)}><X className="w-4 h-4" /></Button>
            </>
          )}
        </div>
      )
    }
  ];

  return (
    <DashboardLayout userType="admin" userName="Administrador" notifications={5}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div><h2 className="text-2xl font-bold text-foreground">Estabelecimentos</h2><p className="text-muted-foreground">Gerencie os estabelecimentos da plataforma</p></div>
          <Button onClick={() => setIsCreateOpen(true)}><Plus className="w-4 h-4 mr-2" />Novo Estabelecimento</Button>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Card><CardContent className="pt-6"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"><Building2 className="w-6 h-6 text-primary" /></div><div><p className="text-sm text-muted-foreground">Total</p><p className="text-2xl font-bold text-foreground">{establishments.length}</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center"><ShoppingCart className="w-6 h-6 text-success" /></div><div><p className="text-sm text-muted-foreground">Vendas Totais</p><p className="text-2xl font-bold text-foreground">{formatCurrency(establishments.reduce((acc, e) => acc + (e.total_sales || 0), 0))}</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"><Wallet className="w-6 h-6 text-primary" /></div><div><p className="text-sm text-muted-foreground">Comissões Pagas</p><p className="text-2xl font-bold text-foreground">{formatCurrency(establishments.reduce((acc, e) => acc + (e.total_commission || 0), 0))}</p></div></div></CardContent></Card>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <Card><CardHeader><CardTitle>Lista de Estabelecimentos</CardTitle></CardHeader><CardContent><DataTable data={establishments} columns={columns} /></CardContent></Card>
        )}

        {/* Create Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Estabelecimento</DialogTitle>
              <DialogDescription>Preencha os dados para cadastrar um novo estabelecimento.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <LogoIconPicker 
                value={formData.logo_url || ''} 
                onChange={(val) => setFormData(p => ({ ...p, logo_url: val }))} 
                label="Logomarca"
              />
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome Fantasia</Label>
                  <Input value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>CNPJ</Label>
                  <Input value={formData.cnpj} onChange={e => setFormData(p => ({ ...p, cnpj: maskCNPJ(e.target.value) }))} maxLength={18} placeholder="00.000.000/0000-00" />
                </div>
                <div className="space-y-2">
                  <Label>WhatsApp</Label>
                  <Input value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: maskPhone(e.target.value) }))} maxLength={15} placeholder="(00) 00000-0000" />
                </div>
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input type="email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Senha</Label>
                  <Input type="password" value={formData.password} onChange={e => setFormData(p => ({ ...p, password: e.target.value }))} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreate} disabled={saving}>{saving ? 'Criando...' : 'Criar Estabelecimento'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={!!editingEstablishment} onOpenChange={() => setEditingEstablishment(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Estabelecimento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <LogoIconPicker 
                value={formData.logo_url || ''} 
                onChange={(val) => setFormData(p => ({ ...p, logo_url: val }))} 
                label="Logomarca"
              />
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome Fantasia</Label>
                  <Input value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>CNPJ</Label>
                  <Input value={formData.cnpj} onChange={e => setFormData(p => ({ ...p, cnpj: maskCNPJ(e.target.value) }))} maxLength={18} />
                </div>
                <div className="space-y-2">
                  <Label>WhatsApp</Label>
                  <Input value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: maskPhone(e.target.value) }))} maxLength={15} />
                </div>
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input type="email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingEstablishment(null)}>Cancelar</Button>
              <Button onClick={handleEdit} disabled={saving}>{saving ? 'Salvando...' : 'Salvar Alterações'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Dialog */}
        <Dialog open={!!viewingEstablishment} onOpenChange={() => setViewingEstablishment(null)}>
          <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Detalhes do Estabelecimento</DialogTitle></DialogHeader>
            {viewingEstablishment && (
              <div className="space-y-6 py-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div><Label className="text-muted-foreground">Nome Fantasia</Label><p className="font-medium">{viewingEstablishment.name || 'Sem nome'}</p></div>
                  <div><Label className="text-muted-foreground">CNPJ</Label><p className="font-medium">{viewingEstablishment.cnpj || '-'}</p></div>
                  <div><Label className="text-muted-foreground">WhatsApp</Label><p className="font-medium">{viewingEstablishment.phone || '-'}</p></div>
                  <div><Label className="text-muted-foreground">E-mail</Label><p className="font-medium">{viewingEstablishment.user?.email || viewingEstablishment.email || '-'}</p></div>
                  <div><Label className="text-muted-foreground">Gerente</Label><p className="font-medium">{viewingEstablishment.manager_name || viewingEstablishment.manager?.user?.name || '-'}</p></div>
                  <div><Label className="text-muted-foreground">Vendas</Label><p className="font-medium text-primary">{formatCurrency(viewingEstablishment.total_sales || 0)}</p></div>
                  <div><Label className="text-muted-foreground">Comissão</Label><p className="font-medium text-primary">{formatCurrency(viewingEstablishment.total_commission || 0)}</p></div>
                  <div><Label className="text-muted-foreground">Status KYC</Label><Badge variant={viewingEstablishment.kyc_status === 'approved' ? 'default' : viewingEstablishment.kyc_status === 'pending' ? 'secondary' : 'destructive'}>{viewingEstablishment.kyc_status === 'approved' ? 'Aprovado' : viewingEstablishment.kyc_status === 'pending' ? 'Pendente' : 'Reprovado'}</Badge></div>
                  <div><Label className="text-muted-foreground">Ativo</Label><Badge variant={viewingEstablishment.is_active ? 'default' : 'outline'}>{viewingEstablishment.is_active ? 'Sim' : 'Não'}</Badge></div>
                </div>

                <div className="border-t pt-4 space-y-3">
                  <h3 className="font-semibold text-foreground">Links Únicos</h3>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Link da TV (Código de 8 dígitos)</Label>
                    <div className="flex gap-2">
                      <Input
                        readOnly
                        value={`${window.location.origin}/tv/${viewingEstablishment.code || viewingEstablishment.slug || viewingEstablishment.id}`}
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const link = `${window.location.origin}/tv/${viewingEstablishment.code || viewingEstablishment.slug || viewingEstablishment.id}`;
                          navigator.clipboard.writeText(link);
                          toast({ title: 'Link da TV copiado!' });
                        }}
                      >
                        Copiar
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Link de Vendas (Código de 8 dígitos)</Label>
                    <div className="flex gap-2">
                      <Input
                        readOnly
                        value={`${window.location.origin}/est/${viewingEstablishment.code || viewingEstablishment.id}`}
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const link = `${window.location.origin}/est/${viewingEstablishment.code || viewingEstablishment.id}`;
                          navigator.clipboard.writeText(link);
                          toast({ title: 'Link de vendas copiado!' });
                        }}
                      >
                        Copiar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter><Button variant="outline" onClick={() => setViewingEstablishment(null)}>Fechar</Button>
              {viewingEstablishment?.kyc_status === 'pending' && (<><Button variant="destructive" onClick={() => { handleRejectKYC(viewingEstablishment.id); setViewingEstablishment(null); }}>Reprovar</Button><Button onClick={() => { handleApproveKYC(viewingEstablishment.id); setViewingEstablishment(null); }}>Aprovar KYC</Button></>)}</DialogFooter></DialogContent>
        </Dialog>

        {/* Delete Confirm */}
        <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <DialogContent><DialogHeader><DialogTitle>Confirmar Exclusão</DialogTitle><DialogDescription>Tem certeza que deseja excluir este estabelecimento? Esta ação não pode ser desfeita.</DialogDescription></DialogHeader>
            <DialogFooter><Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancelar</Button><Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>Excluir</Button></DialogFooter></DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
