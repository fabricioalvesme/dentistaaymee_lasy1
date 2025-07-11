import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useNotifications } from '@/hooks/useNotifications';
import { Notification, Reminder, BirthdayNotification } from '@/lib/types/reminder';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Bell, 
  Calendar, 
  CalendarClock, 
  CheckCircle, 
  Clock, 
  Loader2, 
  MessageCircle, 
  Trash2,
  Search
} from 'lucide-react';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Notifications = () => {
  const {
    notifications,
    loading,
    openWhatsApp,
    markAsSent,
    getReturnMessage,
    getBirthdayMessage,
    deleteReminder
  } = useNotifications();
  
  const [activeTab, setActiveTab] = useState('all');
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loadingReminders, setLoadingReminders] = useState(true);
  const [patientMap, setPatientMap] = useState<Record<string, { nome: string, telefone: string }>>({});
  const [searchTerm, setSearchTerm] = useState('');
  
  // Carregar todos os lembretes
  const loadAllReminders = async () => {
    try {
      setLoadingReminders(true);
      
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .order('target_date', { ascending: true });
      
      if (error) {
        console.error('Erro ao carregar lembretes:', error);
        throw error;
      }
      
      setReminders(data || []);
      await loadPatientInfo(data || []);
    } catch (error) {
      console.error('Erro ao carregar lembretes:', error);
      toast.error('Erro ao carregar lembretes');
    } finally {
      setLoadingReminders(false);
    }
  };
  
  // Carregar informações dos pacientes
  const loadPatientInfo = async (remindersList: Reminder[]) => {
    try {
      const patientIds = [...new Set(remindersList.map(r => r.patient_id))];
      if (patientIds.length === 0) return;
      
      const { data, error } = await supabase
        .from('patients')
        .select('id, nome, telefone')
        .in('id', patientIds);
      
      if (error) {
        console.error('Erro ao carregar informações dos pacientes:', error);
        return;
      }
      
      const map: Record<string, { nome: string, telefone: string }> = {};
      data?.forEach(patient => {
        map[patient.id] = { nome: patient.nome, telefone: patient.telefone };
      });
      
      setPatientMap(map);
    } catch (error) {
      console.error('Erro ao carregar informações dos pacientes:', error);
    }
  };
  
  useEffect(() => {
    loadAllReminders();
  }, []);
  
  // Filtrar lembretes com base na tab e no termo de busca
  const filteredReminders = reminders.filter(reminder => {
    const patient = patientMap[reminder.patient_id];
    const searchTermLower = searchTerm.toLowerCase();
    
    const matchesSearch = searchTerm ? 
      (patient?.nome.toLowerCase().includes(searchTermLower) || 
       patient?.telefone.includes(searchTerm)) : true;

    if (!matchesSearch) return false;

    switch (activeTab) {
      case 'upcoming':
        return new Date(reminder.target_date) >= new Date() && !reminder.sent;
      case 'past':
        return new Date(reminder.target_date) < new Date() || reminder.sent;
      case 'all':
      default:
        return true;
    }
  });
  
  const getBirthdayNotifications = () => {
    return notifications.filter(n => 'virtual' in n) as BirthdayNotification[];
  };
  
  const handleDeleteReminder = async (id: string) => {
    try {
      const success = await deleteReminder(id);
      if (success) {
        setReminders(prev => prev.filter(r => r.id !== id));
        toast.success('Lembrete excluído com sucesso');
      }
    } catch (error) {
      console.error('Erro ao excluir lembrete:', error);
      toast.error('Erro ao excluir lembrete');
    }
  };
  
  return (
    <AdminLayout>
      <Helmet>
        <title>Notificações - Dra. Aymée Frauzino</title>
      </Helmet>
      
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Notificações e Lembretes</h1>
          <p className="text-gray-500">Gerencie lembretes de retorno e aniversários</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Notificações Ativas</CardTitle>
            <CardDescription>Notificações que precisam da sua atenção</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : notifications.length > 0 ? (
              <div className="space-y-4">
                {notifications.map(notification => {
                  if ('virtual' in notification) {
                    const birthday = notification as BirthdayNotification;
                    const isToday = birthday.dias_ate_aniversario === 0;
                    return (
                      <div key={notification.id} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-start gap-3">
                          <div className="bg-pink-100 text-pink-600 p-2 rounded-full"><Calendar className="h-5 w-5" /></div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{isToday ? 'Aniversário hoje' : 'Aniversário amanhã'}</h3>
                              <Badge variant="outline" className="bg-pink-50 text-pink-600 border-pink-100">{isToday ? 'Hoje' : 'Amanhã'}</Badge>
                            </div>
                            <p className="text-gray-600 mt-1">{isToday ? `Hoje é aniversário de ${birthday.nome}!` : `Amanhã é aniversário de ${birthday.nome}!`}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="secondary" onClick={() => { const message = getBirthdayMessage(birthday); openWhatsApp(birthday.telefone, message); markAsSent(notification.id); }}><MessageCircle className="h-4 w-4 mr-2" />Enviar mensagem</Button>
                            <Button size="sm" variant="ghost" onClick={() => markAsSent(notification.id)}><CheckCircle className="h-4 w-4 mr-2" />Marcar como visto</Button>
                          </div>
                        </div>
                      </div>
                    );
                  } else {
                    const reminder = notification as Reminder;
                    const patient = patientMap[reminder.patient_id];
                    return (
                      <div key={notification.id} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-start gap-3">
                          <div className="bg-blue-100 text-blue-600 p-2 rounded-full"><CalendarClock className="h-5 w-5" /></div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">Lembrete de retorno</h3>
                              <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-100">Retorno</Badge>
                            </div>
                            <p className="text-gray-600 mt-1">Retorno de {patient?.nome || 'Paciente'} agendado para {formatDate(reminder.target_date)}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="secondary" onClick={() => { if (patient) { const message = getReturnMessage(reminder, patient.nome); openWhatsApp(patient.telefone, message); markAsSent(reminder.id); } else { toast.error('Dados do paciente não encontrados'); } }}><MessageCircle className="h-4 w-4 mr-2" />Enviar mensagem</Button>
                            <Button size="sm" variant="ghost" onClick={() => markAsSent(reminder.id)}><CheckCircle className="h-4 w-4 mr-2" />Marcar como visto</Button>
                          </div>
                        </div>
                      </div>
                    );
                  }
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Nenhuma notificação ativa no momento.</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Gerenciar Lembretes</CardTitle>
            <CardDescription>Todos os lembretes cadastrados no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nome ou telefone..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
                <TabsList className="grid grid-cols-4 w-full">
                  <TabsTrigger value="all">Todos</TabsTrigger>
                  <TabsTrigger value="upcoming">Próximos</TabsTrigger>
                  <TabsTrigger value="past">Passados</TabsTrigger>
                  <TabsTrigger value="birthdays">Aniversários</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            <TabsContent value={activeTab}>
              {activeTab === 'birthdays' ? (
                getBirthdayNotifications().length > 0 ? (
                  <div className="space-y-4">
                    {getBirthdayNotifications().map(birthday => (
                      <div key={birthday.id} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-start gap-3">
                          <div className="bg-pink-100 text-pink-600 p-2 rounded-full"><Calendar className="h-5 w-5" /></div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{birthday.dias_ate_aniversario === 0 ? 'Aniversário hoje' : 'Aniversário amanhã'}</h3>
                              <Badge variant="outline" className="bg-pink-50 text-pink-600 border-pink-100">{birthday.dias_ate_aniversario === 0 ? 'Hoje' : 'Amanhã'}</Badge>
                            </div>
                            <p className="text-gray-600 mt-1">{birthday.nome} - {formatDate(birthday.data_nascimento)}</p>
                          </div>
                          <Button size="sm" variant="secondary" onClick={() => { const message = getBirthdayMessage(birthday); openWhatsApp(birthday.telefone, message); }}><MessageCircle className="h-4 w-4 mr-2" />Enviar mensagem</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Nenhum aniversariante para hoje ou amanhã.</p>
                  </div>
                )
              ) : (
                <ReminderTable 
                  reminders={filteredReminders} 
                  patientMap={patientMap} 
                  loading={loadingReminders} 
                  onDelete={handleDeleteReminder}
                  onSendMessage={(reminder) => {
                    const patient = patientMap[reminder.patient_id];
                    if (patient) {
                      const message = getReturnMessage(reminder, patient.nome);
                      openWhatsApp(patient.telefone, message);
                    }
                  }}
                />
              )}
            </TabsContent>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

interface ReminderTableProps {
  reminders: Reminder[];
  patientMap: Record<string, { nome: string, telefone: string }>;
  loading: boolean;
  onDelete: (id: string) => void;
  onSendMessage: (reminder: Reminder) => void;
}

const ReminderTable = ({ reminders, patientMap, loading, onDelete, onSendMessage }: ReminderTableProps) => {
  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  
  if (reminders.length === 0) {
    return (
      <div className="text-center py-8">
        <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">Nenhum lembrete encontrado.</p>
      </div>
    );
  }
  
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Paciente</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reminders.map(reminder => {
            const patient = patientMap[reminder.patient_id];
            const isPast = new Date(reminder.target_date) < new Date();
            return (
              <TableRow key={reminder.id}>
                <TableCell>{patient?.nome || 'Carregando...'}</TableCell>
                <TableCell><Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-100">{reminder.type === 'return' ? 'Retorno' : 'Outro'}</Badge></TableCell>
                <TableCell><div className="flex items-center gap-1"><Clock className="h-3 w-3 text-gray-400" /><span>{formatDate(reminder.target_date)}</span></div></TableCell>
                <TableCell>
                  {reminder.sent ? <Badge variant="outline" className="bg-green-50 text-green-600 border-green-100">Enviado</Badge>
                   : isPast ? <Badge variant="outline" className="bg-red-50 text-red-600 border-red-100">Atrasado</Badge>
                   : <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-100">Pendente</Badge>}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" disabled={!patient} onClick={() => onSendMessage(reminder)}><MessageCircle className="h-4 w-4" /></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir lembrete?</AlertDialogTitle>
                          <AlertDialogDescription>Esta ação não pode ser desfeita. O lembrete será permanentemente excluído.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction className="bg-red-500 hover:bg-red-600" onClick={() => onDelete(reminder.id)}>Excluir</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default Notifications;