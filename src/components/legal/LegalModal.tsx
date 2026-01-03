import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { FileText, Shield, Eye, X } from 'lucide-react';
import { apiService } from '@/services/api';

interface LegalModalProps {
  type: 'terms' | 'privacy' | 'transparency';
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const defaultTerms = `📜 TERMOS DE USO - SORTEBEM

Última atualização: 02 de janeiro de 2025

1. ACEITAÇÃO DOS TERMOS

Ao acessar e utilizar a plataforma SorteBem ("Plataforma"), seja através do website, aplicativo móvel ou terminais POS em estabelecimentos credenciados, você ("Usuário", "Participante" ou "você") concorda integralmente com estes Termos de Uso ("Termos"). Se você não concorda com qualquer disposição destes Termos, não utilize a Plataforma.

A SorteBem é operada por [NOME DA EMPRESA], CNPJ [NÚMERO], com sede em [ENDEREÇO COMPLETO] ("SorteBem", "nós" ou "nossa").

2. DESCRIÇÃO DO SERVIÇO

2.1. Natureza do Serviço

A SorteBem é uma plataforma digital de bingo beneficente que conecta participantes a rodadas de bingo online com finalidade social. Todo o sistema opera sob o conceito de bingo beneficente regulamentado pela legislação brasileira, especificamente:
• Lei nº 13.756/2018 (Lei das Apostas Esportivas)
• Decreto-Lei nº 204/1967 (Regulamenta loterias e sorteios)
• Lei nº 9.790/1999 (Lei das OSCIP)
• Portaria MF nº 67/2018 (Regulamenta apostas de quota fixa)

2.2. Finalidade Social

100% do lucro líquido da SorteBem é destinado a instituições de caridade devidamente registradas e certificadas. A distribuição ocorre da seguinte forma:
• Instituições Beneficiárias: Certificadas como OSCIP, OSC ou entidades filantrópicas com CEBAS
• Transparência: Todas as doações são publicadas mensalmente no website
• Destinação: As instituições são escolhidas através de votação pelos usuários

3. REQUISITOS PARA PARTICIPAÇÃO

3.1. Elegibilidade

Para participar da SorteBem, você deve:
• Ter 18 (dezoito) anos completos ou mais
• Estar localizado em território brasileiro
• Possuir CPF válido e regularizado
• Fornecer informações cadastrais verdadeiras e atualizadas
• Ter capacidade civil plena para contrair obrigações

4. AQUISIÇÃO DE CARTELAS

4.1. Canais de Venda

As cartelas podem ser adquiridas através de:
• Website: sortebem.com.br
• Aplicativo Móvel: Android e iOS
• Estabelecimentos Credenciados: Pontos de venda físicos com terminais POS

4.2. Preços e Pagamento

• Valores: Definidos por rodada, variando conforme premiação
• Formas de Pagamento: PIX (instantâneo), Cartão de crédito
• Confirmação: A participação só é válida após confirmação do pagamento

5. RODADAS E SORTEIOS

5.1. Programação

As rodadas são pré-agendadas e públicas, iniciando pontualmente no horário programado.

5.2. Mecânica do Sorteio

• Sistema RNG: Random Number Generator certificado e auditável
• Transparência: Todos os números sorteados são registrados
• Sequência: Os números são sorteados até que haja um vencedor

6. PRÊMIOS E RESGATES

6.1. Estrutura de Premiação

• Valor do Prêmio: Definido para cada rodada
• Tributação: Prêmios acima de R$ 2.112,00 estão sujeitos a IR (30%)

6.2. Processo de Resgate

• Solicitação: Usuário pode solicitar saque a qualquer momento
• Valor Mínimo: R$ 10,00 (dez reais)
• Forma de Pagamento: Transferência via PIX
• Prazo: Até 5 (cinco) dias úteis após solicitação

7. CONTATO

Para questões sobre estes Termos de Uso:

SorteBem
E-mail: juridico@sortebem.com.br
E-mail DPO: privacidade@sortebem.com.br

Versão 1.0 - Janeiro/2025`;

const defaultPrivacy = `🔒 POLÍTICA DE PRIVACIDADE - SORTEBEM

Última atualização: 02 de janeiro de 2025

1. INTRODUÇÃO

A presente Política de Privacidade descreve como a SorteBem coleta, utiliza, armazena, compartilha e protege os dados pessoais de seus usuários.

Esta Política foi elaborada em conformidade com a Lei Geral de Proteção de Dados Pessoais (LGPD - Lei nº 13.709/2018) e demais normas aplicáveis à proteção de dados pessoais no Brasil.

2. DADOS PESSOAIS COLETADOS

2.1. Dados Fornecidos Diretamente

Durante o Cadastro:
• Identificação: Nome completo, CPF, RG, data de nascimento
• Contato: E-mail, telefone celular com DDD
• Endereço: CEP, logradouro, número, complemento, bairro, cidade, estado
• Financeiros: Chave PIX para eventual resgate de prêmios

Durante o Uso:
• Transacionais: Histórico de compras de cartelas, valores pagos
• Participação: Rodadas participadas, cartelas adquiridas

2.2. Dados Coletados Automaticamente

Informações de Dispositivo e Conexão:
• Identificadores: Endereço IP, tipo de dispositivo
• Navegação: Sistema operacional, versão do navegador

3. FINALIDADES DO TRATAMENTO

Os dados pessoais são tratados para:
• Cadastro e autenticação de usuários
• Processamento de pagamentos e resgates
• Cumprimento de obrigações legais e regulatórias
• Combate à fraude e lavagem de dinheiro
• Comunicação sobre rodadas, resultados e promoções

4. COMPARTILHAMENTO DE DADOS

4.1. Prestadores de Serviços

• Processadores de Pagamento: Para efetuar transações financeiras
• Infraestrutura: Hospedagem e banco de dados na nuvem

4.2. Autoridades Públicas

Quando exigido por lei ou ordem judicial.

5. SEGURANÇA DA INFORMAÇÃO

Medidas Técnicas:
• Criptografia: TLS 1.3 (HTTPS) em todas as comunicações
• Controle de Acesso: Princípio do Menor Privilégio
• Monitoramento: Análise de logs em tempo real

6. DIREITOS DO TITULAR DE DADOS

Conforme a LGPD, você tem direito a:
• Confirmação e Acesso aos seus dados
• Correção de dados incompletos ou incorretos
• Anonimização, Bloqueio ou Eliminação de dados desnecessários
• Portabilidade dos dados
• Revogação de consentimento
• Oposição a determinados tratamentos

Como exercer:
• E-mail: privacidade@sortebem.com.br
• Prazo de resposta: Até 15 dias corridos

7. ENCARREGADO DE DADOS (DPO)

E-mail: privacidade@sortebem.com.br

8. AUTORIDADE DE PROTEÇÃO DE DADOS

Se você não estiver satisfeito, pode contatar a ANPD:
Website: https://www.gov.br/anpd/

9. CONTATO

SorteBem
E-mail: suporte@sortebem.com.br
Privacidade: privacidade@sortebem.com.br

Versão 1.0 - Janeiro/2025`;

const defaultTransparency = `📊 TRANSPARÊNCIA - SORTEBEM

Última atualização: 02 de janeiro de 2025

COMPROMISSO COM A TRANSPARÊNCIA

A SorteBem tem como princípio fundamental a total transparência em todas as suas operações. Acreditamos que a confiança dos nossos usuários é construída através da clareza e honestidade em cada aspecto do nosso negócio.

1. DISTRIBUIÇÃO DOS RECURSOS

Cada cartela vendida contribui para:

💰 40% - PRÊMIO DO VENCEDOR
O maior percentual vai diretamente para quem ganha o sorteio.

❤️ 20% - INSTITUIÇÕES BENEFICENTES
Parte significativa de cada venda é destinada a causas sociais.

🏪 20% - COMISSÃO DOS PARCEIROS
Estabelecimentos e gerentes que ajudam a expandir nossa rede.

🔧 10% - MANUTENÇÃO DA PLATAFORMA
Custos operacionais, tecnologia e segurança.

🎁 10% - POOLS ACUMULADOS
Formação de prêmios especiais e bônus.

2. INSTITUIÇÕES APOIADAS

Mensalmente, publicamos relatórios detalhados sobre:
• Total arrecadado para cada instituição
• Comprovantes de transferências realizadas
• Impacto social gerado

As instituições beneficiárias são:
• Certificadas como OSCIP, OSC ou entidades filantrópicas
• Auditadas regularmente
• Escolhidas através de votação da comunidade

3. RELATÓRIOS MENSAIS

Todo mês disponibilizamos:
• Total de cartelas vendidas
• Valor total em prêmios distribuídos
• Valor total destinado à caridade
• Lista de ganhadores (com consentimento)

4. AUDITORIA E CONFORMIDADE

Sistema RNG Certificado:
Nosso gerador de números aleatórios é certificado e auditável, garantindo total imparcialidade nos sorteios.

Compliance:
Operamos em conformidade com todas as regulamentações brasileiras aplicáveis a sorteios beneficentes.

5. CANAIS DE DENÚNCIA

Caso identifique qualquer irregularidade:
E-mail: denuncia@sortebem.com.br
Canal anônimo: sortebem.com.br/denuncia

6. COMPROMISSO SOCIAL

A SorteBem não é apenas uma plataforma de sorteios - somos uma comunidade comprometida com a transformação social. Cada participação contribui para um Brasil mais solidário.

Junte-se a nós nessa missão! ❤️

---

Para mais informações:
E-mail: transparencia@sortebem.com.br

Versão 1.0 - Janeiro/2025`;

const modalConfig = {
  terms: {
    title: 'Termos de Uso',
    icon: FileText,
    settingKey: 'legal_terms',
  },
  privacy: {
    title: 'Política de Privacidade',
    icon: Shield,
    settingKey: 'legal_privacy',
  },
  transparency: {
    title: 'Transparência',
    icon: Eye,
    settingKey: 'legal_transparency',
  },
};

const getDefaultContent = (type: 'terms' | 'privacy' | 'transparency') => {
  switch (type) {
    case 'terms':
      return defaultTerms;
    case 'privacy':
      return defaultPrivacy;
    case 'transparency':
      return defaultTransparency;
  }
};

export function LegalModal({ type, open, onOpenChange }: LegalModalProps) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const config = modalConfig[type];
  const Icon = config.icon;

