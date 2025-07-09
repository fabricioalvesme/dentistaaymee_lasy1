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
  about_text: z.string(),
  services_text: z.string(),
  convenios_text: z.string(),
  logo_url: z.string().url('URL inválida').or(z.string().length(0)),
  primary_color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Formato de cor inválido'),
  secondary_color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Formato de cor inválido'),
  accent_color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Formato de cor inválido'),
});

type SEOSettingsValues = z.infer<typeof seoSettingsSchema>;

const SEOSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  
  const form = useForm<SEOSettingsValues>({
    resolver: zodResolver(seoSettingsSchema),
    defaultValues: {
      meta_title: 'Dra. Aymée Frauzino – Odontopediatra',
      meta_description: 'Atendimento odontológico especializado para crianças em Morrinhos-GO. Odontopediatria de qualidade para a saúde bucal dos seus filhos.',
      about_text: '',
      services_text: '',
      convenios_text: 'Unimed, Bradesco Saúde, Amil, SulAmérica e outros. Consulte disponibilidade.',
      logo_url: '',
      primary_color: '#3B82F6',
      secondary_color: '#10B981',
      accent_color: '#F3F4F6',
    },
  });

  // Carregar valores iniciais
  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('settings')
          .select('*')
          .limit(1)
          .single();
        
        if (error && error.code !== 'PGRST116') {
          console.error('Erro ao carregar configurações:', error);
          toast.error('Erro ao carregar configurações');
          return;
        }
        
        if (data) {
          setSettingsId(data.id);
          
          form.reset({
            meta_title: data.meta_title || 'Dra. Aymée Frauzino – Odontopediatra',
            meta_description: data.meta_description || 'Atendimento odontológico especializado para crianças em Morrinhos-GO. Odontopediatria de qualidade para a saúde bucal dos seus filhos.',
            about_text: data.about_text || '',
            services_text: data.services_text || '',
            convenios_text: data.convenios_text || 'Unimed, Bradesco Saúde, Amil, SulAmérica e outros. Consulte disponibilidade.',
            logo_url: data.logo_url || '',
            primary_color: data.primary_color || '#3B82F6',
            secondary_color: data.secondary_color || '#10B981',
            accent_color: data.accent_color || '#F3F4F6',
          });
          
          console.log('Configurações carregadas com sucesso:', data);
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
        toast.error('Erro ao carregar configurações');
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, [form]);

  const onSubmit = async (data: SEOSettingsValues) => {
    try {
      setSaving(true);
      
      // Aplicar variáveis CSS com as cores
      document.documentElement.style.setProperty('--color-primary', data.primary_color);
      document.documentElement.style.setProperty('--color-secondary', data.secondary_color);
      document.documentElement.style.setProperty('--color-accent', data.accent_color);
      
      let result;
      
      if (settingsId) {
        // Atualizar configurações existentes
        result = await supabase
          .from('settings')
          .update(data)
          .eq('id', settingsId);
      } else {
        // Criar novas configurações
        result = await supabase
          .from('settings')
          .insert([data])
          .select();
          
        if (result.data && result.data.length > 0) {
          setSettingsId(result.data[0].id);
        }
      }
      
      if (result.error) {
        throw result.error;
      }
      
      toast.success('Configurações salvas com sucesso!');
      
      // Recarregar dados para garantir que tudo foi salvo corretamente
      const { data: reloadedData, error: reloadError } = await supabase
        .from('settings')
        .select('*')
        .eq('id', settingsId || result.data?.[0]?.id)
        .single();
      
      if (!reloadError && reloadedData) {
        form.reset({
          meta_title: reloadedData.meta_title,
          meta_description: reloadedData.meta_description,
          about_text: reloadedData.about_text || '',
          services_text: reloadedData.services_text || '',
          convenios_text: reloadedData.convenios_text,
          logo_url: reloadedData.logo_url || '',
          primary_color: reloadedData.primary_color,
          secondary_color: reloadedData.secondary_color,
          accent_color: reloadedData.accent_color,
        });
      }
      
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações. Tente novamente.');
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
              <Tabs defaultValue="seo" className="w-full">
                <TabsList className="grid grid-cols-3">
                  <TabsTrigger value="seo">SEO</TabsTrigger>
                  <TabsTrigger value="conteudo">Conteúdo</TabsTrigger>
                  <TabsTrigger value="design">Design</TabsTrigger>
                </TabsList>
                
                {/* Aba de SEO */}
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
                
                {/* Aba de Conteúdo */}
                <TabsContent value="conteudo" className="space-y-6 pt-4">
                  <FormField
                    control={form.control}
                    name="about_text"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Texto da Seção "Sobre"</FormLabel>
                        <FormDescription>
                          Suporta HTML básico para formatação (negrito, links, parágrafos, etc.)
                        </FormDescription>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            className="resize-none h-40 font-mono"
                            placeholder='<p>Dra. Aymée Frauzino é especialista em Odontopediatria, dedicada a proporcionar cuidados odontológicos de excelência para crianças de todas as idades.</p>'
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
                        <FormDescription>
                          Suporta HTML básico para formatação (negrito, links, parágrafos, etc.)
                        </FormDescription>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            className="resize-none h-40 font-mono"
                            placeholder='<p>Oferecemos uma variedade de tratamentos odontológicos para garantir a saúde bucal e o bem-estar dos nossos pacientes.</p>'
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
                        <FormDescription>
                          Suporta HTML básico para formatação (negrito, links, parágrafos, etc.)
                        </FormDescription>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            className="resize-none h-20 font-mono"
                            placeholder='<p>Aceitamos os seguintes convênios: Unimed, Bradesco Saúde, Amil, SulAmérica e outros. Consulte disponibilidade.</p>'
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
                
                {/* Aba de Design */}
                <TabsContent value="design" className="space-y-6 pt-4">
                  <FormField
                    control={form.control}
                    name="logo_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL do Logotipo</FormLabel>
                        <FormDescription>
                          Link direto para a imagem do logotipo (recomendado: 200x60px, fundo transparente)
                        </FormDescription>
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
                  
                  <div className="mt-6 p-4 bg-gray-50 rounded-md">
                    <h3 className="font-medium mb-2">Pré-visualização de Cores</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Botão Primário</p>
                        <Button style={{ backgroundColor: form.watch('primary_color') }}>
                          Botão Primário
                        </Button>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Botão Secundário</p>
                        <Button style={{ backgroundColor: form.watch('secondary_color') }}>
                          Botão Secundário
                        </Button>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Fundo de Destaque</p>
                        <div 
                          className="p-4 rounded-md"
                          style={{ backgroundColor: form.watch('accent_color') }}
                        >
                          <p>Conteúdo com fundo de destaque</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              
              <Button type="submit" disabled={saving}>
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