import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Bell, MessageCircle, Check, AlertCircle, CalendarClock, Calendar, NotebookText } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { Notification, Reminder, BirthdayNotification, ManualNotification } from '@/lib/types/reminder';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatRelativeTime, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

export function NotificationPopover() {
  const {
    notifications,
    unreadCount,
    markAsSent,
    openWhatsApp,
    getReturnMessage,
    getBirthdayMessage
  } = useNotifications();
  
  const isMobile = useIsMobile();
  const [patientNames, setPatientNames] = useState<Record<string, string>>({});
  
  // Carregar nomes dos pacientes para os lembretes
  const loadPatientNames = async (notifications: Notification[]) => {
    try {
      // Filtrar apenas os lembretes do tipo retorno (não aniversários)
      const reminders = notifications.filter(n => !('virtual' in n) && n.type === 'return') as Reminder[];
      
      // Obter IDs únicos de pacientes
      const patientIds = [...new Set(reminders.map(r => r.patient_id))];
      
      if (patientIds.length === 0) return;
      
      // Carregar nomes dos pacientes
      const { data, error } = await supabase
        .from('patients')
        .select('id, nome')
        .in('id', patientIds);
      
      if (error) {
        console.error('Erro ao carregar nomes dos pacientes:', error);
        return;
      }
      
      // Criar mapa de ID -> nome
      const nameMap: Record<string, string> = {};
      data?.forEach(patient => {
        nameMap[patient.id] = patient.nome;
      });
      
      setPatientNames(nameMap);
    } catch (error) {
      console.error('Erro ao carregar nomes dos pacientes:', error);
    }
  };
  
  // Carregar nomes dos pacientes quando as notificações mudarem
  useState(() => {
    if (notifications.length > 0) {
      loadPatientNames(notifications);
    }
  });
  
  // Componente para renderizar um item de notificação
  const NotificationItem = ({ notification }: { notification: Notification }) => {
    // Verificar se é uma notificação de aniversário (virtual)
    if ('virtual' in notification) {
      const birthday = notification as BirthdayNotification;
      const isToday = birthday.dias_ate_aniversario === 0;
      
      return (
        <div className="py-3 space-y-2">
          <div className="flex items-start gap-3">
            <Avatar className="h-9 w-9 bg-pink-100">
              <AvatarFallback className="bg-pink-100 text-pink-600">
                <Calendar className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{isToday ? 'Aniversário hoje' : 'Aniversário amanhã'}</span>
                <Badge variant="outline" className="bg-pink-50 text-pink-600 border-pink-100">
                  {isToday ? 'Hoje' : 'Amanhã'}
                </Badge>
              </div>
              
              <p className="text-sm text-gray-600">
                {isToday 
                  ? `Hoje é aniversário de ${birthday.nome}!` 
                  : `Amanhã é aniversário de ${birthday.nome}!`}
              </p>
              
              <div className="text-xs text-gray-500">
                {formatDate(birthday.data_nascimento)}
              </div>
            </div>
          </div>
          
          <div className="pl-12 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="h-8"
              onClick={() => {
                const message = getBirthdayMessage(birthday);
                openWhatsApp(birthday.telefone, message);
                markAsSent(notification.id);
                toast.success('Mensagem de aniversário enviada');
              }}
            >
              <MessageCircle className="h-3.5 w-3.5 mr-1" />
              Enviar mensagem
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              className="h-8"
              onClick={() => {
                markAsSent(notification.id);
                toast.success('Notificação removida');
              }}
            >
              <Check className="h-3.5 w-3.5 mr-1" />
              Marcar como visto
            </Button>
          </div>
        </div>
      );
    } else if (notification.type === 'manual') {
      // É uma notificação manual
      const manualNotif = notification as ManualNotification;
      
      return (
        <div className="py-3 space-y-2">
          <div className="flex items-start gap-3">
            <Avatar className="h-9 w-9 bg-purple-100">
              <AvatarFallback className="bg-purple-100 text-purple-600">
                <NotebookText className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{manualNotif.titulo}</span>
                <Badge variant="outline" className="bg-purple-50 text-purple-600 border-purple-100">
                  Manual
                </Badge>
              </div>
              
              <p className="text-sm text-gray-600">
                {manualNotif.mensagem}
              </p>
              
              <div className="text-xs text-gray-500">
                Criada em {formatDate(manualNotif.created_at)}
              </div>
            </div>
          </div>
          
          <div className="pl-12 flex flex-wrap gap-2">
            {manualNotif.telefone && (
              <Button
                size="sm"
                variant="secondary"
                className="h-8"
                onClick={() => {
                  openWhatsApp(manualNotif.telefone!, manualNotif.mensagem);
                  markAsSent(notification.id);
                  toast.success('Mensagem enviada');
                }}
              >
                <MessageCircle className="h-3.5 w-3.5 mr-1" />
                Enviar mensagem
              </Button>
            )}
            
            <Button
              size="sm"
              variant="ghost"
              className="h-8"
              onClick={() => {
                markAsSent(notification.id);
                toast.success('Notificação removida');
              }}
            >
              <Check className="h-3.5 w-3.5 mr-1" />
              Marcar como visto
            </Button>
          </div>
        </div>
      );
    } else {
      // É um lembrete normal (retorno)
      const reminder = notification as Reminder;
      const patientName = patientNames[reminder.patient_id] || 'Paciente';
      
      return (
        <div className="py-3 space-y-2">
          <div className="flex items-start gap-3">
            <Avatar className="h-9 w-9 bg-blue-100">
              <AvatarFallback className="bg-blue-100 text-blue-600">
                <CalendarClock className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">Lembrete de retorno</span>
                <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-100">
                  Retorno
                </Badge>
              </div>
              
              <p className="text-sm text-gray-600">
                Retorno de {patientName} agendado para {formatDate(reminder.target_date)}
              </p>
              
              <div className="text-xs text-gray-500">
                Lembrete criado em {formatDate(reminder.created_at)}
              </div>
            </div>
          </div>
          
          <div className="pl-12 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="h-8"
              onClick={async () => {
                try {
                  // Buscar telefone do paciente
                  const { data: patient, error } = await supabase
                    .from('patients')
                    .select('telefone')
                    .eq('id', reminder.patient_id)
                    .single();
                  
                  if (error) throw error;
                  
                  const message = getReturnMessage(reminder, patientName);
                  openWhatsApp(patient.telefone, message);
                  await markAsSent(reminder.id);
                  toast.success('Mensagem de retorno enviada');
                } catch (error) {
                  console.error('Erro ao enviar mensagem:', error);
                  toast.error('Erro ao enviar mensagem');
                }
              }}
            >
              <MessageCircle className="h-3.5 w-3.5 mr-1" />
              Enviar mensagem
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              className="h-8"
              onClick={() => {
                markAsSent(reminder.id);
                toast.success('Notificação removida');
              }}
            >
              <Check className="h-3.5 w-3.5 mr-1" />
              Marcar como visto
            </Button>
          </div>
        </div>
      );
    }
  };
  
  // Conteúdo das notificações
  const NotificationContent = () => (
    <div className="w-full">
      {notifications.length > 0 ? (
        <ScrollArea className="h-[300px] md:h-[350px]">
          <div className="px-4 py-2">
            {notifications.map((notification, index) => (
              <div key={notification.id}>
                <NotificationItem notification={notification} />
                {index < notifications.length - 1 && <Separator />}
              </div>
            ))}
          </div>
        </ScrollArea>
      ) : (
        <div className="p-6 text-center">
          <Bell className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Nenhuma notificação para exibir.</p>
        </div>
      )}
    </div>
  );
  
  // Componente para mobile (drawer)
  if (isMobile) {
    return (
      <Drawer>
        <DrawerTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </Button>
        </DrawerTrigger>
        
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Notificações</DrawerTitle>
          </DrawerHeader>
          
          <NotificationContent />
          
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">Fechar</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }
  
  // Componente para desktop (popover)
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 md:w-96 p-0" align="end">
        <div className="px-4 py-2 bg-gray-50 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Notificações</h3>
            <Badge variant="outline" className="bg-gray-100">
              {unreadCount} {unreadCount === 1 ? 'novo' : 'novos'}
            </Badge>
          </div>
        </div>
        
        <NotificationContent />
      </PopoverContent>
    </Popover>
  );
}