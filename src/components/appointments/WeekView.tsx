import { Appointment } from "@/lib/supabaseClient";
import { Clock } from "lucide-react";

interface WeekViewProps {
  selectedDate: Date;
  events: Appointment[];
  onEventClick: (event: Appointment) => void;
}

export function WeekView({ selectedDate, events, onEventClick }: WeekViewProps) {
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

  // Filtrar eventos por data
  const getEventsForDay = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    
    return events.filter(event => {
      const eventDate = new Date(event.data_hora_inicio);
      return (
        eventDate.getFullYear() === year &&
        eventDate.getMonth() === month &&
        eventDate.getDate() === day
      );
    });
  };

  // Obter a cor do evento ou usar a cor padrão
  const getEventColor = (event: Appointment) => {
    return event.cor || '#3B82F6'; // Azul padrão se não definido
  };

  return (
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
            {getEventsForDay(day).map(event => {
              const eventColor = getEventColor(event);
              
              return (
                <div
                  key={event.id}
                  className="p-2 rounded-md border-l-4 cursor-pointer hover:bg-opacity-70 text-left"
                  style={{
                    backgroundColor: `${eventColor}20`, // 20% de opacidade
                    borderLeftColor: eventColor
                  }}
                  onClick={() => onEventClick(event)}
                >
                  <h4 className="font-medium text-sm truncate">{event.titulo}</h4>
                  <div className="flex items-center text-xs text-gray-500">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>
                      {new Date(event.data_hora_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}
            
            {getEventsForDay(day).length === 0 && (
              <div className="h-8 flex items-center justify-center">
                <span className="text-xs text-gray-400">Sem eventos</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}