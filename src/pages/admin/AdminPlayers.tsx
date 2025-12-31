import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Users, Bot, UserPlus, Sparkles, Trash2, Search, Filter, BarChart3, Trophy } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { groqService } from '@/services/groqService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

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
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (estData) {
        setEstablishments(estData);
        if (estData.length > 0 && !selectedEstablishment) {
          setSelectedEstablishment(estData[0].id.toString());
        }
      }

      // Load rounds
      const { data: roundsData } = await supabase
        .from('rounds')
        .select('id, draw_date, prize, establishment_id')
        .in('status', ['open', 'in_progress'])
        .order('draw_date', { ascending: true });

      if (roundsData) {
        setRounds(roundsData);
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

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.phone?.includes(searchTerm)
      );
    }

    // Filter by type
    if (filterType === 'bots') {
      filtered = filtered.filter(p => p.is_bot);
    } else if (filterType === 'real') {
      filtered = filtered.filter(p => !p.is_bot);
    }

    // Filter by establishment
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
      // Parse command using Groq AI
      const parseResult = await groqService.executePrompt(
        'generate_multiple_players',
        {
          quantity: '10', // Will be extracted from command
          establishment_name: establishments.find(e => e.id.toString() === selectedEstablishment)?.name || 'Estabelecimento'
        }
      );

      if (!parseResult.success || !parseResult.content) {
        throw new Error('Falha ao gerar nomes de jogadores');
      }

      // Parse JSON response
      const playerNames = JSON.parse(parseResult.content);

      if (!Array.isArray(playerNames) || playerNames.length === 0) {
        throw new Error('Nenhum nome de jogador foi gerado');
      }

      // Create players in batch
      const { data, error } = await supabase.rpc('create_players_batch', {
        p_establishment_id: parseInt(selectedEstablishment),
        p_names: playerNames,
        p_is_bot: true,
        p_created_by: null
      });

      if (error) {
        throw error;
      }

      const created = data?.filter((d: any) => d.created).length || 0;
      const existing = data?.filter((d: any) => !d.created).length || 0;

      setNlResult(`✅ Sucesso! ${created} jogadores criados, ${existing} já existiam.`);

      toast({
        title: 'Jogadores criados!',
        description: `${created} novos jogadores adicionados ao estabelecimento.`
      });

      // Reload players
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
    if (!confirm('Tem certeza que deseja excluir este jogador?')) {
      return;
    }

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
            <h2 className="text-2xl font-bold text-foreground">Jogadores & Bots</h2>
            <p className="text-muted-foreground">Gerencie jogadores e bots com IA</p>
          </div>
          <Button onClick={() => setShowManualDialog(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Adicionar Manualmente
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
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
            <div className="space-y-2">
              {filteredPlayers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum jogador encontrado</p>
                  <p className="text-xs mt-1">Crie jogadores usando IA ou adicione manualmente</p>
                </div>
              ) : (
                filteredPlayers.map(player => (
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
            </div>
          </CardContent>
        </Card>

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
