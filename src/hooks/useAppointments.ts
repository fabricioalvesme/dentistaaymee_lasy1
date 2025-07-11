import { useState, useEffect } from 'react';
import { supabase, Appointment } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { AppointmentFormValues } from '@/components/appointments/EventForm';

export function useAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  // Carregar consultas
  useEffect(() => {
    console.log("Inicializando useAppointments hook");
    loadAppointments();
  }, []);

  // Carregar consultas
  const loadAppointments = async () => {
    try {
      setLoading(true);
      console.log("Carregando lista de compromissos...");
      
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('data_hora_inicio', { ascending: true });
      
      if (error) {
        console.error('Erro ao carregar consultas:', error);
        throw error;
      }
      
      console.log("Compromissos carregados:", data?.length || 0);
      setAppointments(data || []);
      return data || [];
    } catch (error) {
      console.error('Erro ao carregar consultas:', error);
      toast.error('Erro ao carregar consultas');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Próximos eventos
  const getUpcomingEvents = () => {
    const now = new Date();
    return appointments
      .filter(event => new Date(event.data_hora_inicio) >= now)
      .sort((a, b) => 
        new Date(a.data_hora_inicio).getTime() - new Date(b.data_hora_inicio).getTime()
      )
      .slice(0, 5);
  };

  // Filtrar eventos por data
  const getEventsForDay = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    
    return appointments.filter(event => {
      const eventDate = new Date(event.data_hora_inicio);
      return (
        eventDate.getFullYear() === year &&
        eventDate.getMonth() === month &&
        eventDate.getDate() === day
      );
    });
  };

  // Criar ou atualizar evento
  const saveAppointment = async (
    data: AppointmentFormValues, 
    selectedEvent: Appointment | null = null
  ): Promise<boolean> => {
    try {
      setLoading(true);
      console.log("Salvando compromisso:", { data, isEditing: !!selectedEvent });
      
      // Converter para ISO string
      const startDate = new Date(data.data);
      const endDate = new Date(data.data);
      
      const [startHours, startMinutes] = data.hora_inicio.split(':').map(Number);
      const [endHours, endMinutes] = data.hora_fim.split(':').map(Number);
      
      startDate.setHours(startHours, startMinutes, 0, 0);
      endDate.setHours(endHours, endMinutes, 0, 0);
      
      if (startDate >= endDate) {
        toast.error('A hora de início deve ser anterior à hora de fim');
        return false;
      }
      
      const appointmentData = {
        titulo: data.titulo,
        descricao: data.descricao || null,
        data_hora_inicio: startDate.toISOString(),
        data_hora_fim: endDate.toISOString(),
        patient_id: data.patient_id || null,
      };
      
      let result;
      
      if (selectedEvent) {
        // Atualizar evento existente
        console.log("Atualizando evento existente:", selectedEvent.id);
        result = await supabase
          .from('appointments')
          .update(appointmentData)
          .eq('id', selectedEvent.id);
      } else {
        // Criar novo evento
        console.log("Criando novo evento");
        result = await supabase
          .from('appointments')
          .insert([appointmentData]);
      }
      
      if (result.error) {
        console.error("Erro ao salvar evento:", result.error);
        toast.error('Erro ao salvar evento: ' + result.error.message);
        return false;
      }
      
      console.log("Evento salvo com sucesso:", result);
      toast.success(selectedEvent ? 'Evento atualizado com sucesso' : 'Evento criado com sucesso');
      
      // Recarregar a lista de compromissos após salvar
      await loadAppointments();
      return true;
    } catch (error: any) {
      console.error('Erro ao salvar evento:', error);
      toast.error('Erro ao salvar evento: ' + (error.message || 'Erro desconhecido'));
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Excluir evento
  const deleteAppointment = async (event: Appointment): Promise<boolean> => {
    try {
      setDeleting(true);
      console.log("Excluindo evento:", event.id);
      
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', event.id);
      
      if (error) {
        console.error("Erro ao excluir evento:", error);
        toast.error('Erro ao excluir evento: ' + error.message);
        return false;
      }
      
      console.log("Evento excluído com sucesso");
      toast.success('Evento excluído com sucesso');
      
      // Atualizar o estado local para refletir a exclusão
      setAppointments(appointments.filter(a => a.id !== event.id));
      return true;
    } catch (error: any) {
      console.error('Erro ao excluir evento:', error);
      toast.error('Erro ao excluir evento: ' + (error.message || 'Erro desconhecido'));
      return false;
    } finally {
      setDeleting(false);
    }
  };

  return {
    appointments,
    loading,
    deleting,
    getUpcomingEvents,
    getEventsForDay,
    saveAppointment,
    deleteAppointment,
    loadAppointments
  };
}