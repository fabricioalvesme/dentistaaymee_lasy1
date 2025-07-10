import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Verificação de autenticação
    const checkAuth = async () => {
      try {
        // Esperar o carregamento do estado de autenticação
        if (loading) return;
        
        if (!user) {
          console.log("Usuário não autenticado, redirecionando para login");
          // Redirecionar para login, guardando a rota tentada
          navigate('/admin/login', { 
            replace: true,
            state: { from: location.pathname }
          });
          return;
        }
        
        if (requireAdmin && !isAdmin) {
          console.log("Usuário não é admin, redirecionando para home");
          // Se precisa ser admin mas não é
          navigate('/', { replace: true });
          return;
        }
        
        // Se chegou aqui, o usuário está autenticado e tem permissão
        setIsAuthenticated(true);
      } finally {
        // Finaliza a verificação
        setIsChecking(false);
      }
    };
    
    checkAuth();
  }, [user, loading, navigate, requireAdmin, isAdmin, location.pathname]);

  // Mostra spinner enquanto verifica autenticação
  if (loading || isChecking) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <span className="text-lg font-medium">Carregando...</span>
        </div>
      </div>
    );
  }

  // Renderiza os filhos apenas se estiver autenticado
  return isAuthenticated ? <>{children}</> : null;
}