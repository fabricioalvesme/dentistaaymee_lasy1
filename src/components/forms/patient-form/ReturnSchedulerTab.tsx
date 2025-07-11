import { ReturnScheduler } from '@/components/patient/ReturnScheduler';
import { Reminder } from '@/lib/types/reminder';

interface ReturnSchedulerTabProps {
  patientId?: string;
  patientName: string;
  patientReminders: Reminder[];
  onReminderCreated: (reminder: Reminder) => void;
}

export function ReturnSchedulerTab({
  patientId,
  patientName,
  patientReminders,
  onReminderCreated,
}: ReturnSchedulerTabProps) {
  return (
    <>
      {patientId ? (
        <ReturnScheduler 
          patientId={patientId} 
          patientName={patientName}
          existingReminders={patientReminders}
          onReminderCreated={onReminderCreated}
        />
      ) : (
        <div className="bg-yellow-50 p-4 rounded-md text-yellow-800">
          <p>Para agendar um retorno, primeiro salve o formulário do paciente.</p>
        </div>
      )}
    </>
  );
}