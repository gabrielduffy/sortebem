import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Save, User, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { apiService } from '@/services/api';

interface ProfileState {
  fullName: string;
  cpf: string;
  whatsapp: string;
  email: string;
  address: string;
  pixKeyType: string;
  pixKey: string;
  kycStatus: 'approved' | 'pending' | 'rejected';
  bankCode: string;
  agency: string;
  account: string;
  accountType: string;
  birthDate: string;
}

export default function ManagerProfile() {
  const [profile, setProfile] = useState<ProfileState>({
    fullName: 'Carlos Gerente', cpf: '123.456.789-00', whatsapp: '11999999999', email: 'carlos@email.com',
    address: 'Rua das Flores, 123 - Centro, São Paulo - SP',
    pixKeyType: 'cpf', pixKey: '12345678900', kycStatus: 'approved',
    bankCode: '', agency: '', account: '', accountType: 'CHECKING', birthDate: ''
  });

  const handleSave = async () => {
    try {
      const response = await apiService.updateAsaasData({
        bankCode: profile.bankCode,
        agency: profile.agency,
        account: profile.account,
        accountType: profile.accountType,
        pixKey: profile.pixKey,
        birthDate: profile.birthDate
      });

      if (response.ok) {
        toast({ title: 'Perfil atualizado!', description: 'Suas informações bancárias foram salvas.' });
      } else {
        toast({ title: 'Erro ao salvar', description: response.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Erro', description: 'Ocorreu um erro ao salvar os dados.', variant: 'destructive' });
    }
  };

  return (
    <DashboardLayout userType="manager" userName="Carlos Gerente" notifications={3}>
      <div className="space-y-6">
        <div><h2 className="text-2xl font-bold text-foreground">Meu Perfil</h2><p className="text-muted-foreground">Gerencie suas informações pessoais e financeiras</p></div>

        <Card className={profile.kycStatus === 'approved' ? 'border-success' : profile.kycStatus === 'pending' ? 'border-warning' : 'border-destructive'}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              {profile.kycStatus === 'approved' ? <CheckCircle className="w-8 h-8 text-success" /> : profile.kycStatus === 'pending' ? <Clock className="w-8 h-8 text-warning" /> : <AlertCircle className="w-8 h-8 text-destructive" />}
              <div>
                <h3 className="font-semibold">Status KYC: <Badge variant={profile.kycStatus === 'approved' ? 'default' : 'secondary'}>{profile.kycStatus === 'approved' ? 'Aprovado' : 'Pendente'}</Badge></h3>
                <p className="text-sm text-muted-foreground">{profile.kycStatus === 'approved' ? 'Seu cadastro está verificado.' : 'Aguardando análise dos documentos.'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><User className="w-5 h-5 text-primary" />Dados Pessoais</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Nome Completo *</Label><Input value={profile.fullName} onChange={(e) => setProfile({ ...profile, fullName: e.target.value })} /></div>
              <div><Label>CPF *</Label><Input value={profile.cpf} onChange={(e) => setProfile({ ...profile, cpf: e.target.value })} /></div>
              <div><Label>WhatsApp *</Label><Input value={profile.whatsapp} onChange={(e) => setProfile({ ...profile, whatsapp: e.target.value })} /></div>
              <div><Label>E-mail *</Label><Input type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} /></div>
              <div><Label>Endereço Completo *</Label><Input value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Dados Bancários (Para Saque via Asaas)</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Banco *</Label><Input placeholder="Cód: 001" value={profile.bankCode} onChange={(e) => setProfile({ ...profile, bankCode: e.target.value })} /></div>
                <div><Label>Tipo de Conta *</Label>
                  <Select value={profile.accountType} onValueChange={(v) => setProfile({ ...profile, accountType: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="CHECKING">Corrente</SelectItem><SelectItem value="SAVINGS">Poupança</SelectItem></SelectContent>
                  </Select>
                </div>
                <div><Label>Agência *</Label><Input placeholder="0001" value={profile.agency} onChange={(e) => setProfile({ ...profile, agency: e.target.value })} /></div>
                <div><Label>Conta e Dígito *</Label><Input placeholder="12345-6" value={profile.account} onChange={(e) => setProfile({ ...profile, account: e.target.value })} /></div>
              </div>

              <div className="border-t pt-4">
                <Label>Dados Extras para KYC</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div><Label>Chave Pix *</Label><Input value={profile.pixKey} onChange={(e) => setProfile({ ...profile, pixKey: e.target.value })} /></div>
                  <div><Label>Data de Nascimento *</Label><Input type="date" value={profile.birthDate} onChange={(e) => setProfile({ ...profile, birthDate: e.target.value })} /></div>
                </div>
              </div>

              <Button variant="hero" className="w-full" onClick={handleSave}><Save className="w-4 h-4" />Salvar Alterações</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
