import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X, Heart, Trophy, Tv, Gift, Users } from 'lucide-react';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '/como-funciona', label: 'Como Funciona', icon: Heart },
    { href: '/checkout', label: 'Comprar Cartelas', icon: Gift },
    { href: '/resultados', label: 'Resultados', icon: Trophy },
    { href: '/tv/demo', label: 'Modo TV', icon: Tv },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-background/95 backdrop-blur-md shadow-md'
          : 'bg-background/80 backdrop-blur-sm'
      }`}
    >
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between h-14 sm:h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-primary flex items-center justify-center shadow-lg">
              <Heart className="w-4 h-4 sm:w-6 sm:h-6 text-primary-foreground" />
            </div>
            <span className="text-lg sm:text-xl md:text-2xl font-bold text-gradient">
              SORTEBEM
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden xl:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} to={link.href}>
                <Button variant="ghost" size="sm" className="gap-2">
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Button>
              </Link>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden xl:flex items-center gap-2 lg:gap-3">
            <Link to="/estabelecimento/login">
              <Button variant="outline" size="sm" className="gap-2">
                <Users className="w-4 h-4" />
                <span className="hidden lg:inline">Área do Parceiro</span>
                <span className="lg:hidden">Parceiro</span>
              </Button>
            </Link>
            <Link to="/checkout">
              <Button variant="hero" size="default">
                Jogar Agora
              </Button>
            </Link>
          </div>

          {/* Tablet CTA + Mobile Menu Button */}
          <div className="flex xl:hidden items-center gap-2">
            {/* Show CTA on tablet */}
            <Link to="/checkout" className="hidden sm:block">
              <Button variant="hero" size="sm">
                Jogar Agora
              </Button>
            </Link>
            
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-primary/10 transition-colors"
              aria-label="Menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 sm:w-6 sm:h-6 text-foreground" />
              ) : (
                <Menu className="w-5 h-5 sm:w-6 sm:h-6 text-foreground" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="xl:hidden absolute top-full left-0 right-0 bg-background border-b border-border shadow-lg z-50 animate-fade-in">
            <nav className="container mx-auto px-4 py-4 flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Button variant="ghost" className="w-full justify-start gap-3 h-12">
                    <link.icon className="w-5 h-5" />
                    {link.label}
                  </Button>
                </Link>
              ))}
              <div className="border-t border-border pt-3 mt-2 flex flex-col gap-2">
                <Link to="/estabelecimento/login" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full h-12">
                    <Users className="w-5 h-5" />
                    Área do Parceiro
                  </Button>
                </Link>
                <Link to="/checkout" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="hero" className="w-full h-12">
                    <Gift className="w-5 h-5" />
                    Jogar Agora
                  </Button>
                </Link>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
