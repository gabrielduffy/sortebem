import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { 
  Palette, 
  Timer, 
  Volume2, 
  Scale, 
  Swords, 
  Monitor,
  Play,
  Save,
  RotateCcw,
  Eye
} from 'lucide-react';

interface DrawSettings {
  // Aparência
  cardFont: string;
  cardFontSize: number;
  codeFontSize: number;
  cardBgColor: string;
  numberColor: string;
  markedNumberColor: string;
  markedBgColor: string;
  enableAnimations: boolean;
  
  // Tempo e Ritmo
  intervalBetweenNumbers: number;
  animationDuration: number;
  initialDelay: number;
  maxRoundTime: number;
  autoPauseEnabled: boolean;
  autoPauseTimeout: number;
  
  // Voz IA
  voiceEnabled: boolean;
  voiceProvider: string;
  voiceId: string;
  voiceLanguage: string;
  voiceSpeed: number;
  voiceVolume: number;
  voiceFormat: 'number_x' | 'only_number' | 'column_number';
  
  // Regras
  minNumber: number;
  maxNumber: number;
  winPatterns: string[];
  multiplePatterns: boolean;
  maxCardsPerRound: number;
  maxCardsPerUser: number | null;
  
  // Desempate
  tieBreakMethod: 'stone' | 'first_claim' | 'split_prize';
  tieBreakWindowMs: number;
  stoneMin: number;
  stoneMax: number;
  showStonePublicly: boolean;
  tieBreakAnimation: boolean;
  
  // Modo TV
  tvFont: string;
  tvFontSize: number;
  tvBgColor: string;
  tvNumberColor: string;
  showWinnersHistory: boolean;
  winnersHistoryCount: number;
  winnerDisplayTime: number;
  autoRotateInfo: boolean;
}

const defaultSettings: DrawSettings = {
  cardFont: 'Poppins',
  cardFontSize: 24,
  codeFontSize: 14,
  cardBgColor: '#ffffff',
  numberColor: '#1a1a1a',
  markedNumberColor: '#ffffff',
  markedBgColor: '#f97316',
  enableAnimations: true,
  
  intervalBetweenNumbers: 5,
  animationDuration: 1,
  initialDelay: 3,
  maxRoundTime: 60,
  autoPauseEnabled: true,
  autoPauseTimeout: 30,
  
  voiceEnabled: true,
  voiceProvider: 'elevenlabs',
  voiceId: 'pedro',
  voiceLanguage: 'pt-BR',
  voiceSpeed: 1,
  voiceVolume: 80,
  voiceFormat: 'column_number',
  
  minNumber: 1,
  maxNumber: 75,
  winPatterns: ['line', 'column', 'full'],
  multiplePatterns: false,
  maxCardsPerRound: 10000,
  maxCardsPerUser: null,
  
  tieBreakMethod: 'stone',
  tieBreakWindowMs: 5000,
  stoneMin: 1,
  stoneMax: 99,
  showStonePublicly: true,
  tieBreakAnimation: true,
  
  tvFont: 'Poppins',
  tvFontSize: 72,
  tvBgColor: '#1a1a1a',
  tvNumberColor: '#f97316',
  showWinnersHistory: true,
  winnersHistoryCount: 5,
  winnerDisplayTime: 10,
  autoRotateInfo: true,
};

const fontOptions = [
  'Poppins',
  'Roboto',
  'Inter',
  'Montserrat',
  'Open Sans',
  'Lato',
  'Oswald',
  'Playfair Display',
  'Bebas Neue',
  'Arial',
];

const voiceProviders = [
  { id: 'elevenlabs', name: 'ElevenLabs' },
  { id: 'google', name: 'Google TTS' },
  { id: 'amazon', name: 'Amazon Polly' },
  { id: 'azure', name: 'Azure Speech' },
];

const voices = {
  elevenlabs: [
    { id: 'pedro', name: 'Pedro (Masculino)' },
    { id: 'ana', name: 'Ana (Feminino)' },
    { id: 'carlos', name: 'Carlos (Masculino)' },
    { id: 'maria', name: 'Maria (Feminino)' },
  ],
  google: [
    { id: 'pt-BR-Standard-A', name: 'Voz A (Feminino)' },
    { id: 'pt-BR-Standard-B', name: 'Voz B (Masculino)' },
  ],
  amazon: [
    { id: 'Ricardo', name: 'Ricardo (Masculino)' },
    { id: 'Vitoria', name: 'Vitória (Feminino)' },
  ],
  azure: [
    { id: 'pt-BR-AntonioNeural', name: 'Antonio (Masculino)' },
    { id: 'pt-BR-FranciscaNeural', name: 'Francisca (Feminino)' },
  ],
};

