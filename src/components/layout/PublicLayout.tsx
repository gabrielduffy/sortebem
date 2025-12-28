import { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';

interface PublicLayoutProps {
  children: ReactNode;
  hideHeader?: boolean;
  hideFooter?: boolean;
}

const PublicLayout = ({ children, hideHeader = false, hideFooter = false }: PublicLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      {!hideHeader && <Header />}
      <main className={`flex-1 ${!hideHeader ? 'pt-16 md:pt-20' : ''}`}>
        {children}
      </main>
      {!hideFooter && <Footer />}
    </div>
  );
};

export default PublicLayout;
