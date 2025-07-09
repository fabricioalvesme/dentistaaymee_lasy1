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

  useEffect(() => {
    async function getInitialSession() {
      setLoading(true);
      
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Erro ao carregar sessão:', error);
        toast.error('Erro ao carregar sessão');
      }
      
      setSession(data.session);
      setUser(data.session?.user || null);

      // Verifica se o usuário é admin
      if (data.session?.user) {
        const { data: userData } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.session.user.id)
          .single();
        
        setIsAdmin(userData?.role === 'admin');
      }
      
      setLoading(false);
    }

    getInitialSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user || null);

        // Verifica se o usuário é admin
        if (session?.user) {
          const { data: userData } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();
          
          setIsAdmin(userData?.role === 'admin');
        } else {
          setIsAdmin(false);
        }
        
        setLoading(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        throw error;
      }
      
      toast.success('Login realizado com sucesso!');
      navigate('/admin/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Falha ao fazer login');
      console.error('Erro ao fazer login:', error);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Logout realizado com sucesso!');
      navigate('/');
    } catch (error: any) {
      toast.error('Falha ao fazer logout');
      console.error('Erro ao fazer logout:', error);
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