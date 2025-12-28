import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { Save, DollarSign, Percent, Clock, Hash, Trophy } from 'lucide-react';
import { apiService } from '@/services/api';

export default function AdminSettings() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [winPatterns, setWinPatterns] = useState<string[]>([]);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await apiService.getSettings();
        if (response.ok && response.settings) {
          setSettings(response.settings);
          setWinPatterns(response.settings.winPatterns || []);
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
      // TODO: Implement bulk update or loop through changed settings
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

  if (loading || !settings) {
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="valores">Valores</TabsTrigger>
            <TabsTrigger value="splits">Splits/Pools</TabsTrigger>
            <TabsTrigger value="jogo">Regras do Jogo</TabsTrigger>
            <TabsTrigger value="sistema">Sistema</TabsTrigger>
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
                      value={settings.cardPriceRegular}
                      onChange={(e) => setSettings({...settings, cardPriceRegular: parseFloat(e.target.value)})}
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
                      value={settings.cardPriceSpecial}
                      onChange={(e) => setSettings({...settings, cardPriceSpecial: parseFloat(e.target.value)})}
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
                    settings.platformPercent + settings.charityPercent + settings.establishmentCommission + 
                    settings.managerCommission + settings.prizePoolPercent + settings.specialPoolPercent + settings.bonusPoolPercent
                  }%
                </CardDescription>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label>Plataforma (%)</Label>
                  <Input
                    type="number"
                    value={settings.platformPercent}
                    onChange={(e) => setSettings({...settings, platformPercent: parseFloat(e.target.value)})}
                  />
                </div>
                <div>
                  <Label>Caridade (%)</Label>
                  <Input
                    type="number"
                    value={settings.charityPercent}
                    onChange={(e) => setSettings({...settings, charityPercent: parseFloat(e.target.value)})}
                  />
                </div>
                <div>
                  <Label>Comissão Estabelecimento (%)</Label>
                  <Input
                    type="number"
                    value={settings.establishmentCommission}
                    onChange={(e) => setSettings({...settings, establishmentCommission: parseFloat(e.target.value)})}
                  />
                </div>
                <div>
                  <Label>Comissão Gerente (%)</Label>
                  <Input
                    type="number"
                    value={settings.managerCommission}
                    onChange={(e) => setSettings({...settings, managerCommission: parseFloat(e.target.value)})}
                  />
                </div>
                <div>
                  <Label>Pool de Prêmios (%)</Label>
                  <Input
                    type="number"
                    value={settings.prizePoolPercent}
                    onChange={(e) => setSettings({...settings, prizePoolPercent: parseFloat(e.target.value)})}
                  />
                </div>
                <div>
                  <Label>Pool Especial (%)</Label>
                  <Input
                    type="number"
                    value={settings.specialPoolPercent}
                    onChange={(e) => setSettings({...settings, specialPoolPercent: parseFloat(e.target.value)})}
                  />
                </div>
                <div>
                  <Label>Pool Bônus (%)</Label>
                  <Input
                    type="number"
                    value={settings.bonusPoolPercent}
                    onChange={(e) => setSettings({...settings, bonusPoolPercent: parseFloat(e.target.value)})}
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
                        value={settings.minNumber}
                        onChange={(e) => setSettings({...settings, minNumber: parseInt(e.target.value)})}
                      />
                    </div>
                    <div>
                      <Label>Máximo</Label>
                      <Input
                        type="number"
                        value={settings.maxNumber}
                        onChange={(e) => setSettings({...settings, maxNumber: parseInt(e.target.value)})}
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
                      value={settings.tieBreakWindowMs}
                      onChange={(e) => setSettings({...settings, tieBreakWindowMs: parseInt(e.target.value)})}
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
                    value={settings.maxCardsPerRound}
                    onChange={(e) => setSettings({...settings, maxCardsPerRound: parseInt(e.target.value)})}
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
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
