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

Data: {DATA}
Hora: {HORA}
Rodada: #{RODADA}

--------------------------------
CARTELA(S):
{CARTELAS}
--------------------------------

Valor Total: R$ {VALOR}

Acesse: sortebem.com.br/c/{CODIGO}

{QR_CODE}

Guarde este comprovante!
Ele é necessário para resgatar
seu prêmio em caso de vitória.

================================
     BOA SORTE! 🍀
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
                    Variáveis: {'{DATA}'}, {'{HORA}'}, {'{RODADA}'}, {'{CARTELAS}'}, {'{VALOR}'}, {'{CODIGO}'}, {'{QR_CODE}'}
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
                      .replace('{DATA}', '27/12/2024')
                      .replace('{HORA}', '15:30')
                      .replace('{RODADA}', '001')
                      .replace('{CARTELAS}', 'SB-A7K3M9P2\nSB-B8L4N0Q3')
                      .replace('{VALOR}', '10,00')
                      .replace('{CODIGO}', 'SB-A7K3M9P2')
                      .replace('{QR_CODE}', '[QR CODE AQUI]')
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
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
