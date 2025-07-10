import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { supabase, Appointment } from '@/lib/supabaseClient';
import { 
  Plus, 
  Loader2, 
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatDate } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAppointments } from '@/hooks/useAppointments';
import { CalendarView } from '@/components/appointments/CalendarView';
import { DayView } from '@/components/appointments/DayView';
import { WeekView } from '@/components/appointments/WeekView';
import { MonthView } from '@/components/appointments/MonthView';
import { EventForm, AppointmentFormValues } from '@/components/appointments/EventForm';
import { EventDetails } from '@/components/appointments/EventDetails';
import { toast } from 'sonner';

const AppointmentCalendar = () => {
  const {
    appointments,
    loading,
    deleting,
    getUpcomingEvents,
    getEventsForDay,
    saveAppointment,
    deleteAppointment
  } = useAppointments();
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDialog, setShowDialog] = useState(false);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Appointment | null>(null);
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');
  const [showCalendar, setShowCalendar] = useState(false);
  const isMobile = useIsMobile();

  // Abrir diálogo para adicionar evento
  const handleAddEvent = () => {
    setSelectedEvent(null);
    const defaultValues: AppointmentFormValues = {
      titulo: '',
      descricao: '',
      data: selectedDate,
      hora_inicio: '09:00',
      hora_fim: '10:00',
    };
    setShowDialog(true);
  };

  // Abrir diálogo para ver/editar evento
  const handleEventClick = (event: Appointment) => {
    setSelectedEvent(event);
    setShowEventDialog(true);
  };

  // Editar evento
  const handleEditEvent = () => {
    if (!selectedEvent) return;
    
    const startDate = new Date(selectedEvent.data_hora_inicio);
    const endDate = new Date(selectedEvent.data_hora_fim);
    
    const defaultValues: AppointmentFormValues = {
      titulo: selectedEvent.titulo,
      descricao: selectedEvent.descricao || '',
      data: startDate,
      hora_inicio: startDate.toTimeString().substring(0, 5),
      hora_fim: endDate.toTimeString().substring(0, 5),
      patient_id: selectedEvent.patient_id,
    };
    
    setShowEventDialog(false);
    setShowDialog(true);
  };

  // Excluir evento
  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;
    
    const success = await deleteAppointment(selectedEvent);
    if (success) {
      setShowEventDialog(false);
    }
  };

  // Enviar formulário
  const onSubmit = async (data: AppointmentFormValues) => {
    try {
      console.log("Processando envio do formulário:", data);
      
      // Validar se a hora de término é posterior à hora de início
      const startDate = new Date(data.data);
      const endDate = new Date(data.data);
      
      const [startHours, startMinutes] = data.hora_inicio.split(':').map(Number);
      const [endHours, endMinutes] = data.hora_fim.split(':').map(Number);
      
      startDate.setHours(startHours, startMinutes, 0, 0);
      endDate.setHours(endHours, endMinutes, 0, 0);
      
      if (startDate >= endDate) {
        toast.error('A hora de início deve ser anterior à hora de fim');
        return;
      }
      
      const success = await saveAppointment(data, selectedEvent);
      if (success) {
        setShowDialog(false);
        toast.success(selectedEvent ? 'Evento atualizado com sucesso' : 'Evento criado com sucesso');
      }
    } catch (error) {
      console.error("Erro ao salvar evento:", error);
      toast.error('Erro ao salvar o evento. Tente novamente.');
    }
  };

  // Função para alternar a visualização do calendário
  const toggleCalendar = () => {
    setShowCalendar(!showCalendar);
  };

  // Função para mudar a data selecionada
  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  // Função para mudar a data para dia anterior/posterior
  const changeDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    
    if (direction === 'prev') {
      if (viewMode === 'day') {
        newDate.setDate(newDate.getDate() - 1);
      } else if (viewMode === 'week') {
        newDate.setDate(newDate.getDate() - 7);
      } else {
        newDate.setMonth(newDate.getMonth() - 1);
      }
    } else {
      if (viewMode === 'day') {
        newDate.setDate(newDate.getDate() + 1);
      } else if (viewMode === 'week') {
        newDate.setDate(newDate.getDate() + 7);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
    }
    
    setSelectedDate(newDate);
  };

  // Gerar descrição da data atual com base no modo de visualização
  const getDateDescription = () => {
    if (viewMode === 'day') {
      return formatDate(selectedDate);
    } else if (viewMode === 'week') {
      const startOfWeek = new Date(selectedDate);
      startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      return `Semana de ${formatDate(startOfWeek)} a ${formatDate(endOfWeek)}`;
    } else {
      return selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    }
  };

  return (
    <AdminLayout>
      <Helmet>
        <title>Agenda - Dra. Aymée Frauzino</title>
      </Helmet>
      
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Agenda</h1>
            <p className="text-gray-500">Gerencie consultas e compromissos</p>
          </div>
          
          <div className="flex space-x-2">
            <Button onClick={handleAddEvent}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Evento
            </Button>
          </div>
        </div>
        
        {/* Carregando */}
        {loading && !appointments.length ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Card de data selecionada e controles */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <CardTitle>{getDateDescription()}</CardTitle>
                  </div>
                  
                  <div className="flex items-center space-x-2 w-full sm:w-auto">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => changeDate('prev')}
                    >
                      Anterior
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedDate(new Date())}
                    >
                      Hoje
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => changeDate('next')}
                    >
                      Próximo
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-2">
                {/* Controles de visualização */}
                <div className="flex justify-between items-center mb-4">
                  <Tabs 
                    value={viewMode} 
                    onValueChange={(value) => setViewMode(value as 'day' | 'week' | 'month')}
                    className="w-full sm:w-auto"
                  >
                    <TabsList className="grid grid-cols-3">
                      <TabsTrigger value="day">Dia</TabsTrigger>
                      <TabsTrigger value="week">Semana</TabsTrigger>
                      <TabsTrigger value="month">Mês</TabsTrigger>
                    </TabsList>
                  </Tabs>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={toggleCalendar}
                    className="flex items-center"
                  >
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {showCalendar ? (
                      <>
                        Ocultar Calendário
                        <ChevronUp className="ml-2 h-4 w-4" />
                      </>
                    ) : (
                      <>
                        Mostrar Calendário
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
                
                {/* Calendário colapsável */}
                {showCalendar && (
                  <CalendarView 
                    selectedDate={selectedDate}
                    onDateSelect={handleDateChange}
                    appointments={appointments}
                    upcomingEvents={getUpcomingEvents()}
                    onEventClick={handleEventClick}
                  />
                )}
                
                {/* Visualizações */}
                <div className="overflow-x-auto">
                  <div className={`min-w-full ${viewMode === 'day' ? 'min-w-[600px]' : viewMode === 'week' ? 'min-w-[700px]' : 'min-w-[800px]'}`}>
                    <Tabs value={viewMode} className="mt-0">
                      <TabsContent value="day">
                        <DayView
                          events={getEventsForDay(selectedDate)}
                          selectedDate={selectedDate}
                          onEventClick={handleEventClick}
                          onAddEvent={handleAddEvent}
                        />
                      </TabsContent>
                      
                      <TabsContent value="week">
                        <WeekView
                          selectedDate={selectedDate}
                          events={appointments}
                          onEventClick={handleEventClick}
                        />
                      </TabsContent>
                      
                      <TabsContent value="month">
                        <MonthView
                          selectedDate={selectedDate}
                          events={appointments}
                          onDateSelect={(date) => {
                            setSelectedDate(date);
                            setViewMode('day');
                          }}
                          onEventClick={handleEventClick}
                        />
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      
      {/* Diálogo para adicionar/editar evento */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedEvent ? 'Editar Evento' : 'Novo Evento'}</DialogTitle>
            <DialogDescription>
              {selectedEvent 
                ? 'Edite os detalhes do evento selecionado' 
                : 'Preencha os detalhes para adicionar um novo evento'}
            </DialogDescription>
          </DialogHeader>
          
          <EventForm 
            defaultValues={{
              titulo: selectedEvent?.titulo || '',
              descricao: selectedEvent?.descricao || '',
              data: selectedEvent ? new Date(selectedEvent.data_hora_inicio) : selectedDate,
              hora_inicio: selectedEvent 
                ? new Date(selectedEvent.data_hora_inicio).toTimeString().substring(0, 5) 
                : '09:00',
              hora_fim: selectedEvent 
                ? new Date(selectedEvent.data_hora_fim).toTimeString().substring(0, 5) 
                : '10:00',
              patient_id: selectedEvent?.patient_id,
            }}
            onSubmit={onSubmit}
            isEditing={!!selectedEvent}
          />
        </DialogContent>
      </Dialog>
      
      {/* Diálogo para visualizar evento */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do Evento</DialogTitle>
          </DialogHeader>
          
          {selectedEvent && (
            <EventDetails
              event={selectedEvent}
              onEdit={handleEditEvent}
              onDelete={handleDeleteEvent}
              deleting={deleting}
            />
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AppointmentCalendar;