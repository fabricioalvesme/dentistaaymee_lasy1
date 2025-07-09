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
    loadAppointments();
  }, []);

  // Carregar consultas
  const loadAppointments = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('data_hora_inicio', { ascending: true });
      
      if (error) throw error;
      
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
  ) => {
    try {
      setLoading(true);
      
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
      
      if (selectedEvent) {
        // Atualizar evento existente
        const { error } = await supabase
          .from('appointments')
          .update(appointmentData)
          .eq('id', selectedEvent.id);
        
        if (error) throw error;
        
        toast.success('Evento atualizado com sucesso');
      } else {
        // Criar novo evento
        const { error } = await supabase
          .from('appointments')
          .insert([appointmentData]);
        
        if (error) throw error;
        
        toast.success('Evento criado com sucesso');
      }
      
      await loadAppointments();
      return true;
    } catch (error) {
      console.error('Erro ao salvar evento:', error);
      toast.error('Erro ao salvar evento');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Excluir evento
  const deleteAppointment = async (event: Appointment) => {
    try {
      setDeleting(true);
      
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', event.id);
      
      if (error) throw error;
      
      toast.success('Evento excluído com sucesso');
      await loadAppointments();
      return true;
    } catch (error) {
      console.error('Erro ao excluir evento:', error);
      toast.error('Erro ao excluir evento');
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