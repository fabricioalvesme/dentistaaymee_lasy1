import { Button } from "@/components/ui/button";
import { Appointment } from "@/lib/supabaseClient";
import { Clock } from "lucide-react";

interface DayViewProps {
  events: Appointment[];
  selectedDate: Date;
  onEventClick: (event: Appointment) => void;
  onAddEvent: () => void;
}

export function DayView({ events, selectedDate, onEventClick, onAddEvent }: DayViewProps) {
  // Gerar horários para visão de dia
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour < 19; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    return slots;
  };

  if (events.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-md">
        <p className="text-gray-500">Nenhum evento agendado para este dia</p>
        <Button 
          variant="link" 
          onClick={onAddEvent}
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
        
        const eventsAtTime = events.filter(event => {
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
                  onClick={() => onEventClick(event)}
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
}