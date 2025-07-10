import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, signOut } = useAuth();
  const { settings } = useTheme();
  const navigate = useNavigate();

  // Detecta o scroll para mudar o estilo do header
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Função de logout segura
  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Logout realizado com sucesso!');
      setIsMenuOpen(false);
      navigate('/');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      toast.error('Erro ao fazer logout. Tente novamente.');
    }
  };

  // Função para navegar para o dashboard e fechar o menu
  const navigateToDashboard = () => {
    console.log("Navegando para o dashboard");
    setIsMenuOpen(false);
    navigate('/admin/dashboard');
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled || isMenuOpen
          ? 'bg-white shadow-md py-2'
          : 'bg-white shadow-sm py-4'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            {settings?.logo_url ? (
              <img 
                src={settings.logo_url} 
                alt="Dra. Aymée Frauzino" 
                className="h-10 w-auto"
              />
            ) : (
              <div className="font-bold text-xl">
                <span className="text-primary">Dra. Aymée Frauzino</span>
              </div>
            )}
          </Link>

          {/* Links de navegação - Desktop */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="/#sobre" className="text-gray-700 hover:text-primary font-medium">
              Sobre
            </a>
            <a href="/#servicos" className="text-gray-700 hover:text-primary font-medium">
              Serviços
            </a>
            <a href="/#contato" className="text-gray-700 hover:text-primary font-medium">
              Contato
            </a>
            
            {user ? (
              <div className="flex items-center space-x-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={navigateToDashboard}
                >
                  <User className="h-4 w-4 mr-1" />
                  Área Admin
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                >
                  Sair
                </Button>
              </div>
            ) : (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/admin/login')}
              >
                <User className="h-4 w-4 mr-1" />
                Login
              </Button>
            )}
          </nav>

          {/* Botão mobile */}
          <button
            className="md:hidden text-gray-700"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? 'Fechar menu' : 'Abrir menu'}
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Menu mobile */}
        {isMenuOpen && (
          <div className="md:hidden py-4 mt-4 bg-white rounded-lg shadow-md">
            <nav className="flex flex-col space-y-4 px-4">
              <a 
                href="/#sobre" 
                className="text-gray-800 hover:text-primary font-medium py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Sobre
              </a>
              <a 
                href="/#servicos" 
                className="text-gray-800 hover:text-primary font-medium py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Serviços
              </a>
              <a 
                href="/#contato" 
                className="text-gray-800 hover:text-primary font-medium py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Contato
              </a>
              
              <div className="border-t border-gray-200 pt-2 mt-2"></div>
              
              {user ? (
                <div className="flex flex-col space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={navigateToDashboard}
                  >
                    <User className="h-4 w-4 mr-1" />
                    Área Admin
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={handleSignOut}
                  >
                    Sair
                  </Button>
                </div>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => {
                    setIsMenuOpen(false);
                    navigate('/admin/login');
                  }}
                >
                  <User className="h-4 w-4 mr-1" />
                  Login
                </Button>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}