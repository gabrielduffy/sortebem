import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { Save, Monitor, Smartphone, Printer, QrCode, Download } from 'lucide-react';

export default function AdminPOS() {
  const [config, setConfig] = useState({
    enabled: true,
    printQRCode: true,
    compactMode: false,
  });

  const [receiptTemplate, setReceiptTemplate] = useState(`================================
        SORTEBEM
     Sorteio Beneficente
================================

Data: {DATA}  Hora: {HORA}
Rodada: #{RODADA}

--------------------------------
{CARTELAS_GRADE}
--------------------------------

Valor Total: R$ {VALOR}

Acesse: sortebem.com.br
        para acompanhar!

Guarde este comprovante!
Ele e necessario para resgatar
seu premio em caso de vitoria.

================================
        BOA SORTE!
================================`);

  const handleSave = () => {
    toast({ title: 'Configurações salvas!', description: 'As configurações do POS foram atualizadas.' });
  };

  return (
    <DashboardLayout userType="admin" userName="Administrador" notifications={5}>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Configurações POS</h2>
          <p className="text-muted-foreground">Configure as maquininhas Moderninha Smart 2</p>
        </div>

        <Tabs defaultValue="config" className="space-y-6">
          <TabsList>
            <TabsTrigger value="config">Configurações</TabsTrigger>
            <TabsTrigger value="receipt">Comprovante</TabsTrigger>
            <TabsTrigger value="install">Instalação APK</TabsTrigger>
            <TabsTrigger value="api">Documentação API</TabsTrigger>
          </TabsList>

          <TabsContent value="config" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="w-5 h-5 text-primary" />
                  Configurações Gerais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>POS Habilitado</Label>
                    <p className="text-sm text-muted-foreground">Permitir vendas via maquininha</p>
                  </div>
                  <Switch 
                    checked={config.enabled} 
                    onCheckedChange={(checked) => setConfig({...config, enabled: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Imprimir QR Code</Label>
                    <p className="text-sm text-muted-foreground">Imprimir QR Code de cada cartela no comprovante</p>
                  </div>
                  <Switch 
                    checked={config.printQRCode} 
                    onCheckedChange={(checked) => setConfig({...config, printQRCode: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Modo Compacto</Label>
                    <p className="text-sm text-muted-foreground">Reduzir tamanho do comprovante</p>
                  </div>
                  <Switch 
                    checked={config.compactMode} 
                    onCheckedChange={(checked) => setConfig({...config, compactMode: checked})}
                  />
                </div>
                <Button variant="hero" onClick={handleSave}>
                  <Save className="w-4 h-4" />
                  Salvar Configurações
                </Button>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <Smartphone className="w-12 h-12 text-primary mx-auto mb-4" />
                  <p className="text-2xl font-bold">47</p>
                  <p className="text-sm text-muted-foreground">Terminais Ativos</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <Printer className="w-12 h-12 text-primary mx-auto mb-4" />
                  <p className="text-2xl font-bold">1.234</p>
                  <p className="text-sm text-muted-foreground">Vendas POS Hoje</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <QrCode className="w-12 h-12 text-primary mx-auto mb-4" />
                  <p className="text-2xl font-bold">3.456</p>
                  <p className="text-sm text-muted-foreground">Cartelas Impressas</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="receipt" className="space-y-4">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Template do Comprovante</CardTitle>
                  <CardDescription>Edite o layout do comprovante impresso</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea 
                    value={receiptTemplate}
                    onChange={(e) => setReceiptTemplate(e.target.value)}
                    className="font-mono text-xs h-96"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Variáveis: {'{DATA}'}, {'{HORA}'}, {'{RODADA}'}, {'{CARTELAS_GRADE}'}, {'{VALOR}'}, {'{QR_CODE}'}
                  </p>
                  <Button variant="hero" className="w-full mt-4" onClick={handleSave}>
                    <Save className="w-4 h-4" />
                    Salvar Template
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Preview do Comprovante</CardTitle>
                  <CardDescription>Visualização de como ficará impresso</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-background border-2 border-dashed border-border rounded-xl p-4 font-mono text-xs whitespace-pre-wrap">
                    {receiptTemplate
                      .replace('{DATA}', '04/01/2026')
                      .replace('{HORA}', '15:30')
                      .replace('{RODADA}', '042')
                      .replace('{CARTELAS_GRADE}', `CARTELA: SB-A7K3M9P2

 B   I   N   G   O
-------------------
 3  17  31  47  61
 7  22  35  52  68
12  25  **  55  71
14  28  42  58  73
15  30  44  60  75

[QR CODE]

--------------------------------
CARTELA: SB-B8L4N0Q3

 B   I   N   G   O
-------------------
 2  19  33  48  63
 5  21  37  51  66
 9  24  **  54  69
11  27  41  57  72
13  29  43  59  74

[QR CODE]`)
                      .replace('{VALOR}', '10,00')
                      .replace('{QR_CODE}', '')
                    }
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="install" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="w-5 h-5 text-primary" />
                  Instalação do APK na Moderninha Smart 2
                </CardTitle>
                <CardDescription>Guia passo a passo para instalar o aplicativo SORTEBEM</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">1</div>
                    <div>
                      <h4 className="font-medium">Baixe o APK</h4>
                      <p className="text-sm text-muted-foreground">Faça o download do aplicativo SORTEBEM para Android.</p>
                      <Button variant="outline" className="mt-2">
                        <Download className="w-4 h-4" />
                        Baixar APK (v1.0.0)
                      </Button>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">2</div>
                    <div>
                      <h4 className="font-medium">Transfira para a Maquininha</h4>
                      <p className="text-sm text-muted-foreground">Conecte a Moderninha Smart 2 ao computador via USB e copie o arquivo APK para a pasta Downloads.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">3</div>
                    <div>
                      <h4 className="font-medium">Habilite Fontes Desconhecidas</h4>
                      <p className="text-sm text-muted-foreground">Acesse Configurações → Segurança → Fontes Desconhecidas e ative a opção.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">4</div>
                    <div>
                      <h4 className="font-medium">Instale o APK</h4>
                      <p className="text-sm text-muted-foreground">Abra o gerenciador de arquivos, localize o APK e toque para instalar.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">5</div>
                    <div>
                      <h4 className="font-medium">Configure o Terminal</h4>
                      <p className="text-sm text-muted-foreground">Abra o app SORTEBEM, insira o Terminal ID e a API Key fornecidos no painel do estabelecimento.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-muted rounded-xl p-4">
                  <h4 className="font-medium mb-2">📋 Requisitos</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Moderninha Smart 2 (PagSeguro)</li>
                    <li>• Android 7.0 ou superior</li>
                    <li>• Conexão com internet (Wi-Fi ou dados móveis)</li>
                    <li>• Terminal ID e API Key válidos</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="w-5 h-5 text-primary" />
                  Documentação da API POS
                </CardTitle>
                <CardDescription>Endpoints para integração do APK com o sistema Sortebem</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-muted rounded-xl p-4">
                  <h4 className="font-semibold mb-2">🔐 1. Autenticação do Terminal</h4>
                  <code className="block bg-background p-3 rounded text-xs mb-2">
                    POST /functions/v1/pos-auth
                  </code>
                  <p className="text-sm text-muted-foreground mb-2">Request Body:</p>
                  <pre className="bg-background p-3 rounded text-xs overflow-x-auto">{`{
  "terminal_code": "TERM001",
  "api_key": "sk_pos_xxxxx"
}`}</pre>
                  <p className="text-sm text-muted-foreground mt-2 mb-2">Response:</p>
                  <pre className="bg-background p-3 rounded text-xs overflow-x-auto">{`{
  "success": true,
  "token": "eyJhbGciOiJ...",
  "terminal": { "id": 1, "name": "Caixa 1" },
  "establishment": { "id": 1, "name": "Loja X" }
}`}</pre>
                </div>

                <div className="bg-muted rounded-xl p-4">
                  <h4 className="font-semibold mb-2">📋 2. Obter Rodada Atual</h4>
                  <code className="block bg-background p-3 rounded text-xs mb-2">
                    GET /functions/v1/pos-get-round
                  </code>
                  <p className="text-sm text-muted-foreground mb-2">Headers:</p>
                  <pre className="bg-background p-3 rounded text-xs">{`Authorization: Bearer <token>`}</pre>
                  <p className="text-sm text-muted-foreground mt-2 mb-2">Response:</p>
                  <pre className="bg-background p-3 rounded text-xs overflow-x-auto">{`{
  "success": true,
  "round": {
    "id": 123,
    "number": 42,
    "card_price": 5.00,
    "prize_pool": 2500.00,
    "cards_sold": 450,
    "max_cards": 1000,
    "selling_ends_at": "2024-01-15T20:00:00Z"
  }
}`}</pre>
                </div>

                <div className="bg-muted rounded-xl p-4">
                  <h4 className="font-semibold mb-2">🎫 3. Criar Venda</h4>
                  <code className="block bg-background p-3 rounded text-xs mb-2">
                    POST /functions/v1/pos-create-sale
                  </code>
                  <p className="text-sm text-muted-foreground mb-2">Headers + Body:</p>
                  <pre className="bg-background p-3 rounded text-xs overflow-x-auto">{`Authorization: Bearer <token>

{
  "quantity": 2,
  "customer_name": "João Silva",
  "customer_phone": "11999999999",
  "payment_method": "credit_card",
  "payment_reference": "PAGBANK_TX_123"
}`}</pre>
                  <p className="text-sm text-muted-foreground mt-2 mb-2">Response:</p>
                  <pre className="bg-background p-3 rounded text-xs overflow-x-auto">{`{
  "success": true,
  "transaction_code": "POS-1705350000-ABC123",
  "purchase_id": 456,
  "round_number": 42,
  "quantity": 2,
  "total_amount": 10.00,
  "cards": [
    {
      "id": 789,
      "code": "SB-A7K3M9P2",
      "numbers": [3, 17, 31, 47, 61, 7, 22, 35, 52, 68, 12, 25, 0, 55, 71, 14, 28, 42, 58, 73, 15, 30, 44, 60, 75],
      "numbers_formatted": " B   I   N   G   O\\n-------------------\\n 3  17  31  47  61\\n 7  22  35  52  68\\n12  25  **  55  71\\n14  28  42  58  73\\n15  30  44  60  75\\n",
      "qr_url": "https://sortebem.com.br/c/SB-A7K3M9P2"
    }
  ]
}`}</pre>
                  <p className="text-xs text-muted-foreground mt-2">
                    <strong>Nota:</strong> O campo <code>numbers_formatted</code> já vem formatado para impressão térmica (32 colunas). O centro da cartela (posição 12 no array) é marcado como 0 (FREE).
                  </p>
                </div>

                <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
                  <h4 className="font-semibold text-primary mb-2">📱 Stack Recomendada para o APK</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• <strong>Kotlin Nativo:</strong> Melhor integração com SDK PagBank/PagSeguro</li>
                    <li>• <strong>Android SDK mínimo:</strong> API 24 (Android 7.0)</li>
                    <li>• <strong>Integração PagSeguro:</strong> Usar SDK oficial para Moderninha Smart 2</li>
                    <li>• <strong>Impressão:</strong> Usar API de impressão térmica do dispositivo</li>
                  </ul>
                </div>

                <div className="bg-warning/10 border border-warning/20 rounded-xl p-4">
                  <h4 className="font-semibold text-warning mb-2">⚠️ Tratamento de Erros</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• <strong>401:</strong> Token inválido ou expirado - reautenticar</li>
                    <li>• <strong>403:</strong> Terminal ou estabelecimento desativado</li>
                    <li>• <strong>400:</strong> Dados inválidos ou rodada fechada</li>
                    <li>• Sempre exibir mensagem de erro para o operador</li>
                    <li>• Implementar retry automático para erros de rede</li>
                  </ul>
                </div>

                <div className="bg-muted rounded-xl p-4">
                  <h4 className="font-semibold mb-2">🖨️ Formato do Comprovante</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    O comprovante deve incluir a <strong>grade de números</strong> para o cliente jogar:
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Cabeçalho: Logo/Nome SORTEBEM</li>
                    <li>• Data/Hora da compra</li>
                    <li>• Número da rodada</li>
                    <li>• <strong>Para cada cartela:</strong></li>
                    <li className="ml-4">- Código da cartela (SB-XXXXXXXX)</li>
                    <li className="ml-4">- Grade 5x5 com números (B-I-N-G-O)</li>
                    <li className="ml-4">- Centro marcado com ** (FREE)</li>
                    <li className="ml-4">- QR Code (opcional)</li>
                    <li>• Valor total pago</li>
                    <li>• Aviso para guardar o comprovante</li>
                  </ul>
                  <div className="mt-4 p-3 bg-background rounded font-mono text-xs whitespace-pre">
{`Exemplo de cartela impressa:

CARTELA: SB-A7K3M9P2

 B   I   N   G   O
-------------------
 3  17  31  47  61
 7  22  35  52  68
12  25  **  55  71
14  28  42  58  73
15  30  44  60  75`}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
