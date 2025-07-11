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
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  useEffect(() => {
    // Este efeito será executado quando o status de autenticação mudar
    if (initialCheckDone) return;
    
    // Se ainda está carregando, aguarde
    if (loading) return;
    
    console.log("ProtectedRoute - Estado de autenticação:", { 
      user: !!user, 
      loading, 
      isAdmin, 
      path: location.pathname,
      initialCheckDone 
    });
    
    // Após carregar, verificar autenticação
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
    
    // Marcamos que a verificação inicial foi concluída
    setInitialCheckDone(true);
    setIsChecking(false);
  }, [user, loading, isAdmin, navigate, location.pathname, requireAdmin, initialCheckDone]);

  // Mostra spinner enquanto verifica autenticação
  if (loading || (isChecking && !initialCheckDone)) {
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