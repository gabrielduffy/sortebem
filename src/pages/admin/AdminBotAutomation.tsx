import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { 
  Bot, Play, Settings, History, Zap, Users, CreditCard, 
  RefreshCw, CheckCircle, XCircle, Clock, TrendingUp 
} from 'lucide-react';
import { botAutomationService, type BotAutomationConfig, type BotAutomationLog } from '@/services/botAutomationService';

export default function AdminBotAutomation() {
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [establishments, setEstablishments] = useState<any[]>([]);
  const [rounds, setRounds] = useState<any[]>([]);
  const [logs, setLogs] = useState<BotAutomationLog[]>([]);
  const [configs, setConfigs] = useState<BotAutomationConfig[]>([]);
  const [stats, setStats] = useState({
    total_bots_created: 0,
    total_cards_generated: 0,
    total_amount: 0,
    executions_today: 0,
    success_rate: 100
  });

  // Manual execution form
  const [selectedRound, setSelectedRound] = useState<string>('');
  const [selectedEstablishment, setSelectedEstablishment] = useState<string>('');
  const [botCount, setBotCount] = useState(10);
  const [cardsPerBot, setCardsPerBot] = useState(1);

  // Config form
  const [configEstablishment, setConfigEstablishment] = useState<string>('');
  const [configEnabled, setConfigEnabled] = useState(false);
  const [configMinBots, setConfigMinBots] = useState(5);
  const [configMaxBots, setConfigMaxBots] = useState(20);
  const [configMinCards, setConfigMinCards] = useState(1);
  const [configMaxCards, setConfigMaxCards] = useState(3);
  const [configTrigger, setConfigTrigger] = useState<'round_open' | 'scheduled' | 'manual'>('manual');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [establishmentsData, roundsData, logsData, configsData, statsData] = await Promise.all([
        botAutomationService.getEstablishments(),
        botAutomationService.getAvailableRounds(),
        botAutomationService.getLogs(),
        botAutomationService.getConfigs(),
        botAutomationService.getStats()
      ]);

      setEstablishments(establishmentsData);
      setRounds(roundsData);
      setLogs(logsData);
      setConfigs(configsData);
      setStats(statsData);

      // Set default establishment (Online)
      const onlineEst = establishmentsData.find((e: any) => e.code === 'ONLINE');
      if (onlineEst) {
        setSelectedEstablishment(onlineEst.id.toString());
        setConfigEstablishment(onlineEst.id.toString());
      }

      // Set default round
      if (roundsData.length > 0) {
        setSelectedRound(roundsData[0].id.toString());
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteManual = async () => {
    if (!selectedRound || !selectedEstablishment) {
      toast({
        title: 'Erro',
        description: 'Selecione uma rodada e um estabelecimento',
        variant: 'destructive'
      });
      return;
    }

    setExecuting(true);
    try {
      const result = await botAutomationService.executeManual({
        roundId: parseInt(selectedRound),
        establishmentId: parseInt(selectedEstablishment),
        botCount,
        cardsPerBot
      });

      if (result.success) {
        toast({
          title: 'Automação executada!',
          description: `${result.bots_created} bots criados, ${result.cards_generated} cartelas geradas`
        });
        loadData(); // Refresh data
      } else {
        toast({
          title: 'Erro na automação',
          description: result.error || 'Erro desconhecido',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao executar automação',
        variant: 'destructive'
      });
    } finally {
      setExecuting(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!configEstablishment) {
      toast({
        title: 'Erro',
        description: 'Selecione um estabelecimento',
        variant: 'destructive'
      });
      return;
    }

    try {
      const config = await botAutomationService.upsertConfig({
        establishment_id: parseInt(configEstablishment),
        enabled: configEnabled,
        min_bots_per_round: configMinBots,
        max_bots_per_round: configMaxBots,
        min_cards_per_bot: configMinCards,
        max_cards_per_bot: configMaxCards,
        trigger_type: configTrigger
      });

      if (config) {
        toast({
          title: 'Configuração salva!',
          description: 'As configurações de automação foram atualizadas'
        });
        loadData();
      } else {
        toast({
          title: 'Erro',
          description: 'Não foi possível salvar a configuração',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao salvar configuração',
        variant: 'destructive'
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Concluído</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Falhou</Badge>;
      case 'running':
        return <Badge className="bg-blue-500"><RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Executando</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Pendente</Badge>;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('pt-BR');
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
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Bot className="w-7 h-7 text-primary" />
              Automação de Bots
            </h2>
            <p className="text-muted-foreground">
              Gerencie a inserção automática de jogadores virtuais nas rodadas
            </p>
          </div>
          <Button onClick={loadData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Bots Criados</CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_bots_created}</div>
              <p className="text-xs text-muted-foreground">Total acumulado</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Cartelas Geradas</CardTitle>
              <CreditCard className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_cards_generated}</div>
              <p className="text-xs text-muted-foreground">Total acumulado</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Valor Gerado</CardTitle>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.total_amount)}</div>
              <p className="text-xs text-muted-foreground">Em cartelas virtuais</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Execuções Hoje</CardTitle>
              <Zap className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.executions_today}</div>
              <p className="text-xs text-muted-foreground">
                {stats.success_rate.toFixed(0)}% de sucesso
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="execute" className="space-y-4">
          <TabsList>
            <TabsTrigger value="execute" className="flex items-center gap-2">
              <Play className="w-4 h-4" />
              Executar
            </TabsTrigger>
            <TabsTrigger value="config" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Configurações
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              Histórico
            </TabsTrigger>
          </TabsList>

          {/* Execute Tab */}
          <TabsContent value="execute">
            <Card>
              <CardHeader>
                <CardTitle>Execução Manual</CardTitle>
                <CardDescription>
                  Execute a automação de bots manualmente para uma rodada específica
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Rodada</Label>
                    <Select value={selectedRound} onValueChange={setSelectedRound}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma rodada" />
                      </SelectTrigger>
                      <SelectContent>
                        {rounds.map((round) => (
                          <SelectItem key={round.id} value={round.id.toString()}>
                            #{round.number} - {round.type === 'regular' ? 'Regular' : 'Especial'} ({round.status})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {rounds.length === 0 && (
                      <p className="text-sm text-muted-foreground">Nenhuma rodada disponível</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Estabelecimento</Label>
                    <Select value={selectedEstablishment} onValueChange={setSelectedEstablishment}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um estabelecimento" />
                      </SelectTrigger>
                      <SelectContent>
                        {establishments.map((est) => (
                          <SelectItem key={est.id} value={est.id.toString()}>
                            {est.name} ({est.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-4">
                    <Label>Quantidade de Bots: {botCount}</Label>
                    <Slider
                      value={[botCount]}
                      onValueChange={(v) => setBotCount(v[0])}
                      min={1}
                      max={50}
                      step={1}
                    />
                  </div>

                  <div className="space-y-4">
                    <Label>Cartelas por Bot: {cardsPerBot}</Label>
                    <Slider
                      value={[cardsPerBot]}
                      onValueChange={(v) => setCardsPerBot(v[0])}
                      min={1}
                      max={10}
                      step={1}
                    />
                  </div>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Resumo da Execução</h4>
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total de bots:</span>
                      <span className="font-medium">{botCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cartelas por bot:</span>
                      <span className="font-medium">{cardsPerBot}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total de cartelas:</span>
                      <span className="font-medium">{botCount * cardsPerBot}</span>
                    </div>
                    {selectedRound && rounds.find(r => r.id.toString() === selectedRound) && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Valor estimado:</span>
                        <span className="font-medium">
                          {formatCurrency(
                            botCount * cardsPerBot * 
                            (rounds.find(r => r.id.toString() === selectedRound)?.card_price || 0)
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <Button 
                  onClick={handleExecuteManual} 
                  disabled={executing || !selectedRound || !selectedEstablishment}
                  className="w-full"
                >
                  {executing ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Executando...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Executar Automação
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Config Tab */}
          <TabsContent value="config">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Automação</CardTitle>
                <CardDescription>
                  Configure os parâmetros de automação para cada estabelecimento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Estabelecimento</Label>
                  <Select value={configEstablishment} onValueChange={setConfigEstablishment}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um estabelecimento" />
                    </SelectTrigger>
                    <SelectContent>
                      {establishments.map((est) => (
                        <SelectItem key={est.id} value={est.id.toString()}>
                          {est.name} ({est.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Automação Habilitada</Label>
                    <p className="text-sm text-muted-foreground">
                      Ativa a automação para este estabelecimento
                    </p>
                  </div>
                  <Switch
                    checked={configEnabled}
                    onCheckedChange={setConfigEnabled}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tipo de Gatilho</Label>
                  <Select value={configTrigger} onValueChange={(v: any) => setConfigTrigger(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="round_open">Quando rodada abrir</SelectItem>
                      <SelectItem value="scheduled">Agendado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-4">
                    <Label>Mínimo de Bots: {configMinBots}</Label>
                    <Slider
                      value={[configMinBots]}
                      onValueChange={(v) => setConfigMinBots(v[0])}
                      min={1}
                      max={50}
                      step={1}
                    />
                  </div>
                  <div className="space-y-4">
                    <Label>Máximo de Bots: {configMaxBots}</Label>
                    <Slider
                      value={[configMaxBots]}
                      onValueChange={(v) => setConfigMaxBots(v[0])}
                      min={1}
                      max={100}
                      step={1}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-4">
                    <Label>Mínimo de Cartelas/Bot: {configMinCards}</Label>
                    <Slider
                      value={[configMinCards]}
                      onValueChange={(v) => setConfigMinCards(v[0])}
                      min={1}
                      max={10}
                      step={1}
                    />
                  </div>
                  <div className="space-y-4">
                    <Label>Máximo de Cartelas/Bot: {configMaxCards}</Label>
                    <Slider
                      value={[configMaxCards]}
                      onValueChange={(v) => setConfigMaxCards(v[0])}
                      min={1}
                      max={20}
                      step={1}
                    />
                  </div>
                </div>

                <Button onClick={handleSaveConfig} className="w-full">
                  <Settings className="w-4 h-4 mr-2" />
                  Salvar Configurações
                </Button>

                {/* Existing Configs List */}
                {configs.length > 0 && (
                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-3">Configurações Existentes</h4>
                    <div className="space-y-2">
                      {configs.map((config) => {
                        const est = establishments.find(e => e.id === config.establishment_id);
                        return (
                          <div 
                            key={config.id} 
                            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                          >
                            <div>
                              <span className="font-medium">{est?.name || 'Estabelecimento'}</span>
                              <span className="text-sm text-muted-foreground ml-2">
                                ({config.min_bots_per_round}-{config.max_bots_per_round} bots)
                              </span>
                            </div>
                            <Badge variant={config.enabled ? 'default' : 'secondary'}>
                              {config.enabled ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Execuções</CardTitle>
                <CardDescription>
                  Veja o histórico das automações executadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {logs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma execução registrada ainda</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {logs.map((log) => (
                      <div 
                        key={log.id} 
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Rodada #{log.round_id}</span>
                            {getStatusBadge(log.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {log.bots_created} bots · {log.cards_generated} cartelas · {formatCurrency(log.total_amount)}
                          </p>
                          {log.error_message && (
                            <p className="text-sm text-destructive">{log.error_message}</p>
                          )}
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          <p>{formatDate(log.started_at)}</p>
                          {log.completed_at && (
                            <p className="text-xs">
                              Duração: {Math.round((new Date(log.completed_at).getTime() - new Date(log.started_at).getTime()) / 1000)}s
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
