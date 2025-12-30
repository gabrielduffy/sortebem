import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Building2, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';
import { maskCNPJ, maskPhone } from '@/utils/masks';

export default function SejaParceiro() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const referralCode = searchParams.get('ref');

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [managerId, setManagerId] = useState<number | null>(null);
    const [managerName, setManagerName] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        cnpj: '',
        phone: '',
        email: '',
        password: '',
        confirmPassword: '',
        address: '',
        city: '',
        state: ''
    });

    useEffect(() => {
        if (referralCode) {
            validateReferral();
        }
    }, [referralCode]);

    const validateReferral = async () => {
        try {
            // We need a way to check if a referral code is valid and get manager name
            // For now, we'll try to find a manager with this code
            const { data, ok } = await apiService.getManagers();
            if (ok && data) {
                const manager = data.find((m: any) => m.referral_code === referralCode);
                if (manager) {
                    setManagerId(manager.id);
                    setManagerName(manager.name || manager.user?.name);
                } else {
                    toast({
                        title: 'Código inválido',
                        description: 'O código de indicação informado não é válido.',
                        variant: 'destructive'
                    });
                }
            }
        } catch (error) {
            console.error('Error validating referral:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            toast({ title: 'Senhas não conferem', description: 'As senhas digitadas são diferentes.', variant: 'destructive' });
            return;
        }

        try {
            setLoading(true);
            const response = await apiService.createEstablishment({
                name: formData.name,
                cnpj: formData.cnpj,
                phone: formData.phone,
                email: formData.email,
                password: formData.password,
                manager_id: managerId,
                address: formData.address,
                city: formData.city,
                state: formData.state
            });

            if (response.ok) {
                setSuccess(true);
                toast({ title: 'Cadastro realizado!', description: 'Seu estabelecimento foi cadastrado com sucesso.' });
            } else {
                toast({ title: 'Erro ao cadastrar', description: response.error || 'Ocorreu um erro inesperado.', variant: 'destructive' });
            }
        } catch (error) {
            toast({ title: 'Erro', description: 'Não foi possível realizar o cadastro.', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <Card className="max-w-md w-full text-center">
                    <CardHeader>
                        <div className="w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="w-10 h-10" />
                        </div>
                        <CardTitle className="text-2xl">Cadastro Concluído!</CardTitle>
                        <CardDescription>
                            Seu estabelecimento foi cadastrado com sucesso. Nossa equipe analisará seus dados em breve.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-muted-foreground">
                            Você já pode acessar o painel com seu e-mail e senha, mas algumas funções estarão limitadas até a aprovação do KYC.
                        </p>
                        <Button className="w-full" onClick={() => navigate('/estabelecimento/login')}>
                            Ir para o Login <ArrowRight className="ml-2 w-4 h-4" />
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background py-12 px-4">
            <div className="max-w-2xl mx-auto space-y-8">
                <div className="text-center">
                    <Link to="/" className="inline-block mb-6">
                        <img src="/logo.png" alt="SORTEBEM" className="h-10 mx-auto" />
                    </Link>
                    <h1 className="text-3xl font-bold text-foreground">Seja um Estabelecimento Parceiro</h1>
                    <p className="text-muted-foreground mt-2">Aumente seu faturamento e ajude instituições de caridade</p>

                    {managerName && (
                        <div className="mt-4 inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
                            <CheckCircle2 className="w-4 h-4" />
                            Indicado por: {managerName}
                        </div>
                    )}
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Dados do Estabelecimento</CardTitle>
                        <CardDescription>Preencha as informações abaixo para começar</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Nome Fantasia / Razão Social</Label>
                                    <Input required value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="Ex: Padaria do João" />
                                </div>
                                <div className="space-y-2">
                                    <Label>CNPJ</Label>
                                    <Input required value={formData.cnpj} onChange={e => setFormData(p => ({ ...p, cnpj: maskCNPJ(e.target.value) }))} maxLength={18} placeholder="00.000.000/0000-00" />
                                </div>
                                <div className="space-y-2">
                                    <Label>WhatsApp para Contato</Label>
                                    <Input required value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: maskPhone(e.target.value) }))} maxLength={15} placeholder="(00) 00000-0000" />
                                </div>
                                <div className="space-y-2">
                                    <Label>E-mail de Acesso</Label>
                                    <Input required type="email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} placeholder="adm@estabelecimento.com" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Senha</Label>
                                    <Input required type="password" value={formData.password} onChange={e => setFormData(p => ({ ...p, password: e.target.value }))} placeholder="••••••••" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Confirmar Senha</Label>
                                    <Input required type="password" value={formData.confirmPassword} onChange={e => setFormData(p => ({ ...p, confirmPassword: e.target.value }))} placeholder="••••••••" />
                                </div>
                            </div>

                            <div className="space-y-4 border-t pt-6">
                                <h3 className="font-semibold text-lg flex items-center gap-2">
                                    <Building2 className="w-5 h-5 text-primary" /> Endereço
                                </h3>
                                <div className="grid md:grid-cols-3 gap-4">
                                    <div className="md:col-span-3 space-y-2">
                                        <Label>Rua, Número e Bairro</Label>
                                        <Input required value={formData.address} onChange={e => setFormData(p => ({ ...p, address: e.target.value }))} placeholder="Rua das Flores, 123 - Centro" />
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <Label>Cidade</Label>
                                        <Input required value={formData.city} onChange={e => setFormData(p => ({ ...p, city: e.target.value }))} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Estado (UF)</Label>
                                        <Input required value={formData.state} onChange={e => setFormData(p => ({ ...p, state: e.target.value.toUpperCase() }))} maxLength={2} placeholder="SP" />
                                    </div>
                                </div>
                            </div>

                            <Button type="submit" className="w-full h-12 text-lg" disabled={loading}>
                                {loading ? 'Processando...' : 'Finalizar Cadastro'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <p className="text-center text-sm text-muted-foreground">
                    Já tem conta? <Link to="/estabelecimento/login" className="text-primary font-medium hover:underline">Faça login aqui</Link>
                </p>
            </div>
        </div>
    );
}
