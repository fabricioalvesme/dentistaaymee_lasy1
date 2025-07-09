import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { supabase, Appointment } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { 
  Plus, 
  Loader2, 
  Calendar as CalendarIcon,
  Clock,
  User,
  Trash2,
  Edit,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { formatDate, formatDateTime } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIsMobile } from '@/hooks/use-mobile';

const appointmentSchema = z.object({
  titulo: z.string().min(3, 'Título deve ter pelo menos 3 caracteres'),
  descricao: z.string().optional(),
  data: z.date(),
  hora_inicio: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido'),
  hora_fim: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido'),
  patient_id: z.string().optional(),
});

type AppointmentFormValues = z.infer<typeof appointmentSchema>;

const AppointmentCalendar = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Appointment | null>(null);
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');
  const [deleting, setDeleting] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const isMobile = useIsMobile();
  
  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      titulo: '',
      descricao: '',
      data: new Date(),
      hora_inicio: '09:00',
      hora_fim: '10:00',
    },
  });

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
    } catch (error) {
      console.error('Erro ao carregar consultas:', error);
      toast.error('Erro ao carregar consultas');
    } finally {
      setLoading(false);
    }
  };

  // Abrir diálogo para adicionar evento
  const handleAddEvent = () => {
    form.reset({
      titulo: '',
      descricao: '',
      data: selectedDate,
      hora_inicio: '09:00',
      hora_fim: '10:00',
    });
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
    
    form.reset({
      titulo: selectedEvent.titulo,
      descricao: selectedEvent.descricao || '',
      data: startDate,
      hora_inicio: startDate.toTimeString().substring(0, 5),
      hora_fim: endDate.toTimeString().substring(0, 5),
      patient_id: selectedEvent.patient_id,
    });
    
    setShowEventDialog(false);
    setShowDialog(true);
  };

  // Excluir evento
  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;
    
    try {
      setDeleting(true);
      
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', selectedEvent.id);
      
      if (error) throw error;
      
      toast.success('Evento excluído com sucesso');
      setShowEventDialog(false);
      loadAppointments();
    } catch (error) {
      console.error('Erro ao excluir evento:', error);
      toast.error('Erro ao excluir evento');
    } finally {
      setDeleting(false);
    }
  };

  // Enviar formulário
  const onSubmit = async (data: AppointmentFormValues) => {
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
        return;
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
      
      setShowDialog(false);
      loadAppointments();
    } catch (error) {
      console.error('Erro ao salvar evento:', error);
      toast.error('Erro ao salvar evento');
    } finally {
      setLoading(false);
    }
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

  // Filtrar eventos por semana
  const getEventsForWeek = (date: Date) => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    return appointments.filter(event => {
      const eventDate = new Date(event.data_hora_inicio);
      return eventDate >= startOfWeek && eventDate <= endOfWeek;
    });
  };

  // Filtrar eventos por mês
  const getEventsForMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    return appointments.filter(event => {
      const eventDate = new Date(event.data_hora_inicio);
      return eventDate.getFullYear() === year && eventDate.getMonth() === month;
    });
  };

  // Gerar horários para visão de dia
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour < 19; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    return slots;
  };

  // Gerar dias da semana para visão de semana
  const generateWeekDays = (date: Date) => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  };

  // Verificar se há eventos em uma data específica
  const hasEventsOnDate = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    
    return appointments.some(event => {
      const eventDate = new Date(event.data_hora_inicio);
      return (
        eventDate.getFullYear() === year &&
        eventDate.getMonth() === month &&
        eventDate.getDate() === day
      );
    });
  };

  // Obter eventos para o dia selecionado com slots de tempo
  const getDayEvents = () => {
    const todayEvents = getEventsForDay(selectedDate);
    if (todayEvents.length === 0) {
      return (
        <div className="text-center py-12 bg-gray-50 rounded-md">
          <p className="text-gray-500">Nenhum evento agendado para este dia</p>
          <Button 
            variant="link" 
            onClick={handleAddEvent}
            className="mt-2"
          >
            Adicionar Evento
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {generateTimeSlots().map(timeSlot => {
          const [hours, minutes] = timeSlot.split(':').map(Number);
          const slotDate = new Date(selectedDate);
          slotDate.setHours(hours, minutes, 0, 0);
          
          const eventsAtTime = todayEvents.filter(event => {
            const eventStart = new Date(event.data_hora_inicio);
            const eventEnd = new Date(event.data_hora_fim);
            return eventStart <= slotDate && eventEnd > slotDate;
          });
          
          if (eventsAtTime.length === 0) return null;
          
          return (
            <div key={timeSlot} className="flex">
              <div className="w-16 text-right pr-4 text-gray-500">
                {timeSlot}
              </div>
              
              <div className="flex-1 space-y-2">
                {eventsAtTime.map(event => (
                  <div
                    key={event.id}
                    className="p-3 rounded-md bg-primary/10 border-l-4 border-primary cursor-pointer hover:bg-primary/20"
                    onClick={() => handleEventClick(event)}
                  >
                    <h3 className="font-medium">{event.titulo}</h3>
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="h-3 w-3 mr-1" />
                      <span>
                        {new Date(event.data_hora_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - 
                        {new Date(event.data_hora_fim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
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

  return (
    <AdminLayout>
      <Helmet>
        <title>Agenda - Dra. Aymée Frauzino</title>
      </Helmet>
      
      <div className="space-y-6">
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
                    <CardTitle>
                      {viewMode === 'day' && formatDate(selectedDate)}
                      {viewMode === 'week' && `Semana de ${formatDate(generateWeekDays(selectedDate)[0])} a ${formatDate(generateWeekDays(selectedDate)[6])}`}
                      {viewMode === 'month' && `${selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`}
                    </CardTitle>
                  </div>
                  
                  <div className="flex items-center space-x-2 w-full sm:w-auto">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const newDate = new Date(selectedDate);
                        if (viewMode === 'day') {
                          newDate.setDate(newDate.getDate() - 1);
                        } else if (viewMode === 'week') {
                          newDate.setDate(newDate.getDate() - 7);
                        } else {
                          newDate.setMonth(newDate.getMonth() - 1);
                        }
                        setSelectedDate(newDate);
                      }}
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
                      onClick={() => {
                        const newDate = new Date(selectedDate);
                        if (viewMode === 'day') {
                          newDate.setDate(newDate.getDate() + 1);
                        } else if (viewMode === 'week') {
                          newDate.setDate(newDate.getDate() + 7);
                        } else {
                          newDate.setMonth(newDate.getMonth() + 1);
                        }
                        setSelectedDate(newDate);
                      }}
                    >
                      Próximo
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-2">
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
                    onClick={() => setShowCalendar(!showCalendar)}
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
                  <div className="mb-6 border rounded-md p-4 bg-gray-50">
                    <div className="flex flex-col sm:flex-row gap-6">
                      <div className="w-full sm:w-auto flex justify-center">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => date && setSelectedDate(date)}
                          className="rounded-md border bg-white"
                          modifiers={{
                            hasEvents: appointments.map(event => new Date(event.data_hora_inicio))
                          }}
                          modifiersClassNames={{
                            hasEvents: "bg-primary/20 font-bold text-primary"
                          }}
                        />
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-medium mb-2">Próximos Eventos</h3>
                        
                        {getUpcomingEvents().length === 0 ? (
                          <p className="text-sm text-gray-500">Nenhum evento agendado</p>
                        ) : (
                          <ul className="space-y-2">
                            {getUpcomingEvents().map(event => (
                              <li 
                                key={event.id}
                                className="text-sm p-2 rounded bg-white hover:bg-gray-100 cursor-pointer border"
                                onClick={() => handleEventClick(event)}
                              >
                                <p className="font-medium">{event.titulo}</p>
                                <p className="text-gray-500">{formatDateTime(event.data_hora_inicio)}</p>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Visualizações */}
                <div className="overflow-x-auto">
                  <div className={`min-w-full ${viewMode === 'day' ? 'min-w-[600px]' : viewMode === 'week' ? 'min-w-[700px]' : 'min-w-[800px]'}`}>
                    <Tabs value={viewMode} className="mt-0">
                      <TabsContent value="day">
                        {getDayEvents()}
                      </TabsContent>
                      
                      <TabsContent value="week">
                        <div className="grid grid-cols-7 gap-2">
                          {generateWeekDays(selectedDate).map((day, index) => (
                            <div key={index} className="text-center">
                              <div className={`
                                p-2 rounded-md mb-2 
                                ${new Date().toDateString() === day.toDateString() ? 'bg-primary text-white' : 'bg-gray-100'}
                              `}>
                                <p className="font-medium">{day.toLocaleDateString('pt-BR', { weekday: 'short' })}</p>
                                <p>{day.getDate()}</p>
                              </div>
                              
                              <div className="space-y-2">
                                {getEventsForDay(day).map(event => (
                                  <div
                                    key={event.id}
                                    className="p-2 rounded-md bg-primary/10 border-l-4 border-primary cursor-pointer hover:bg-primary/20 text-left"
                                    onClick={() => handleEventClick(event)}
                                  >
                                    <h4 className="font-medium text-sm truncate">{event.titulo}</h4>
                                    <div className="flex items-center text-xs text-gray-500">
                                      <Clock className="h-3 w-3 mr-1" />
                                      <span>
                                        {new Date(event.data_hora_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                                
                                {getEventsForDay(day).length === 0 && (
                                  <div className="h-8 flex items-center justify-center">
                                    <span className="text-xs text-gray-400">Sem eventos</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="month">
                        <div className="grid grid-cols-7 gap-1">
                          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                            <div key={day} className="text-center font-medium p-2">
                              {day}
                            </div>
                          ))}
                          
                          {Array.from({ length: 42 }).map((_, index) => {
                            const firstDayOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
                            const day = new Date(firstDayOfMonth);
                            day.setDate(1 - firstDayOfMonth.getDay() + index);
                            
                            const isCurrentMonth = day.getMonth() === selectedDate.getMonth();
                            const isToday = day.toDateString() === new Date().toDateString();
                            const hasEvents = hasEventsOnDate(day);
                            
                            return (
                              <div 
                                key={index}
                                className={`
                                  min-h-14 p-1 border 
                                  ${isCurrentMonth ? 'bg-white' : 'bg-gray-50 text-gray-400'}
                                  ${isToday ? 'border-primary' : 'border-gray-100'}
                                `}
                                onClick={() => {
                                  setSelectedDate(new Date(day));
                                  setViewMode('day');
                                }}
                              >
                                <div className="flex justify-between items-center">
                                  <span className={`text-sm ${isToday ? 'font-bold text-primary' : ''}`}>
                                    {day.getDate()}
                                  </span>
                                  
                                  {hasEvents && (
                                    <div className="h-2 w-2 rounded-full bg-primary"></div>
                                  )}
                                </div>
                                
                                {hasEvents && (
                                  <div className="mt-1">
                                    {getEventsForDay(day).slice(0, 2).map((event, i) => (
                                      <div 
                                        key={i}
                                        className="text-xs p-1 mb-1 truncate bg-primary/10 rounded"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleEventClick(event);
                                        }}
                                      >
                                        {event.titulo}
                                      </div>
                                    ))}
                                    
                                    {getEventsForDay(day).length > 2 && (
                                      <div className="text-xs text-gray-500 text-center">
                                        +{getEventsForDay(day).length - 2} mais
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
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
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="titulo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título*</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Detalhes do evento..." 
                        className="resize-none"
                        {...field} 
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="data"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data*</FormLabel>
                    <div className="flex justify-center">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                        className="mx-auto border rounded-md"
                      />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="hora_inicio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hora de Início*</FormLabel>
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
                
                <FormField
                  control={form.control}
                  name="hora_fim"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hora de Término*</FormLabel>
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
              
              <DialogFooter className="mt-6">
                <Button type="submit">{selectedEvent ? 'Salvar Alterações' : 'Adicionar Evento'}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo para visualizar evento */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do Evento</DialogTitle>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">{selectedEvent.titulo}</h3>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-2 text-gray-500" />
                  <span>{formatDate(selectedEvent.data_hora_inicio)}</span>
                </div>
                
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-gray-500" />
                  <span>
                    {new Date(selectedEvent.data_hora_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - 
                    {new Date(selectedEvent.data_hora_fim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                
                {selectedEvent.patient_id && (
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2 text-gray-500" />
                    <span>Paciente ID: {selectedEvent.patient_id}</span>
                  </div>
                )}
              </div>
              
              {selectedEvent.descricao && (
                <div className="pt-2 border-t">
                  <p className="text-sm text-gray-600 whitespace-pre-line">{selectedEvent.descricao}</p>
                </div>
              )}
              
              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={handleEditEvent}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                
                <Button
                  variant="destructive"
                  onClick={handleDeleteEvent}
                  disabled={deleting}
                >
                  {deleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Excluindo...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AppointmentCalendar;