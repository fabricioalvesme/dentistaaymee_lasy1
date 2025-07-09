import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';

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
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

const loginSchema = z.object({
  email: z.string().email('Email inválido').min(1, 'Email é obrigatório'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Login = () => {
  const { signIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);
  const navigate = useNavigate();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setIsLoading(true);
      await signIn(data.email, data.password);
      // O redirecionamento é feito no contexto de autenticação
    } catch (error) {
      console.error('Erro ao fazer login:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Função para criar o usuário admin inicial
  const createInitialAdmin = async () => {
    const adminEmail = 'ay_frauzino@hotmail.com';
    const adminPassword = 'Frauzino102';

    try {
      setIsCreatingAdmin(true);
      
      // Verificar se o usuário já existe
      const { data: existingUsers, error: checkError } = await supabase
        .from('auth.users')
        .select('email')
        .eq('email', adminEmail)
        .limit(1);
      
      if (checkError) {
        // Não podemos verificar diretamente a tabela auth.users, então vamos apenas tentar criar
        console.log('Verificando se o usuário já existe...');
      } else if (existingUsers && existingUsers.length > 0) {
        toast.error('Usuário admin já existe!');
        setIsCreatingAdmin(false);
        return;
      }
      
      // Criar o usuário no Auth
      const { data, error } = await supabase.auth.signUp({
        email: adminEmail,
        password: adminPassword,
        options: {
          data: {
            role: 'admin'
          }
        }
      });
      
      if (error) throw error;
      
      // Criar perfil na tabela profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          { 
            id: data.user?.id,
            email: adminEmail,
            role: 'admin',
            name: 'Dra. Aymée Frauzino'
          }
        ]);
      
      if (profileError) throw profileError;
      
      toast.success('Usuário admin criado com sucesso! Email: ay_frauzino@hotmail.com, Senha: Frauzino102');
      
      // Preencher o formulário com as credenciais
      form.setValue('email', adminEmail);
      form.setValue('password', adminPassword);
      
    } catch (error: any) {
      console.error('Erro ao criar usuário admin:', error);
      toast.error(`Erro ao criar usuário admin: ${error.message}`);
    } finally {
      setIsCreatingAdmin(false);
    }
  };

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

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
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
            <Alert className="bg-blue-50 border-blue-200 text-blue-800 mb-4">
              <AlertDescription className="text-sm">
                Primeiro acesso? Crie o usuário administrativo inicial.
              </AlertDescription>
            </Alert>
            
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={createInitialAdmin}
              disabled={isCreatingAdmin}
            >
              {isCreatingAdmin ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando usuário admin...
                </>
              ) : (
                'Criar Usuário Admin Inicial'
              )}
            </Button>
            
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