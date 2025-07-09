import { Appointment } from "@/lib/supabaseClient";

interface MonthViewProps {
  selectedDate: Date;
  events: Appointment[];
  onDateSelect: (date: Date) => void;
  onEventClick: (event: Appointment) => void;
}

export function MonthView({ selectedDate, events, onDateSelect, onEventClick }: MonthViewProps) {
  // Verificar se há eventos em uma data específica
  const hasEventsOnDate = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    
    return events.some(event => {
      const eventDate = new Date(event.data_hora_inicio);
      return (
        eventDate.getFullYear() === year &&
        eventDate.getMonth() === month &&
        eventDate.getDate() === day
      );
    });
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

  return (
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
            onClick={() => onDateSelect(new Date(day))}
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
                      onEventClick(event);
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
  );
}