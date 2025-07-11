import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Reminder } from '@/lib/types/reminder';
import { formatDate } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Loader2, 
  Bell, 
  CalendarClock, 
  Calendar,
  MessageCircle,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

export function UpcomingRemindersCard() {
  const [loading, setLoading] = useState(true);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [birthdays, setBirthdays] = useState<any[]>([]);
  const [patientMap, setPatientMap] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  
  // Carregar próximos lembretes e aniversários
  useEffect(() => {
    async function loadReminders() {
      try {
        setLoading(true);
        
        // Carregar lembretes de retorno
        const { data: reminderData, error: reminderError } = await supabase
          .from('reminders')
          .select('*')
          .eq('sent', false)
          .eq('type', 'return')
          .gte('target_date', new Date().toISOString().split('T')[0])
          .order('target_date', { ascending: true })
          .limit(3);
          
        if (reminderError) {
          console.error('Erro ao carregar lembretes:', reminderError);
          throw reminderError;
        }
        
        // Carregar aniversariantes próximos
        const { data: birthdayData, error: birthdayError } = await supabase
          .rpc('get_upcoming_birthdays', { days_ahead: 7 });
          
        if (birthdayError) {
          console.error('Erro ao carregar aniversários:', birthdayError);
          throw birthdayError;
        }
        
        setReminders(reminderData || []);
        setBirthdays(birthdayData || []);
        
        // Carregar nomes dos pacientes para os lembretes
        if (reminderData && reminderData.length > 0) {
          const patientIds = reminderData.map(r => r.patient_id);
          const { data: patients, error: patientError } = await supabase
            .from('patients')
            .select('id, nome')
            .in('id', patientIds);
            
          if (patientError) {
            console.error('Erro ao carregar pacientes:', patientError);
          } else if (patients) {
            const nameMap: Record<string, string> = {};
            patients.forEach(p => {
              nameMap[p.id] = p.nome;
            });
            setPatientMap(nameMap);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dados de lembretes:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadReminders();
  }, []);
  
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Bell className="h-4 w-4 mr-2" />
            Próximos Lembretes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const hasData = reminders.length > 0 || birthdays.length > 0;
  
  // Função para abrir mensagem no WhatsApp
  const openWhatsApp = (phone: string, message: string) => {
    const formattedMessage = encodeURIComponent(message);
    window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${formattedMessage}`, '_blank');
  };
  
  // Função para criar mensagem de aniversário
  const getBirthdayMessage = (name: string, isToday: boolean) => {
    if (isToday) {
      return `Olá! A equipe da Dra. Aymée Frauzino deseja um feliz aniversário para ${name}! 🎂🎉 Que seja um dia especial, cheio de alegria e sorrisos! 😊`;
    } else {
      return `Olá! Em breve será o aniversário de ${name} e a equipe da Dra. Aymée Frauzino quer enviar nossos votos antecipados de feliz aniversário! 🎂🎉`;
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <Bell className="h-4 w-4 mr-2" />
          Próximos Lembretes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="space-y-4">
            {/* Retornos agendados */}
            {reminders.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Retornos Agendados</h4>
                <div className="space-y-2">
                  {reminders.map(reminder => (
                    <div 
                      key={reminder.id} 
                      className="p-3 bg-gray-50 rounded-md flex justify-between items-center"
                    >
                      <div className="flex items-start gap-2">
                        <CalendarClock className="h-4 w-4 text-blue-500 mt-0.5" />
                        <div>
                          <p className="font-medium text-sm">
                            {patientMap[reminder.patient_id] || 'Paciente'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(reminder.target_date)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Aniversários próximos */}
            {birthdays.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Aniversários Próximos</h4>
                <div className="space-y-2">
                  {birthdays.slice(0, 3).map(birthday => (
                    <div 
                      key={birthday.id} 
                      className="p-3 bg-gray-50 rounded-md flex justify-between items-center"
                    >
                      <div className="flex items-start gap-2">
                        <Calendar className="h-4 w-4 text-pink-500 mt-0.5" />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">
                              {birthday.nome}
                            </p>
                            <Badge variant="outline" className="text-xs h-5 bg-pink-50 text-pink-600 border-pink-100">
                              {birthday.dias_ate_aniversario === 0 
                                ? 'Hoje' 
                                : birthday.dias_ate_aniversario === 1 
                                  ? 'Amanhã' 
                                  : `Em ${birthday.dias_ate_aniversario} dias`}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500">
                            {formatDate(birthday.data_nascimento)}
                          </p>
                        </div>
                      </div>
                      
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => openWhatsApp(
                          birthday.telefone, 
                          getBirthdayMessage(birthday.nome, birthday.dias_ate_aniversario === 0)
                        )}
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <Button 
              variant="outline" 
              className="w-full mt-2" 
              onClick={() => navigate('/admin/notifications')}
            >
              Ver todos os lembretes
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-500 text-sm">Nenhum lembrete para os próximos dias</p>
            <Button 
              variant="link" 
              onClick={() => navigate('/admin/notifications')}
              className="mt-2"
            >
              Gerenciar lembretes
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}