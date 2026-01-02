import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Mail, Phone } from 'lucide-react';
import { LegalModal } from '@/components/legal/LegalModal';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [legalModal, setLegalModal] = useState<'terms' | 'privacy' | 'transparency' | null>(null);

  return (
    <>
      <footer className="bg-foreground text-background">
        {/* Main Footer */}
        <div className="container mx-auto px-4 py-8 md:py-12 lg:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 lg:gap-12">
            {/* Brand */}
            <div className="space-y-4 sm:col-span-2 lg:col-span-1">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                  <Heart className="w-6 h-6 text-primary-foreground" />
                </div>
                <span className="text-xl md:text-2xl font-bold text-primary">SORTEBEM</span>
              </Link>
              <p className="text-background/70 text-sm leading-relaxed max-w-xs">
                Sorteios beneficentes que transformam vidas. Cada cartela vendida 
                contribui para instituições que fazem a diferença.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-semibold text-base md:text-lg mb-3 md:mb-4 text-primary">Navegação</h4>
              <ul className="space-y-2 md:space-y-3">
                <li>
                  <Link to="/como-funciona" className="text-sm md:text-base text-background/70 hover:text-primary transition-colors">
                    Como Funciona
                  </Link>
                </li>
                <li>
                  <Link to="/checkout" className="text-sm md:text-base text-background/70 hover:text-primary transition-colors">
                    Comprar Cartelas
                  </Link>
                </li>
                <li>
                  <Link to="/resultados" className="text-sm md:text-base text-background/70 hover:text-primary transition-colors">
                    Resultados
                  </Link>
                </li>
                <li>
                  <button 
                    onClick={() => setLegalModal('transparency')} 
                    className="text-sm md:text-base text-background/70 hover:text-primary transition-colors"
                  >
                    Transparência
                  </button>
                </li>
              </ul>
            </div>

            {/* Parceiros */}
            <div>
              <h4 className="font-semibold text-base md:text-lg mb-3 md:mb-4 text-primary">Para Parceiros</h4>
              <ul className="space-y-2 md:space-y-3">
                <li>
                  <Link to="/estabelecimento/login" className="text-sm md:text-base text-background/70 hover:text-primary transition-colors">
                    Área do Estabelecimento
                  </Link>
                </li>
                <li>
                  <Link to="/gerente/login" className="text-sm md:text-base text-background/70 hover:text-primary transition-colors">
                    Área do Gerente
                  </Link>
                </li>
                <li>
                  <Link to="/seja-parceiro" className="text-sm md:text-base text-background/70 hover:text-primary transition-colors">
                    Seja um Parceiro
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contato */}
            <div>
              <h4 className="font-semibold text-base md:text-lg mb-3 md:mb-4 text-primary">Contato</h4>
              <ul className="space-y-2 md:space-y-3">
                <li className="flex items-center gap-3 text-sm md:text-base text-background/70">
                  <Mail className="w-4 h-4 md:w-5 md:h-5 text-primary flex-shrink-0" />
                  <span className="break-all">contato@sortebem.com.br</span>
                </li>
                <li className="flex items-center gap-3 text-sm md:text-base text-background/70">
                  <Phone className="w-4 h-4 md:w-5 md:h-5 text-primary flex-shrink-0" />
                  (11) 99999-9999
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-background/10">
          <div className="container mx-auto px-4 py-4 md:py-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 md:gap-4 text-xs md:text-sm text-background/60">
              <p className="text-center sm:text-left">© {currentYear} SORTEBEM. Todos os direitos reservados.</p>
              <div className="flex flex-wrap justify-center gap-4 md:gap-6">
                <button 
                  onClick={() => setLegalModal('terms')} 
                  className="hover:text-primary transition-colors"
                >
                  Termos de Uso
                </button>
                <button 
                  onClick={() => setLegalModal('privacy')} 
                  className="hover:text-primary transition-colors"
                >
                  Política de Privacidade
                </button>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Legal Modals */}
      <LegalModal 
        type="terms" 
        open={legalModal === 'terms'} 
        onOpenChange={(open) => !open && setLegalModal(null)} 
      />
      <LegalModal 
        type="privacy" 
        open={legalModal === 'privacy'} 
        onOpenChange={(open) => !open && setLegalModal(null)} 
      />
      <LegalModal 
        type="transparency" 
        open={legalModal === 'transparency'} 
        onOpenChange={(open) => !open && setLegalModal(null)} 
      />
    </>
  );
};

export default Footer;