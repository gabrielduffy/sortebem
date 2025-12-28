import { useState } from 'react';
import { Save, Building2, User, MapPin, CreditCard, Shield } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { mockEstablishment } from '@/services/mockData';

export default function EstablishmentProfile() {
  const [formData, setFormData] = useState({
    cnpj: mockEstablishment.cnpj,
    companyName: mockEstablishment.companyName,
    tradeName: mockEstablishment.tradeName,
    address: mockEstablishment.address,
    legalRepName: mockEstablishment.legalRepName,
    legalRepCpf: mockEstablishment.legalRepCpf,
    whatsapp: mockEstablishment.whatsapp,
    email: mockEstablishment.email,
    pixKeyType: mockEstablishment.pixKeyType,
    pixKey: mockEstablishment.pixKey,
  });

  const handleSave = () => {
    toast({
      title: "Perfil atualizado!",
      description: "Suas informações foram salvas com sucesso.",
    });
  };

  return (
    <DashboardLayout userType="establishment" userName={mockEstablishment.tradeName} notifications={2}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Meu Perfil</h2>
          <p className="text-muted-foreground">Cadastro completo e compliance</p>
        </div>
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Salvar Alterações
        </Button>
      </div>

      {/* KYC Status Banner */}
      <div className={`rounded-xl p-4 mb-6 flex items-center gap-4 ${
        mockEstablishment.kycStatus === 'approved' 
          ? 'bg-green-500/10 border border-green-500/20' 
          : mockEstablishment.kycStatus === 'pending'
          ? 'bg-yellow-500/10 border border-yellow-500/20'
          : 'bg-red-500/10 border border-red-500/20'
      }`}>
        <Shield className={`h-8 w-8 ${
          mockEstablishment.kycStatus === 'approved' ? 'text-green-600' :
          mockEstablishment.kycStatus === 'pending' ? 'text-yellow-600' : 'text-red-600'
        }`} />
        <div className="flex-1">
          <p className="font-semibold text-foreground">
            Status KYC: {' '}
            <Badge variant={
              mockEstablishment.kycStatus === 'approved' ? 'default' :
              mockEstablishment.kycStatus === 'pending' ? 'secondary' : 'destructive'
            }>
              {mockEstablishment.kycStatus === 'approved' ? 'Aprovado' :
               mockEstablishment.kycStatus === 'pending' ? 'Em Análise' : 'Reprovado'}
            </Badge>
          </p>
          <p className="text-sm text-muted-foreground">
            {mockEstablishment.kycStatus === 'approved' 
              ? 'Seu estabelecimento está verificado e habilitado para vendas.'
              : 'Complete todas as informações para aprovação.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Info */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">Dados da Empresa</h3>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ *</Label>
              <Input
                id="cnpj"
                value={formData.cnpj}
                onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                placeholder="00.000.000/0000-00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyName">Razão Social *</Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tradeName">Nome Fantasia *</Label>
              <Input
                id="tradeName"
                value={formData.tradeName}
                onChange={(e) => setFormData({ ...formData, tradeName: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Legal Rep */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">Responsável Legal</h3>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="legalRepName">Nome Completo *</Label>
              <Input
                id="legalRepName"
                value={formData.legalRepName}
                onChange={(e) => setFormData({ ...formData, legalRepName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="legalRepCpf">CPF *</Label>
              <Input
                id="legalRepCpf"
                value={formData.legalRepCpf}
                onChange={(e) => setFormData({ ...formData, legalRepCpf: e.target.value })}
                placeholder="000.000.000-00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp *</Label>
              <Input
                id="whatsapp"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                placeholder="11999999999"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">Endereço</h3>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Endereço Completo *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Rua, número, bairro, cidade - UF"
              />
            </div>
          </div>
        </div>

        {/* Payment */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">Dados Bancários / PIX</h3>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pixKeyType">Tipo de Chave PIX *</Label>
              <Select 
                value={formData.pixKeyType}
                onValueChange={(value) => setFormData({ ...formData, pixKeyType: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cpf">CPF</SelectItem>
                  <SelectItem value="cnpj">CNPJ</SelectItem>
                  <SelectItem value="phone">Celular</SelectItem>
                  <SelectItem value="email">E-mail</SelectItem>
                  <SelectItem value="random">Chave Aleatória</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pixKey">Chave PIX *</Label>
              <Input
                id="pixKey"
                value={formData.pixKey}
                onChange={(e) => setFormData({ ...formData, pixKey: e.target.value })}
              />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
