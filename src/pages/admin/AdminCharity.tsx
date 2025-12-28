import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Star, Heart, TrendingUp } from 'lucide-react';
import { apiService } from '@/services/api';

export default function AdminCharity() {
  const [charities, setCharities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCharity, setEditingCharity] = useState<any>(null);
  const [form, setForm] = useState({ name: '', description: '', logo: '' });

  useEffect(() => {
    fetchCharities();
  }, []);

  const fetchCharities = async () => {
    try {
      setLoading(true);
      const response = await apiService.getCharities();
      if (response.ok && response.charities) {
        setCharities(response.charities);
      }
    } catch (error) {
      console.error('Error loading charities:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as instituições.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.description) {
      toast({ title: 'Campos obrigatórios', description: 'Preencha todos os campos.', variant: 'destructive' });
      return;
    }

    try {
      setSaving(true);
      if (editingCharity) {
        const response = await apiService.updateCharity(editingCharity.id, {
          name: form.name,
          description: form.description,
          logo: form.logo
        });

        if (response.ok) {
          toast({ title: 'Instituição atualizada!', description: 'Os dados foram atualizados com sucesso.' });
          setIsDialogOpen(false);
          setEditingCharity(null);
          setForm({ name: '', description: '', logo: '' });
          fetchCharities();
        } else {
          toast({ title: 'Erro', description: response.error || 'Erro ao atualizar instituição.', variant: 'destructive' });
        }
      } else {
        const response = await apiService.createCharity({
          name: form.name,
          description: form.description,
          logo: form.logo
        });

        if (response.ok) {
          toast({ title: 'Instituição cadastrada!', description: 'A nova instituição foi cadastrada com sucesso.' });
          setIsDialogOpen(false);
          setForm({ name: '', description: '', logo: '' });
          fetchCharities();
        } else {
          toast({ title: 'Erro', description: response.error || 'Erro ao criar instituição.', variant: 'destructive' });
        }
      }
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível salvar a instituição.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleSetActive = async (id: number) => {
    try {
      const response = await apiService.setActiveCharity(id);
      if (response.ok) {
        toast({ title: 'Instituição do mês atualizada!', description: 'A instituição foi definida como ativa.' });
        fetchCharities();
      } else {
        toast({ title: 'Erro', description: response.error || 'Erro ao definir instituição ativa.', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível atualizar a instituição.', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await apiService.deleteCharity(id);
      if (response.ok) {
        toast({ title: 'Instituição removida', description: 'A instituição foi removida do sistema.' });
        fetchCharities();
      } else {
        toast({ title: 'Erro', description: response.error || 'Erro ao excluir instituição.', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível excluir a instituição.', variant: 'destructive' });
    }
  };

  const openEdit = (charity: any) => {
    setEditingCharity(charity);
    setForm({ name: charity.name, description: charity.description, logo: charity.logo });
    setIsDialogOpen(true);
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <DashboardLayout userType="admin" userName="Administrador" notifications={5}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Instituição do Mês</h2>
            <p className="text-muted-foreground">Gerencie as instituições beneficentes</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="hero" onClick={() => { setEditingCharity(null); setForm({ name: '', description: '', logo: '' }); }}>
                <Plus className="w-4 h-4" />
                Nova Instituição
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingCharity ? 'Editar Instituição' : 'Nova Instituição'}</DialogTitle>
                <DialogDescription>Preencha os dados da instituição beneficente</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>Nome da Instituição</Label>
                  <Input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Instituto..." />
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Textarea value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Descrição da causa..." />
                </div>
                <div>
                  <Label>URL do Logo</Label>
                  <Input value={form.logo} onChange={(e) => setForm(p => ({ ...p, logo: e.target.value }))} placeholder="https://..." />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button variant="hero" onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Heart className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Arrecadado (Mês)</p>
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(charities.find(c => c.is_active)?.total_raised || 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Histórico</p>
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(charities.reduce((acc, c) => acc + (c.total_raised || 0), 0))}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Star className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Instituições Cadastradas</p>
                  <p className="text-2xl font-bold text-foreground">{charities.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {charities.map(charity => (
              <Card key={charity.id} className={charity.is_active ? 'border-primary ring-2 ring-primary/20' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center overflow-hidden">
                        <img src={charity.logo} alt={charity.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{charity.name}</CardTitle>
                        {charity.is_active && <Badge className="mt-1">Ativa</Badge>}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{charity.description}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{charity.month}/{charity.year}</span>
                    <span className="font-semibold text-primary">{formatCurrency(charity.total_raised || 0)}</span>
                  </div>
                  <div className="flex gap-2">
                    {!charity.is_active && (
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => handleSetActive(charity.id)}>
                        <Star className="w-4 h-4" />
                        Definir Ativa
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => openEdit(charity)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(charity.id)}>
                      <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
