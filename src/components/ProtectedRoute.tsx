import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, loading, isAdmin, sessionExpired, refreshSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) {
      return; // Aguarda o fim do carregamento
    }

    if (sessionExpired) {
      console.log("Sessão expirada detectada, redirecionando para login");
      navigate('/admin/login', { 
        replace: true,
        state: { 
          from: location.pathname,
          sessionExpired: true 
        }
      });
      return;
    }

    if (!user) {
      console.log("Usuário não autenticado, redirecionando para login");
      navigate('/admin/login', { 
        replace: true,
        state: { from: location.pathname }
      });
    } else if (requireAdmin && !isAdmin) {
      console.log("Usuário não é admin, redirecionando para home");
      navigate('/', { replace: true });
    }
  }, [user, loading, isAdmin, sessionExpired, navigate, location.pathname, requireAdmin]);

  // Tela de sessão expirada
  if (sessionExpired) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center max-w-md p-8 bg-white rounded-lg shadow-md">
          <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Sessão Expirada</h2>
          <p className="text-gray-600 mb-6">
            Sua sessão expirou por segurança. Por favor, faça login novamente para continuar.
          </p>
          <div className="space-y-3">
            <Button 
              onClick={() => navigate('/admin/login')}
              className="w-full"
            >
              Fazer Login Novamente
            </Button>
            <Button 
              variant="outline"
              onClick={refreshSession}
              className="w-full"
            >
              Tentar Renovar Sessão
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <span className="text-lg font-medium">Verificando autenticação...</span>
        </div>
      </div>
    );
  }

  // Renderiza os filhos apenas se o usuário estiver autenticado e autorizado
  if (user && (!requireAdmin || isAdmin)) {
    return <>{children}</>;
  }

  // Retorna null enquanto redireciona
  return null;
}