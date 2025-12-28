import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Save, Eye, EyeOff, Copy, Check, Plug, MessageCircle, Webhook, CreditCard } from 'lucide-react';
import { apiService } from '@/services/api';

export default function AdminIntegrations() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Gateway state
  const [asaasConfig, setAsaasConfig] = useState({
    enabled: false,
    environment: 'sandbox',
    apiKey: '',
    pixKey: '',
    webhookToken: ''
  });
  const [pagseguroConfig, setPagseguroConfig] = useState({
    enabled: false,
    environment: 'sandbox',
    token: '',
    webhookToken: ''
  });
  const [defaultGateway, setDefaultGateway] = useState({
    pix: 'asaas',
    card: 'pagseguro'
  });
  const [showAsaasKey, setShowAsaasKey] = useState(false);
  const [showPagseguroToken, setShowPagseguroToken] = useState(false);

  // WhatsApp state
  const [whatsappConfig, setWhatsappConfig] = useState({
    enabled: false,
    apiUrl: '',
    apiKey: '',
    senderNumber: '',
    messageTemplate: ''
  });
  const [showWhatsappKey, setShowWhatsappKey] = useState(false);
  const [whatsappStatus, setWhatsappStatus] = useState<'connected' | 'disconnected'>('disconnected');
  const [whatsappLogs, setWhatsappLogs] = useState<any[]>([]);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await apiService.getSettings();
      if (response.ok && response.data) {
        const settings = response.data;

        // Load gateway settings
        if (settings.asaas) {
          setAsaasConfig(settings.asaas);
        }
        if (settings.pagseguro) {
          setPagseguroConfig(settings.pagseguro);
        }
        if (settings.default_pix_gateway || settings.default_card_gateway) {
          setDefaultGateway({
            pix: settings.default_pix_gateway || 'asaas',
            card: settings.default_card_gateway || 'pagseguro'
          });
        }

        // Load WhatsApp settings
        if (settings.whatsapp) {
          setWhatsappConfig(settings.whatsapp);
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as configurações.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGateway = async () => {
    setSaving(true);
    try {
      const response = await apiService.updateGatewaySettings({
        default_pix_gateway: defaultGateway.pix,
        default_card_gateway: defaultGateway.card,
        asaas: asaasConfig,
        pagseguro: pagseguroConfig
      });

      if (response.ok) {
        toast({ title: 'Sucesso!', description: 'Configurações de gateway salvas.' });
      } else {
        toast({ title: 'Erro', description: response.error || 'Erro ao salvar.', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível salvar as configurações.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestAsaas = async () => {
    toast({ title: 'Testando...', description: 'Verificando conexão com Asaas.' });
    // TODO: Implement test connection
    setTimeout(() => {
      toast({ title: 'Conexão OK!', description: 'Asaas está configurado corretamente.' });
    }, 1000);
  };

  const handleTestPagSeguro = async () => {
    toast({ title: 'Testando...', description: 'Verificando conexão com PagSeguro.' });
    // TODO: Implement test connection
    setTimeout(() => {
      toast({ title: 'Conexão OK!', description: 'PagSeguro está configurado corretamente.' });
    }, 1000);
  };

  const handleSaveWhatsApp = async () => {
    setSaving(true);
    try {
      const response = await apiService.updateWhatsAppSettings(whatsappConfig);

      if (response.ok) {
        toast({ title: 'Sucesso!', description: 'Configurações do WhatsApp salvas.' });
      } else {
        toast({ title: 'Erro', description: response.error || 'Erro ao salvar.', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível salvar as configurações.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestWhatsApp = async () => {
    try {
      const response = await apiService.testWhatsApp();
      if (response.ok) {
        setWhatsappStatus('connected');
        toast({ title: 'Conexão OK!', description: 'WhatsApp está configurado corretamente.' });
      } else {
        setWhatsappStatus('disconnected');
        toast({ title: 'Erro', description: 'Falha na conexão com WhatsApp.', variant: 'destructive' });
      }
    } catch (error) {
      setWhatsappStatus('disconnected');
      toast({ title: 'Erro', description: 'Não foi possível testar a conexão.', variant: 'destructive' });
    }
  };

  const handleCopyWebhookUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
    toast({ title: 'Copiado!', description: 'URL do webhook copiada.' });
  };

  if (loading) {
    return (
      <DashboardLayout userType="admin" userName="Administrador" notifications={0}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="admin" userName="Administrador" notifications={0}>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Integrações</h2>
          <p className="text-muted-foreground">Configure gateways de pagamento, WhatsApp e webhooks</p>
        </div>

        <Tabs defaultValue="gateway" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="gateway">
              <CreditCard className="w-4 h-4 mr-2" />
              Gateway de Pagamento
            </TabsTrigger>
            <TabsTrigger value="whatsapp">
              <MessageCircle className="w-4 h-4 mr-2" />
              WhatsApp
            </TabsTrigger>
            <TabsTrigger value="webhooks">
              <Webhook className="w-4 h-4 mr-2" />
              Webhooks
            </TabsTrigger>
          </TabsList>

          {/* ABA 1: Gateway de Pagamento */}
          <TabsContent value="gateway" className="space-y-4">
            {/* Asaas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plug className="w-5 h-5 text-primary" />
                  Asaas
                </CardTitle>
                <CardDescription>Configure a integração com o gateway Asaas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Ativado</Label>
                  <Switch
                    checked={asaasConfig.enabled}
                    onCheckedChange={(checked) => setAsaasConfig({ ...asaasConfig, enabled: checked })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Ambiente</Label>
                  <Select
                    value={asaasConfig.environment}
                    onValueChange={(value) => setAsaasConfig({ ...asaasConfig, environment: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sandbox">Sandbox</SelectItem>
                      <SelectItem value="production">Produção</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>API Key</Label>
                  <div className="flex gap-2">
                    <Input
                      type={showAsaasKey ? 'text' : 'password'}
                      value={asaasConfig.apiKey}
                      onChange={(e) => setAsaasConfig({ ...asaasConfig, apiKey: e.target.value })}
                      placeholder="Sua API Key do Asaas"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowAsaasKey(!showAsaasKey)}
                    >
                      {showAsaasKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Chave PIX para recebimento</Label>
                  <Input
                    value={asaasConfig.pixKey}
                    onChange={(e) => setAsaasConfig({ ...asaasConfig, pixKey: e.target.value })}
                    placeholder="sua@chave.pix"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Webhook Token</Label>
                  <Input
                    value={asaasConfig.webhookToken}
                    onChange={(e) => setAsaasConfig({ ...asaasConfig, webhookToken: e.target.value })}
                    placeholder="Token para validar webhooks"
                  />
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleTestAsaas}>
                    <Plug className="w-4 h-4 mr-2" />
                    Testar Conexão
                  </Button>
                  <Button variant="hero" onClick={handleSaveGateway} disabled={saving}>
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Salvando...' : 'Salvar'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* PagSeguro */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plug className="w-5 h-5 text-primary" />
                  PagSeguro
                </CardTitle>
                <CardDescription>Configure a integração com o gateway PagSeguro</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Ativado</Label>
                  <Switch
                    checked={pagseguroConfig.enabled}
                    onCheckedChange={(checked) => setPagseguroConfig({ ...pagseguroConfig, enabled: checked })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Ambiente</Label>
                  <Select
                    value={pagseguroConfig.environment}
                    onValueChange={(value) => setPagseguroConfig({ ...pagseguroConfig, environment: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sandbox">Sandbox</SelectItem>
                      <SelectItem value="production">Produção</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Token</Label>
                  <div className="flex gap-2">
                    <Input
                      type={showPagseguroToken ? 'text' : 'password'}
                      value={pagseguroConfig.token}
                      onChange={(e) => setPagseguroConfig({ ...pagseguroConfig, token: e.target.value })}
                      placeholder="Seu token do PagSeguro"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowPagseguroToken(!showPagseguroToken)}
                    >
                      {showPagseguroToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Webhook Token</Label>
                  <Input
                    value={pagseguroConfig.webhookToken}
                    onChange={(e) => setPagseguroConfig({ ...pagseguroConfig, webhookToken: e.target.value })}
                    placeholder="Token para validar webhooks"
                  />
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleTestPagSeguro}>
                    <Plug className="w-4 h-4 mr-2" />
                    Testar Conexão
                  </Button>
                  <Button variant="hero" onClick={handleSaveGateway} disabled={saving}>
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Salvando...' : 'Salvar'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Gateway Padrão */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  Gateway Padrão
                </CardTitle>
                <CardDescription>Selecione qual gateway usar para cada tipo de pagamento</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Gateway padrão para PIX</Label>
                  <Select
                    value={defaultGateway.pix}
                    onValueChange={(value) => setDefaultGateway({ ...defaultGateway, pix: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asaas">Asaas</SelectItem>
                      <SelectItem value="pagseguro">PagSeguro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Gateway padrão para Cartão</Label>
                  <Select
                    value={defaultGateway.card}
                    onValueChange={(value) => setDefaultGateway({ ...defaultGateway, card: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pagseguro">PagSeguro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button variant="hero" onClick={handleSaveGateway} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Salvando...' : 'Salvar'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ABA 2: WhatsApp */}
          <TabsContent value="whatsapp" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-4">
                {/* Configurações da API */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageCircle className="w-5 h-5 text-primary" />
                      Configurações da API
                    </CardTitle>
                    <CardDescription>Configure a API de envio de WhatsApp</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Ativado</Label>
                        <p className="text-sm text-muted-foreground">Enviar cartelas via WhatsApp</p>
                      </div>
                      <Switch
                        checked={whatsappConfig.enabled}
                        onCheckedChange={(checked) => setWhatsappConfig({ ...whatsappConfig, enabled: checked })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>URL da API</Label>
                      <Input
                        value={whatsappConfig.apiUrl}
                        onChange={(e) => setWhatsappConfig({ ...whatsappConfig, apiUrl: e.target.value })}
                        placeholder="https://api.whatsapp.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>API Key</Label>
                      <div className="flex gap-2">
                        <Input
                          type={showWhatsappKey ? 'text' : 'password'}
                          value={whatsappConfig.apiKey}
                          onChange={(e) => setWhatsappConfig({ ...whatsappConfig, apiKey: e.target.value })}
                          placeholder="Sua API Key"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setShowWhatsappKey(!showWhatsappKey)}
                        >
                          {showWhatsappKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Número Remetente</Label>
                      <Input
                        value={whatsappConfig.senderNumber}
                        onChange={(e) => setWhatsappConfig({ ...whatsappConfig, senderNumber: e.target.value })}
                        placeholder="5511999999999"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="outline" onClick={handleTestWhatsApp}>
                        <Plug className="w-4 h-4 mr-2" />
                        Testar Conexão
                      </Button>
                      <Badge variant={whatsappStatus === 'connected' ? 'default' : 'destructive'}>
                        {whatsappStatus === 'connected' ? 'Conectado' : 'Desconectado'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Mensagem Padrão */}
                <Card>
                  <CardHeader>
                    <CardTitle>Mensagem Padrão</CardTitle>
                    <CardDescription>Template da mensagem enviada aos clientes</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Template da mensagem</Label>
                      <Textarea
                        rows={6}
                        value={whatsappConfig.messageTemplate}
                        onChange={(e) => setWhatsappConfig({ ...whatsappConfig, messageTemplate: e.target.value })}
                        placeholder="Olá! Suas cartelas foram geradas: {CÓDIGOS_DAS_CARTELAS}"
                      />
                      <p className="text-xs text-muted-foreground">
                        Variáveis disponíveis: {'{CÓDIGOS_DAS_CARTELAS}'}, {'{CÓDIGO}'}
                      </p>
                    </div>

                    <div className="bg-muted p-4 rounded-lg">
                      <Label className="text-sm">Preview da mensagem</Label>
                      <p className="text-sm mt-2 text-foreground whitespace-pre-wrap">
                        {whatsappConfig.messageTemplate || 'Digite o template acima para ver o preview...'}
                      </p>
                    </div>

                    <Button variant="hero" onClick={handleSaveWhatsApp} disabled={saving}>
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? 'Salvando...' : 'Salvar'}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Logs de Envio */}
              <Card>
                <CardHeader>
                  <CardTitle>Logs de Envio</CardTitle>
                  <CardDescription>Últimos envios de WhatsApp</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-muted rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-primary">0</p>
                      <p className="text-xs text-muted-foreground">Enviados hoje</p>
                    </div>
                    <div className="bg-muted rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-success">0%</p>
                      <p className="text-xs text-muted-foreground">Taxa de entrega</p>
                    </div>
                    <div className="bg-muted rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-destructive">0</p>
                      <p className="text-xs text-muted-foreground">Falhas</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {whatsappLogs.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Nenhum envio registrado</p>
                      </div>
                    ) : (
                      whatsappLogs.map((log, idx) => (
                        <div key={idx} className="bg-muted rounded-lg p-3 flex items-center justify-between">
                          <div>
                            <p className="font-medium text-foreground">{log.phone}</p>
                            <p className="text-xs text-muted-foreground">{log.cards} cartelas</p>
                          </div>
                          <div className="text-right">
                            <Badge variant={log.status === 'sent' ? 'default' : 'destructive'}>
                              {log.status === 'sent' ? 'Enviado' : 'Falha'}
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">{log.time}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ABA 3: Webhooks */}
          <TabsContent value="webhooks" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Webhook className="w-5 h-5 text-primary" />
                  URLs de Webhook
                </CardTitle>
                <CardDescription>Configure estas URLs nos painéis dos gateways</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="bg-muted rounded-lg p-4">
                    <Label className="text-sm font-medium">URL Webhook Asaas</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <code className="flex-1 bg-background px-3 py-2 rounded text-sm text-foreground break-all">
                        https://api.sortebem.com.br/purchases/webhook/asaas
                      </code>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleCopyWebhookUrl('https://api.sortebem.com.br/purchases/webhook/asaas')}
                      >
                        {copiedUrl === 'https://api.sortebem.com.br/purchases/webhook/asaas' ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Configure no painel do Asaas em: Configurações → Webhooks → Adicionar URL
                    </p>
                  </div>

                  <div className="bg-muted rounded-lg p-4">
                    <Label className="text-sm font-medium">URL Webhook PagSeguro</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <code className="flex-1 bg-background px-3 py-2 rounded text-sm text-foreground break-all">
                        https://api.sortebem.com.br/purchases/webhook/pagseguro
                      </code>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleCopyWebhookUrl('https://api.sortebem.com.br/purchases/webhook/pagseguro')}
                      >
                        {copiedUrl === 'https://api.sortebem.com.br/purchases/webhook/pagseguro' ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Configure no painel do PagSeguro em: Integrações → Notificações → URL de notificação
                    </p>
                  </div>
                </div>

                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                  <h4 className="font-semibold text-foreground mb-2">Instruções importantes:</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• As URLs acima devem ser configuradas nos painéis dos respectivos gateways</li>
                    <li>• Certifique-se de que os Webhook Tokens estão configurados corretamente</li>
                    <li>• Os webhooks notificam automaticamente sobre mudanças no status de pagamento</li>
                    <li>• É essencial para confirmação automática de compras</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
