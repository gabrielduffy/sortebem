import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { apiService } from '@/services/api';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function ManagerLogin() {
  const navigate = useNavigate();
  const { login, isAuthenticated, user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // Redirect if already authenticated as manager
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'manager') {
        navigate('/gerente');
      } else {
        setError('Acesso negado. Esta área é restrita a gerentes.');
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(formData.email, formData.password);

      if (result.ok) {
        // The useEffect will handle the redirect once user state updates
        toast({
          title: "Login realizado!",
          description: "Bem-vindo ao painel do gerente."
        });
      } else {
        setError(result.error || 'Credenciais inválidas. Tente novamente.');
      }
    } catch (err) {
      setError('Erro ao fazer login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetEmail) {
      toast({ title: 'E-mail obrigatório', description: 'Por favor, informe seu e-mail.', variant: 'destructive' });
      return;
    }

    try {
      setResetLoading(true);
      const response = await apiService.requestPasswordReset(resetEmail);
      if (response.ok) {
        toast({ title: 'Solicitação enviada!', description: 'Verifique seu e-mail.' });
        setIsResetModalOpen(false);
      } else {
        toast({ title: 'Erro', description: response.error || 'Erro ao solicitar recuperação.', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Erro', description: 'Ocorreu um erro inesperado.', variant: 'destructive' });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center">
            <img src="/logo.png" alt="SORTEBEM" className="h-12" />
          </Link>
        </div>
        <div className="bg-card rounded-2xl border border-border p-8 shadow-lg">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Painel do Gerente</h1>
            <p className="text-muted-foreground mt-2">Gerencie sua rede de estabelecimentos</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" placeholder="seu@email.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <Dialog open={isResetModalOpen} onOpenChange={setIsResetModalOpen}>
                  <DialogTrigger asChild>
                    <button type="button" className="text-sm font-medium text-primary hover:text-primary/80">
                      Esqueci minha senha
                    </button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Recuperar Senha</DialogTitle>
                      <DialogDescription>Informe seu e-mail para receber um link de recuperação.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>E-mail</Label>
                        <Input type="email" placeholder="seu@email.com" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsResetModalOpen(false)}>Cancelar</Button>
                      <Button onClick={handleResetPassword} disabled={resetLoading}>{resetLoading ? 'Enviando...' : 'Enviar Link'}</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="relative">
                <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</Button>
          </form>
        </div>
        <p className="text-center text-sm text-muted-foreground mt-6"><Link to="/" className="hover:text-primary">← Voltar para o site</Link></p>
      </div>
    </div>
  );
}
