import { useEffect } from 'react';
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

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      navigate('/admin/login', { 
        replace: true,
        state: { from: location.pathname }
      });
    } else if (requireAdmin && !isAdmin) {
      navigate('/', { replace: true });
    }
  }, [user, loading, isAdmin, navigate, location.pathname, requireAdmin]);

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

  if (user && (!requireAdmin || isAdmin)) {
    return <>{children}</>;
  }

  return null;
}