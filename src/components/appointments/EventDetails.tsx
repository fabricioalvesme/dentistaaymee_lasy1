import { Button } from "@/components/ui/button";
import { Appointment } from "@/lib/supabaseClient";
import { formatDate } from "@/lib/utils";
import { 
  Clock, 
  Calendar as CalendarIcon, 
  User, 
  Edit, 
  Trash2, 
  Loader2 
} from "lucide-react";

interface EventDetailsProps {
  event: Appointment;
  onEdit: () => void;
  onDelete: () => Promise<void>;
  deleting: boolean;
}

export function EventDetails({ event, onEdit, onDelete, deleting }: EventDetailsProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">{event.titulo}</h3>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center">
          <CalendarIcon className="h-4 w-4 mr-2 text-gray-500" />
          <span>{formatDate(event.data_hora_inicio)}</span>
        </div>
        
        <div className="flex items-center">
          <Clock className="h-4 w-4 mr-2 text-gray-500" />
          <span>
            {new Date(event.data_hora_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - 
            {new Date(event.data_hora_fim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        
        {event.patient_id && (
          <div className="flex items-center">
            <User className="h-4 w-4 mr-2 text-gray-500" />
            <span>Paciente ID: {event.patient_id}</span>
          </div>
        )}
      </div>
      
      {event.descricao && (
        <div className="pt-2 border-t">
          <p className="text-sm text-gray-600 whitespace-pre-line">{event.descricao}</p>
        </div>
      )}
      
      <div className="flex justify-between pt-4">
        <Button
          variant="outline"
          onClick={onEdit}
        >
          <Edit className="h-4 w-4 mr-2" />
          Editar
        </Button>
        
        <Button
          variant="destructive"
          onClick={onDelete}
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
  );
}