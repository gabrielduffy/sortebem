import { useState, useEffect } from 'react';
import { Bell, Check, Trash2, ShoppingCart, Trophy, AlertCircle, Monitor, MessageSquare, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export interface Notification {
  id: string;
  category: 'sales' | 'rounds' | 'prizes' | 'system' | 'pos' | 'whatsapp';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

interface NotificationCenterProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: string) => void;
}

const categoryIcons = {
  sales: ShoppingCart,
  rounds: Trophy,
  prizes: Trophy,
  system: Settings,
  pos: Monitor,
  whatsapp: MessageSquare,
};

const categoryColors = {
  sales: 'text-primary',
  rounds: 'text-warning',
  prizes: 'text-success',
  system: 'text-muted-foreground',
  pos: 'text-primary',
  whatsapp: 'text-success',
};

export const NotificationCenter = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
}: NotificationCenterProps) => {
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}min`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 text-xs animate-pulse"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-80 md:w-96 bg-card border border-border shadow-xl z-50"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <span className="font-semibold text-foreground">Notificações</span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs">{unreadCount} novas</Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs text-primary hover:text-primary"
              onClick={onMarkAllAsRead}
            >
              <Check className="h-3 w-3 mr-1" />
              Marcar todas
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <ScrollArea className="max-h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhuma notificação</p>
            </div>
          ) : (
            <div className="py-1">
              {notifications.map((notification) => {
                const Icon = categoryIcons[notification.category] || AlertCircle;
                const colorClass = categoryColors[notification.category] || 'text-foreground';

                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "flex items-start gap-3 p-3 hover:bg-muted/50 transition-colors cursor-pointer group",
                      !notification.isRead && "bg-primary/5"
                    )}
                    onClick={() => onMarkAsRead(notification.id)}
                  >
                    <div className={cn("mt-0.5", colorClass)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn(
                          "text-sm text-foreground line-clamp-1",
                          !notification.isRead && "font-semibold"
                        )}>
                          {notification.title}
                        </p>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatTime(notification.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {notification.message}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(notification.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3 text-muted-foreground" />
                    </Button>
                    {!notification.isRead && (
                      <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button variant="ghost" className="w-full text-sm text-muted-foreground">
                Ver todas as notificações
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Hook para gerenciar notificações
export const useNotifications = (initialNotifications: Notification[] = []) => {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);

  // Simular notificações em tempo real
  useEffect(() => {
    const mockNotifications: Notification[] = [
      { id: '1', category: 'sales', title: 'Nova venda realizada!', message: '5 cartelas vendidas - R$ 25,00', isRead: false, createdAt: new Date() },
      { id: '2', category: 'prizes', title: 'Vitória! 🎉', message: 'Uma cartela do seu estabelecimento ganhou R$ 12.500!', isRead: false, createdAt: new Date(Date.now() - 5 * 60000) },
      { id: '3', category: 'rounds', title: 'Rodada #102 finalizada', message: 'Vencedor: Mercado Central - R$ 8.500', isRead: true, createdAt: new Date(Date.now() - 15 * 60000) },
      { id: '4', category: 'pos', title: 'Terminal conectado', message: 'Terminal T001 está online e pronto para vendas', isRead: true, createdAt: new Date(Date.now() - 30 * 60000) },
      { id: '5', category: 'whatsapp', title: 'Cartelas enviadas', message: '3 cartelas enviadas para (11) 99999-9999', isRead: true, createdAt: new Date(Date.now() - 45 * 60000) },
      { id: '6', category: 'system', title: 'Atualização do sistema', message: 'Nova versão disponível com melhorias de desempenho', isRead: true, createdAt: new Date(Date.now() - 60 * 60000) },
    ];
    setNotifications(mockNotifications);

    // Simular nova notificação a cada 30 segundos
    const interval = setInterval(() => {
      const newNotification: Notification = {
        id: Date.now().toString(),
        category: ['sales', 'prizes', 'rounds', 'pos', 'whatsapp'][Math.floor(Math.random() * 5)] as any,
        title: 'Nova atividade!',
        message: `Evento simulado às ${new Date().toLocaleTimeString('pt-BR')}`,
        isRead: false,
        createdAt: new Date(),
      };
      setNotifications(prev => [newNotification, ...prev].slice(0, 20));
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      createdAt: new Date(),
      isRead: false,
    };
    setNotifications(prev => [newNotification, ...prev].slice(0, 20));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    addNotification,
  };
};
