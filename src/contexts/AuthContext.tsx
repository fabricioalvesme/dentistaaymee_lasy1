import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  sessionExpired: boolean;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const navigate = useNavigate();

  // Função para verificar se o usuário é admin
  const checkUserRole = async (userId: string) => {
    try {
      const { data: userData, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Erro ao verificar perfil:', error);
        return false; // Princípio de menor privilégio
      }
      
      const userIsAdmin = userData?.role === 'admin';
      setIsAdmin(userIsAdmin);
      
      console.log("Verificação de admin realizada:", { 
        userId, 
        isAdmin: userIsAdmin,
        userData
      });
      
      return userIsAdmin;
    } catch (error) {
      console.error('Erro ao verificar perfil:', error);
      return false; // Princípio de menor privilégio
    }
  };

  // Função para refresh da sessão
  const refreshSession = async () => {
    try {
      console.log("Tentando refresh da sessão...");
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Erro ao fazer refresh da sessão:', error);
        setSessionExpired(true);
        setUser(null);
        setSession(null);
        setIsAdmin(false);
        toast.error('Sessão expirada. Faça login novamente.');
        return;
      }
      
      if (data.session) {
        console.log("Sessão renovada com sucesso");
        setSession(data.session);
        setUser(data.session.user);
        setSessionExpired(false);
        
        if (data.session.user) {
          await checkUserRole(data.session.user.id);
        }
      }
    } catch (error) {
      console.error('Erro ao renovar sessão:', error);
      setSessionExpired(true);
    }
  };

  // Função para tratar erros de autenticação
  const handleAuthError = (error: AuthError) => {
    console.error('Erro de autenticação detectado:', error);
    
    if (error.message.includes('refresh_token_not_found') || 
        error.message.includes('invalid_token') ||
        error.message.includes('token_expired')) {
      setSessionExpired(true);
      setUser(null);
      setSession(null);
      setIsAdmin(false);
      toast.error('Sessão expirada. Faça login novamente.');
    }
  };

  useEffect(() => {
    let mounted = true;

    async function getInitialSession() {
      try {
        console.log("Inicializando sessão do AuthContext");
        setLoading(true);
        setSessionExpired(false);
        
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Erro ao carregar sessão inicial:', error);
          handleAuthError(error);
          if (mounted) setLoading(false);
          return;
        }
        
        if (mounted) {
          setSession(data.session);
          setUser(data.session?.user || null);

          if (data.session?.user) {
            await checkUserRole(data.session.user.id);
          } else {
            setIsAdmin(false);
          }
        }
      } catch (error) {
        console.error('Erro ao inicializar sessão:', error);
        if (mounted) {
          setSessionExpired(true);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    getInitialSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log("Auth state changed:", event, newSession?.user?.id);
        
        if (!mounted) return;
        
        // Tratar diferentes eventos de autenticação
        switch (event) {
          case 'SIGNED_IN':
            console.log("Usuário logado com sucesso");
            setSession(newSession);
            setUser(newSession?.user || null);
            setSessionExpired(false);
            
            if (newSession?.user) {
              await checkUserRole(newSession.user.id);
            }
            break;
            
          case 'SIGNED_OUT':
            console.log("Usuário deslogado");
            setSession(null);
            setUser(null);
            setIsAdmin(false);
            setSessionExpired(false);
            break;
            
          case 'TOKEN_REFRESHED':
            console.log("Token renovado automaticamente");
            setSession(newSession);
            setUser(newSession?.user || null);
            setSessionExpired(false);
            break;
            
          case 'USER_UPDATED':
            console.log("Dados do usuário atualizados");
            setSession(newSession);
            setUser(newSession?.user || null);
            break;
            
          default:
            console.log("Evento de auth não tratado:", event);
            setSession(newSession);
            setUser(newSession?.user || null);
        }
        
        setLoading(false);
      }
    );

    // Configurar refresh automático da sessão a cada 50 minutos
    const refreshInterval = setInterval(async () => {
      if (mounted && session) {
        console.log("Refresh automático da sessão...");
        await refreshSession();
      }
    }, 50 * 60 * 1000); // 50 minutos

    return () => {
      mounted = false;
      console.log("Removendo listener de auth e interval");
      authListener.subscription.unsubscribe();
      clearInterval(refreshInterval);
    };
  }, []); // Dependências vazias para evitar re-execução

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      setSessionExpired(false);
      
      console.log("Tentando fazer login com:", email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('Erro no login:', error);
        handleAuthError(error);
        throw error;
      }
      
      if (data.user && data.session) {
        console.log("Login bem-sucedido:", data.user.id);
        setUser(data.user);
        setSession(data.session);
        await checkUserRole(data.user.id);
        
        toast.success('Login realizado com sucesso!');
        navigate('/admin/dashboard');
      }
    } catch (error: any) {
      console.error('Erro ao fazer login:', error);
      toast.error(error.message || 'Falha ao fazer login');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      console.log("Fazendo logout...");
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Erro ao fazer logout no Supabase:', error);
        // Mesmo com erro, limpar estado local
      }
      
      // Limpar estado local
      setUser(null);
      setSession(null);
      setIsAdmin(false);
      setSessionExpired(false);
      
      navigate('/');
      toast.success('Logout realizado com sucesso');
    } catch (error: any) {
      console.error('Erro ao fazer logout:', error);
      // Mesmo com erro, limpar estado local e redirecionar
      setUser(null);
      setSession(null);
      setIsAdmin(false);
      setSessionExpired(false);
      navigate('/');
      toast.error('Logout realizado (com avisos)');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user,
        session,
        loading,
        signIn,
        signOut,
        isAdmin,
        sessionExpired,
        refreshSession
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  
  return context;
}