import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useNotifications } from '@/hooks/useNotifications';
import { Notification, Reminder, BirthdayNotification, ManualNotification } from '@/lib/types/reminder';
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
  Search,
  NotebookText
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
import { ManualNotificationForm } from '@/components/notifications/ManualNotificationForm';

const Notifications = () => {
  const {
    notifications,
    loading,
    openWhatsApp,
    markAsSent,
    getReturnMessage,
    getBirthdayMessage,
    deleteReminder,
    deleteManualNotification,
    getAllManualNotifications
  } = useNotifications();
  
  const [activeTab, setActiveTab] = useState('all');
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [manualNotifications, setManualNotifications] = useState<ManualNotification[]>([]);
  const [loadingReminders, setLoadingReminders] = useState(true);
  const [patientMap, setPatientMap] = useState<Record<string, { nome: string, telefone: string }>>({});
  const [searchTerm, setSearchTerm] = useState('');
  
  const loadAllData = async () => {
    try {
      setLoadingReminders(true);
      
      const [remindersData, manualData] = await Promise.all([
        supabase.from('reminders').select('*').order('target_date', { ascending: true }),
        getAllManualNotifications()
      ]);
      
      if (remindersData.error) throw remindersData.error;
      
      setReminders(remindersData.data || []);
      setManualNotifications(manualData);
      await loadPatientInfo(remindersData.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados da página');
    } finally {
      setLoadingReminders(false);
    }
  };
  
  const loadPatientInfo = async (remindersList: Reminder[]) => {
    try {
      const patientIds = [...new Set(remindersList.map(r => r.patient_id))];
      if (patientIds.length === 0) return;
      
      const { data, error } = await supabase
        .from('patients')
        .select('id, nome, telefone')
        .in('id', patientIds);
      
      if (error) throw error;
      
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
    loadAllData();
  }, []);
  
  const filteredReminders = reminders.filter(reminder => {
    const patient = patientMap[reminder.patient_id];
    const searchTermLower = searchTerm.toLowerCase();
    
    const matchesSearch = searchTerm ? 
      (patient?.nome.toLowerCase().includes(searchTermLower) || 
       patient?.telefone.includes(searchTerm)) : true;

    if (!matchesSearch) return false;

    switch (activeTab) {
      case 'upcoming': return new Date(reminder.target_date) >= new Date() && !reminder.sent;
      case 'past': return new Date(reminder.target_date) < new Date() || reminder.sent;
      default: return true;
    }
  });

  const filteredManualNotifications = manualNotifications.filter(notif => {
    const searchTermLower = searchTerm.toLowerCase();
    return searchTerm ? 
      (notif.titulo.toLowerCase().includes(searchTermLower) ||
       notif.mensagem.toLowerCase().includes(searchTermLower) ||
       (notif.telefone && notif.telefone.includes(searchTerm))) : true;
  });
  
  const getBirthdayNotifications = () => {
    return notifications.filter(n => 'virtual' in n) as BirthdayNotification[];
  };
  
  const handleDeleteReminder = async (id: string) => {
    const success = await deleteReminder(id);
    if (success) {
      setReminders(prev => prev.filter(r => r.id !== id));
      toast.success('Lembrete excluído com sucesso');
    }
  };

  const handleDeleteManual = async (id: string) => {
    const success = await deleteManualNotification(id);
    if (success) {
      setManualNotifications(prev => prev.filter(n => n.id !== id));
      toast.success('Notificação manual excluída com sucesso');
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
          <p className="text-gray-500">Gerencie lembretes de retorno, aniversários e notificações manuais</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
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
                        return (
                          <div key={notification.id} className="bg-gray-50 p-4 rounded-lg flex items-start gap-3">
                            <div className="bg-pink-100 text-pink-600 p-2 rounded-full"><Calendar className="h-5 w-5" /></div>
                            <div className="flex-1"><h3 className="font-medium">Aniversário: {birthday.nome}</h3><p className="text-gray-600 text-sm">Hoje é aniversário de {birthday.nome}!</p></div>
                            <Button size="sm" variant="secondary" onClick={() => { const message = getBirthdayMessage(birthday); openWhatsApp(birthday.telefone, message); markAsSent(notification.id); }}><MessageCircle className="h-4 w-4 mr-2" />Enviar</Button>
                          </div>
                        );
                      } else if (notification.type === 'manual') {
                        const manual = notification as ManualNotification;
                        return (
                          <div key={notification.id} className="bg-gray-50 p-4 rounded-lg flex items-start gap-3">
                            <div className="bg-purple-100 text-purple-600 p-2 rounded-full"><NotebookText className="h-5 w-5" /></div>
                            <div className="flex-1"><h3 className="font-medium">{manual.titulo}</h3><p className="text-gray-600 text-sm">{manual.mensagem}</p></div>
                            {manual.telefone && <Button size="sm" variant="secondary" onClick={() => { openWhatsApp(manual.telefone!, manual.mensagem); markAsSent(notification.id); }}><MessageCircle className="h-4 w-4 mr-2" />Enviar</Button>}
                            <Button size="sm" variant="ghost" onClick={() => markAsSent(notification.id)}><CheckCircle className="h-4 w-4 mr-2" />Visto</Button>
                          </div>
                        );
                      } else {
                        const reminder = notification as Reminder;
                        const patient = patientMap[reminder.patient_id];
                        return (
                          <div key={notification.id} className="bg-gray-50 p-4 rounded-lg flex items-start gap-3">
                            <div className="bg-blue-100 text-blue-600 p-2 rounded-full"><CalendarClock className="h-5 w-5" /></div>
                            <div className="flex-1"><h3 className="font-medium">Retorno: {patient?.nome || 'Paciente'}</h3><p className="text-gray-600 text-sm">Agendado para {formatDate(reminder.target_date)}</p></div>
                            <Button size="sm" variant="secondary" onClick={() => { if (patient) { const message = getReturnMessage(reminder, patient.nome); openWhatsApp(patient.telefone, message); markAsSent(reminder.id); } else { toast.error('Dados do paciente não encontrados'); } }}><MessageCircle className="h-4 w-4 mr-2" />Enviar</Button>
                          </div>
                        );
                      }
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8"><Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">Nenhuma notificação ativa no momento.</p></div>
                )}
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Criar Notificação Manual</CardTitle>
                <CardDescription>Envie um lembrete ou aviso personalizado.</CardDescription>
              </CardHeader>
              <CardContent>
                <ManualNotificationForm onSuccess={loadAllData} />
              </CardContent>
            </Card>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Gerenciar Lembretes</CardTitle>
            <CardDescription>Todos os lembretes e notificações cadastrados no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Buscar..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
                <TabsList className="grid grid-cols-4 w-full">
                  <TabsTrigger value="all">Todos</TabsTrigger>
                  <TabsTrigger value="upcoming">Próximos</TabsTrigger>
                  <TabsTrigger value="past">Passados</TabsTrigger>
                  <TabsTrigger value="manual">Manuais</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            {loadingReminders ? (
              <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : (
              <TabsContent value={activeTab} className="mt-0">
                {activeTab === 'manual' ? (
                  <ManualNotificationsTable notifications={filteredManualNotifications} onDelete={handleDeleteManual} />
                ) : (
                  <ReminderTable reminders={filteredReminders} patientMap={patientMap} onDelete={handleDeleteReminder} onSendMessage={(reminder) => { const patient = patientMap[reminder.patient_id]; if (patient) { const message = getReturnMessage(reminder, patient.nome); openWhatsApp(patient.telefone, message); }}} />
                )}
              </TabsContent>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

const ReminderTable = ({ reminders, patientMap, onDelete, onSendMessage }: { reminders: Reminder[], patientMap: any, onDelete: (id: string) => void, onSendMessage: (reminder: Reminder) => void }) => {
  if (reminders.length === 0) return <div className="text-center py-8"><Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">Nenhum lembrete de retorno encontrado.</p></div>;
  return (
    <div className="rounded-md border"><Table><TableHeader><TableRow><TableHead>Paciente</TableHead><TableHead>Data</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
      <TableBody>
        {reminders.map(r => (
          <TableRow key={r.id}>
            <TableCell>{patientMap[r.patient_id]?.nome || 'Carregando...'}</TableCell>
            <TableCell>{formatDate(r.target_date)}</TableCell>
            <TableCell>{r.sent ? <Badge variant="outline" className="bg-green-50 text-green-600 border-green-100">Enviado</Badge> : new Date(r.target_date) < new Date() ? <Badge variant="outline" className="bg-red-50 text-red-600 border-red-100">Atrasado</Badge> : <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-100">Pendente</Badge>}</TableCell>
            <TableCell className="text-right"><div className="flex justify-end gap-2"><Button size="sm" variant="ghost" onClick={() => onSendMessage(r)}><MessageCircle className="h-4 w-4" /></Button><AlertDialog><AlertDialogTrigger asChild><Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir lembrete?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction className="bg-red-500 hover:bg-red-600" onClick={() => onDelete(r.id)}>Excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></div></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table></div>
  );
};

const ManualNotificationsTable = ({ notifications, onDelete }: { notifications: ManualNotification[], onDelete: (id: string) => void }) => {
  if (notifications.length === 0) return <div className="text-center py-8"><NotebookText className="h-12 w-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">Nenhuma notificação manual encontrada.</p></div>;
  return (
    <div className="rounded-md border"><Table><TableHeader><TableRow><TableHead>Título</TableHead><TableHead>Data de Envio</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
      <TableBody>
        {notifications.map(n => (
          <TableRow key={n.id}>
            <TableCell>{n.titulo}</TableCell>
            <TableCell>{formatDate(n.notify_at)}</TableCell>
            <TableCell>{n.sent ? <Badge variant="outline" className="bg-green-50 text-green-600 border-green-100">Enviado</Badge> : new Date(n.notify_at) < new Date() ? <Badge variant="outline" className="bg-red-50 text-red-600 border-red-100">Atrasado</Badge> : <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-100">Pendente</Badge>}</TableCell>
            <TableCell className="text-right"><AlertDialog><AlertDialogTrigger asChild><Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir notificação?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction className="bg-red-500 hover:bg-red-600" onClick={() => onDelete(n.id)}>Excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table></div>
  );
};

export default Notifications;