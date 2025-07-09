import { Calendar } from "@/components/ui/calendar";
import { Appointment } from "@/lib/supabaseClient";
import { formatDateTime } from "@/lib/utils";

interface CalendarViewProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  appointments: Appointment[];
  upcomingEvents: Appointment[];
  onEventClick: (event: Appointment) => void;
}

export function CalendarView({
  selectedDate,
  onDateSelect,
  appointments,
  upcomingEvents,
  onEventClick
}: CalendarViewProps) {
  return (
    <div className="mb-6 border rounded-md p-4 bg-gray-50">
      <div className="flex flex-col sm:flex-row gap-6">
        <div className="w-full sm:w-auto flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && onDateSelect(date)}
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
          
          {upcomingEvents.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhum evento agendado</p>
          ) : (
            <ul className="space-y-2">
              {upcomingEvents.map(event => (
                <li 
                  key={event.id}
                  className="text-sm p-2 rounded bg-white hover:bg-gray-100 cursor-pointer border"
                  onClick={() => onEventClick(event)}
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
  );
}