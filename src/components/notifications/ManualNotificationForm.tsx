import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';

// Schema para validação do formulário
const manualNotificationSchema = z.object({
  titulo: z.string().min(3, 'O título deve ter pelo menos 3 caracteres'),
  mensagem: z.string().min(5, 'A mensagem deve ter pelo menos 5 caracteres'),
  data_exibicao: z.date({
    required_error: 'A data de exibição é obrigatória',
  }),
  hora_exibicao: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Formato de hora inválido (HH:MM)',
  }),
  telefone: z.string().optional()
});

type ManualNotificationFormValues = z.infer<typeof manualNotificationSchema>;

interface ManualNotificationFormProps {
  onSuccess: () => void;
}

export function ManualNotificationForm({ onSuccess }: ManualNotificationFormProps) {
  const [submitting, setSubmitting] = useState(false);
  
  // Formulário com valores iniciais
  const form = useForm<ManualNotificationFormValues>({
    resolver: zodResolver(manualNotificationSchema),
    defaultValues: {
      titulo: '',
      mensagem: '',
      data_exibicao: new Date(),
      hora_exibicao: '09:00',
      telefone: '',
    }
  });
  
  // Função para criar notificação manual
  const onSubmit = async (data: ManualNotificationFormValues) => {
    try {
      setSubmitting(true);
      
      // Combinar data e hora para criar timestamp de notificação
      const notifyAt = new Date(data.data_exibicao);
      const [hours, minutes] = data.hora_exibicao.split(':').map(Number);
      notifyAt.setHours(hours, minutes, 0, 0);
      
      // Verificar se a data de notificação está no futuro
      if (notifyAt < new Date()) {
        toast.error('A data de exibição deve ser no futuro');
        return;
      }
      
      // Criar notificação manual
      const notificationData = {
        type: 'manual', // Tipo específico para notificações manuais
        titulo: data.titulo,
        mensagem: data.mensagem,
        notify_at: notifyAt.toISOString(),
        telefone: data.telefone || null,
        sent: false,
        created_at: new Date().toISOString(),
      };
      
      console.log('Criando notificação manual:', notificationData);
      
      // Salvar no Supabase
      const { data: notification, error } = await supabase
        .from('manual_notifications')
        .insert([notificationData])
        .select();
      
      if (error) {
        console.error('Erro ao criar notificação manual:', error);
        throw error;
      }
      
      console.log('Notificação manual criada:', notification);
      toast.success('Notificação criada com sucesso!');
      
      // Resetar formulário
      form.reset({
        titulo: '',
        mensagem: '',
        data_exibicao: new Date(),
        hora_exibicao: '09:00',
        telefone: '',
      });
      
      // Notificar componente pai
      onSuccess();
      
    } catch (error) {
      console.error('Erro ao criar notificação manual:', error);
      toast.error('Erro ao criar notificação. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="titulo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título*</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Ex: Lembrete de campanha" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="mensagem"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mensagem*</FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  placeholder="Conteúdo da notificação..." 
                  className="resize-none h-24"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="data_exibicao"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data de Exibição*</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className="pl-3 text-left font-normal"
                      >
                        {field.value ? (
                          format(field.value, "PPP", { locale: pt })
                        ) : (
                          <span>Selecione a data</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="hora_exibicao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hora de Exibição*</FormLabel>
                <FormControl>
                  <Input
                    type="time"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="telefone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telefone para WhatsApp (opcional)</FormLabel>
              <FormControl>
                <Input 
                  {...field}
                  placeholder="(00) 00000-0000" 
                />
              </FormControl>
              <FormDescription>
                Se preenchido, exibirá opção de enviar mensagem via WhatsApp
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button 
          type="submit" 
          className="w-full"
          disabled={submitting}
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Criando Notificação...
            </>
          ) : (
            'Criar Notificação'
          )}
        </Button>
      </form>
    </Form>
  );
}