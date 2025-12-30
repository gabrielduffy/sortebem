import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Building2, User, MapPin, Wallet, Phone, Mail, FileText, CheckCircle, ArrowRight } from 'lucide-react';
import { apiService } from '@/services/api';

export default function ManagerRegisterEstablishment() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [manager, setManager] = useState<any>(null);
  const [form, setForm] = useState({
    // Dados da empresa
    cnpj: '',
    companyName: '',
    tradeName: '',
    // Endereço
    cep: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    // Responsável legal
    legalRepName: '',
    legalRepCpf: '',
    // Contato
    whatsapp: '',
    email: '',
    // Dados bancários
    pixKeyType: '',
    pixKey: '',
  });

  useEffect(() => {
    apiService.getCurrentManager().then(res => {
      if (res.ok) setManager(res.data);
    });
  }, []);

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    // API call
    const response = await apiService.registerEstablishment(form);

    setIsSubmitting(false);

    if (response.ok) {
      toast({
        title: 'Estabelecimento cadastrado!',
        description: 'O estabelecimento foi enviado para análise de KYC.',
      });
      navigate('/gerente/rede');
    } else {
      toast({
        title: 'Erro no cadastro',
        description: response.error || 'Verifique os dados e tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const isStepValid = (stepNum: number) => {
    switch (stepNum) {
      case 1:
        return form.cnpj && form.companyName && form.tradeName;
      case 2:
        return form.cep && form.street && form.number && form.neighborhood && form.city && form.state;
      case 3:
        return form.legalRepName && form.legalRepCpf && form.whatsapp && form.email;
      case 4:
        return form.pixKeyType && form.pixKey;
      default:
        return false;
    }
  };

  return (
    <DashboardLayout userType="manager" userName={manager?.name || 'Gerente'} notifications={3}>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Cadastrar Estabelecimento</h2>
          <p className="text-muted-foreground">Adicione um novo estabelecimento à sua rede</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-between">
          {[
            { num: 1, label: 'Empresa', icon: Building2 },
            { num: 2, label: 'Endereço', icon: MapPin },
            { num: 3, label: 'Contato', icon: User },
            { num: 4, label: 'Financeiro', icon: Wallet },
          ].map((s, index) => (
            <div key={s.num} className="flex items-center">
              <div className={`flex flex-col items-center ${step >= s.num ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${step >= s.num ? 'border-primary bg-primary/10' : 'border-muted'}`}>
                  {step > s.num ? <CheckCircle className="w-5 h-5" /> : <s.icon className="w-5 h-5" />}
                </div>
                <span className="text-xs mt-1 hidden sm:block">{s.label}</span>
              </div>
              {index < 3 && <div className={`w-12 sm:w-24 h-0.5 mx-2 ${step > s.num ? 'bg-primary' : 'bg-muted'}`} />}
            </div>
          ))}
        </div>

        <Card>
          <CardContent className="pt-6">
            {/* Step 1: Dados da Empresa */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold">Dados da Empresa</h3>
                </div>
                <div>
                  <Label>CNPJ *</Label>
                  <Input placeholder="00.000.000/0000-00" value={form.cnpj} onChange={(e) => handleChange('cnpj', e.target.value)} />
                </div>
                <div>
                  <Label>Razão Social *</Label>
                  <Input placeholder="Nome da empresa conforme CNPJ" value={form.companyName} onChange={(e) => handleChange('companyName', e.target.value)} />
                </div>
                <div>
                  <Label>Nome Fantasia *</Label>
                  <Input placeholder="Como é conhecido" value={form.tradeName} onChange={(e) => handleChange('tradeName', e.target.value)} />
                </div>
              </div>
            )}

            {/* Step 2: Endereço */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold">Endereço</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>CEP *</Label>
                    <Input placeholder="00000-000" value={form.cep} onChange={(e) => handleChange('cep', e.target.value)} />
                  </div>
                  <div>
                    <Label>Estado *</Label>
                    <Select value={form.state} onValueChange={(v) => handleChange('state', v)}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SP">São Paulo</SelectItem>
                        <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                        <SelectItem value="MG">Minas Gerais</SelectItem>
                        <SelectItem value="BA">Bahia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Rua / Avenida *</Label>
                  <Input placeholder="Nome da rua" value={form.street} onChange={(e) => handleChange('street', e.target.value)} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Número *</Label>
                    <Input placeholder="123" value={form.number} onChange={(e) => handleChange('number', e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <Label>Complemento</Label>
                    <Input placeholder="Sala, andar..." value={form.complement} onChange={(e) => handleChange('complement', e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Bairro *</Label>
                    <Input placeholder="Bairro" value={form.neighborhood} onChange={(e) => handleChange('neighborhood', e.target.value)} />
                  </div>
                  <div>
                    <Label>Cidade *</Label>
                    <Input placeholder="Cidade" value={form.city} onChange={(e) => handleChange('city', e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Contato */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold">Responsável Legal e Contato</h3>
                </div>
                <div>
                  <Label>Nome do Responsável Legal *</Label>
                  <Input placeholder="Nome completo" value={form.legalRepName} onChange={(e) => handleChange('legalRepName', e.target.value)} />
                </div>
                <div>
                  <Label>CPF do Responsável *</Label>
                  <Input placeholder="000.000.000-00" value={form.legalRepCpf} onChange={(e) => handleChange('legalRepCpf', e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>WhatsApp *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input className="pl-10" placeholder="(11) 99999-9999" value={form.whatsapp} onChange={(e) => handleChange('whatsapp', e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <Label>E-mail *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input className="pl-10" type="email" placeholder="email@empresa.com" value={form.email} onChange={(e) => handleChange('email', e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Financeiro */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Wallet className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold">Dados Bancários / Pix</h3>
                </div>
                <div>
                  <Label>Tipo de Chave Pix *</Label>
                  <Select value={form.pixKeyType} onValueChange={(v) => handleChange('pixKeyType', v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cpf">CPF</SelectItem>
                      <SelectItem value="cnpj">CNPJ</SelectItem>
                      <SelectItem value="phone">Celular</SelectItem>
                      <SelectItem value="email">E-mail</SelectItem>
                      <SelectItem value="random">Chave Aleatória</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Chave Pix *</Label>
                  <Input placeholder="Digite a chave Pix" value={form.pixKey} onChange={(e) => handleChange('pixKey', e.target.value)} />
                </div>
                <div className="bg-muted rounded-xl p-4 mt-6">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    Resumo do Cadastro
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-muted-foreground">CNPJ:</span> {form.cnpj || '-'}</div>
                    <div><span className="text-muted-foreground">Nome Fantasia:</span> {form.tradeName || '-'}</div>
                    <div><span className="text-muted-foreground">Cidade:</span> {form.city || '-'}/{form.state || '-'}</div>
                    <div><span className="text-muted-foreground">Responsável:</span> {form.legalRepName || '-'}</div>
                    <div><span className="text-muted-foreground">WhatsApp:</span> {form.whatsapp || '-'}</div>
                    <div><span className="text-muted-foreground">E-mail:</span> {form.email || '-'}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8">
              <Button variant="outline" onClick={handleBack} disabled={step === 1}>
                Voltar
              </Button>
              {step < 4 ? (
                <Button variant="hero" onClick={handleNext} disabled={!isStepValid(step)}>
                  Próximo
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button variant="hero" onClick={handleSubmit} disabled={!isStepValid(step) || isSubmitting}>
                  {isSubmitting ? 'Cadastrando...' : 'Cadastrar Estabelecimento'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
