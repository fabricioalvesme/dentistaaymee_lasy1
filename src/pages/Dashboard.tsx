import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PatientFormCard } from '@/components/PatientFormCard';
import { supabase, Patient, HealthHistory, Treatment } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { 
  Search, 
  Plus, 
  Calendar, 
  FileText, 
  User, 
  Loader2,
  Check,
  X,
  Download
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { copyToClipboard } from '@/lib/utils';
import { PatientFormPDFViewer } from '@/components/exports/PatientFormPDF';
import { useTheme } from '@/contexts/ThemeContext';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { PatientFormPDF } from '@/components/exports/PatientFormPDF';
import { UpcomingRemindersCard } from '@/components/dashboard/UpcomingRemindersCard';
import { PatientDetailsContent } from '@/components/patient/PatientDetailsContent';

const Dashboard = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientDetails, setPatientDetails] = useState<{
    healthHistory?: HealthHistory | null;
    treatment?: Treatment | null;
  }>({});
  const [counts, setCounts] = useState({
    total: 0,
    rascunho: 0,
    enviado: 0,
    assinado: 0
  });
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { settings } = useTheme();
  
  const navigate = useNavigate();

  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      let query = supabase.from('patients').select('*', { count: 'exact' }).order('created_at', { ascending: false });
      
      if (periodFilter !== 'all') {
        const now = new Date();
        let startDate = new Date();
        
        switch (periodFilter) {
          case '7days': startDate.setDate(now.getDate() - 7); break;
          case '15days': startDate.setDate(now.getDate() - 15); break;
          case '30days': startDate.setDate(now.getDate() - 30); break;
          case '90days': startDate.setDate(now.getDate() - 90); break;
        }
        
        query = query.gte('created_at', startDate.toISOString());
      }
      
      const { data, error, count } = await query;
      
      if (error) {
        console.error('Erro ao carregar pacientes:', error);
        setError('Erro ao carregar dados dos pacientes. Tente novamente.');
        throw error;
      }
      
      setPatients(data || []);
      
      if (data) {
        setCounts({
          total: count || 0,
          rascunho: data.filter(p => p.status === 'rascunho').length,
          enviado: data.filter(p => p.status === 'enviado').length,
          assinado: data.filter(p => p.status === 'assinado').length
        });
      }
    } catch (error) {
      console.error('Erro ao carregar pacientes:', error);
      toast.error('Erro ao carregar dados dos pacientes');
    } finally {
      setLoading(false);
    }
  }, [periodFilter]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const filteredPatients = patients.filter(patient => 
    patient.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.nome_responsavel.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const loadPatientDetails = async (patientId: string) => {
    try {
      setLoadingDetails(true);
      const [healthHistoryResult, treatmentResult] = await Promise.allSettled([
        supabase.from('health_histories').select('*').eq('patient_id', patientId).single(),
        supabase.from('treatments').select('*').eq('patient_id', patientId).single()
      ]);

      const healthHistory = healthHistoryResult.status === 'fulfilled' ? healthHistoryResult.value.data : null;
      const treatment = treatmentResult.status === 'fulfilled' ? treatmentResult.value.data : null;

      setPatientDetails({ healthHistory, treatment });
    } catch (error) {
      console.error('Erro ao carregar detalhes do paciente:', error);
      toast.error('Erro ao carregar detalhes do paciente');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleShare = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowShareDialog(true);
  };

  const handleViewDetails = async (patient: Patient) => {
    setSelectedPatient(patient);
    setShowDetailsDialog(true);
    await loadPatientDetails(patient.id);
  };

  const handleExport = async (patient: Patient) => {
    setSelectedPatient(patient);
    setShowExportDialog(true);
    await loadPatientDetails(patient.id);
  };

  const handleDelete = async (patientId: string) => {
    try {
      setIsDeleting(true);
      
      await supabase.from('health_histories').delete().eq('patient_id', patientId);
      await supabase.from('treatments').delete().eq('patient_id', patientId);
      await supabase.from('reminders').delete().eq('patient_id', patientId);
      await supabase.from('appointments').delete().eq('patient_id', patientId);

      const { error } = await supabase.from('patients').delete().eq('id', patientId);
      if (error) throw error;

      toast.success('Paciente e todos os seus dados foram excluídos com sucesso.');
      await fetchPatients(); // Recarrega a lista de pacientes
    } catch (error: any) {
      console.error('Erro ao excluir paciente:', error);
      toast.error('Erro ao excluir paciente: ' + error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const copyToClipboardHandler = async (link: string) => {
    setIsCopying(true);
    const success = await copyToClipboard(link);
    if (success) {
      toast.success('Link copiado para a área de transferência');
    } else {
      toast.error('Não foi possível copiar o link.');
    }
    setIsCopying(false);
  };

  const shareLink = selectedPatient ? `${window.location.origin}/public/form?id=${selectedPatient.id}` : '';

  return (
    <AdminLayout>
      <Helmet>
        <title>Dashboard - Dra. Aymée Frauzino</title>
      </Helmet>
      
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-gray-500">Gerencie formulários, agenda e configurações</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={() => navigate('/admin/forms/new')}><Plus className="h-4 w-4 mr-2" />Novo Formulário</Button>
            <Button variant="outline" onClick={() => navigate('/admin/agenda')}><Calendar className="h-4 w-4 mr-2" />Agenda</Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total de Pacientes</CardTitle></CardHeader><CardContent><div className="flex items-center"><User className="h-5 w-5 text-primary mr-2" /><span className="text-2xl font-bold">{counts.total}</span></div></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Rascunhos</CardTitle></CardHeader><CardContent><div className="flex items-center"><FileText className="h-5 w-5 text-yellow-500 mr-2" /><span className="text-2xl font-bold">{counts.rascunho}</span></div></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Assinados</CardTitle></CardHeader><CardContent><div className="flex items-center"><FileText className="h-5 w-5 text-green-500 mr-2" /><span className="text-2xl font-bold">{counts.assinado}</span></div></CardContent></Card>
          </div>
          <div className="lg:col-span-2"><UpcomingRemindersCard /></div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Buscar por nome do paciente ou responsável..." className="pl-10 pr-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            {searchTerm && (<button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setSearchTerm('')}><X className="h-4 w-4" /></button>)}
          </div>
          <div className="w-full md:w-48">
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger><SelectValue placeholder="Período" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="7days">Últimos 7 dias</SelectItem>
                <SelectItem value="15days">Últimos 15 dias</SelectItem>
                <SelectItem value="30days">Últimos 30 dias</SelectItem>
                <SelectItem value="90days">Últimos 90 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {error && (<div className="bg-red-50 text-red-700 p-4 rounded-md flex items-center gap-2"><span>⚠️</span><p>{error}</p><Button variant="ghost" size="sm" className="ml-auto" onClick={fetchPatients}>Tentar novamente</Button></div>)}
        
        {loading ? (
          <div className="flex justify-center items-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : filteredPatients.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPatients.map((patient) => (
              <PatientFormCard key={patient.id} patient={patient} onShare={() => handleShare(patient)} onViewDetails={() => handleViewDetails(patient)} onExport={() => handleExport(patient)} onDelete={() => handleDelete(patient.id)} isDeleting={isDeleting} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12"><p className="text-gray-500">Nenhum paciente encontrado</p>{searchTerm && <Button variant="link" onClick={() => setSearchTerm('')} className="mt-2">Limpar busca</Button>}</div>
        )}
      </div>

      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Compartilhar Formulário</DialogTitle><DialogDescription>Compartilhe este link com o paciente para que ele possa assinar o formulário.</DialogDescription></DialogHeader>
          <div className="flex items-center space-x-2 mt-4">
            <Input value={shareLink} readOnly onClick={(e) => (e.target as HTMLInputElement).select()} />
            <Button onClick={() => copyToClipboardHandler(shareLink)} variant="secondary" disabled={isCopying}>{isCopying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}</Button>
          </div>
          <p className="text-sm text-gray-500 mt-2">Formulário para: <span className="font-medium">{selectedPatient?.nome}</span></p>
          <DialogFooter className="mt-4"><Button onClick={() => setShowShareDialog(false)}>Fechar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Detalhes do Paciente</DialogTitle></DialogHeader>
          {loadingDetails ? (
            <div className="flex justify-center items-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : selectedPatient ? (
            <PatientDetailsContent 
              patient={selectedPatient}
              healthHistory={patientDetails.healthHistory}
              treatment={patientDetails.treatment}
              onShare={() => { setShowDetailsDialog(false); handleShare(selectedPatient); }}
              onExport={() => { setShowDetailsDialog(false); handleExport(selectedPatient); }}
              onClose={() => setShowDetailsDialog(false)}
            />
          ) : (
            <div className="py-6 text-center"><p className="text-gray-500">Paciente não encontrado.</p></div>
          )}
        </DialogContent>
      </Dialog>
      
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader><DialogTitle>Exportar Formulário</DialogTitle><DialogDescription>Visualize e exporte o formulário do paciente como PDF</DialogDescription></DialogHeader>
          {loadingDetails || !selectedPatient ? (
            <div className="flex justify-center items-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <>
              <div className="my-4"><PatientFormPDFViewer patient={selectedPatient} healthHistory={patientDetails.healthHistory} treatment={patientDetails.treatment} logoUrl={settings?.logo_url} /></div>
              <DialogFooter>
                <PDFDownloadLink document={<PatientFormPDF patient={selectedPatient} healthHistory={patientDetails.healthHistory} treatment={patientDetails.treatment} logoUrl={settings?.logo_url} />} fileName={`formulario_${selectedPatient.nome.replace(/\s+/g, '_').toLowerCase()}.pdf`}>
                  {({ loading: pdfLoading }) => (<Button disabled={pdfLoading}><Download className="h-4 w-4 mr-2" />{pdfLoading ? 'Preparando...' : 'Baixar PDF'}</Button>)}
                </PDFDownloadLink>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default Dashboard;