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

  useEffect(() => {
    async function getInitialSession() {
      try {
        console.log("Inicializando sessão do AuthContext");
        setLoading(true);
        
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Erro ao carregar sessão inicial:', error);
          setLoading(false);
          return;
        }
        
        setSession(data.session);
        setUser(data.session?.user || null);

        if (data.session?.user) {
          await checkUserRole(data.session.user.id);
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Erro ao inicializar sessão:', error);
      } finally {
        setLoading(false);
      }
    }

    getInitialSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log("Auth state changed:", event, newSession?.user?.id);
        
        setSession(newSession);
        setUser(newSession?.user || null);

        if (newSession?.user) {
          await checkUserRole(newSession.user.id);
        } else {
          setIsAdmin(false);
        }
        
        setLoading(false);
      }
    );

    return () => {
      console.log("Removendo listener de auth");
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('Erro no login:', error);
        toast.error(error.message || 'Falha ao fazer login');
        return;
      }
      
      if (data.user) {
        await checkUserRole(data.user.id);
      }
      
      toast.success('Login realizado com sucesso!');
      navigate('/admin/dashboard');
    } catch (error: any) {
      console.error('Erro ao fazer login:', error);
      toast.error(error.message || 'Falha ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Erro ao fazer logout no Supabase:', error);
        toast.error('Falha ao fazer logout');
        throw error;
      }
      
      navigate('/');
      toast.success('Logout realizado com sucesso');
    } catch (error: any) {
      console.error('Erro ao fazer logout:', error);
      toast.error('Falha ao fazer logout');
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