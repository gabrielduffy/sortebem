import { useState } from 'react';
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

const mockCharities = [
  { id: '1', name: 'Instituto Criança Feliz', logo: '/placeholder.svg', description: 'Ajudando crianças em situação de vulnerabilidade', isActive: true, month: 12, year: 2024, totalRaised: 127845.50 },
  { id: '2', name: 'Casa dos Idosos', logo: '/placeholder.svg', description: 'Cuidando de nossos idosos com carinho', isActive: false, month: 11, year: 2024, totalRaised: 98234.00 },
  { id: '3', name: 'ONG Animais Felizes', logo: '/placeholder.svg', description: 'Resgatando e cuidando de animais abandonados', isActive: false, month: 10, year: 2024, totalRaised: 76543.25 },
];

export default function AdminCharity() {
  const [charities, setCharities] = useState(mockCharities);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCharity, setEditingCharity] = useState<any>(null);
  const [form, setForm] = useState({ name: '', description: '', logo: '' });

  const handleSave = () => {
    if (editingCharity) {
      setCharities(prev => prev.map(c => c.id === editingCharity.id ? { ...c, ...form } : c));
      toast({ title: 'Instituição atualizada!' });
    } else {
      const newCharity = { 
        id: Date.now().toString(), 
        ...form, 
        isActive: false, 
        month: new Date().getMonth() + 1, 
        year: new Date().getFullYear(),
        totalRaised: 0 
      };
      setCharities(prev => [...prev, newCharity]);
      toast({ title: 'Instituição cadastrada!' });
    }
    setIsDialogOpen(false);
    setEditingCharity(null);
    setForm({ name: '', description: '', logo: '' });
  };

  const handleSetActive = (id: string) => {
    setCharities(prev => prev.map(c => ({ ...c, isActive: c.id === id })));
    toast({ title: 'Instituição do mês atualizada!' });
  };

  const handleDelete = (id: string) => {
    setCharities(prev => prev.filter(c => c.id !== id));
    toast({ title: 'Instituição removida' });
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
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Instituto..." />
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descrição da causa..." />
                </div>
                <div>
                  <Label>URL do Logo</Label>
                  <Input value={form.logo} onChange={(e) => setForm({ ...form, logo: e.target.value })} placeholder="https://..." />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button variant="hero" onClick={handleSave}>Salvar</Button>
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
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(charities.find(c => c.isActive)?.totalRaised || 0)}</p>
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
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(charities.reduce((acc, c) => acc + c.totalRaised, 0))}</p>
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
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {charities.map(charity => (
            <Card key={charity.id} className={charity.isActive ? 'border-primary ring-2 ring-primary/20' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center overflow-hidden">
                      <img src={charity.logo} alt={charity.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{charity.name}</CardTitle>
                      {charity.isActive && <Badge className="mt-1">Ativa</Badge>}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{charity.description}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{charity.month}/{charity.year}</span>
                  <span className="font-semibold text-primary">{formatCurrency(charity.totalRaised)}</span>
                </div>
                <div className="flex gap-2">
                  {!charity.isActive && (
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
      </div>
    </DashboardLayout>
  );
}
