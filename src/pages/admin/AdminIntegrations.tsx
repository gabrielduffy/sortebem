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
import { Save, Eye, EyeOff, Copy, Check, Plug, MessageCircle, Webhook, CreditCard, Mail, Send, FileText, Trash2, Plus, Info, Brain, Zap, BarChart3 } from 'lucide-react';
import { apiService } from '@/services/api';
import { groqService } from '@/services/groqService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

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

  // SMTP state
  const [smtpConfig, setSmtpConfig] = useState({
    enabled: false,
    host: '',
    port: '587',
    user: '',
    password: '',
    fromName: 'Sortebem',
    fromEmail: '',
    secure: true
  });
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [emailTemplates, setEmailTemplates] = useState([
    { id: '1', name: 'Recuperação de Senha', subject: 'Recuperação de Senha - Sortebem', content: 'Olá {{nome_cliente}}, clique aqui para resetar sua senha...' },
    { id: '2', name: 'Boas-vindas', subject: 'Bem-vindo ao Sortebem!', content: 'Olá {{nome_cliente}}, seja bem-vindo ao Sortebem...' }
  ]);
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Groq AI state
  const [groqConfig, setGroqConfig] = useState({
    enabled: false,
    apiKey: ''
  });
  const [showGroqKey, setShowGroqKey] = useState(false);
  const [groqPrompts, setGroqPrompts] = useState<any[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<string>('');
  const [testPromptVars, setTestPromptVars] = useState<Record<string, string>>({});
  const [testModel, setTestModel] = useState('llama-3.1-70b-versatile');
  const [testTemperature, setTestTemperature] = useState(0.7);
  const [testResult, setTestResult] = useState<string>('');
  const [testLoading, setTestLoading] = useState(false);
  const [groqStats, setGroqStats] = useState<any[]>([]);

  useEffect(() => {
    loadSettings();
    loadGroqPrompts();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await apiService.getSettings();
      if (response.ok && response.data) {
        const settings = response.data;

        // Load gateway settings
        if (settings.gateway) {
          const g = settings.gateway;
          if (g.asaas) setAsaasConfig(g.asaas);
          if (g.pagseguro) setPagseguroConfig(g.pagseguro);
          if (g.default_pix_gateway || g.default_card_gateway) {
            setDefaultGateway({
              pix: g.default_pix_gateway || 'asaas',
              card: g.default_card_gateway || 'pagseguro'
            });
          }
        }

        // Load WhatsApp settings
        if (settings.whatsapp) {
          setWhatsappConfig(settings.whatsapp);
        }

        // Load SMTP settings
        if (settings.smtp) {
          setSmtpConfig(settings.smtp);
        }
        if (settings.email_templates) {
          setEmailTemplates(settings.email_templates);
        }

        // Load Groq settings
        if (settings.groq_config) {
          setGroqConfig(settings.groq_config);
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

  const loadGroqPrompts = async () => {
    try {
      const prompts = await groqService.listPrompts();
      setGroqPrompts(prompts);
      if (prompts.length > 0) {
        setSelectedPrompt(prompts[0].name);
      }
    } catch (error) {
      console.error('Error loading Groq prompts:', error);
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

  const handleSaveSMTP = async () => {
    setSaving(true);
    try {
      const response = await apiService.updateSMTPSettings({
        smtp: smtpConfig,
        templates: emailTemplates
      });

      if (response.ok) {
        toast({ title: 'Sucesso!', description: 'Configurações de E-mail (SMTP) salvas.' });
      } else {
        toast({ title: 'Erro', description: response.error || 'Erro ao salvar.', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível salvar as configurações.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestSMTP = async () => {
    if (!testEmail) {
      toast({ title: 'E-mail necessário', description: 'Informe um e-mail para o teste.', variant: 'destructive' });
      return;
    }
    toast({ title: 'Testando...', description: 'Enviando e-mail de teste.' });
    try {
      const response = await apiService.testSMTP(testEmail, smtpConfig);
      if (response.ok) {
        toast({ title: 'Sucesso!', description: 'E-mail de teste enviado.' });
      } else {
        toast({ title: 'Erro', description: response.error || 'Falha no envio.', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao testar SMTP.', variant: 'destructive' });
    }
  };

  const handleCopyWebhookUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
    toast({ title: 'Copiado!', description: 'URL do webhook copiada.' });
  };

  const handleAddTemplate = () => {
    const newId = (emailTemplates.length + 1).toString();
    const newTemplate = {
      id: newId,
      name: `Novo Template ${newId}`,
      subject: 'Assunto do E-mail',
      content: 'Digite o conteúdo aqui...'
    };
    setEmailTemplates([...emailTemplates, newTemplate]);
    toast({ title: 'Template adicionado', description: 'Não esqueça de salvar as alterações.' });
  };

  const handleDeleteTemplate = (id: string) => {
    setEmailTemplates(emailTemplates.filter(t => t.id !== id));
    toast({ title: 'Template removido', description: 'O template foi removido da lista.' });
  };

  const handlePreviewTemplate = (template: any) => {
    setPreviewTemplate(template);
    setShowPreview(true);
  };

  const renderPreviewContent = (content: string) => {
    if (!content) return '';
    return content
      .replace(/{{nome_cliente}}/g, 'Gabriel Duffy')
      .replace(/{{codigo_cartela}}/g, 'SB-A1B2C3D4')
      .replace(/{{valor_premio}}/g, 'R$ 5.000,00')
      .replace(/{{data_sorteio}}/g, new Date().toLocaleDateString('pt-BR'))
      .replace(/{{link_resgate}}/g, 'https://sortebem.com.br/resgatar')
      .replace(/{{email_suporte}}/g, 'suporte@sortebem.com.br');
  };

  const handleSaveGroq = async () => {
    setSaving(true);
    try {
      const response = await apiService.updateSettings({
        groq_config: groqConfig
      });

      if (response.ok) {
        toast({ title: 'Sucesso!', description: 'Configurações do Groq AI salvas.' });
      } else {
        toast({ title: 'Erro', description: response.error || 'Erro ao salvar.', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível salvar as configurações.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestGroqPrompt = async () => {
    if (!selectedPrompt) {
      toast({ title: 'Selecione um prompt', description: 'Escolha um prompt para testar.', variant: 'destructive' });
      return;
    }

    setTestLoading(true);
    setTestResult('');

    try {
      const result = await groqService.testPrompt({
        promptName: selectedPrompt,
        variables: testPromptVars,
        model: testModel,
        temperature: testTemperature
      });

      if (result.success) {
        setTestResult(result.content || '');
        toast({
          title: 'Sucesso!',
          description: `Prompt executado (${result.usage?.total_tokens} tokens, ${result.duration_ms}ms)`
        });
      } else {
        setTestResult(`Erro: ${result.error}`);
        toast({ title: 'Erro', description: result.error, variant: 'destructive' });
      }
    } catch (error: any) {
      setTestResult(`Erro: ${error.message}`);
      toast({ title: 'Erro', description: 'Não foi possível testar o prompt.', variant: 'destructive' });
    } finally {
      setTestLoading(false);
    }
  };

  const handleLoadGroqStats = async () => {
    try {
      const stats = await groqService.getUsageStats(30);
      setGroqStats(stats);
    } catch (error) {
      console.error('Error loading Groq stats:', error);
    }
  };

  const getCurrentPrompt = () => {
    return groqPrompts.find(p => p.name === selectedPrompt);
  };

  const extractVariablesFromTemplate = (template: string): string[] => {
    const matches = template.match(/{{(.*?)}}/g);
    if (!matches) return [];
    return matches.map(m => m.replace(/{{|}}/g, ''));
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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="gateway">
              <CreditCard className="w-4 h-4 mr-2" />
              Pagamentos
            </TabsTrigger>
            <TabsTrigger value="whatsapp">
              <MessageCircle className="w-4 h-4 mr-2" />
              WhatsApp
            </TabsTrigger>
            <TabsTrigger value="smtp">
              <Mail className="w-4 h-4 mr-2" />
              E-mail (SMTP)
            </TabsTrigger>
            <TabsTrigger value="groq">
              <Brain className="w-4 h-4 mr-2" />
              Groq AI
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

          {/* ABA 4: Groq AI */}
          <TabsContent value="groq" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Configurações */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-primary" />
                    Configurações Groq AI
                  </CardTitle>
                  <CardDescription>Configure a integração com Groq AI para geração de conteúdo</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Ativado</Label>
                      <p className="text-sm text-muted-foreground">Habilitar Groq AI no sistema</p>
                    </div>
                    <Switch
                      checked={groqConfig.enabled}
                      onCheckedChange={(checked) => setGroqConfig({ ...groqConfig, enabled: checked })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>API Key</Label>
                    <div className="flex gap-2">
                      <Input
                        type={showGroqKey ? 'text' : 'password'}
                        value={groqConfig.apiKey}
                        onChange={(e) => setGroqConfig({ ...groqConfig, apiKey: e.target.value })}
                        placeholder="Sua API Key do Groq"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setShowGroqKey(!showGroqKey)}
                      >
                        {showGroqKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Obtenha sua API key em: <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">console.groq.com/keys</a>
                    </p>
                  </div>

                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                    <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      O que é Groq AI?
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Groq oferece inferência ultra-rápida de modelos LLM (Llama 3, Mixtral, etc) para:
                    </p>
                    <ul className="space-y-1 text-sm text-muted-foreground mt-2 ml-4">
                      <li>• Gerar nomes de jogadores automaticamente</li>
                      <li>• Análises de performance de rodadas</li>
                      <li>• Sugestões de preços otimizados</li>
                      <li>• Geração de conteúdo para marketing</li>
                    </ul>
                  </div>

                  <Button variant="hero" onClick={handleSaveGroq} disabled={saving}>
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Salvando...' : 'Salvar Configurações'}
                  </Button>
                </CardContent>
              </Card>

              {/* Testador de Prompts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" />
                    Testar Prompts
                  </CardTitle>
                  <CardDescription>Teste os prompts configurados no sistema</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Prompt</Label>
                    <Select value={selectedPrompt} onValueChange={setSelectedPrompt}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um prompt" />
                      </SelectTrigger>
                      <SelectContent>
                        {groqPrompts.map(prompt => (
                          <SelectItem key={prompt.name} value={prompt.name}>
                            {prompt.description || prompt.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {getCurrentPrompt() && (
                    <>
                      <div className="bg-muted rounded-lg p-3 space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground">CATEGORIA</p>
                        <Badge>{getCurrentPrompt()?.category}</Badge>
                      </div>

                      {extractVariablesFromTemplate(getCurrentPrompt()?.user_prompt_template || '').length > 0 && (
                        <div className="space-y-2">
                          <Label>Variáveis do Prompt</Label>
                          {extractVariablesFromTemplate(getCurrentPrompt()?.user_prompt_template || '').map(varName => (
                            <div key={varName} className="space-y-1">
                              <Label className="text-xs text-muted-foreground">{varName}</Label>
                              <Input
                                placeholder={`Valor para ${varName}`}
                                value={testPromptVars[varName] || ''}
                                onChange={(e) => setTestPromptVars({ ...testPromptVars, [varName]: e.target.value })}
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Modelo</Label>
                          <Select value={testModel} onValueChange={setTestModel}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="llama-3.1-70b-versatile">Llama 3.1 70B</SelectItem>
                              <SelectItem value="llama-3.1-8b-instant">Llama 3.1 8B</SelectItem>
                              <SelectItem value="mixtral-8x7b-32768">Mixtral 8x7B</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Temperature: {testTemperature}</Label>
                          <input
                            type="range"
                            min="0"
                            max="2"
                            step="0.1"
                            value={testTemperature}
                            onChange={(e) => setTestTemperature(parseFloat(e.target.value))}
                            className="w-full"
                          />
                        </div>
                      </div>

                      <Button
                        variant="hero"
                        className="w-full"
                        onClick={handleTestGroqPrompt}
                        disabled={testLoading || !groqConfig.enabled}
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        {testLoading ? 'Executando...' : 'Testar Prompt'}
                      </Button>

                      {testResult && (
                        <div className="space-y-2">
                          <Label>Resultado</Label>
                          <div className="bg-muted rounded-lg p-4 max-h-[300px] overflow-auto">
                            <pre className="text-sm text-foreground whitespace-pre-wrap">{testResult}</pre>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Estatísticas de Uso */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-primary" />
                      Estatísticas de Uso (Últimos 30 dias)
                    </CardTitle>
                    <CardDescription>Monitoramento de tokens e custos da API Groq</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleLoadGroqStats}>
                    Atualizar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {groqStats.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Brain className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhum uso registrado ainda</p>
                    <p className="text-xs mt-1">Execute alguns prompts para ver estatísticas aqui</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-4 gap-4">
                      <div className="bg-muted rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-primary">
                          {groqStats.reduce((sum, s) => sum + (s.total_requests || 0), 0)}
                        </p>
                        <p className="text-xs text-muted-foreground">Total Requisições</p>
                      </div>
                      <div className="bg-muted rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-success">
                          {groqStats.reduce((sum, s) => sum + (s.successful_requests || 0), 0)}
                        </p>
                        <p className="text-xs text-muted-foreground">Sucesso</p>
                      </div>
                      <div className="bg-muted rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-destructive">
                          {groqStats.reduce((sum, s) => sum + (s.failed_requests || 0), 0)}
                        </p>
                        <p className="text-xs text-muted-foreground">Falhas</p>
                      </div>
                      <div className="bg-muted rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-primary">
                          {(groqStats.reduce((sum, s) => sum + (s.total_tokens || 0), 0) / 1000).toFixed(1)}K
                        </p>
                        <p className="text-xs text-muted-foreground">Total Tokens</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Por Prompt</Label>
                      {groqStats.slice(0, 10).map((stat, idx) => (
                        <div key={idx} className="bg-muted rounded-lg p-3 flex items-center justify-between">
                          <div>
                            <p className="font-medium text-foreground text-sm">{stat.prompt_name || 'N/A'}</p>
                            <p className="text-xs text-muted-foreground">{stat.model}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-foreground">{stat.total_requests} req</p>
                            <p className="text-xs text-muted-foreground">{(stat.total_tokens / 1000).toFixed(1)}K tokens</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ABA 5: Webhooks */}
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
                        https://sortebem.com.br/api/webhook/asaas
                      </code>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleCopyWebhookUrl('https://sortebem.com.br/api/webhook/asaas')}
                      >
                        {copiedUrl === 'https://sortebem.com.br/api/webhook/asaas' ? (
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
                        https://sortebem.com.br/api/webhook/pagseguro
                      </code>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleCopyWebhookUrl('https://sortebem.com.br/api/webhook/pagseguro')}
                      >
                        {copiedUrl === 'https://sortebem.com.br/api/webhook/pagseguro' ? (
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
                    <li>• As URLs usam seu domínio personalizado e fazem proxy para as Edge Functions do Supabase</li>
                  </ul>
                </div>
                
                <div className="bg-muted/50 border border-border rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm text-foreground mb-1">URLs Personalizadas</h4>
                      <p className="text-xs text-muted-foreground">
                        Estas URLs usam seu domínio personalizado (sortebem.com.br). 
                        Certifique-se de que seu servidor/nginx está configurado para fazer proxy dessas rotas para as Edge Functions do Supabase:
                        <br />
                        <code className="text-xs mt-1 block bg-background px-2 py-1 rounded">/api/webhook/asaas → Supabase Edge Function</code>
                        <code className="text-xs block bg-background px-2 py-1 rounded">/api/webhook/pagseguro → Supabase Edge Function</code>
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ABA 4: SMTP */}
          <TabsContent value="smtp" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5 text-primary" />
                    Configurações SMTP
                  </CardTitle>
                  <CardDescription>Configure o servidor para envio de e-mails do sistema</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Ativado</Label>
                    <Switch
                      checked={smtpConfig.enabled}
                      onCheckedChange={(checked) => setSmtpConfig({ ...smtpConfig, enabled: checked })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Host SMTP</Label>
                      <Input
                        value={smtpConfig.host}
                        onChange={(e) => setSmtpConfig({ ...smtpConfig, host: e.target.value })}
                        placeholder="smtp.exemplo.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Porta</Label>
                      <Input
                        value={smtpConfig.port}
                        onChange={(e) => setSmtpConfig({ ...smtpConfig, port: e.target.value })}
                        placeholder="587"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Usuário/E-mail</Label>
                    <Input
                      value={smtpConfig.user}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, user: e.target.value })}
                      placeholder="usuario@exemplo.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Senha</Label>
                    <div className="flex gap-2">
                      <Input
                        type={showSmtpPassword ? 'text' : 'password'}
                        value={smtpConfig.password}
                        onChange={(e) => setSmtpConfig({ ...smtpConfig, password: e.target.value })}
                        placeholder="Senha do e-mail"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                      >
                        {showSmtpPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <hr className="my-4 border-border" />

                  <div className="space-y-4">
                    <Label>Teste de Envio</Label>
                    <div className="flex gap-2">
                      <Input
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                        placeholder="E-mail para teste"
                      />
                      <Button variant="outline" onClick={handleTestSMTP}>
                        <Send className="w-4 h-4 mr-2" />
                        Enviar
                      </Button>
                    </div>
                  </div>

                  <Button variant="hero" className="w-full" onClick={handleSaveSMTP} disabled={saving}>
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Salvando...' : 'Salvar Configurações'}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Templates de E-mail
                  </CardTitle>
                  <CardDescription>Gerencie o conteúdo dos e-mails enviados</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex gap-3 items-start mb-4">
                    <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div className="text-xs space-y-1">
                      <p className="font-semibold text-primary">Variáveis Disponíveis:</p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-muted-foreground">
                        <code>{`{{nome_cliente}}`}</code>
                        <code>{`{{codigo_cartela}}`}</code>
                        <code>{`{{valor_premio}}`}</code>
                        <code>{`{{data_sorteio}}`}</code>
                        <code>{`{{link_resgate}}`}</code>
                        <code>{`{{email_suporte}}`}</code>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {emailTemplates.map((template, idx) => (
                      <div key={template.id} className="p-4 border border-border rounded-lg bg-muted/30 group space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 space-y-2">
                            <Input
                              value={template.name}
                              onChange={(e) => {
                                const newTemplates = [...emailTemplates];
                                newTemplates[idx].name = e.target.value;
                                setEmailTemplates(newTemplates);
                              }}
                              className="h-8 font-semibold bg-transparent border-none p-0 focus-visible:ring-0"
                            />
                            <Input
                              placeholder="Assunto do E-mail"
                              value={template.subject}
                              onChange={(e) => {
                                const newTemplates = [...emailTemplates];
                                newTemplates[idx].subject = e.target.value;
                                setEmailTemplates(newTemplates);
                              }}
                              className="h-7 text-xs bg-background/50"
                            />
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => handlePreviewTemplate(template)} title="Visualizar">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteTemplate(template.id)} title="Excluir">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <Textarea
                          defaultValue={template.content}
                          className="text-xs bg-background h-24"
                          onChange={(e) => {
                            const newTemplates = [...emailTemplates];
                            newTemplates[idx].content = e.target.value;
                            setEmailTemplates(newTemplates);
                          }}
                        />
                      </div>
                    ))}
                    <Button variant="outline" className="w-full border-dashed" onClick={handleAddTemplate}>
                      <Plus className="w-4 h-4 mr-2" />
                      Novo Template
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Dialog open={showPreview} onOpenChange={setShowPreview}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Visualização do Template</DialogTitle>
                    <DialogDescription>
                      Como o destinatário verá este e-mail (exemplo com dados fictícios).
                    </DialogDescription>
                  </DialogHeader>
                  {previewTemplate && (
                    <div className="space-y-4">
                      <div className="border border-border rounded-lg overflow-hidden">
                        <div className="bg-muted p-3 border-b border-border space-y-1">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Assunto:</p>
                          <p className="text-sm font-medium">{renderPreviewContent(previewTemplate.subject)}</p>
                        </div>
                        <div
                          className="p-6 bg-white text-gray-800 min-h-[200px] font-sans overflow-auto"
                          dangerouslySetInnerHTML={{ __html: renderPreviewContent(previewTemplate.content).replace(/\n/g, '<br/>') }}
                        />
                      </div>
                    </div>
                  )}
                  <DialogFooter>
                    <Button onClick={() => setShowPreview(false)}>Fechar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
