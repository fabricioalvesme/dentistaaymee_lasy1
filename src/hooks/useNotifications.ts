import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Notification, Reminder, BirthdayNotification, ManualNotification } from '@/lib/types/reminder';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Carregar notificações
  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Carregando notificações...');

      // Carregar lembretes não enviados
      const { data: reminders, error: remindersError } = await supabase
        .from('reminders')
        .select('*')
        .eq('sent', false)
        .lte('notify_at', new Date().toISOString())
        .order('notify_at', { ascending: true });

      if (remindersError) {
        console.error('Erro ao carregar lembretes:', remindersError);
        throw remindersError;
      }

      // Carregar aniversariantes de hoje e amanhã
      const { data: birthdays, error: birthdaysError } = await supabase
        .rpc('get_upcoming_birthdays', { days_ahead: 1 });

      if (birthdaysError) {
        console.error('Erro ao carregar aniversariantes:', birthdaysError);
        throw birthdaysError;
      }
      
      // Carregar notificações manuais não enviadas
      const { data: manualNotifs, error: manualError } = await supabase
        .from('manual_notifications')
        .select('*')
        .eq('sent', false)
        .lte('notify_at', new Date().toISOString())
        .order('notify_at', { ascending: true });
        
      if (manualError) {
        console.error('Erro ao carregar notificações manuais:', manualError);
        throw manualError;
      }

      // Converter aniversariantes para notificações
      const birthdayNotifications: BirthdayNotification[] = (birthdays || []).map(birthday => ({
        id: `birthday-${birthday.id}`,
        nome: birthday.nome,
        data_nascimento: birthday.data_nascimento,
        dias_ate_aniversario: birthday.dias_ate_aniversario,
        telefone: birthday.telefone,
        type: 'birthday',
        virtual: true
      }));
      
      // Converter notificações manuais para o formato padrão
      const manualNotifications: ManualNotification[] = (manualNotifs || []).map(notif => ({
        id: notif.id,
        titulo: notif.titulo,
        mensagem: notif.mensagem,
        notify_at: notif.notify_at,
        telefone: notif.telefone,
        sent: notif.sent,
        created_at: notif.created_at,
        type: 'manual'
      }));

      // Combinar os três tipos de notificações
      const allNotifications: Notification[] = [
        ...(reminders || []),
        ...birthdayNotifications,
        ...manualNotifications
      ];

      console.log('Notificações carregadas:', allNotifications.length);
      setNotifications(allNotifications);
      setUnreadCount(allNotifications.length);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
      toast.error('Erro ao carregar notificações');
    } finally {
      setLoading(false);
    }
  }, []);

  // Carregar notificações ao montar o componente
  useEffect(() => {
    loadNotifications();
    
    // Configurar um intervalo para verificar notificações a cada 5 minutos
    const interval = setInterval(() => {
      loadNotifications();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [loadNotifications]);

  // Marcar um lembrete como enviado
  const markAsSent = async (id: string) => {
    try {
      // Verificar se é uma notificação virtual (aniversário)
      if (id.startsWith('birthday-')) {
        // Apenas remover da lista local
        setNotifications(prev => prev.filter(n => n.id !== id));
        setUnreadCount(prev => Math.max(0, prev - 1));
        return true;
      }
      
      // Verificar se é uma notificação manual
      const isManualNotification = notifications.some(n => 
        n.id === id && n.type === 'manual'
      );
      
      if (isManualNotification) {
        // Atualizar no banco de dados (tabela manual_notifications)
        const { error } = await supabase
          .from('manual_notifications')
          .update({ sent: true })
          .eq('id', id);
        
        if (error) {
          console.error('Erro ao marcar notificação manual como enviada:', error);
          throw error;
        }
      } else {
        // Atualizar no banco de dados (tabela reminders)
        const { error } = await supabase
          .from('reminders')
          .update({ sent: true })
          .eq('id', id);
        
        if (error) {
          console.error('Erro ao marcar notificação como enviada:', error);
          throw error;
        }
      }
      
      // Atualizar estado local
      setNotifications(prev => prev.filter(n => n.id !== id));
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      return true;
    } catch (error) {
      console.error('Erro ao marcar notificação como enviada:', error);
      toast.error('Erro ao marcar notificação como enviada');
      return false;
    }
  };
  
  // Abrir o WhatsApp com uma mensagem pré-definida
  const openWhatsApp = (phone: string, message: string) => {
    const formattedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${phone}&text=${formattedMessage}`;
    window.open(whatsappUrl, '_blank');
  };
  
  // Gerar mensagem para lembrete de retorno
  const getReturnMessage = (reminder: Reminder, patientName: string) => {
    if (reminder.message_template) {
      return reminder.message_template
        .replace('{{nome}}', patientName)
        .replace('{{data}}', formatDate(reminder.target_date));
    }
    
    return `Olá. O retorno de ${patientName} está próximo. Será no dia ${formatDate(reminder.target_date)}. Posso confirmar?`;
  };
  
  // Gerar mensagem para aniversário
  const getBirthdayMessage = (birthday: BirthdayNotification) => {
    const isToday = birthday.dias_ate_aniversario === 0;
    
    if (isToday) {
      return `Olá! A equipe da Dra. Aymée Frauzino deseja um feliz aniversário para ${birthday.nome}! 🎂🎉 Que seja um dia especial, cheio de alegria e sorrisos! 😊`;
    } else {
      return `Olá! Amanhã é o aniversário de ${birthday.nome} e a equipe da Dra. Aymée Frauzino quer enviar nossos votos antecipados de feliz aniversário! 🎂🎉`;
    }
  };
  
  // Criar um novo lembrete de retorno
  const createReturnReminder = async (
    patientId: string,
    targetDate: Date,
    notifyAt: Date,
    messageTemplate?: string
  ) => {
    try {
      const { data, error } = await supabase
        .from('reminders')
        .insert([{
          patient_id: patientId,
          type: 'return',
          target_date: targetDate.toISOString().split('T')[0],
          notify_at: notifyAt.toISOString(),
          message_template: messageTemplate || null
        }])
        .select();
      
      if (error) {
        console.error('Erro ao criar lembrete de retorno:', error);
        throw error;
      }
      
      return data?.[0] || null;
    } catch (error) {
      console.error('Erro ao criar lembrete de retorno:', error);
      toast.error('Erro ao criar lembrete de retorno');
      return null;
    }
  };
  
  // Criar uma notificação manual
  const createManualNotification = async (
    titulo: string,
    mensagem: string,
    notifyAt: Date,
    telefone?: string
  ) => {
    try {
      const { data, error } = await supabase
        .from('manual_notifications')
        .insert([{
          titulo,
          mensagem,
          notify_at: notifyAt.toISOString(),
          telefone: telefone || null,
          sent: false,
          created_at: new Date().toISOString()
        }])
        .select();
      
      if (error) {
        console.error('Erro ao criar notificação manual:', error);
        throw error;
      }
      
      return data?.[0] || null;
    } catch (error) {
      console.error('Erro ao criar notificação manual:', error);
      toast.error('Erro ao criar notificação manual');
      return null;
    }
  };
  
  // Obter os lembretes de um paciente
  const getPatientReminders = async (patientId: string) => {
    try {
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('patient_id', patientId)
        .order('target_date', { ascending: false });
      
      if (error) {
        console.error('Erro ao carregar lembretes do paciente:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Erro ao carregar lembretes do paciente:', error);
      toast.error('Erro ao carregar lembretes do paciente');
      return [];
    }
  };
  
  // Excluir um lembrete
  const deleteReminder = async (id: string) => {
    try {
      const { error } = await supabase
        .from('reminders')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Erro ao excluir lembrete:', error);
        throw error;
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao excluir lembrete:', error);
      toast.error('Erro ao excluir lembrete');
      return false;
    }
  };

  // Excluir uma notificação manual
  const deleteManualNotification = async (id: string) => {
    try {
      const { error } = await supabase
        .from('manual_notifications')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Erro ao excluir notificação manual:', error);
        throw error;
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao excluir notificação manual:', error);
      toast.error('Erro ao excluir notificação manual');
      return false;
    }
  };
  
  // Carregar todas as notificações manuais (para exibição em tabela)
  const getAllManualNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('manual_notifications')
        .select('*')
        .order('notify_at', { ascending: false });
      
      if (error) {
        console.error('Erro ao carregar notificações manuais:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Erro ao carregar notificações manuais:', error);
      toast.error('Erro ao carregar notificações manuais');
      return [];
    }
  };
  
  return {
    notifications,
    loading,
    unreadCount,
    markAsSent,
    openWhatsApp,
    loadNotifications,
    getReturnMessage,
    getBirthdayMessage,
    createReturnReminder,
    createManualNotification,
    getPatientReminders,
    deleteReminder,
    deleteManualNotification,
    getAllManualNotifications
  };
}