import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  CreditCard, 
  Copy, 
  Check,
  MessageCircle,
  ArrowRight,
  Store,
  Gift,
  Shield,
  Clock
} from 'lucide-react';
import PublicLayout from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createPixPurchase, pollPurchaseStatus, generateCards, saveBuyerWhatsapp, sendCardsWhatsapp } from '@/services/mockApi';
import { mockSettings, mockEstablishment } from '@/services/mockData';
import { toast } from '@/hooks/use-toast';

type CheckoutStep = 'quantity' | 'payment' | 'confirmed';

const Checkout = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const establishmentCode = searchParams.get('ref') || null;

  const [step, setStep] = useState<CheckoutStep>('quantity');
  const [quantity, setQuantity] = useState(1);
  const [pixData, setPixData] = useState<{
    purchaseId: string;
    pixCode: string;
    pixQrCode: string;
    amount: number;
  } | null>(null);
  const [generatedCards, setGeneratedCards] = useState<any[]>([]);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedPix, setCopiedPix] = useState(false);
  const [copiedCard, setCopiedCard] = useState<string | null>(null);
  const [whatsappSent, setWhatsappSent] = useState(false);

  const unitPrice = mockSettings.cardPriceRegular;
  const totalPrice = quantity * unitPrice;

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1) {
      setQuantity(newQuantity);
    }
  };

  const handleGeneratePix = async () => {
    setIsProcessing(true);
    try {
      const pix = await createPixPurchase(quantity, establishmentCode || 'default');
      setPixData(pix);
      setStep('payment');
      
      // Start polling for payment status
      pollForPayment(pix.purchaseId);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível gerar o Pix. Tente novamente.',
        variant: 'destructive',
      });
    }
    setIsProcessing(false);
  };

  const pollForPayment = async (purchaseId: string) => {
    let attempts = 0;
    const maxAttempts = 60; // 3 minutes

    const poll = async () => {
      if (attempts >= maxAttempts) return;
      
      const status = await pollPurchaseStatus(purchaseId);
      
      if (status === 'confirmed') {
        // Generate cards
        const cards = await generateCards(purchaseId, quantity, establishmentCode || 'default');
        setGeneratedCards(cards);
        setStep('confirmed');
        toast({
          title: '✅ Pagamento confirmado!',
          description: 'Suas cartelas foram geradas com sucesso.',
        });
      } else {
        attempts++;
        setTimeout(poll, 3000);
      }
    };

    poll();
  };

  // For demo: simulate confirmation after 5 seconds
  const handleSimulatePayment = async () => {
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    const cards = await generateCards(pixData?.purchaseId || 'demo', quantity, establishmentCode || 'default');
    setGeneratedCards(cards);
    setStep('confirmed');
    setIsProcessing(false);
  };

  const handleCopyPix = () => {
    if (!pixData) return;
    navigator.clipboard.writeText(pixData.pixCode);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2000);
    toast({ title: 'Código Pix copiado!' });
  };

  const handleCopyCardCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCard(code);
    setTimeout(() => setCopiedCard(null), 2000);
    toast({ title: 'Código da cartela copiado!' });
  };

  const handleSendWhatsapp = async () => {
    if (!whatsappNumber || whatsappNumber.length < 10) {
      toast({
        title: 'Número inválido',
        description: 'Digite um número de WhatsApp válido com DDD.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    await saveBuyerWhatsapp(pixData?.purchaseId || '', whatsappNumber);
    await sendCardsWhatsapp(generatedCards.map(c => c.code), whatsappNumber);
    setWhatsappSent(true);
    setIsProcessing(false);
    toast({
      title: '📱 Enviado!',
      description: 'Suas cartelas foram enviadas por WhatsApp.',
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-2xl mx-auto">
          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-4 mb-8">
            {['Quantidade', 'Pagamento', 'Confirmação'].map((label, index) => {
              const stepIndex = ['quantity', 'payment', 'confirmed'].indexOf(step);
              const isActive = index <= stepIndex;
              
              return (
                <div key={label} className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
                      ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                  >
                    {index + 1}
                  </div>
                  <span className={`hidden sm:inline ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {label}
                  </span>
                  {index < 2 && <div className="w-8 h-0.5 bg-border mx-2" />}
                </div>
              );
            })}
          </div>

          {/* Step 1: Quantity */}
          {step === 'quantity' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  Comprar Cartelas
                </h1>
                <p className="text-muted-foreground">
                  Escolha a quantidade e participe do próximo sorteio!
                </p>
              </div>

              {/* Establishment Info */}
              {establishmentCode && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center gap-3">
                  <Store className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Vendedor</p>
                    <p className="font-semibold text-foreground">{mockEstablishment.tradeName}</p>
                  </div>
                </div>
              )}

              {/* Quantity Selector */}
              <div className="bg-card border border-border rounded-2xl p-6">
                <Label className="text-lg mb-4 block">Quantidade de Cartelas</Label>
                
                <div className="flex items-center justify-center gap-4 mb-6">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  
                  <span className="text-4xl font-bold text-primary w-20 text-center">
                    {quantity}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleQuantityChange(1)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-2 text-sm border-t border-border pt-4">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Valor por cartela</span>
                    <span>{formatCurrency(unitPrice)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-foreground">
                    <span>Total</span>
                    <span className="text-primary">{formatCurrency(totalPrice)}</span>
                  </div>
                </div>
              </div>

              {/* Quick Select */}
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 20, 50].map(q => (
                  <Button
                    key={q}
                    variant={quantity === q ? 'default' : 'outline'}
                    onClick={() => setQuantity(q)}
                    className="text-lg"
                  >
                    {q}
                  </Button>
                ))}
              </div>

              {/* Info Cards */}
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="bg-secondary rounded-xl p-4 text-center">
                  <Gift className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Rodada a cada</p>
                  <p className="font-semibold">10 minutos</p>
                </div>
                <div className="bg-secondary rounded-xl p-4 text-center">
                  <Shield className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Pagamento</p>
                  <p className="font-semibold">100% Seguro</p>
                </div>
                <div className="bg-secondary rounded-xl p-4 text-center">
                  <Clock className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Confirmação</p>
                  <p className="font-semibold">Instantânea</p>
                </div>
              </div>

              <Button
                variant="hero"
                size="xl"
                className="w-full"
                onClick={handleGeneratePix}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <span className="animate-spin mr-2">⏳</span>
                ) : (
                  <CreditCard className="w-5 h-5" />
                )}
                Pagar com Pix
                <ArrowRight className="w-5 h-5" />
              </Button>
            </motion.div>
          )}

          {/* Step 2: Payment */}
          {step === 'payment' && pixData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  Pagamento via Pix
                </h1>
                <p className="text-muted-foreground">
                  Escaneie o QR Code ou copie o código Pix
                </p>
              </div>

              <div className="bg-card border border-border rounded-2xl p-6">
                {/* Amount */}
                <div className="text-center mb-6">
                  <p className="text-sm text-muted-foreground">Valor a pagar</p>
                  <p className="text-4xl font-bold text-primary">
                    {formatCurrency(pixData.amount)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {quantity} cartela{quantity > 1 ? 's' : ''}
                  </p>
                </div>

                {/* QR Code */}
                <div className="flex justify-center mb-6">
                  <div className="bg-background p-4 rounded-xl">
                    <QRCodeSVG
                      value={pixData.pixCode}
                      size={200}
                      level="H"
                      includeMargin
                    />
                  </div>
                </div>

                {/* Pix Code */}
                <div className="space-y-2">
                  <Label>Código Pix (Copia e Cola)</Label>
                  <div className="flex gap-2">
                    <Input
                      value={pixData.pixCode}
                      readOnly
                      className="font-mono text-xs"
                    />
                    <Button variant="outline" onClick={handleCopyPix}>
                      {copiedPix ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="font-medium text-primary">Aguardando pagamento...</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  O pagamento será confirmado automaticamente
                </p>
              </div>

              {/* Demo Button */}
              <Button
                variant="outline"
                className="w-full"
                onClick={handleSimulatePayment}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processando...' : '(Demo) Simular Confirmação'}
              </Button>
            </motion.div>
          )}

          {/* Step 3: Confirmed */}
          {step === 'confirmed' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-10 h-10 text-success" />
                </div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  Pagamento Confirmado! ✅
                </h1>
                <p className="text-muted-foreground">
                  Suas cartelas foram geradas com sucesso
                </p>
              </div>

              {/* Generated Cards */}
              <div className="bg-card border border-border rounded-2xl p-6">
                <h2 className="font-semibold text-lg mb-4">
                  Suas Cartelas ({generatedCards.length})
                </h2>
                
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {generatedCards.map((card, index) => (
                    <div
                      key={card.id}
                      className="flex items-center justify-between bg-secondary rounded-xl p-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">#{index + 1}</span>
                        <code className="bg-primary/10 text-primary px-3 py-1 rounded font-mono font-bold">
                          {card.code}
                        </code>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyCardCode(card.code)}
                        >
                          {copiedCard === card.code ? (
                            <Check className="w-4 h-4 text-success" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                        <Link to={`/c/${card.code}`}>
                          <Button variant="outline" size="sm">
                            Abrir
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Open First Card */}
              {generatedCards.length > 0 && (
                <Link to={`/c/${generatedCards[0].code}`}>
                  <Button variant="hero" size="xl" className="w-full">
                    <ShoppingCart className="w-5 h-5" />
                    Abrir Cartela Agora
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
              )}

              {/* WhatsApp */}
              <div className="bg-card border border-border rounded-2xl p-6">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-success" />
                  Receber no WhatsApp
                </h3>
                
                {!whatsappSent ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="whatsapp">WhatsApp (com DDD)</Label>
                      <Input
                        id="whatsapp"
                        type="tel"
                        placeholder="11999999999"
                        value={whatsappNumber}
                        onChange={(e) => setWhatsappNumber(e.target.value.replace(/\D/g, ''))}
                        maxLength={11}
                      />
                    </div>
                    <Button
                      variant="success"
                      className="w-full"
                      onClick={handleSendWhatsapp}
                      disabled={isProcessing}
                    >
                      <MessageCircle className="w-4 h-4" />
                      Enviar Cartelas no WhatsApp
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-success py-4">
                    <Check className="w-5 h-5" />
                    <span className="font-medium">Cartelas enviadas com sucesso!</span>
                  </div>
                )}
              </div>

              {/* Important Notice */}
              <div className="bg-warning/10 border border-warning/20 rounded-xl p-4">
                <p className="text-sm text-warning font-medium">
                  ⚠️ Guarde o código da cartela para resgatar seu prêmio em caso de vitória!
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </PublicLayout>
  );
};

export default Checkout;
