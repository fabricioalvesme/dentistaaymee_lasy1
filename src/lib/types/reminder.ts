export type ReminderType = 'return' | 'birthday';

export interface Reminder {
  id: string;
  patient_id: string;
  type: ReminderType;
  target_date: string;
  notify_at: string;
  message_template: string | null;
  sent: boolean;
  created_at: string;
  updated_at: string;
}

export interface BirthdayNotification {
  id: string;
  nome: string;
  data_nascimento: string;
  dias_ate_aniversario: number;
  telefone: string;
  type: 'birthday';
  virtual: true; // Marca como notificação virtual (não persistida na tabela reminders)
}

export type Notification = Reminder | BirthdayNotification;