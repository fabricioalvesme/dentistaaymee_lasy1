import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().email('Email inválido').min(1, 'Email é obrigatório'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Login = () => {
  const { signIn, user, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Verificar se chegou aqui por sessão expirada
  const sessionExpired = location.state?.sessionExpired;
  const from = location.state?.from || '/admin/dashboard';

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Redirecionar se já estiver logado
  useEffect(() => {
    if (user && !loading) {
      console.log("Usuário já logado, redirecionando para:", from);
      navigate(from, { replace: true });
    }
  }, [user, loading, navigate, from]);

  // Mostrar mensagem de sessão expirada
  useEffect(() => {
    if (sessionExpired) {
      toast.error('Sua sessão expirou. Faça login novamente para continuar.');
    }
  }, [sessionExpired]);

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setIsLoading(true);
      console.log("Tentando fazer login com:", data.email);
      
      await signIn(data.email, data.password);
      
      // O redirecionamento é feito no AuthContext após login bem-sucedido
    } catch (error: any) {
      console.error('Erro ao fazer login:', error);
      // O erro já é tratado no AuthContext
      setIsLoading(false);
    }
  };

  // Se já estiver logado, mostrar loading
  if (user && !loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <span className="text-lg font-medium">Redirecionando...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Login - Dra. Aymée Frauzino</title>
      </Helmet>
      
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Login Administrativo</h1>
            <p className="text-gray-600 mt-2">
              Faça login para acessar o painel administrativo
            </p>
            
            {/* Alerta de sessão expirada */}
            {sessionExpired && (
              <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-md">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-orange-500 mr-2" />
                  <span className="text-sm text-orange-700">
                    Sua sessão expirou por segurança
                  </span>
                </div>
              </div>
            )}
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="seu.email@exemplo.com" 
                        type="email" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="••••••••" 
                        type="password" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading || loading}>
                {isLoading || loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </Button>
            </form>
          </Form>

          <div className="text-center mt-4">
            <Button variant="link" onClick={() => navigate('/')} className="mt-4">
              Voltar para o site
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;