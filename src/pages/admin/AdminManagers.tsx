import { useState } from 'react';
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

const initialManagers = [
  { id: '1', fullName: 'Carlos Gerente', cpf: '123.456.789-00', whatsapp: '11999999999', email: 'carlos@email.com', kycStatus: 'approved', establishments: 12, commission: 7289, referralCode: 'MGR001' },
  { id: '2', fullName: 'Maria Silva', cpf: '987.654.321-00', whatsapp: '11988888888', email: 'maria@email.com', kycStatus: 'pending', establishments: 5, commission: 3450, referralCode: 'MGR002' },
  { id: '3', fullName: 'João Santos', cpf: '456.789.123-00', whatsapp: '11977777777', email: 'joao@email.com', kycStatus: 'rejected', establishments: 0, commission: 0, referralCode: 'MGR003' },
];

const emptyManager = { id: '', fullName: '', cpf: '', whatsapp: '', email: '', kycStatus: 'pending', establishments: 0, commission: 0, referralCode: '' };

export default function AdminManagers() {
  const [managers, setManagers] = useState(initialManagers);
  const [viewingManager, setViewingManager] = useState<any>(null);
  const [editingManager, setEditingManager] = useState<any>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState(emptyManager);

  const handleApproveKYC = (id: string) => {
    setManagers(prev => prev.map(m => m.id === id ? { ...m, kycStatus: 'approved' } : m));
    toast({ title: 'KYC aprovado!', description: 'O gerente foi aprovado com sucesso.' });
  };

  const handleRejectKYC = (id: string) => {
    setManagers(prev => prev.map(m => m.id === id ? { ...m, kycStatus: 'rejected' } : m));
    toast({ title: 'KYC reprovado', description: 'O gerente foi reprovado.' });
  };

  const handleCreate = () => {
    const newManager = { ...formData, id: `${Date.now()}`, referralCode: `MGR${Date.now().toString().slice(-4)}` };
    setManagers(prev => [...prev, newManager]);
    setIsCreateOpen(false);
    setFormData(emptyManager);
    toast({ title: 'Gerente criado!', description: 'O novo gerente foi cadastrado com sucesso.' });
  };

  const handleEdit = () => {
    setManagers(prev => prev.map(m => m.id === editingManager.id ? { ...editingManager, ...formData } : m));
    setEditingManager(null);
    setFormData(emptyManager);
    toast({ title: 'Gerente atualizado!', description: 'Os dados foram atualizados com sucesso.' });
  };

  const handleDelete = (id: string) => {
    setManagers(prev => prev.filter(m => m.id !== id));
    setDeleteConfirm(null);
    toast({ title: 'Gerente excluído', description: 'O gerente foi removido do sistema.' });
  };

  const openEdit = (manager: any) => {
    setFormData(manager);
    setEditingManager(manager);
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const columns = [
    { key: 'fullName', label: 'Nome Completo' },
    { key: 'cpf', label: 'CPF' },
    { key: 'whatsapp', label: 'WhatsApp' },
    { key: 'establishments', label: 'Estabelecimentos' },
    { key: 'commission', label: 'Comissão Total', render: (m: any) => formatCurrency(m.commission) },
    { key: 'kycStatus', label: 'KYC', render: (m: any) => (
      <Badge variant={m.kycStatus === 'approved' ? 'default' : m.kycStatus === 'pending' ? 'secondary' : 'destructive'}>
        {m.kycStatus === 'approved' ? 'Aprovado' : m.kycStatus === 'pending' ? 'Pendente' : 'Reprovado'}
      </Badge>
    )},
    { key: 'actions', label: 'Ações', render: (m: any) => (
      <div className="flex gap-1">
        <Button variant="ghost" size="sm" onClick={() => setViewingManager(m)}><Eye className="w-4 h-4" /></Button>
        <Button variant="ghost" size="sm" onClick={() => openEdit(m)}><Pencil className="w-4 h-4" /></Button>
        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDeleteConfirm(m.id)}><Trash2 className="w-4 h-4" /></Button>
        {m.kycStatus === 'pending' && (
          <>
            <Button variant="ghost" size="sm" className="text-success" onClick={() => handleApproveKYC(m.id)}><Check className="w-4 h-4" /></Button>
            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleRejectKYC(m.id)}><X className="w-4 h-4" /></Button>
          </>
        )}
      </div>
    )}
  ];

  const ManagerForm = ({ onSubmit, submitLabel }: { onSubmit: () => void; submitLabel: string }) => (
    <div className="grid md:grid-cols-2 gap-4 py-4">
      <div className="space-y-2">
        <Label>Nome Completo</Label>
        <Input value={formData.fullName} onChange={e => setFormData(p => ({ ...p, fullName: e.target.value }))} />
      </div>
      <div className="space-y-2">
        <Label>CPF</Label>
        <Input value={formData.cpf} onChange={e => setFormData(p => ({ ...p, cpf: e.target.value }))} />
      </div>
      <div className="space-y-2">
        <Label>WhatsApp</Label>
        <Input value={formData.whatsapp} onChange={e => setFormData(p => ({ ...p, whatsapp: e.target.value }))} />
      </div>
      <div className="space-y-2">
        <Label>E-mail</Label>
        <Input value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} />
      </div>
    </div>
  );

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
          <Card><CardContent className="pt-6"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center"><Building2 className="w-6 h-6 text-success" /></div><div><p className="text-sm text-muted-foreground">Estabelecimentos na Rede</p><p className="text-2xl font-bold text-foreground">{managers.reduce((acc, m) => acc + m.establishments, 0)}</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"><Wallet className="w-6 h-6 text-primary" /></div><div><p className="text-sm text-muted-foreground">Comissões Pagas</p><p className="text-2xl font-bold text-foreground">{formatCurrency(managers.reduce((acc, m) => acc + m.commission, 0))}</p></div></div></CardContent></Card>
        </div>

        <Card><CardHeader><CardTitle>Lista de Gerentes</CardTitle></CardHeader><CardContent><DataTable data={managers} columns={columns} /></CardContent></Card>

        {/* Create Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent><DialogHeader><DialogTitle>Novo Gerente</DialogTitle><DialogDescription>Preencha os dados para cadastrar um novo gerente.</DialogDescription></DialogHeader>
          <ManagerForm onSubmit={handleCreate} submitLabel="Criar" />
          <DialogFooter><Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button><Button onClick={handleCreate}>Criar Gerente</Button></DialogFooter></DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={!!editingManager} onOpenChange={() => setEditingManager(null)}>
          <DialogContent><DialogHeader><DialogTitle>Editar Gerente</DialogTitle></DialogHeader>
          <ManagerForm onSubmit={handleEdit} submitLabel="Salvar" />
          <DialogFooter><Button variant="outline" onClick={() => setEditingManager(null)}>Cancelar</Button><Button onClick={handleEdit}>Salvar Alterações</Button></DialogFooter></DialogContent>
        </Dialog>

        {/* View Dialog */}
        <Dialog open={!!viewingManager} onOpenChange={() => setViewingManager(null)}>
          <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Detalhes do Gerente</DialogTitle></DialogHeader>
          {viewingManager && (
            <div className="grid md:grid-cols-2 gap-4 py-4">
              <div><Label className="text-muted-foreground">Nome Completo</Label><p className="font-medium">{viewingManager.fullName}</p></div>
              <div><Label className="text-muted-foreground">CPF</Label><p className="font-medium">{viewingManager.cpf}</p></div>
              <div><Label className="text-muted-foreground">WhatsApp</Label><p className="font-medium">{viewingManager.whatsapp}</p></div>
              <div><Label className="text-muted-foreground">E-mail</Label><p className="font-medium">{viewingManager.email}</p></div>
              <div><Label className="text-muted-foreground">Código de Indicação</Label><p className="font-medium text-primary">{viewingManager.referralCode}</p></div>
              <div><Label className="text-muted-foreground">Status KYC</Label><Badge variant={viewingManager.kycStatus === 'approved' ? 'default' : viewingManager.kycStatus === 'pending' ? 'secondary' : 'destructive'}>{viewingManager.kycStatus === 'approved' ? 'Aprovado' : viewingManager.kycStatus === 'pending' ? 'Pendente' : 'Reprovado'}</Badge></div>
              <div><Label className="text-muted-foreground">Estabelecimentos</Label><p className="font-medium">{viewingManager.establishments}</p></div>
              <div><Label className="text-muted-foreground">Comissão Total</Label><p className="font-medium text-primary">{formatCurrency(viewingManager.commission)}</p></div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setViewingManager(null)}>Fechar</Button>
          {viewingManager?.kycStatus === 'pending' && (<><Button variant="destructive" onClick={() => { handleRejectKYC(viewingManager.id); setViewingManager(null); }}>Reprovar</Button><Button onClick={() => { handleApproveKYC(viewingManager.id); setViewingManager(null); }}>Aprovar KYC</Button></>)}</DialogFooter></DialogContent>
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
