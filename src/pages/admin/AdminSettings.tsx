import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { Save, DollarSign, Percent, Clock, Hash, Trophy, MessageSquare, Plus, Trash2, Edit2, Eye, EyeOff, GripVertical, FileText, Shield, BarChart3 } from 'lucide-react';
import { apiService } from '@/services/api';

export default function AdminSettings() {
  const [settings, setSettings] = useState<any>({
    cardPriceRegular: 5,
    cardPriceSpecial: 10,
    platformPercent: 10,
    charityPercent: 10,
    establishmentCommission: 20,
    managerCommission: 10,
    prizePoolPercent: 40,
    specialPoolPercent: 5,
    bonusPoolPercent: 5,
    minNumber: 1,
    maxNumber: 75,
    tieBreakWindowMs: 1000,
    maxCardsPerRound: 10000,
    winPatterns: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [winPatterns, setWinPatterns] = useState<string[]>([]);

  // Ticker messages state
  const [tickerMessages, setTickerMessages] = useState<any[]>([]);
  const [editingTickerId, setEditingTickerId] = useState<string | null>(null);
  const [tickerForm, setTickerForm] = useState({ message: '', icon: '📢', is_active: true, display_order: 0 });

  // Legal texts state
  const [legalTerms, setLegalTerms] = useState('');
  const [legalPrivacy, setLegalPrivacy] = useState('');
  const [legalTransparency, setLegalTransparency] = useState('');
  const [savingLegal, setSavingLegal] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const response = await apiService.getSettings();
        if (response.ok && response.data) {
          setSettings(response.data);
          setWinPatterns(response.data.winPatterns || []);
        }

        // Load ticker messages
        const tickerResponse = await apiService.getTickerMessages();
        if (tickerResponse.ok && tickerResponse.data) {
          setTickerMessages(tickerResponse.data);
        }

        // Load legal texts
        if (response.ok && response.data) {
          const allSettings = response.data;
          const terms = allSettings.find((s: any) => s.key === 'legal_terms');
          const privacy = allSettings.find((s: any) => s.key === 'legal_privacy');
          const transparency = allSettings.find((s: any) => s.key === 'legal_transparency');
          
          if (terms?.value) setLegalTerms(typeof terms.value === 'string' ? terms.value : '');
          if (privacy?.value) setLegalPrivacy(typeof privacy.value === 'string' ? privacy.value : '');
          if (transparency?.value) setLegalTransparency(typeof transparency.value === 'string' ? transparency.value : '');
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

    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save all settings
      await Promise.all([
        apiService.updateSetting('card_price_regular', settings.cardPriceRegular),
        apiService.updateSetting('card_price_special', settings.cardPriceSpecial),
        apiService.updateSetting('platform_percent', settings.platformPercent),
        apiService.updateSetting('charity_percent', settings.charityPercent),
        apiService.updateSetting('establishment_commission', settings.establishmentCommission),
        apiService.updateSetting('manager_commission', settings.managerCommission),
        apiService.updateSetting('prize_pool_percent', settings.prizePoolPercent),
        apiService.updateSetting('special_pool_percent', settings.specialPoolPercent),
        apiService.updateSetting('bonus_pool_percent', settings.bonusPoolPercent),
        apiService.updateSetting('min_number', settings.minNumber),
        apiService.updateSetting('max_number', settings.maxNumber),
        apiService.updateSetting('tie_break_window_ms', settings.tieBreakWindowMs),
        apiService.updateSetting('max_cards_per_round', settings.maxCardsPerRound),
        apiService.updateSetting('win_patterns', winPatterns)
      ]);

      toast({ title: 'Configurações salvas!', description: 'As alterações foram aplicadas com sucesso.' });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar as configurações.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const togglePattern = (pattern: string) => {
    setWinPatterns(prev =>
      prev.includes(pattern) ? prev.filter(p => p !== pattern) : [...prev, pattern]
    );
  };

  // Ticker Messages CRUD functions
  const loadTickerMessages = async () => {
    const response = await apiService.getTickerMessages();
    if (response.ok && response.data) {
      setTickerMessages(response.data);
    }
  };

  const handleCreateTicker = async () => {
    if (!tickerForm.message.trim()) {
      toast({ title: 'Erro', description: 'Mensagem não pode ser vazia', variant: 'destructive' });
      return;
    }

    const response = await apiService.createTickerMessage(tickerForm);
    if (response.ok) {
      toast({ title: 'Sucesso!', description: 'Mensagem criada com sucesso' });
      setTickerForm({ message: '', icon: '📢', is_active: true, display_order: 0 });
      loadTickerMessages();
    } else {
      toast({ title: 'Erro', description: response.error || 'Erro ao criar mensagem', variant: 'destructive' });
    }
  };

  const handleEditTicker = (ticker: any) => {
    setEditingTickerId(ticker.id);
    setTickerForm({
      message: ticker.message,
      icon: ticker.icon || '📢',
      is_active: ticker.is_active,
      display_order: ticker.display_order
    });
  };

  const handleUpdateTicker = async () => {
    if (!editingTickerId) return;

    const response = await apiService.updateTickerMessage(editingTickerId, tickerForm);
    if (response.ok) {
      toast({ title: 'Sucesso!', description: 'Mensagem atualizada com sucesso' });
      setEditingTickerId(null);
      setTickerForm({ message: '', icon: '📢', is_active: true, display_order: 0 });
      loadTickerMessages();
    } else {
      toast({ title: 'Erro', description: response.error || 'Erro ao atualizar mensagem', variant: 'destructive' });
    }
  };

  const handleCancelEdit = () => {
    setEditingTickerId(null);
    setTickerForm({ message: '', icon: '📢', is_active: true, display_order: 0 });
  };

  const handleDeleteTicker = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta mensagem?')) return;

    const response = await apiService.deleteTickerMessage(id);
    if (response.ok) {
      toast({ title: 'Sucesso!', description: 'Mensagem excluída com sucesso' });
      loadTickerMessages();
    } else {
      toast({ title: 'Erro', description: response.error || 'Erro ao excluir mensagem', variant: 'destructive' });
    }
  };

  const handleToggleTickerActive = async (id: string, is_active: boolean) => {
    const response = await apiService.toggleTickerMessageActive(id, is_active);
    if (response.ok) {
      toast({ title: 'Sucesso!', description: `Mensagem ${is_active ? 'ativada' : 'desativada'}` });
      loadTickerMessages();
    } else {
      toast({ title: 'Erro', description: response.error || 'Erro ao atualizar status', variant: 'destructive' });
    }
  };

  // Save legal texts
  const handleSaveLegalTexts = async () => {
    setSavingLegal(true);
    try {
      await Promise.all([
        apiService.updateSetting('legal_terms', legalTerms),
        apiService.updateSetting('legal_privacy', legalPrivacy),
        apiService.updateSetting('legal_transparency', legalTransparency),
      ]);
      toast({ title: 'Textos salvos!', description: 'Os textos legais foram atualizados.' });
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível salvar os textos.', variant: 'destructive' });
    } finally {
      setSavingLegal(false);
    }
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
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Configurações do Sistema</h2>
            <p className="text-muted-foreground">Gerencie os valores, percentuais e regras do jogo</p>
          </div>
          <Button variant="hero" onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4" />
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>

        <Tabs defaultValue="valores" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="valores">Valores</TabsTrigger>
            <TabsTrigger value="splits">Splits</TabsTrigger>
            <TabsTrigger value="jogo">Regras</TabsTrigger>
            <TabsTrigger value="sistema">Sistema</TabsTrigger>
            <TabsTrigger value="letreiro">Letreiro</TabsTrigger>
            <TabsTrigger value="textos">Textos</TabsTrigger>
          </TabsList>

          <TabsContent value="valores" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-primary" />
                    Valor da Cartela (10 min)
                  </CardTitle>
                  <CardDescription>Preço da cartela para rodadas regulares</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">R$</span>
                    <Input
                      type="number"
                      step="0.50"
                      value={settings?.cardPriceRegular || 0}
                      onChange={(e) => setSettings({...settings, cardPriceRegular: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-primary" />
                    Valor da Cartela (Especial)
                  </CardTitle>
                  <CardDescription>Preço da cartela para rodada especial (60 min)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">R$</span>
                    <Input
                      type="number"
                      step="0.50"
                      value={settings?.cardPriceSpecial || 0}
                      onChange={(e) => setSettings({...settings, cardPriceSpecial: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="splits" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Percent className="w-5 h-5 text-primary" />
                  Distribuição dos Percentuais
                </CardTitle>
                <CardDescription>
                  Total deve somar 100%. Atual: {
                    (settings?.platformPercent || 0) + (settings?.charityPercent || 0) + (settings?.establishmentCommission || 0) +
                    (settings?.managerCommission || 0) + (settings?.prizePoolPercent || 0) + (settings?.specialPoolPercent || 0) + (settings?.bonusPoolPercent || 0)
                  }%
                </CardDescription>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label>Plataforma (%)</Label>
                  <Input
                    type="number"
                    value={settings?.platformPercent || 0}
                    onChange={(e) => setSettings({...settings, platformPercent: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label>Caridade (%)</Label>
                  <Input
                    type="number"
                    value={settings?.charityPercent || 0}
                    onChange={(e) => setSettings({...settings, charityPercent: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label>Comissão Estabelecimento (%)</Label>
                  <Input
                    type="number"
                    value={settings?.establishmentCommission || 0}
                    onChange={(e) => setSettings({...settings, establishmentCommission: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label>Comissão Gerente (%)</Label>
                  <Input
                    type="number"
                    value={settings?.managerCommission || 0}
                    onChange={(e) => setSettings({...settings, managerCommission: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label>Pool de Prêmios (%)</Label>
                  <Input
                    type="number"
                    value={settings?.prizePoolPercent || 0}
                    onChange={(e) => setSettings({...settings, prizePoolPercent: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label>Pool Especial (%)</Label>
                  <Input
                    type="number"
                    value={settings?.specialPoolPercent || 0}
                    onChange={(e) => setSettings({...settings, specialPoolPercent: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label>Pool Bônus (%)</Label>
                  <Input
                    type="number"
                    value={settings?.bonusPoolPercent || 0}
                    onChange={(e) => setSettings({...settings, bonusPoolPercent: parseFloat(e.target.value) || 0})}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="jogo" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Hash className="w-5 h-5 text-primary" />
                    Intervalo de Números
                  </CardTitle>
                  <CardDescription>Mínimo e máximo para sorteio</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Mínimo</Label>
                      <Input
                        type="number"
                        value={settings?.minNumber || 0}
                        onChange={(e) => setSettings({...settings, minNumber: parseInt(e.target.value) || 0})}
                      />
                    </div>
                    <div>
                      <Label>Máximo</Label>
                      <Input
                        type="number"
                        value={settings?.maxNumber || 0}
                        onChange={(e) => setSettings({...settings, maxNumber: parseInt(e.target.value) || 0})}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    Janela de Empate
                  </CardTitle>
                  <CardDescription>Tempo em milissegundos para considerar empate</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={settings?.tieBreakWindowMs || 0}
                      onChange={(e) => setSettings({...settings, tieBreakWindowMs: parseInt(e.target.value) || 0})}
                    />
                    <span className="text-muted-foreground">ms</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-primary" />
                    Limite de Cartelas por Rodada
                  </CardTitle>
                  <CardDescription>Máximo de cartelas que podem ser emitidas</CardDescription>
                </CardHeader>
                <CardContent>
                  <Input
                    type="number"
                    value={settings?.maxCardsPerRound || 0}
                    onChange={(e) => setSettings({...settings, maxCardsPerRound: parseInt(e.target.value) || 0})}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-primary" />
                    Padrões de Vitória
                  </CardTitle>
                  <CardDescription>Selecione os padrões válidos para ganhar</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {['line', 'column', 'full', 'diagonal'].map(pattern => (
                    <div key={pattern} className="flex items-center justify-between">
                      <Label className="capitalize">{pattern === 'line' ? 'Linha' : pattern === 'column' ? 'Coluna' : pattern === 'full' ? 'Cartela Cheia' : 'Diagonal'}</Label>
                      <Switch
                        checked={winPatterns.includes(pattern)}
                        onCheckedChange={() => togglePattern(pattern)}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sistema" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configurações do Sistema</CardTitle>
                <CardDescription>Configurações gerais da plataforma</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Manutenção</Label>
                    <p className="text-sm text-muted-foreground">Desativar vendas temporariamente</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Notificações WhatsApp</Label>
                    <p className="text-sm text-muted-foreground">Enviar cartelas via WhatsApp</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>POS Habilitado</Label>
                    <p className="text-sm text-muted-foreground">Permitir vendas via maquininha</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="letreiro" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  Gerenciar Mensagens do Letreiro
                </CardTitle>
                <CardDescription>
                  Configure as mensagens que aparecem no rodapé da TV Mode (ticker)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Form para criar/editar */}
                <div className="border rounded-lg p-4 space-y-4 bg-secondary/30">
                  <h3 className="font-semibold text-sm text-foreground">
                    {editingTickerId ? 'Editar Mensagem' : 'Nova Mensagem'}
                  </h3>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <Label>Mensagem *</Label>
                      <Input
                        placeholder="Digite a mensagem que aparecerá no letreiro..."
                        value={tickerForm.message}
                        onChange={(e) => setTickerForm({ ...tickerForm, message: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label>Ícone/Emoji</Label>
                      <Input
                        placeholder="📢"
                        value={tickerForm.icon}
                        onChange={(e) => setTickerForm({ ...tickerForm, icon: e.target.value })}
                        maxLength={2}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Ordem de Exibição</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={tickerForm.display_order}
                        onChange={(e) => setTickerForm({ ...tickerForm, display_order: parseInt(e.target.value) || 0 })}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Menor número aparece primeiro
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-6">
                      <div className="flex items-center gap-2">
                        <Label>Ativo</Label>
                        <Switch
                          checked={tickerForm.is_active}
                          onCheckedChange={(checked) => setTickerForm({ ...tickerForm, is_active: checked })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {editingTickerId ? (
                      <>
                        <Button onClick={handleUpdateTicker} variant="default">
                          <Save className="w-4 h-4" />
                          Atualizar
                        </Button>
                        <Button onClick={handleCancelEdit} variant="outline">
                          Cancelar
                        </Button>
                      </>
                    ) : (
                      <Button onClick={handleCreateTicker} variant="default">
                        <Plus className="w-4 h-4" />
                        Adicionar Mensagem
                      </Button>
                    )}
                  </div>
                </div>

                {/* Lista de mensagens */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm text-foreground">
                      Mensagens Cadastradas ({tickerMessages.length})
                    </h3>
                  </div>

                  {tickerMessages.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Nenhuma mensagem cadastrada ainda</p>
                      <p className="text-sm">Adicione sua primeira mensagem acima</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {tickerMessages.map((ticker) => (
                        <div
                          key={ticker.id}
                          className="border rounded-lg p-4 flex items-center gap-4 hover:bg-secondary/50 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                            <span className="text-2xl">{ticker.icon || '📢'}</span>
                          </div>

                          <div className="flex-1">
                            <p className="font-medium text-foreground">{ticker.message}</p>
                            <p className="text-xs text-muted-foreground">
                              Ordem: {ticker.display_order} • {ticker.is_active ? 'Ativo' : 'Inativo'}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleToggleTickerActive(ticker.id, !ticker.is_active)}
                              title={ticker.is_active ? 'Desativar' : 'Ativar'}
                            >
                              {ticker.is_active ? (
                                <Eye className="w-4 h-4 text-primary" />
                              ) : (
                                <EyeOff className="w-4 h-4 text-muted-foreground" />
                              )}
                            </Button>

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditTicker(ticker)}
                              title="Editar"
                            >
                              <Edit2 className="w-4 h-4 text-primary" />
                            </Button>

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteTicker(ticker.id)}
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Preview do letreiro */}
                {tickerMessages.filter(t => t.is_active).length > 0 && (
                  <div className="border rounded-lg p-4 bg-gradient-tv">
                    <h3 className="font-semibold text-sm text-background mb-3">Preview do Letreiro</h3>
                    <div className="bg-background/10 rounded-lg p-3 overflow-hidden">
                      <div className="flex gap-8 whitespace-nowrap animate-scroll">
                        {tickerMessages
                          .filter(t => t.is_active)
                          .sort((a, b) => a.display_order - b.display_order)
                          .map((ticker, index) => (
                            <span key={index} className="text-background/90 font-medium">
                              {ticker.icon} {ticker.message}
                            </span>
                          ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="textos" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Textos Legais
                </CardTitle>
                <CardDescription>
                  Edite os textos de Termos de Uso, Política de Privacidade e Transparência
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-end">
                  <Button onClick={handleSaveLegalTexts} disabled={savingLegal}>
                    <Save className="w-4 h-4" />
                    {savingLegal ? 'Salvando...' : 'Salvar Textos'}
                  </Button>
                </div>

                <Tabs defaultValue="terms" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="terms" className="gap-2">
                      <FileText className="w-4 h-4" />
                      Termos de Uso
                    </TabsTrigger>
                    <TabsTrigger value="privacy" className="gap-2">
                      <Shield className="w-4 h-4" />
                      Política de Privacidade
                    </TabsTrigger>
                    <TabsTrigger value="transparency" className="gap-2">
                      <BarChart3 className="w-4 h-4" />
                      Transparência
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="terms" className="mt-4">
                    <div className="space-y-2">
                      <Label>Termos de Uso</Label>
                      <Textarea
                        placeholder="Digite os termos de uso..."
                        value={legalTerms}
                        onChange={(e) => setLegalTerms(e.target.value)}
                        className="min-h-[400px] font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        Use quebras de linha para formatação. Linhas começando com números (1., 2.1.) serão formatadas como títulos.
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="privacy" className="mt-4">
                    <div className="space-y-2">
                      <Label>Política de Privacidade</Label>
                      <Textarea
                        placeholder="Digite a política de privacidade..."
                        value={legalPrivacy}
                        onChange={(e) => setLegalPrivacy(e.target.value)}
                        className="min-h-[400px] font-mono text-sm"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="transparency" className="mt-4">
                    <div className="space-y-2">
                      <Label>Transparência</Label>
                      <Textarea
                        placeholder="Digite o texto de transparência..."
                        value={legalTransparency}
                        onChange={(e) => setLegalTransparency(e.target.value)}
                        className="min-h-[400px] font-mono text-sm"
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
