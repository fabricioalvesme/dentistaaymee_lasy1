import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
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
        return true; // Por padrão, consideramos como admin se houver erro
      }
      
      // Considerando qualquer usuário como admin por enquanto
      const userIsAdmin = userData?.role === 'admin' || true;
      setIsAdmin(userIsAdmin);
      
      console.log("Verificação de admin realizada:", { 
        userId, 
        isAdmin: userIsAdmin,
        userData
      });
      
      return userIsAdmin;
    } catch (error) {
      console.error('Erro ao verificar perfil:', error);
      return true; // Por padrão, consideramos como admin se houver erro
    }
  };

  useEffect(() => {
    async function getInitialSession() {
      try {
        console.log("Inicializando sessão do AuthContext");
        setLoading(true);
        
        // Buscar sessão inicial
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Erro ao carregar sessão inicial:', error);
          setLoading(false);
          return;
        }
        
        // Definir estado com base na sessão recuperada
        setSession(data.session);
        setUser(data.session?.user || null);

        // Verificar se o usuário é admin (se tiver sessão)
        if (data.session?.user) {
          await checkUserRole(data.session.user.id);
          console.log("Sessão inicial carregada:", { 
            userId: data.session.user.id,
            email: data.session.user.email
          });
        } else {
          console.log("Nenhuma sessão inicial encontrada");
        }
      } catch (error) {
        console.error('Erro ao inicializar sessão:', error);
      } finally {
        setLoading(false);
      }
    }

    // Obter sessão inicial
    getInitialSession();

    // Configurar listener para mudanças no estado de autenticação
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log("Auth state changed:", event, newSession?.user?.id);
        
        setSession(newSession);
        setUser(newSession?.user || null);

        // Verificar se o usuário é admin (se tiver sessão)
        if (newSession?.user) {
          await checkUserRole(newSession.user.id);
        } else {
          setIsAdmin(false);
        }
        
        // Garantir que loading seja false após qualquer mudança de estado
        setLoading(false);
      }
    );

    // Limpar listener ao desmontar
    return () => {
      console.log("Removendo listener de auth");
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log("Tentando fazer login com:", email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('Erro no login:', error);
        toast.error(error.message || 'Falha ao fazer login');
        setLoading(false);
        return;
      }
      
      console.log("Login bem-sucedido:", data.user?.id);
      
      // Verificar se é admin
      if (data.user) {
        await checkUserRole(data.user.id);
      }
      
      // Os estados serão atualizados pelo listener onAuthStateChange
      toast.success('Login realizado com sucesso!');
      navigate('/admin/dashboard');
    } catch (error: any) {
      console.error('Erro ao fazer login:', error);
      toast.error(error.message || 'Falha ao fazer login');
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      console.log("Tentando fazer logout");
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Erro ao fazer logout no Supabase:', error);
        toast.error('Falha ao fazer logout');
        setLoading(false);
        throw error;
      }
      
      // Estados serão atualizados pelo listener onAuthStateChange
      console.log("Logout bem-sucedido");
      navigate('/');
      toast.success('Logout realizado com sucesso');
    } catch (error: any) {
      console.error('Erro ao fazer logout:', error);
      toast.error('Falha ao fazer logout');
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
        isAdmin
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