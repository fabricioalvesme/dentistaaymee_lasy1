import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export function useAuthErrorHandler() {
  const { sessionExpired, refreshSession } = useAuth();
  const navigate = useNavigate();

  // Função para tratar erros de autenticação em operações
  const handleSupabaseError = async (error: any) => {
    if (error?.message?.includes('JWT expired') || 
        error?.message?.includes('refresh_token_not_found') ||
        error?.message?.includes('invalid_token')) {
      
      console.log("Erro de autenticação detectado, tentando renovar sessão...");
      
      try {
        await refreshSession();
        return true; // Sessão renovada com sucesso
      } catch (refreshError) {
        console.error('Falha ao renovar sessão:', refreshError);
        toast.error('Sessão expirada. Redirecionando para login...');
        navigate('/admin/login', { 
          state: { sessionExpired: true } 
        });
        return false;
      }
    }
    
    return false; // Não é erro de autenticação
  };

  return { handleSupabaseError };
}