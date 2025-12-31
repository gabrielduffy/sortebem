import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Wallet,
  Monitor,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  Building2,
  Users,
  Gift,
  Trophy,
  MessageSquare,
  FileText,
  ChevronDown,
  UserPlus,
  Dices,
  Plug,
  Bot
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { NotificationCenter, useNotifications } from '@/components/notifications/NotificationCenter';
import { useAuth } from '@/hooks/useAuth';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  userType: 'admin' | 'manager' | 'establishment';
  userName: string;
  notifications?: number;
}

const adminNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Financeiro', href: '/admin/financeiro', icon: Wallet },
  { label: 'Configurações', href: '/admin/configuracoes', icon: Settings },
  { label: 'Sorteio', href: '/admin/sorteio', icon: Dices },
  { label: 'Instituição do Mês', href: '/admin/instituicao', icon: Gift },
  { label: 'Rodadas', href: '/admin/rodadas', icon: Trophy },
  { label: 'Gerentes', href: '/admin/gerentes', icon: Users },
  { label: 'Estabelecimentos', href: '/admin/estabelecimentos', icon: Building2 },
  { label: 'Jogadores', href: '/admin/jogadores', icon: Bot },
  { label: 'Integrações', href: '/admin/integracoes', icon: Plug },
  { label: 'Configurações POS', href: '/admin/pos', icon: Monitor },
  { label: 'Logs/Auditoria', href: '/admin/logs', icon: FileText },
];

const managerNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/gerente', icon: LayoutDashboard },
  { label: 'Minha Rede', href: '/gerente/rede', icon: Building2 },
  { label: 'Comissões', href: '/gerente/comissoes', icon: Wallet },
  { label: 'Cadastrar Estabelecimento', href: '/gerente/cadastrar', icon: UserPlus },
  { label: 'Meu Perfil', href: '/gerente/perfil', icon: User },
];

const establishmentNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/estabelecimento', icon: LayoutDashboard },
  { label: 'Vendas', href: '/estabelecimento/vendas', icon: ShoppingCart },
  { label: 'Financeiro', href: '/estabelecimento/financeiro', icon: Wallet },
  { label: 'Terminais POS', href: '/estabelecimento/pos', icon: Monitor },
  { label: 'Modo TV', href: '/estabelecimento/modo-tv', icon: Monitor },
  { label: 'Meu Perfil', href: '/estabelecimento/perfil', icon: User },
];

const getNavItems = (userType: 'admin' | 'manager' | 'establishment'): NavItem[] => {
  switch (userType) {
    case 'admin':
      return adminNavItems;
    case 'manager':
      return managerNavItems;
    case 'establishment':
      return establishmentNavItems;
    default:
      return [];
  }
};

const getUserTypeLabel = (userType: 'admin' | 'manager' | 'establishment'): string => {
  switch (userType) {
    case 'admin':
      return 'Administrador';
    case 'manager':
      return 'Gerente';
    case 'establishment':
      return 'Estabelecimento';
    default:
      return '';
  }
};

export const DashboardLayout = ({ children, userType, userName }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const navItems = getNavItems(userType);
  const { logout } = useAuth();

  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-card border-b border-border z-50 flex items-center justify-between px-4">
        <button onClick={() => setSidebarOpen(true)} className="p-2">
          <Menu className="h-6 w-6 text-foreground" />
        </button>
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="SORTEBEM" className="h-8" />
        </Link>
        <NotificationCenter
          notifications={notifications}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
          onDelete={deleteNotification}
        />
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 h-full w-64 bg-card border-r border-border z-50 transform transition-transform duration-300 lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-border">
            <Link to="/" className="flex items-center gap-2">
              <img src="/logo.png" alt="SORTEBEM" className="h-8" />
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2">
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{userName}</p>
                <p className="text-sm text-muted-foreground">{getUserTypeLabel(userType)}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <Badge variant="secondary" className="h-5 min-w-5 flex items-center justify-center">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-border">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
              Sair
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Desktop Header */}
        <header className="hidden lg:flex h-16 bg-card border-b border-border items-center justify-between px-6">
          <h1 className="text-xl font-semibold text-foreground">
            {navItems.find(item => item.href === location.pathname)?.label || 'Dashboard'}
          </h1>
          <div className="flex items-center gap-4">
            <NotificationCenter
              notifications={notifications}
              onMarkAsRead={markAsRead}
              onMarkAllAsRead={markAllAsRead}
              onDelete={deleteNotification}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 p-2 hover:bg-muted rounded-lg transition-colors">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <span className="font-medium text-foreground">{userName}</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card border border-border shadow-lg z-50">
                <DropdownMenuItem onClick={() => navigate(`/${userType === 'establishment' ? 'estabelecimento' : userType === 'manager' ? 'gerente' : 'admin'}/perfil`)}>
                  <User className="h-4 w-4 mr-2" />
                  Meu Perfil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-6 pt-20 lg:pt-6">
          {children}
        </main>
      </div>
    </div>
  );
};
