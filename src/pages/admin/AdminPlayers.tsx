import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { 
  Users, Bot, UserPlus, Sparkles, Trash2, Search, Filter, BarChart3, Trophy,
  Play, Settings, History, Zap, CreditCard, RefreshCw, CheckCircle, XCircle, Clock, TrendingUp
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { groqService } from '@/services/groqService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { botAutomationService, type BotAutomationConfig, type BotAutomationLog } from '@/services/botAutomationService';

interface Player {
  id: number;
  establishment_id: number;
  name: string;
  email: string | null;
  phone: string | null;
  cpf: string | null;
  is_bot: boolean;
  tags: string[];
  created_at: string;
  total_participations?: number;
  total_wins?: number;
}

export default function AdminPlayers() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'bots' | 'real'>('all');
  const [establishments, setEstablishments] = useState<any[]>([]);
  const [selectedEstablishment, setSelectedEstablishment] = useState<string>('');
  const [rounds, setRounds] = useState<any[]>([]);

  // Natural language command state
  const [nlCommand, setNlCommand] = useState('');
  const [nlProcessing, setNlProcessing] = useState(false);
  const [nlResult, setNlResult] = useState<string>('');

  // Manual creation state
  const [showManualDialog, setShowManualDialog] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualEstablishment, setManualEstablishment] = useState('');

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    bots: 0,
    real: 0,
    totalParticipations: 0
  });

  // Bot automation state
  const [executing, setExecuting] = useState(false);
  const [logs, setLogs] = useState<BotAutomationLog[]>([]);
  const [configs, setConfigs] = useState<BotAutomationConfig[]>([]);
  const [automationStats, setAutomationStats] = useState({
    total_bots_created: 0,
    total_cards_generated: 0,
    total_amount: 0,
    executions_today: 0,
    success_rate: 100
  });

  // Manual execution form
  const [selectedRound, setSelectedRound] = useState<string>('');
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

  useEffect(() => {
    filterPlayers();
  }, [players, searchTerm, filterType, selectedEstablishment]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load establishments
      const { data: estData } = await supabase
        .from('establishments')
        .select('id, name, code')
        .eq('is_active', true)
        .order('name');

      if (estData) {
        setEstablishments(estData);
        const onlineEst = estData.find((e: any) => e.code === 'ONLINE');
        if (onlineEst) {
          setSelectedEstablishment(onlineEst.id.toString());
          setConfigEstablishment(onlineEst.id.toString());
        } else if (estData.length > 0 && !selectedEstablishment) {
          setSelectedEstablishment(estData[0].id.toString());
        }
      }

      // Load rounds
      const { data: roundsData } = await supabase
        .from('rounds')
        .select('id, number, type, status, card_price')
        .in('status', ['open', 'selling'])
        .order('number', { ascending: false });

      if (roundsData) {
        setRounds(roundsData);
        if (roundsData.length > 0) {
          setSelectedRound(roundsData[0].id.toString());
        }
      }

      // Load players with stats
      const { data: playersData } = await supabase
        .from('v_player_stats')
        .select('*')
        .order('created_at', { ascending: false });

      if (playersData) {
        setPlayers(playersData as Player[]);
        calculateStats(playersData as Player[]);
      }

      // Load automation data
      const [logsData, configsData, statsData] = await Promise.all([
        botAutomationService.getLogs(),
        botAutomationService.getConfigs(),
        botAutomationService.getStats()
      ]);

      setLogs(logsData);
      setConfigs(configsData);
      setAutomationStats(statsData);

    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: Player[]) => {
    setStats({
      total: data.length,
      bots: data.filter(p => p.is_bot).length,
      real: data.filter(p => !p.is_bot).length,
      totalParticipations: data.reduce((sum, p) => sum + (p.total_participations || 0), 0)
    });
  };

  const filterPlayers = () => {
    let filtered = [...players];

    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.phone?.includes(searchTerm)
      );
    }

    if (filterType === 'bots') {
      filtered = filtered.filter(p => p.is_bot);
    } else if (filterType === 'real') {
      filtered = filtered.filter(p => !p.is_bot);
    }

    if (selectedEstablishment) {
      filtered = filtered.filter(p => p.establishment_id.toString() === selectedEstablishment);
    }

    setFilteredPlayers(filtered);
  };

  const handleNaturalLanguageCommand = async () => {
    if (!nlCommand.trim()) {
      toast({ title: 'Digite um comando', variant: 'destructive' });
      return;
    }

    setNlProcessing(true);
    setNlResult('');

    try {
      const parseResult = await groqService.executePrompt(
        'generate_multiple_players',
        {
          quantity: '10',
          establishment_name: establishments.find(e => e.id.toString() === selectedEstablishment)?.name || 'Estabelecimento'
        }
      );

      if (!parseResult.success || !parseResult.content) {
        throw new Error('Falha ao gerar nomes de jogadores');
      }

      const playerNames = JSON.parse(parseResult.content);

      if (!Array.isArray(playerNames) || playerNames.length === 0) {
        throw new Error('Nenhum nome de jogador foi gerado');
      }

      const { data, error } = await supabase.rpc('create_players_batch', {
        p_establishment_id: parseInt(selectedEstablishment),
        p_names: playerNames,
        p_is_bot: true,
        p_created_by: null
      });

      if (error) throw error;

      const created = data?.filter((d: any) => d.created).length || 0;
      const existing = data?.filter((d: any) => !d.created).length || 0;

      setNlResult(`✅ Sucesso! ${created} jogadores criados, ${existing} já existiam.`);

      toast({
        title: 'Jogadores criados!',
        description: `${created} novos jogadores adicionados ao estabelecimento.`
      });

      await loadData();
      setNlCommand('');
    } catch (error: any) {
      console.error('Error processing command:', error);
      setNlResult(`❌ Erro: ${error.message}`);
      toast({
        title: 'Erro',
        description: 'Não foi possível processar o comando.',
        variant: 'destructive'
      });
    } finally {
      setNlProcessing(false);
    }
  };

  const handleCreateManualPlayer = async () => {
    if (!manualName.trim()) {
      toast({ title: 'Nome é obrigatório', variant: 'destructive' });
      return;
    }

    if (!manualEstablishment) {
      toast({ title: 'Selecione um estabelecimento', variant: 'destructive' });
      return;
    }

    setProcessing(true);

    try {
      const { error } = await supabase
        .from('players')
        .insert({
          establishment_id: parseInt(manualEstablishment),
          name: manualName,
          email: manualEmail || null,
          phone: manualPhone || null,
          is_bot: false,
          tags: ['manual']
        });

      if (error) throw error;

      toast({ title: 'Jogador criado com sucesso!' });
      setShowManualDialog(false);
      setManualName('');
      setManualEmail('');
      setManualPhone('');
      await loadData();
    } catch (error) {
      console.error('Error creating player:', error);
      toast({ title: 'Erro', description: 'Não foi possível criar o jogador.', variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  const handleDeletePlayer = async (playerId: number) => {
    if (!confirm('Tem certeza que deseja excluir este jogador?')) return;

    try {
      const { error } = await supabase
        .from('players')
        .delete()
        .eq('id', playerId);

      if (error) throw error;

      toast({ title: 'Jogador excluído com sucesso!' });
      await loadData();
    } catch (error) {
      console.error('Error deleting player:', error);
      toast({ title: 'Erro', description: 'Não foi possível excluir o jogador.', variant: 'destructive' });
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
        loadData();
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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Bot className="w-7 h-7 text-primary" />
              Jogadores & Bots
            </h2>
            <p className="text-muted-foreground">Gerencie jogadores, bots e automações com IA</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={loadData} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
            <Button onClick={() => setShowManualDialog(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              Adicionar Manualmente
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Users className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total de Jogadores</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Bot className="w-8 h-8 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.bots}</p>
                  <p className="text-xs text-muted-foreground">Bots (IA)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Users className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.real}</p>
                  <p className="text-xs text-muted-foreground">Jogadores Reais</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <BarChart3 className="w-8 h-8 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalParticipations}</p>
                  <p className="text-xs text-muted-foreground">Participações</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="players" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="players" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Jogadores
            </TabsTrigger>
            <TabsTrigger value="automation" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Automação
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

          {/* Players Tab */}
          <TabsContent value="players" className="space-y-4">
            {/* Natural Language Interface */}
            <Card className="border-2 border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Criar Jogadores com IA
                </CardTitle>
                <CardDescription>
                  Use linguagem natural para criar jogadores automaticamente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Estabelecimento</Label>
                  <Select value={selectedEstablishment} onValueChange={setSelectedEstablishment}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um estabelecimento" />
                    </SelectTrigger>
                    <SelectContent>
                      {establishments.map(est => (
                        <SelectItem key={est.id} value={est.id.toString()}>
                          {est.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Comando</Label>
                  <Textarea
                    placeholder="Ex: crie 10 jogadores brasileiros para jogar no bar do josé&#10;Ex: gerar 5 bots para a rodada do domingo&#10;Ex: adicionar 20 participantes fictícios"
                    value={nlCommand}
                    onChange={(e) => setNlCommand(e.target.value)}
                    rows={3}
                    disabled={nlProcessing}
                  />
                  <p className="text-xs text-muted-foreground">
                    💡 Dica: Seja específico sobre quantidade e contexto para melhores resultados
                  </p>
                </div>

                <Button
                  variant="hero"
                  className="w-full"
                  onClick={handleNaturalLanguageCommand}
                  disabled={nlProcessing || !selectedEstablishment}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {nlProcessing ? 'Gerando com IA...' : 'Gerar Jogadores'}
                </Button>

                {nlResult && (
                  <div className={`rounded-lg p-4 ${nlResult.startsWith('✅') ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                    <p className="text-sm font-medium">{nlResult}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Jogadores Cadastrados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por nome, email ou telefone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <Select value={filterType} onValueChange={(v: any) => setFilterType(v)}>
                    <SelectTrigger className="w-[180px]">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="bots">Apenas Bots</SelectItem>
                      <SelectItem value="real">Apenas Reais</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Players List */}
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {filteredPlayers.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Nenhum jogador encontrado</p>
                      <p className="text-xs mt-1">Crie jogadores usando IA ou adicione manualmente</p>
                    </div>
                  ) : (
                    filteredPlayers.slice(0, 50).map(player => (
                      <div key={player.id} className="bg-muted rounded-lg p-4 flex items-center justify-between hover:bg-muted/80 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            {player.is_bot ? (
                              <Bot className="w-5 h-5 text-primary" />
                            ) : (
                              <Users className="w-5 h-5 text-primary" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-foreground">{player.name}</p>
                              {player.is_bot && <Badge variant="secondary">Bot</Badge>}
                              {player.tags?.includes('manual') && <Badge variant="outline">Manual</Badge>}
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                              {player.email && <span>{player.email}</span>}
                              {player.phone && <span>{player.phone}</span>}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-semibold text-foreground">
                              {player.total_participations || 0} participações
                            </p>
                            {(player.total_wins || 0) > 0 && (
                              <div className="flex items-center gap-1 text-xs text-green-500">
                                <Trophy className="w-3 h-3" />
                                {player.total_wins} vitórias
                              </div>
                            )}
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeletePlayer(player.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                  {filteredPlayers.length > 50 && (
                    <p className="text-center text-sm text-muted-foreground py-2">
                      Mostrando 50 de {filteredPlayers.length} jogadores
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Automation Tab */}
          <TabsContent value="automation">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Execução Manual de Bots
                </CardTitle>
                <CardDescription>
                  Execute a automação de bots manualmente para uma rodada específica
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Automation Stats */}
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Users className="w-4 h-4" />
                      Bots Criados
                    </div>
                    <p className="text-2xl font-bold">{automationStats.total_bots_created}</p>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <CreditCard className="w-4 h-4" />
                      Cartelas Geradas
                    </div>
                    <p className="text-2xl font-bold">{automationStats.total_cards_generated}</p>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <TrendingUp className="w-4 h-4" />
                      Valor Gerado
                    </div>
                    <p className="text-2xl font-bold">{formatCurrency(automationStats.total_amount)}</p>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Zap className="w-4 h-4" />
                      Execuções Hoje
                    </div>
                    <p className="text-2xl font-bold">{automationStats.executions_today}</p>
                  </div>
                </div>

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
                  variant="hero"
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

        {/* Manual Creation Dialog */}
        <Dialog open={showManualDialog} onOpenChange={setShowManualDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Jogador Manualmente</DialogTitle>
              <DialogDescription>
                Preencha os dados do jogador para cadastrá-lo no sistema
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Estabelecimento *</Label>
                <Select value={manualEstablishment} onValueChange={setManualEstablishment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {establishments.map(est => (
                      <SelectItem key={est.id} value={est.id.toString()}>
                        {est.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Nome Completo *</Label>
                <Input
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder="Ex: João Silva"
                />
              </div>

              <div className="space-y-2">
                <Label>Email (opcional)</Label>
                <Input
                  type="email"
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  placeholder="joao@exemplo.com"
                />
              </div>

              <div className="space-y-2">
                <Label>Telefone (opcional)</Label>
                <Input
                  value={manualPhone}
                  onChange={(e) => setManualPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="11999999999"
                  maxLength={11}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowManualDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateManualPlayer} disabled={processing}>
                {processing ? 'Criando...' : 'Criar Jogador'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
