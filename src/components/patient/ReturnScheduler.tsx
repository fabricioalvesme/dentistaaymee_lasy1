import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useNotifications } from '@/hooks/useNotifications';
import { toast } from 'sonner';
import { Reminder } from '@/lib/types/reminder';
import { formatDate } from '@/lib/utils';

// Schema para o formulário de agendamento de retorno
const returnFormSchema = z.object({
  returnDate: z.date({
    required_error: 'Por favor, selecione uma data de retorno',
  }),
  notifyTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Por favor, informe um horário válido (HH:MM)',
  }),
  message: z.string().optional(),
});

type ReturnFormValues = z.infer<typeof returnFormSchema>;

interface ReturnSchedulerProps {
  patientId: string;
  patientName: string;
  existingReminders?: Reminder[];
  onReminderCreated?: (reminder: Reminder) => void;
}

export function ReturnScheduler({ 
  patientId, 
  patientName, 
  existingReminders = [],
  onReminderCreated 
}: ReturnSchedulerProps) {
  const { createReturnReminder, deleteReminder } = useNotifications();
  const [loading, setLoading] = useState(false);
  
  // Formulário para agendamento de retorno
  const form = useForm<ReturnFormValues>({
    resolver: zodResolver(returnFormSchema),
    defaultValues: {
      returnDate: new Date(new Date().setDate(new Date().getDate() + 30)), // 30 dias à frente
      notifyTime: '09:00',
      message: `Olá. O retorno de ${patientName} está próximo. Será no dia {{data}}. Posso confirmar?`,
    },
  });
  
  // Enviar formulário de agendamento de retorno
  const onSubmit = async (data: ReturnFormValues) => {
    try {
      setLoading(true);
      
      // Criar data de notificação (o dia anterior à data de retorno, às 10h)
      const notifyDate = new Date(data.returnDate);
      notifyDate.setDate(notifyDate.getDate() - 1);
      
      // Extrair hora e minuto do horário de notificação
      const [hours, minutes] = data.notifyTime.split(':').map(Number);
      notifyDate.setHours(hours, minutes, 0, 0);
      
      // Verificar se a data de notificação já passou
      if (notifyDate < new Date()) {
        toast.error('A data de notificação já passou. Por favor, escolha outra data.');
        return;
      }
      
      const reminder = await createReturnReminder(
        patientId,
        data.returnDate,
        notifyDate,
        data.message
      );
      
      if (reminder) {
        toast.success('Retorno agendado com sucesso!');
        form.reset({
          returnDate: new Date(new Date().setDate(new Date().getDate() + 30)),
          notifyTime: '09:00',
          message: `Olá. O retorno de ${patientName} está próximo. Será no dia {{data}}. Posso confirmar?`,
        });
        
        // Notificar o componente pai
        if (onReminderCreated) {
          onReminderCreated(reminder);
        }
      }
    } catch (error) {
      console.error('Erro ao agendar retorno:', error);
      toast.error('Erro ao agendar retorno');
    } finally {
      setLoading(false);
    }
  };
  
  // Excluir um lembrete existente
  const handleDeleteReminder = async (id: string) => {
    try {
      setLoading(true);
      const success = await deleteReminder(id);
      
      if (success) {
        toast.success('Lembrete de retorno excluído com sucesso!');
        // Notificar o componente pai (se necessário)
        // Você pode adicionar uma callback onReminderDeleted se necessário
      }
    } catch (error) {
      console.error('Erro ao excluir lembrete:', error);
      toast.error('Erro ao excluir lembrete');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Agendar Retorno</h3>
        <p className="text-sm text-gray-500">
          Defina a data de retorno do paciente e receba lembretes automáticos
        </p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Campo de data de retorno */}
            <FormField
              control={form.control}
              name="returnDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data de Retorno</FormLabel>
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
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Campo de horário da notificação */}
            <FormField
              control={form.control}
              name="notifyTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Horário da Notificação</FormLabel>
                  <div className="flex items-center gap-2">
                    <FormControl>
                      <Input 
                        type="time" 
                        {...field} 
                      />
                    </FormControl>
                    <Clock className="h-4 w-4 text-gray-400" />
                  </div>
                  <FormDescription>
                    Horário para enviar a notificação no dia anterior ao retorno
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {/* Campo de mensagem personalizada */}
          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mensagem Personalizada</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Olá. O retorno de {{nome}} está próximo. Será no dia {{data}}. Posso confirmar?"
                    className="resize-none h-20"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Use {{nome}} para o nome do paciente e {{data}} para a data de retorno
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button 
            type="submit" 
            disabled={loading}
            className="w-full md:w-auto"
          >
            {loading ? 'Agendando...' : 'Agendar Retorno'}
          </Button>
        </form>
      </Form>
      
      {/* Lembretes de retorno existentes */}
      {existingReminders.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium mb-2">Retornos Agendados</h4>
          <div className="space-y-2">
            {existingReminders.map((reminder) => (
              <div 
                key={reminder.id}
                className="p-3 bg-gray-50 rounded-md flex justify-between items-center"
              >
                <div>
                  <p className="font-medium text-sm">{formatDate(reminder.target_date)}</p>
                  <p className="text-xs text-gray-500">
                    Notificação: {format(new Date(reminder.notify_at), "PPP 'às' HH:mm", { locale: pt })}
                  </p>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteReminder(reminder.id)}
                >
                  Cancelar
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}