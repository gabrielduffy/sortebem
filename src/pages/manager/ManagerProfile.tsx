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

export default function ManagerProfile() {
  const [profile, setProfile] = useState({
    fullName: 'Carlos Gerente', cpf: '123.456.789-00', whatsapp: '11999999999', email: 'carlos@email.com',
    address: 'Rua das Flores, 123 - Centro, São Paulo - SP',
    pixKeyType: 'cpf', pixKey: '12345678900', kycStatus: 'approved' as const
  });

  const handleSave = () => { toast({ title: 'Perfil atualizado!', description: 'Suas informações foram salvas.' }); };

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
              <div><Label>Nome Completo *</Label><Input value={profile.fullName} onChange={(e) => setProfile({...profile, fullName: e.target.value})} /></div>
              <div><Label>CPF *</Label><Input value={profile.cpf} onChange={(e) => setProfile({...profile, cpf: e.target.value})} /></div>
              <div><Label>WhatsApp *</Label><Input value={profile.whatsapp} onChange={(e) => setProfile({...profile, whatsapp: e.target.value})} /></div>
              <div><Label>E-mail *</Label><Input type="email" value={profile.email} onChange={(e) => setProfile({...profile, email: e.target.value})} /></div>
              <div><Label>Endereço Completo *</Label><Input value={profile.address} onChange={(e) => setProfile({...profile, address: e.target.value})} /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Dados Bancários / Pix</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Tipo de Chave Pix *</Label>
                <Select value={profile.pixKeyType} onValueChange={(v) => setProfile({...profile, pixKeyType: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="cpf">CPF</SelectItem><SelectItem value="cnpj">CNPJ</SelectItem><SelectItem value="phone">Celular</SelectItem><SelectItem value="email">E-mail</SelectItem><SelectItem value="random">Aleatória</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Chave Pix *</Label><Input value={profile.pixKey} onChange={(e) => setProfile({...profile, pixKey: e.target.value})} /></div>
              <Button variant="hero" className="w-full" onClick={handleSave}><Save className="w-4 h-4" />Salvar Alterações</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
