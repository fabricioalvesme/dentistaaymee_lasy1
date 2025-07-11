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

  useEffect(() => {
    // Esta função será executada apenas uma vez após determinar o estado de autenticação
    const checkAuth = async () => {
      try {
        // Se ainda está carregando, retorne e aguarde o próximo ciclo
        if (loading) return;
        
        console.log("ProtectedRoute - Estado de autenticação:", { 
          user: !!user, 
          loading, 
          isAdmin, 
          path: location.pathname 
        });
        
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
          navigate('/', { replace: true });
          return;
        }
      } finally {
        // Finaliza a verificação em qualquer caso
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
  return <>{children}</>;
}