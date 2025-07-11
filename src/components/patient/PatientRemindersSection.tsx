import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Reminder } from '@/lib/types/reminder';
import { formatDate } from '@/lib/utils';
import { Loader2, Bell, Calendar, MessageCircle, Trash2 } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';

interface PatientRemindersSectionProps {
  patientId: string;
  patientName: string;
  patientPhone: string;
}

export function PatientRemindersSection({ 
  patientId, 
  patientName,
  patientPhone 
}: PatientRemindersSectionProps) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { 
    getPatientReminders, 
    deleteReminder, 
    openWhatsApp, 
    getReturnMessage 
  } = useNotifications();
  
  // Carregar lembretes do paciente
  useEffect(() => {
    async function loadReminders() {
      try {
        setLoading(true);
        setError(null);
        
        const patientReminders = await getPatientReminders(patientId);
        setReminders(patientReminders);
      } catch (error) {
        console.error('Erro ao carregar lembretes:', error);
        setError('Não foi possível carregar os lembretes');
      } finally {
        setLoading(false);
      }
    }
    
    loadReminders();
  }, [patientId, getPatientReminders]);
  
  // Excluir um lembrete
  const handleDeleteReminder = async (id: string) => {
    try {
      const success = await deleteReminder(id);
      
      if (success) {
        setReminders(prev => prev.filter(r => r.id !== id));
        toast.success('Lembrete excluído com sucesso');
      }
    } catch (error) {
      console.error('Erro ao excluir lembrete:', error);
      toast.error('Erro ao excluir lembrete');
    }
  };
  
  // Enviar mensagem de lembrete
  const handleSendMessage = (reminder: Reminder) => {
    const message = getReturnMessage(reminder, patientName);
    openWhatsApp(patientPhone, message);
  };
  
  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md text-red-700">
        <p>{error}</p>
        <Button 
          variant="link" 
          size="sm" 
          className="px-0 mt-2"
          onClick={() => window.location.reload()}
        >
          Tentar novamente
        </Button>
      </div>
    );
  }
  
  // Dividir lembretes em passados e futuros
  const now = new Date();
  const pastReminders = reminders.filter(
    r => new Date(r.target_date) < now || r.sent
  );
  
  const upcomingReminders = reminders.filter(
    r => new Date(r.target_date) >= now && !r.sent
  );
  
  // Verificar se há lembretes
  if (reminders.length === 0) {
    return (
      <div className="text-center py-4">
        <Bell className="h-10 w-10 text-gray-300 mx-auto mb-2" />
        <p className="text-gray-500">
          Nenhum lembrete de retorno agendado para este paciente
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Próximos lembretes */}
      {upcomingReminders.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2">Próximos Retornos</h4>
          <div className="space-y-2">
            {upcomingReminders.map(reminder => (
              <div 
                key={reminder.id}
                className="p-3 bg-gray-50 rounded-md flex items-center justify-between"
              >
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-blue-500 mt-0.5" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">Retorno</p>
                      <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-100">
                        {formatDate(reminder.target_date)}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500">
                      Notificação: {formatDate(reminder.notify_at)} 
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleSendMessage(reminder)}
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir lembrete?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação não pode ser desfeita. O lembrete será permanentemente excluído.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-red-500 hover:bg-red-600"
                          onClick={() => handleDeleteReminder(reminder.id)}
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Lembretes passados */}
      {pastReminders.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2">Histórico de Retornos</h4>
          <div className="space-y-2">
            {pastReminders.map(reminder => (
              <div 
                key={reminder.id}
                className="p-3 bg-gray-50 rounded-md flex items-center justify-between"
              >
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-gray-500 mt-0.5" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">Retorno</p>
                      <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200">
                        {formatDate(reminder.target_date)}
                      </Badge>
                      {reminder.sent && (
                        <Badge variant="outline" className="bg-green-50 text-green-600 border-green-100">
                          Enviado
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir registro de retorno?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação não pode ser desfeita. O registro será permanentemente excluído.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-red-500 hover:bg-red-600"
                        onClick={() => handleDeleteReminder(reminder.id)}
                      >
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}