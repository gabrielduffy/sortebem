import { Link } from 'react-router-dom';
import { Heart, Mail, Phone, MapPin, Instagram, Facebook, Youtube } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-foreground text-background">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Heart className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold text-primary">SORTBEM</span>
            </Link>
            <p className="text-background/70 text-sm leading-relaxed">
              Sorteios beneficentes que transformam vidas. Cada cartela vendida 
              contribui para instituições que fazem a diferença.
            </p>
            <div className="flex gap-3">
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-primary transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-primary transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-primary transition-colors"
              >
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-lg mb-4 text-primary">Navegação</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/como-funciona" className="text-background/70 hover:text-primary transition-colors">
                  Como Funciona
                </Link>
              </li>
              <li>
                <Link to="/checkout" className="text-background/70 hover:text-primary transition-colors">
                  Comprar Cartelas
                </Link>
              </li>
              <li>
                <Link to="/resgatar" className="text-background/70 hover:text-primary transition-colors">
                  Resgatar Prêmio
                </Link>
              </li>
              <li>
                <Link to="/transparencia" className="text-background/70 hover:text-primary transition-colors">
                  Transparência
                </Link>
              </li>
            </ul>
          </div>

          {/* Parceiros */}
          <div>
            <h4 className="font-semibold text-lg mb-4 text-primary">Para Parceiros</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/estabelecimento/login" className="text-background/70 hover:text-primary transition-colors">
                  Área do Estabelecimento
                </Link>
              </li>
              <li>
                <Link to="/gerente/login" className="text-background/70 hover:text-primary transition-colors">
                  Área do Gerente
                </Link>
              </li>
              <li>
                <Link to="/seja-parceiro" className="text-background/70 hover:text-primary transition-colors">
                  Seja um Parceiro
                </Link>
              </li>
              <li>
                <Link to="/pos-smart2" className="text-background/70 hover:text-primary transition-colors">
                  Integração POS Smart 2
                </Link>
              </li>
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h4 className="font-semibold text-lg mb-4 text-primary">Contato</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-background/70">
                <Mail className="w-5 h-5 text-primary" />
                contato@sortbem.com.br
              </li>
              <li className="flex items-center gap-3 text-background/70">
                <Phone className="w-5 h-5 text-primary" />
                (11) 99999-9999
              </li>
              <li className="flex items-start gap-3 text-background/70">
                <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                São Paulo, SP - Brasil
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-background/10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-background/60">
            <p>© {currentYear} SORTBEM. Todos os direitos reservados.</p>
            <div className="flex gap-6">
              <Link to="/termos" className="hover:text-primary transition-colors">
                Termos de Uso
              </Link>
              <Link to="/privacidade" className="hover:text-primary transition-colors">
                Política de Privacidade
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
