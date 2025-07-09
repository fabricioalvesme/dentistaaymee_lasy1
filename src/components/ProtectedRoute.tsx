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
    // Só verifica após a autenticação ter carregado
    if (!loading) {
      if (!user) {
        // Redirecionar para login, guardando a rota tentada
        navigate('/admin/login', { 
          replace: true,
          state: { from: location.pathname }
        });
      } else if (requireAdmin && !isAdmin) {
        // Se precisa ser admin mas não é
        navigate('/', { replace: true });
      }
      
      // Finaliza a verificação
      setIsChecking(false);
    }
  }, [user, loading, navigate, requireAdmin, isAdmin, location.pathname]);

  // Mostra spinner enquanto verifica autenticação
  if (loading || isChecking) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg font-medium">Carregando...</span>
      </div>
    );
  }

  // Se chegou aqui, significa que o usuário está autenticado e tem permissão
  return <>{children}</>;
}