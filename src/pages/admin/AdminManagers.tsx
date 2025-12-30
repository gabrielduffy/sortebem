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
import { Plus, Eye, Check, X, Users, Building2, Wallet, Pencil, Trash2 } from 'lucide-react';
import { apiService } from '@/services/api';
import { maskCPF, maskPhone } from '@/utils/masks';

const emptyManager = { id: 0, name: '', cpf: '', whatsapp: '', email: '', password: '', kyc_status: 'pending', establishments_count: 0, total_commission: 0 };

export default function AdminManagers() {
  const [managers, setManagers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [viewingManager, setViewingManager] = useState<any>(null);
  const [editingManager, setEditingManager] = useState<any>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [formData, setFormData] = useState(emptyManager);

  useEffect(() => {
    fetchManagers();
  }, []);

  const fetchManagers = async () => {
    try {
      setLoading(true);
      const response = await apiService.getManagers();
      if (response.ok && response.data) {
        setManagers(response.data);
      }
    } catch (error) {
      console.error('Error loading managers:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os gerentes.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveKYC = async (id: number) => {
    try {
      const response = await apiService.updateManagerKYC(id, 'approved');
      if (response.ok) {
        toast({ title: 'KYC aprovado!', description: 'O gerente foi aprovado com sucesso.' });
        fetchManagers();
      } else {
        toast({ title: 'Erro', description: response.error || 'Erro ao aprovar KYC.', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível aprovar KYC.', variant: 'destructive' });
    }
  };

  const handleRejectKYC = async (id: number) => {
    try {
      const response = await apiService.updateManagerKYC(id, 'rejected');
      if (response.ok) {
        toast({ title: 'KYC reprovado', description: 'O gerente foi reprovado.' });
        fetchManagers();
      } else {
        toast({ title: 'Erro', description: response.error || 'Erro ao reprovar KYC.', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível reprovar KYC.', variant: 'destructive' });
    }
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      toast({ title: 'Campos obrigatórios', description: 'Preencha todos os campos.', variant: 'destructive' });
      return;
    }

    try {
      setSaving(true);
      const response = await apiService.createManager({
        name: formData.name,
        cpf: formData.cpf,
        whatsapp: formData.whatsapp,
        email: formData.email,
        password: formData.password
      });

      if (response.ok) {
        toast({ title: 'Gerente criado!', description: 'O novo gerente foi cadastrado com sucesso.' });
        setIsCreateOpen(false);
        setFormData(emptyManager);
        fetchManagers();
      } else {
        toast({ title: 'Erro', description: response.error || 'Erro ao criar gerente.', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível criar o gerente.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!formData.name || !formData.email) {
      toast({ title: 'Campos obrigatórios', description: 'Preencha todos os campos.', variant: 'destructive' });
      return;
    }

    try {
      setSaving(true);
      const response = await apiService.updateManager(editingManager.id, {
        name: formData.name,
        email: formData.email,
        whatsapp: formData.whatsapp,
        cpf: formData.cpf
      });

      if (response.ok) {
        toast({ title: 'Gerente atualizado!', description: 'Os dados foram atualizados com sucesso.' });
        setEditingManager(null);
        setFormData(emptyManager);
        fetchManagers();
      } else {
        toast({ title: 'Erro', description: response.error || 'Erro ao atualizar gerente.', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível atualizar o gerente.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await apiService.deleteManager(id);
      if (response.ok) {
        toast({ title: 'Gerente excluído', description: 'O gerente foi removido do sistema.' });
        setDeleteConfirm(null);
        fetchManagers();
      } else {
        toast({ title: 'Erro', description: response.error || 'Erro ao excluir gerente.', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível excluir o gerente.', variant: 'destructive' });
    }
  };

  const openEdit = (manager: any) => {
    setFormData(manager);
    setEditingManager(manager);
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const columns = [
    { key: 'name', label: 'Nome Completo', render: (m: any) => m.name || m.user?.name || 'Sem nome' },
    { key: 'cpf', label: 'CPF', render: (m: any) => m.cpf || '-' },
    { key: 'whatsapp', label: 'WhatsApp', render: (m: any) => m.whatsapp || m.user?.whatsapp || '-' },
    { key: 'establishments_count', label: 'Estabelecimentos', render: (m: any) => m.establishments_count || 0 },
    { key: 'total_commission', label: 'Comissão Total', render: (m: any) => formatCurrency(m.total_commission || 0) },
    {
      key: 'kyc_status', label: 'KYC', render: (m: any) => (
        <Badge variant={m.kyc_status === 'approved' ? 'default' : m.kyc_status === 'pending' ? 'secondary' : 'destructive'}>
          {m.kyc_status === 'approved' ? 'Aprovado' : m.kyc_status === 'pending' ? 'Pendente' : 'Reprovado'}
        </Badge>
      )
    },
    {
      key: 'actions', label: 'Ações', render: (m: any) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => setViewingManager(m)}><Eye className="w-4 h-4" /></Button>
          <Button variant="ghost" size="sm" onClick={() => openEdit(m)}><Pencil className="w-4 h-4" /></Button>
          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDeleteConfirm(m.id)}><Trash2 className="w-4 h-4" /></Button>
          {m.kyc_status === 'pending' && (
            <>
              <Button variant="ghost" size="sm" className="text-success" onClick={() => handleApproveKYC(m.id)}><Check className="w-4 h-4" /></Button>
              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleRejectKYC(m.id)}><X className="w-4 h-4" /></Button>
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
          <div>
            <h2 className="text-2xl font-bold text-foreground">Gerentes</h2>
            <p className="text-muted-foreground">Gerencie os gerentes da plataforma</p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}><Plus className="w-4 h-4 mr-2" />Novo Gerente</Button>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Card><CardContent className="pt-6"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"><Users className="w-6 h-6 text-primary" /></div><div><p className="text-sm text-muted-foreground">Total de Gerentes</p><p className="text-2xl font-bold text-foreground">{managers.length}</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center"><Building2 className="w-6 h-6 text-success" /></div><div><p className="text-sm text-muted-foreground">Estabelecimentos na Rede</p><p className="text-2xl font-bold text-foreground">{managers.reduce((acc, m) => acc + (m.establishments_count || 0), 0)}</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"><Wallet className="w-6 h-6 text-primary" /></div><div><p className="text-sm text-muted-foreground">Comissões Pagas</p><p className="text-2xl font-bold text-foreground">{formatCurrency(managers.reduce((acc, m) => acc + (m.total_commission || 0), 0))}</p></div></div></CardContent></Card>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <Card><CardHeader><CardTitle>Lista de Gerentes</CardTitle></CardHeader><CardContent><DataTable data={managers} columns={columns} /></CardContent></Card>
        )}

        {/* Create Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Gerente</DialogTitle>
              <DialogDescription>Preencha os dados para cadastrar um novo gerente.</DialogDescription>
            </DialogHeader>
            <div className="grid md:grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label>Nome Completo</Label>
                <Input value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>CPF</Label>
                <Input value={formData.cpf} onChange={e => setFormData(p => ({ ...p, cpf: maskCPF(e.target.value) }))} maxLength={14} placeholder="000.000.000-00" />
              </div>
              <div className="space-y-2">
                <Label>WhatsApp</Label>
                <Input value={formData.whatsapp} onChange={e => setFormData(p => ({ ...p, whatsapp: maskPhone(e.target.value) }))} maxLength={15} placeholder="(00) 00000-0000" />
              </div>
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Senha</Label>
                <Input type="password" value={formData.password} onChange={e => setFormData(p => ({ ...p, password: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreate} disabled={saving}>{saving ? 'Criando...' : 'Criar Gerente'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={!!editingManager} onOpenChange={() => setEditingManager(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Gerente</DialogTitle>
            </DialogHeader>
            <div className="grid md:grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label>Nome Completo</Label>
                <Input value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>CPF</Label>
                <Input value={formData.cpf} onChange={e => setFormData(p => ({ ...p, cpf: maskCPF(e.target.value) }))} maxLength={14} />
              </div>
              <div className="space-y-2">
                <Label>WhatsApp</Label>
                <Input value={formData.whatsapp} onChange={e => setFormData(p => ({ ...p, whatsapp: maskPhone(e.target.value) }))} maxLength={15} />
              </div>
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingManager(null)}>Cancelar</Button>
              <Button onClick={handleEdit} disabled={saving}>{saving ? 'Salvando...' : 'Salvar Alterações'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Dialog */}
        <Dialog open={!!viewingManager} onOpenChange={() => setViewingManager(null)}>
          <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Detalhes do Gerente</DialogTitle></DialogHeader>
            {viewingManager && (
              <div className="grid md:grid-cols-2 gap-4 py-4">
                <div><Label className="text-muted-foreground">Nome Completo</Label><p className="font-medium">{viewingManager.name || viewingManager.user?.name || 'Sem nome'}</p></div>
                <div><Label className="text-muted-foreground">CPF</Label><p className="font-medium">{viewingManager.cpf || '-'}</p></div>
                <div><Label className="text-muted-foreground">WhatsApp</Label><p className="font-medium">{viewingManager.whatsapp || viewingManager.user?.whatsapp || '-'}</p></div>
                <div><Label className="text-muted-foreground">E-mail</Label><p className="font-medium">{viewingManager.email || viewingManager.user?.email || '-'}</p></div>
                <div><Label className="text-muted-foreground">Código de Indicação</Label><p className="font-medium text-primary">{viewingManager.referral_code || 'N/A'}</p></div>
                <div><Label className="text-muted-foreground">Status KYC</Label><Badge variant={viewingManager.kyc_status === 'approved' ? 'default' : viewingManager.kyc_status === 'pending' ? 'secondary' : 'destructive'}>{viewingManager.kyc_status === 'approved' ? 'Aprovado' : viewingManager.kyc_status === 'pending' ? 'Pendente' : 'Reprovado'}</Badge></div>
                <div><Label className="text-muted-foreground">Estabelecimentos</Label><p className="font-medium">{viewingManager.establishments_count || 0}</p></div>
                <div><Label className="text-muted-foreground">Comissão Total</Label><p className="font-medium text-primary">{formatCurrency(viewingManager.total_commission || 0)}</p></div>
              </div>
            )}
            <DialogFooter><Button variant="outline" onClick={() => setViewingManager(null)}>Fechar</Button>
              {viewingManager?.kyc_status === 'pending' && (<><Button variant="destructive" onClick={() => { handleRejectKYC(viewingManager.id); setViewingManager(null); }}>Reprovar</Button><Button onClick={() => { handleApproveKYC(viewingManager.id); setViewingManager(null); }}>Aprovar KYC</Button></>)}</DialogFooter></DialogContent>
        </Dialog>

        {/* Delete Confirm */}
        <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <DialogContent><DialogHeader><DialogTitle>Confirmar Exclusão</DialogTitle><DialogDescription>Tem certeza que deseja excluir este gerente? Esta ação não pode ser desfeita.</DialogDescription></DialogHeader>
            <DialogFooter><Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancelar</Button><Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>Excluir</Button></DialogFooter></DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
