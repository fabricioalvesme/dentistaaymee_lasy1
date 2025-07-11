import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const seoSettingsSchema = z.object({
  meta_title: z.string().max(60, 'O título deve ter no máximo 60 caracteres'),
  meta_description: z.string().max(160, 'A descrição deve ter no máximo 160 caracteres'),
  about_text: z.string().optional().default(''),
  services_text: z.string().optional().default(''),
  convenios_text: z.string().optional().default('Unimed, Bradesco Saúde, Amil, SulAmérica e outros. Consulte disponibilidade.'),
  logo_url: z.string().url('URL inválida').or(z.string().length(0)),
  primary_color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Formato de cor inválido'),
  secondary_color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Formato de cor inválido'),
  accent_color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Formato de cor inválido'),
});

type SEOSettingsValues = z.infer<typeof seoSettingsSchema>;

const defaultValues: SEOSettingsValues = {
  meta_title: 'Dra. Aymée Frauzino – Odontopediatra',
  meta_description: 'Atendimento odontológico especializado para crianças em Morrinhos-GO. Odontopediatria de qualidade para a saúde bucal dos seus filhos.',
  about_text: 'Dra. Aymée Frauzino é especialista em Odontopediatria e apaixonada por cuidar de sorrisos desde os primeiros anos de vida. Com uma abordagem humanizada e acolhedora, ela transforma cada consulta em uma experiência leve e positiva para crianças e adolescentes.',
  services_text: 'Oferecemos uma variedade de tratamentos odontológicos voltados para o público infantil e familiar, com foco na prevenção, no cuidado humanizado e na excelência clínica.',
  convenios_text: 'Unimed, Bradesco Saúde, Amil, SulAmérica e outros. Consulte disponibilidade.',
  logo_url: '',
  primary_color: '#3B82F6',
  secondary_color: '#10B981',
  accent_color: '#F3F4F6',
};

const SEOSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('seo');
  
  const form = useForm<SEOSettingsValues>({
    resolver: zodResolver(seoSettingsSchema),
    defaultValues,
  });

  // Carregar configurações iniciais
  useEffect(() => {
    async function loadSettings() {
      try {
        console.log("Carregando configurações de SEO...");
        setLoading(true);
        
        const { data, error } = await supabase
          .from('settings')
          .select('*')
          .limit(1)
          .single();
        
        if (error && error.code !== 'PGRST116') {
          console.error('Erro ao carregar configurações:', error);
          toast.error('Erro ao carregar configurações');
          form.reset(defaultValues);
          return;
        }
        
        if (data) {
          console.log("Configurações carregadas com sucesso:", data);
          setSettingsId(data.id);
          
          // Preencher o formulário com dados do banco ou valores padrão
          form.reset({
            meta_title: data.meta_title || defaultValues.meta_title,
            meta_description: data.meta_description || defaultValues.meta_description,
            about_text: data.about_text || defaultValues.about_text,
            services_text: data.services_text || defaultValues.services_text,
            convenios_text: data.convenios_text || defaultValues.convenios_text,
            logo_url: data.logo_url || defaultValues.logo_url,
            primary_color: data.primary_color || defaultValues.primary_color,
            secondary_color: data.secondary_color || defaultValues.secondary_color,
            accent_color: data.accent_color || defaultValues.accent_color,
          });
        } else {
          console.log("Nenhuma configuração encontrada, usando valores padrão");
          form.reset(defaultValues);
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
        toast.error('Erro ao carregar configurações');
        form.reset(defaultValues);
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, [form]);

  const onSubmit = async (data: SEOSettingsValues) => {
    try {
      setSaving(true);
      console.log("Salvando configurações:", data);
      
      const formattedData = {
        ...data,
        updated_at: new Date().toISOString(),
      };
      
      let result;
      
      if (settingsId) {
        // Atualizar configurações existentes
        console.log("Atualizando configurações existentes, ID:", settingsId);
        result = await supabase
          .from('settings')
          .update(formattedData)
          .eq('id', settingsId)
          .select();
      } else {
        // Criar novas configurações
        console.log("Criando novas configurações");
        result = await supabase
          .from('settings')
          .insert([formattedData])
          .select();
      }
      
      if (result.error) {
        throw result.error;
      }
      
      if (result.data && result.data.length > 0) {
        setSettingsId(result.data[0].id);
        console.log("Configurações salvas com sucesso, ID:", result.data[0].id);
      }
      
      document.documentElement.style.setProperty('--color-primary', data.primary_color);
      document.documentElement.style.setProperty('--color-secondary', data.secondary_color);
      document.documentElement.style.setProperty('--color-accent', data.accent_color);
      
      toast.success('Configurações salvas com sucesso!');
    } catch (error: any) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <Helmet>
        <title>Configurações de SEO e Conteúdo - Dra. Aymée Frauzino</title>
      </Helmet>
      
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Configurações de SEO e Conteúdo</h1>
          <p className="text-gray-500">Personalize as informações exibidas no site</p>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="seo">SEO</TabsTrigger>
                  <TabsTrigger value="conteudo">Conteúdo</TabsTrigger>
                  <TabsTrigger value="design">Design</TabsTrigger>
                </TabsList>
                
                <TabsContent value="seo" className="space-y-6 pt-4">
                  <FormField
                    control={form.control}
                    name="meta_title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título da Página (Meta Title)</FormLabel>
                        <FormDescription>
                          Título exibido na aba do navegador e nos resultados de busca (máx. 60 caracteres)
                        </FormDescription>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <div className="text-xs text-gray-500 mt-1">
                          {field.value.length}/60 caracteres
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="meta_description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição da Página (Meta Description)</FormLabel>
                        <FormDescription>
                          Descrição exibida nos resultados de busca (máx. 160 caracteres)
                        </FormDescription>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            className="resize-none h-20"
                          />
                        </FormControl>
                        <div className="text-xs text-gray-500 mt-1">
                          {field.value.length}/160 caracteres
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
                
                <TabsContent value="conteudo" className="space-y-6 pt-4">
                  <FormField
                    control={form.control}
                    name="about_text"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Texto da Seção "Sobre"</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            className="resize-none h-40"
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="services_text"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Texto da Seção "Serviços"</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            className="resize-none h-40"
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="convenios_text"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Texto da Seção "Convênios"</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            className="resize-none h-20"
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
                
                <TabsContent value="design" className="space-y-6 pt-4">
                  <FormField
                    control={form.control}
                    name="logo_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL do Logotipo</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://exemplo.com/imagens/logo.png" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="primary_color"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cor Primária</FormLabel>
                          <div className="flex space-x-2">
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <div 
                              className="h-10 w-10 rounded-md border"
                              style={{ backgroundColor: field.value }}
                            />
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="secondary_color"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cor Secundária</FormLabel>
                          <div className="flex space-x-2">
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <div 
                              className="h-10 w-10 rounded-md border"
                              style={{ backgroundColor: field.value }}
                            />
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="accent_color"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cor de Destaque</FormLabel>
                          <div className="flex space-x-2">
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <div 
                              className="h-10 w-10 rounded-md border"
                              style={{ backgroundColor: field.value }}
                            />
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
              </Tabs>
              
              <Button 
                type="submit" 
                disabled={saving || loading} 
                className="w-full md:w-auto"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Configurações'
                )}
              </Button>
            </form>
          </Form>
        )}
      </div>
    </AdminLayout>
  );
};

export default SEOSettings;