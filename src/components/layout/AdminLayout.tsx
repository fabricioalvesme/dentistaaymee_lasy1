import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CalendarDays, 
  FileText, 
  Settings, 
  Menu, 
  X, 
  LogOut,
  Home
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { signOut } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems = [
    {
      title: 'Dashboard',
      href: '/admin/dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />
    },
    {
      title: 'Formulários',
      href: '/admin/forms/new',
      icon: <FileText className="h-5 w-5" />
    },
    {
      title: 'Agenda',
      href: '/admin/agenda',
      icon: <CalendarDays className="h-5 w-5" />
    },
    {
      title: 'SEO e Conteúdo',
      href: '/admin/seo',
      icon: <Settings className="h-5 w-5" />
    }
  ];

  const isActive = (path: string) => location.pathname === path;

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
            <Link
              key={item.href}
              to={item.href}
              className={`flex items-center px-4 py-3 rounded-md transition-colors ${
                isActive(item.href)
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {item.icon}
              <span className="ml-3">{item.title}</span>
            </Link>
          ))}
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
            onClick={() => signOut()}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Mobile header & sidebar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between p-4">
          <Link to="/" className="flex items-center">
            <span className="text-lg font-bold text-primary">
              Dra. Aymée Frauzino
            </span>
          </Link>
          
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
          >
            {isSidebarOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
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
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <nav className="mt-4 p-4 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center px-4 py-3 rounded-md transition-colors ${
                    isActive(item.href)
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  {item.icon}
                  <span className="ml-3">{item.title}</span>
                </Link>
              ))}
            </nav>
            
            <div className="p-4 mt-auto border-t border-gray-200 space-y-3">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                asChild
              >
                <Link 
                  to="/" 
                  target="_blank"
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <Home className="h-4 w-4 mr-2" />
                  Ver Site
                </Link>
              </Button>
              
              <Button 
                variant="ghost" 
                className="w-full justify-start text-gray-600"
                onClick={() => {
                  signOut();
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
        <div className="md:p-8 p-4 mt-16 md:mt-0">
          {children}
        </div>
      </main>
    </div>
  );
}