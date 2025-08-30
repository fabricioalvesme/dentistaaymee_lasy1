import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CalendarDays, 
  FileText, 
  Settings, 
  Menu, 
  X, 
  LogOut,
  Home,
  Bell,
  Plus
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { NotificationPopover } from '@/components/notifications/NotificationPopover';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems = [
    {
      title: 'Dashboard',
      href: '/admin/dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />
    },
    {
      title: 'Formulários',
      href: '/admin/dashboard',
      icon: <FileText className="h-5 w-5" />
    },
    {
      title: 'Agenda',
      href: '/admin/agenda',
      icon: <CalendarDays className="h-5 w-5" />
    },
    {
      title: 'Notificações',
      href: '/admin/notifications',
      icon: <Bell className="h-5 w-5" />
    },
    {
      title: 'SEO e Conteúdo',
      href: '/admin/seo',
      icon: <Settings className="h-5 w-5" />
    }
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    try {
      console.log("AdminLayout - Tentando fazer logout");
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Erro ao fazer logout (AdminLayout):', error);
      toast.error('Erro ao fazer logout. Tente novamente.');
    }
  };

  const handleNavigation = (path: string) => {
    console.log("AdminLayout - Navegando para:", path);
    setIsSidebarOpen(false);
    navigate(path);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar para desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200">
        <div className="p-6">
          <Link to="/" className="flex items-center">
            <span className="text-xl font-bold text-primary">
              Dra. Aymée Frauzino
            </span>
          </Link>
        </div>
        
        <Separator />
        
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Button
              key={item.href}
              variant={isActive(item.href) ? "secondary" : "ghost"}
              className={`w-full justify-start ${
                isActive(item.href)
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              onClick={() => handleNavigation(item.href)}
            >
              {item.icon}
              <span className="ml-3">{item.title}</span>
            </Button>
          ))}
          
          {/* Botão separado para Novo Formulário */}
          <div className="pt-2 mt-2 border-t border-gray-100">
            <Button
              variant="outline"
              className="w-full justify-start text-primary border-primary/20 hover:bg-primary/5"
              onClick={() => handleNavigation('/admin/forms/new')}
            >
              <Plus className="h-5 w-5" />
              <span className="ml-3">Novo Formulário</span>
            </Button>
          </div>
        </nav>
        
        <div className="p-4 mt-auto border-t border-gray-200 space-y-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-start"
            asChild
          >
            <Link to="/" target="_blank">
              <Home className="h-4 w-4 mr-2" />
              Ver Site
            </Link>
          </Button>
          
          <Button 
            variant="ghost" 
            className="w-full justify-start text-gray-600"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Mobile header & sidebar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            className="p-0 hover:bg-transparent"
            onClick={() => navigate('/')}
          >
            <span className="text-lg font-bold text-primary">
              Dra. Aymée Frauzino
            </span>
          </Button>
          
          <div className="flex items-center gap-1">
            <NotificationPopover />
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1"
            >
              {isSidebarOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile sidebar */}
      {isSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-20 bg-gray-600 bg-opacity-75">
          <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-white shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <span className="text-lg font-bold text-primary">
                Área Administrativa
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen(false)}
                className="p-1"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
            
            <nav className="mt-4 p-4 space-y-1">
              {navItems.map((item) => (
                <Button
                  key={item.href}
                  variant={isActive(item.href) ? "secondary" : "ghost"}
                  className={`w-full justify-start ${
                    isActive(item.href)
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  onClick={() => handleNavigation(item.href)}
                >
                  {item.icon}
                  <span className="ml-3">{item.title}</span>
                </Button>
              ))}
              
              {/* Botão separado para Novo Formulário */}
              <div className="pt-2 mt-2 border-t border-gray-100">
                <Button
                  variant="outline"
                  className="w-full justify-start text-primary border-primary/20 hover:bg-primary/5"
                  onClick={() => handleNavigation('/admin/forms/new')}
                >
                  <Plus className="h-5 w-5" />
                  <span className="ml-3">Novo Formulário</span>
                </Button>
              </div>
            </nav>
            
            <div className="p-4 mt-auto border-t border-gray-200 space-y-3">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                onClick={() => {
                  window.open('/', '_blank');
                  setIsSidebarOpen(false);
                }}
              >
                <Home className="h-4 w-4 mr-2" />
                Ver Site
              </Button>
              
              <Button 
                variant="ghost" 
                className="w-full justify-start text-gray-600"
                onClick={() => {
                  handleSignOut();
                  setIsSidebarOpen(false);
                }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-auto h-full">
        {/* Header para desktop com notificações */}
        <div className="hidden md:flex items-center justify-end p-4 bg-white border-b border-gray-200">
          <NotificationPopover />
        </div>
        
        <div className="md:p-8 p-4 mt-16 md:mt-0">
          {children}
        </div>
      </main>
    </div>
  );
}