const winPatternOptions = [
  { id: 'line', label: 'Linha Horizontal' },
  { id: 'column', label: 'Coluna Vertical' },
  { id: 'diagonal', label: 'Diagonal' },
  { id: 'full', label: 'Cartela Cheia' },
  { id: 'x', label: 'Formato X' },
  { id: 'l', label: 'Formato L' },
  { id: 't', label: 'Formato T' },
  { id: 'corners', label: '4 Cantos' },
];

const AdminDraw = () => {
  const [settings, setSettings] = useState<DrawSettings>(defaultSettings);
  const [hasChanges, setHasChanges] = useState(false);

  const updateSetting = <K extends keyof DrawSettings>(key: K, value: DrawSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const toggleWinPattern = (patternId: string) => {
    const newPatterns = settings.winPatterns.includes(patternId)
      ? settings.winPatterns.filter(p => p !== patternId)
      : [...settings.winPatterns, patternId];
    updateSetting('winPatterns', newPatterns);
  };

  const handleSave = () => {
    toast.success('Configurações salvas com sucesso!');
    setHasChanges(false);
  };

  const handleReset = () => {
    setSettings(defaultSettings);
    setHasChanges(true);
    toast.info('Configurações restauradas para o padrão');
  };

  const testVoice = () => {
    toast.success('Reproduzindo: "S - 42"');
  };

  const availableVoices = voices[settings.voiceProvider as keyof typeof voices] || [];

  return (
    <DashboardLayout userType="admin" userName="Administrador">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Configurações do Sorteio</h1>
            <p className="text-muted-foreground">Personalize a experiência do sorteio</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Restaurar Padrão
            </Button>
            <Button onClick={handleSave} disabled={!hasChanges}>
              <Save className="h-4 w-4 mr-2" />
              Salvar Alterações
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="appearance" className="space-y-6">
          <TabsList className="grid grid-cols-2 lg:grid-cols-6 w-full">
            <TabsTrigger value="appearance" className="gap-2">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Aparência</span>
            </TabsTrigger>
            <TabsTrigger value="timing" className="gap-2">
              <Timer className="h-4 w-4" />
              <span className="hidden sm:inline">Tempo</span>
            </TabsTrigger>
            <TabsTrigger value="voice" className="gap-2">
              <Volume2 className="h-4 w-4" />
              <span className="hidden sm:inline">Voz IA</span>
            </TabsTrigger>
            <TabsTrigger value="rules" className="gap-2">
              <Scale className="h-4 w-4" />
              <span className="hidden sm:inline">Regras</span>
            </TabsTrigger>
            <TabsTrigger value="tiebreak" className="gap-2">
              <Swords className="h-4 w-4" />
              <span className="hidden sm:inline">Desempate</span>
            </TabsTrigger>
            <TabsTrigger value="tv" className="gap-2">
              <Monitor className="h-4 w-4" />
              <span className="hidden sm:inline">Modo TV</span>
            </TabsTrigger>
          </TabsList>

          {/* Aparência */}
          <TabsContent value="appearance" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Tipografia</CardTitle>
                  <CardDescription>Configure as fontes e tamanhos do texto</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Fonte Principal</Label>
                    <Select value={settings.cardFont} onValueChange={(v) => updateSetting('cardFont', v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {fontOptions.map(font => (
                          <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                            {font}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Tamanho dos Números: {settings.cardFontSize}px</Label>
                    <Slider
                      value={[settings.cardFontSize]}
                      onValueChange={([v]) => updateSetting('cardFontSize', v)}
                      min={16}
                      max={48}
                      step={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Tamanho do Código: {settings.codeFontSize}px</Label>
                    <Slider
                      value={[settings.codeFontSize]}
                      onValueChange={([v]) => updateSetting('codeFontSize', v)}
                      min={10}
                      max={24}
                      step={1}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Cores</CardTitle>
                  <CardDescription>Personalize as cores da cartela</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Fundo da Cartela</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={settings.cardBgColor}
                          onChange={(e) => updateSetting('cardBgColor', e.target.value)}
                          className="w-12 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          value={settings.cardBgColor}
                          onChange={(e) => updateSetting('cardBgColor', e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Cor dos Números</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={settings.numberColor}
                          onChange={(e) => updateSetting('numberColor', e.target.value)}
                          className="w-12 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          value={settings.numberColor}
                          onChange={(e) => updateSetting('numberColor', e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Fundo Marcado</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={settings.markedBgColor}
                          onChange={(e) => updateSetting('markedBgColor', e.target.value)}
                          className="w-12 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          value={settings.markedBgColor}
                          onChange={(e) => updateSetting('markedBgColor', e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Número Marcado</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={settings.markedNumberColor}
                          onChange={(e) => updateSetting('markedNumberColor', e.target.value)}
                          className="w-12 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          value={settings.markedNumberColor}
                          onChange={(e) => updateSetting('markedNumberColor', e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Animações</Label>
                      <p className="text-sm text-muted-foreground">Animar números ao marcar</p>
                    </div>
                    <Switch
                      checked={settings.enableAnimations}
                      onCheckedChange={(v) => updateSetting('enableAnimations', v)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Preview */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Preview da Cartela
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div 
                    className="p-6 rounded-xl border-2 max-w-sm mx-auto"
                    style={{ 
                      backgroundColor: settings.cardBgColor,
                      fontFamily: settings.cardFont
                    }}
                  >
                    <div className="text-center mb-4">
                      <span 
                        className="font-bold"
                        style={{ fontSize: settings.codeFontSize, color: settings.numberColor }}
                      >
                        SB-A7K3M9P2
                      </span>
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      {['S', 'O', 'R', 'T', 'E'].map((letter, i) => (
                        <div
                          key={letter}
                          className="text-center font-bold"
                          style={{ 
                            fontSize: settings.cardFontSize * 0.8,
                            color: settings.markedBgColor
                          }}
                        >
                          {letter}
                        </div>
                      ))}
                      {[5, 23, 47, 12, 68, 31, 9, 56, 73, 2, 15, 28, 0, 44, 61, 8, 19, 38, 52, 70, 4, 25, 41, 58, 75].map((num, i) => (
                        <div
                          key={i}
                          className="aspect-square flex items-center justify-center rounded-lg font-bold transition-all"
                          style={{
                            fontSize: settings.cardFontSize,
                            backgroundColor: [0, 3, 7, 12].includes(i) ? settings.markedBgColor : 'transparent',
                            color: [0, 3, 7, 12].includes(i) ? settings.markedNumberColor : settings.numberColor,
                            border: `2px solid ${settings.markedBgColor}20`
                          }}
                        >
                          {num === 0 ? '★' : num}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tempo e Ritmo */}
          <TabsContent value="timing" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Intervalo entre Números</CardTitle>
                  <CardDescription>Configure o ritmo do sorteio</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Intervalo: {settings.intervalBetweenNumbers} segundos</Label>
                    <Slider
                      value={[settings.intervalBetweenNumbers]}
                      onValueChange={([v]) => updateSetting('intervalBetweenNumbers', v)}
                      min={2}
                      max={15}
                      step={1}
                    />
                    <p className="text-sm text-muted-foreground">
                      Tempo entre um número sorteado e o próximo
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Duração da Animação: {settings.animationDuration}s</Label>
                    <Slider
                      value={[settings.animationDuration]}
                      onValueChange={([v]) => updateSetting('animationDuration', v)}
                      min={0.3}
                      max={2}
                      step={0.1}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Delay Inicial: {settings.initialDelay} segundos</Label>
                    <Slider
                      value={[settings.initialDelay]}
                      onValueChange={([v]) => updateSetting('initialDelay', v)}
                      min={0}
                      max={10}
                      step={1}
                    />
                    <p className="text-sm text-muted-foreground">
                      Tempo de espera antes de iniciar o sorteio
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Limites de Tempo</CardTitle>
                  <CardDescription>Controle a duração máxima</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Tempo Máximo da Rodada</Label>
                    <div className="flex gap-2 items-center">
                      <Input
                        type="number"
                        value={settings.maxRoundTime}
                        onChange={(e) => updateSetting('maxRoundTime', parseInt(e.target.value))}
                        min={10}
                        max={180}
                      />
                      <span className="text-muted-foreground">minutos</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Pausa Automática</Label>
                      <p className="text-sm text-muted-foreground">
                        Pausar se não houver interação
                      </p>
                    </div>
                    <Switch
                      checked={settings.autoPauseEnabled}
                      onCheckedChange={(v) => updateSetting('autoPauseEnabled', v)}
                    />
                  </div>

                  {settings.autoPauseEnabled && (
                    <div className="space-y-2">
                      <Label>Timeout: {settings.autoPauseTimeout} segundos</Label>
                      <Slider
                        value={[settings.autoPauseTimeout]}
                        onValueChange={([v]) => updateSetting('autoPauseTimeout', v)}
                        min={10}
                        max={120}
                        step={5}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Voz IA */}
          <TabsContent value="voice" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Configurações de Voz</CardTitle>
                  <CardDescription>Configure a narração por IA</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Habilitar Narração</Label>
                      <p className="text-sm text-muted-foreground">
                        IA irá falar os números sorteados
                      </p>
                    </div>
                    <Switch
                      checked={settings.voiceEnabled}
                      onCheckedChange={(v) => updateSetting('voiceEnabled', v)}
                    />
                  </div>

                  {settings.voiceEnabled && (
                    <>
                      <div className="space-y-2">
                        <Label>Provedor de Voz</Label>
                        <Select 
                          value={settings.voiceProvider} 
                          onValueChange={(v) => {
                            updateSetting('voiceProvider', v);
                            updateSetting('voiceId', voices[v as keyof typeof voices]?.[0]?.id || '');
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {voiceProviders.map(p => (
                              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Voz</Label>
                        <Select value={settings.voiceId} onValueChange={(v) => updateSetting('voiceId', v)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {availableVoices.map(v => (
                              <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Velocidade: {settings.voiceSpeed}x</Label>
                        <Slider
                          value={[settings.voiceSpeed]}
                          onValueChange={([v]) => updateSetting('voiceSpeed', v)}
                          min={0.5}
                          max={2}
                          step={0.1}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Volume: {settings.voiceVolume}%</Label>
                        <Slider
                          value={[settings.voiceVolume]}
                          onValueChange={([v]) => updateSetting('voiceVolume', v)}
                          min={0}
                          max={100}
                          step={5}
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Formato de Leitura</CardTitle>
                  <CardDescription>Como a IA irá anunciar os números</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="format_column"
                        checked={settings.voiceFormat === 'column_number'}
                        onChange={() => updateSetting('voiceFormat', 'column_number')}
                        className="text-primary"
                      />
                      <Label htmlFor="format_column" className="cursor-pointer">
                        <span className="font-medium">Coluna e Número</span>
                        <p className="text-sm text-muted-foreground">Ex: "S - 12", "O - 28"</p>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="format_number_x"
                        checked={settings.voiceFormat === 'number_x'}
                        onChange={() => updateSetting('voiceFormat', 'number_x')}
                        className="text-primary"
                      />
                      <Label htmlFor="format_number_x" className="cursor-pointer">
                        <span className="font-medium">Número X</span>
                        <p className="text-sm text-muted-foreground">Ex: "Número 12", "Número 28"</p>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="format_only"
                        checked={settings.voiceFormat === 'only_number'}
                        onChange={() => updateSetting('voiceFormat', 'only_number')}
                        className="text-primary"
                      />
                      <Label htmlFor="format_only" className="cursor-pointer">
                        <span className="font-medium">Apenas Número</span>
                        <p className="text-sm text-muted-foreground">Ex: "12", "28"</p>
                      </Label>
                    </div>
                  </div>

                  <Button onClick={testVoice} variant="outline" className="w-full">
                    <Play className="h-4 w-4 mr-2" />
                    Testar Voz
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Regras */}
          <TabsContent value="rules" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Intervalo de Números</CardTitle>
                  <CardDescription>Defina o range de números do sorteio</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Número Mínimo</Label>
                      <Input
                        type="number"
                        value={settings.minNumber}
                        onChange={(e) => updateSetting('minNumber', parseInt(e.target.value))}
                        min={1}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Número Máximo</Label>
                      <Input
                        type="number"
                        value={settings.maxNumber}
                        onChange={(e) => updateSetting('maxNumber', parseInt(e.target.value))}
                        min={settings.minNumber}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Limite de Cartelas por Rodada</Label>
                    <Input
                      type="number"
                      value={settings.maxCardsPerRound}
                      onChange={(e) => updateSetting('maxCardsPerRound', parseInt(e.target.value))}
                      min={100}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Cartelas por Usuário</Label>
                    <div className="flex gap-2 items-center">
                      <Input
                        type="number"
                        value={settings.maxCardsPerUser || ''}
                        onChange={(e) => updateSetting('maxCardsPerUser', e.target.value ? parseInt(e.target.value) : null)}
                        placeholder="Sem limite"
                        min={1}
                      />
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        (vazio = sem limite)
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Padrões de Vitória</CardTitle>
                  <CardDescription>Selecione os padrões aceitos</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    {winPatternOptions.map(pattern => (
                      <div key={pattern.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={pattern.id}
                          checked={settings.winPatterns.includes(pattern.id)}
                          onCheckedChange={() => toggleWinPattern(pattern.id)}
                        />
                        <Label htmlFor={pattern.id} className="cursor-pointer">
                          {pattern.label}
                        </Label>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div>
                      <Label>Múltiplos Padrões</Label>
                      <p className="text-sm text-muted-foreground">
                        Permitir vários padrões na mesma rodada
                      </p>
                    </div>
                    <Switch
                      checked={settings.multiplePatterns}
                      onCheckedChange={(v) => updateSetting('multiplePatterns', v)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Desempate */}
          <TabsContent value="tiebreak" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Método de Desempate</CardTitle>
                  <CardDescription>Como resolver empates</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-start space-x-2">
                      <input
                        type="radio"
                        id="method_stone"
                        checked={settings.tieBreakMethod === 'stone'}
                        onChange={() => updateSetting('tieBreakMethod', 'stone')}
                        className="mt-1 text-primary"
                      />
                      <Label htmlFor="method_stone" className="cursor-pointer">
                        <span className="font-medium">Pedra (Número Extra)</span>
                        <p className="text-sm text-muted-foreground">
                          Um número extra é sorteado. Quem tiver o número mais próximo vence.
                        </p>
                      </Label>
                    </div>

                    <div className="flex items-start space-x-2">
                      <input
                        type="radio"
                        id="method_first"
                        checked={settings.tieBreakMethod === 'first_claim'}
                        onChange={() => updateSetting('tieBreakMethod', 'first_claim')}
                        className="mt-1 text-primary"
                      />
                      <Label htmlFor="method_first" className="cursor-pointer">
                        <span className="font-medium">Primeiro a Declarar</span>
                        <p className="text-sm text-muted-foreground">
                          O primeiro jogador a clicar no botão de vitória ganha.
                        </p>
                      </Label>
                    </div>

                    <div className="flex items-start space-x-2">
                      <input
                        type="radio"
                        id="method_split"
                        checked={settings.tieBreakMethod === 'split_prize'}
                        onChange={() => updateSetting('tieBreakMethod', 'split_prize')}
                        className="mt-1 text-primary"
                      />
                      <Label htmlFor="method_split" className="cursor-pointer">
                        <span className="font-medium">Divisão do Prêmio</span>
                        <p className="text-sm text-muted-foreground">
                          O prêmio é dividido igualmente entre os empatados.
                        </p>
                      </Label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Janela de Empate: {settings.tieBreakWindowMs}ms</Label>
                    <Slider
                      value={[settings.tieBreakWindowMs]}
                      onValueChange={([v]) => updateSetting('tieBreakWindowMs', v)}
                      min={1000}
                      max={10000}
                      step={500}
                    />
                    <p className="text-sm text-muted-foreground">
                      Tempo máximo para considerar vitórias simultâneas como empate
                    </p>
                  </div>
                </CardContent>
              </Card>

              {settings.tieBreakMethod === 'stone' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Configurações da Pedra</CardTitle>
                    <CardDescription>Ajuste o número de desempate</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Número Mínimo</Label>
                        <Input
                          type="number"
                          value={settings.stoneMin}
                          onChange={(e) => updateSetting('stoneMin', parseInt(e.target.value))}
                          min={1}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Número Máximo</Label>
                        <Input
                          type="number"
                          value={settings.stoneMax}
                          onChange={(e) => updateSetting('stoneMax', parseInt(e.target.value))}
                          min={settings.stoneMin}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Exibir Pedra Publicamente</Label>
                        <p className="text-sm text-muted-foreground">
                          Mostrar o número sorteado para todos
                        </p>
                      </div>
                      <Switch
                        checked={settings.showStonePublicly}
                        onCheckedChange={(v) => updateSetting('showStonePublicly', v)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Animação Especial</Label>
                        <p className="text-sm text-muted-foreground">
                          Efeitos visuais durante o desempate
                        </p>
                      </div>
                      <Switch
                        checked={settings.tieBreakAnimation}
                        onCheckedChange={(v) => updateSetting('tieBreakAnimation', v)}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Modo TV */}
          <TabsContent value="tv" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Aparência do Modo TV</CardTitle>
                  <CardDescription>Configure a exibição em TVs</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Fonte</Label>
                    <Select value={settings.tvFont} onValueChange={(v) => updateSetting('tvFont', v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {fontOptions.map(font => (
                          <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                            {font}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Tamanho dos Números: {settings.tvFontSize}px</Label>
                    <Slider
                      value={[settings.tvFontSize]}
                      onValueChange={([v]) => updateSetting('tvFontSize', v)}
                      min={48}
                      max={120}
                      step={4}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Cor de Fundo</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={settings.tvBgColor}
                          onChange={(e) => updateSetting('tvBgColor', e.target.value)}
                          className="w-12 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          value={settings.tvBgColor}
                          onChange={(e) => updateSetting('tvBgColor', e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Cor dos Números</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={settings.tvNumberColor}
                          onChange={(e) => updateSetting('tvNumberColor', e.target.value)}
                          className="w-12 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          value={settings.tvNumberColor}
                          onChange={(e) => updateSetting('tvNumberColor', e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Exibição de Informações</CardTitle>
                  <CardDescription>Configure o que mostrar na TV</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Histórico de Vencedores</Label>
                      <p className="text-sm text-muted-foreground">
                        Exibir últimos vencedores
                      </p>
                    </div>
                    <Switch
                      checked={settings.showWinnersHistory}
                      onCheckedChange={(v) => updateSetting('showWinnersHistory', v)}
                    />
                  </div>

                  {settings.showWinnersHistory && (
                    <div className="space-y-2">
                      <Label>Quantidade: {settings.winnersHistoryCount}</Label>
                      <Slider
                        value={[settings.winnersHistoryCount]}
                        onValueChange={([v]) => updateSetting('winnersHistoryCount', v)}
                        min={1}
                        max={10}
                        step={1}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Tempo do Vencedor: {settings.winnerDisplayTime}s</Label>
                    <Slider
                      value={[settings.winnerDisplayTime]}
                      onValueChange={([v]) => updateSetting('winnerDisplayTime', v)}
                      min={5}
                      max={30}
                      step={1}
                    />
                    <p className="text-sm text-muted-foreground">
                      Tempo de exibição da tela de vitória
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Rotação Automática</Label>
                      <p className="text-sm text-muted-foreground">
                        Alternar entre informações automaticamente
                      </p>
                    </div>
                    <Switch
                      checked={settings.autoRotateInfo}
                      onCheckedChange={(v) => updateSetting('autoRotateInfo', v)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* TV Preview */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="h-5 w-5" />
                    Preview do Modo TV
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div 
                    className="aspect-video rounded-xl flex items-center justify-center relative overflow-hidden"
                    style={{ 
                      backgroundColor: settings.tvBgColor,
                      fontFamily: settings.tvFont
                    }}
                  >
                    <div className="text-center">
                      <p className="text-white/60 text-sm mb-2">Último número sorteado</p>
                      <div 
                        className="font-bold animate-pulse"
                        style={{ 
                          fontSize: settings.tvFontSize,
                          color: settings.tvNumberColor
                        }}
                      >
                        S-42
                      </div>
                    </div>
                    <div className="absolute bottom-4 right-4 text-white/40 text-sm">
                      SORTEBEM
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdminDraw;