  useEffect(() => {
    const loadContent = async () => {
      if (!open) return;
      
      setLoading(true);
      try {
        const response = await apiService.getSettings();
        if (response.ok && response.data) {
          const setting = response.data.find((s: any) => s.key === config.settingKey);
          if (setting && setting.value) {
            setContent(typeof setting.value === 'string' ? setting.value : JSON.stringify(setting.value));
          } else {
            setContent(getDefaultContent(type));
          }
        } else {
          setContent(getDefaultContent(type));
        }
      } catch (error) {
        console.error('Error loading legal content:', error);
        setContent(getDefaultContent(type));
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [open, type, config.settingKey]);

  const formatContent = (text: string) => {
    return text.split('\n').map((line, index) => {
      // Main titles (all caps or with emoji)
      if (/^[📜🔒📊]/.test(line) || /^[A-ZÁÉÍÓÚÀÂÊÎÔÛÃÕÇ\s-]{10,}$/.test(line.trim())) {
        return (
          <h2 key={index} className="text-xl md:text-2xl font-bold text-primary mt-6 mb-3 first:mt-0">
            {line}
          </h2>
        );
      }
      
      // Section numbers (1. TITLE)
      if (/^\d+\.\s+[A-ZÁÉÍÓÚÀÂÊÎÔÛÃÕÇ]/.test(line)) {
        return (
          <h3 key={index} className="text-lg font-semibold text-foreground mt-6 mb-2 border-b border-border pb-2">
            {line}
          </h3>
        );
      }
      
      // Subsection numbers (2.1. Title)
      if (/^\d+\.\d+\.\s+/.test(line)) {
        return (
          <h4 key={index} className="text-base font-medium text-foreground mt-4 mb-2">
            {line}
          </h4>
        );
      }
      
      // Bullet points
      if (/^[•●○◦-]\s/.test(line) || /^[💰❤️🏪🔧🎁]\s/.test(line)) {
        return (
          <li key={index} className="ml-4 text-muted-foreground mb-1 list-none flex items-start gap-2">
            <span className="text-primary mt-1">•</span>
            <span>{line.replace(/^[•●○◦-]\s/, '')}</span>
          </li>
        );
      }
      
      // Emoji highlights
      if (/^[💰❤️🏪🔧🎁📊📜🔒]/.test(line)) {
        return (
          <div key={index} className="bg-primary/5 border-l-4 border-primary pl-4 py-2 my-3 rounded-r-lg">
            <span className="text-foreground font-medium">{line}</span>
          </div>
        );
      }
      
      // Date/version line
      if (/^(Última atualização|Versão)/.test(line)) {
        return (
          <p key={index} className="text-sm text-muted-foreground italic mb-4">
            {line}
          </p>
        );
      }
      
      // Empty lines
      if (!line.trim()) {
        return <div key={index} className="h-2" />;
      }
      
      // Regular paragraphs
      return (
        <p key={index} className="text-muted-foreground mb-2 leading-relaxed">
          {line}
        </p>
      );
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b border-border bg-gradient-to-r from-primary/5 to-transparent sticky top-0 z-10">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            {config.title}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1 max-h-[calc(90vh-120px)]">
          <div className="px-6 py-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : (
              <div className="prose prose-sm max-w-none">
                {formatContent(content)}
              </div>
            )}
          </div>
        </ScrollArea>
        
      </DialogContent>
    </Dialog>
  );
}

export default LegalModal;
