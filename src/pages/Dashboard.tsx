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
  ChevronDown,
  Loader2,
  Check,
  X,
  Download
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDate, getAge, copyToClipboard } from '@/lib/utils';
import { PatientFormPDFViewer } from '@/components/exports/PatientFormPDF';
import { useTheme } from '@/contexts/ThemeContext';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { PatientFormPDF } from '@/components/exports/PatientFormPDF';

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
  const [loadingExport, setLoadingExport] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { settings } = useTheme();
  
  const navigate = useNavigate();

  // Carregar dados dos pacientes - memoizado para evitar recriações desnecessárias
  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Dashboard - Carregando lista de pacientes...");
      
      let query = supabase.from('patients').select('*').order('created_at', { ascending: false });
      
      // Aplicar filtro de período se necessário
      if (periodFilter !== 'all') {
        const now = new Date();
        let startDate = new Date();
        
        switch (periodFilter) {
          case '7days':
            startDate.setDate(now.getDate() - 7);
            break;
          case '15days':
            startDate.setDate(now.getDate() - 15);
            break;
          case '30days':
            startDate.setDate(now.getDate() - 30);
            break;
          case '90days':
            startDate.setDate(now.getDate() - 90);
            break;
        }
        
        query = query.gte('created_at', startDate.toISOString());
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Erro ao carregar pacientes:', error);
        setError('Erro ao carregar dados dos pacientes. Tente novamente.');
        throw error;
      }
      
      console.log("Dashboard - Pacientes carregados:", data?.length || 0);
      setPatients(data || []);
      
      // Contar por status
      if (data) {
        setCounts({
          total: data.length,
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

  // Carregar pacientes ao montar o componente ou mudar o filtro
  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  // Filtrar pacientes por nome
  const filteredPatients = patients.filter(patient => 
    patient.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.nome_responsavel.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Carregar detalhes do paciente para visualização
  const loadPatientDetails = async (patientId: string) => {
    try {
      setLoadingDetails(true);
      console.log("Dashboard - Carregando detalhes do paciente:", patientId);
      
      // Carregar histórico de saúde
      const { data: healthData, error: healthError } = await supabase
        .from('health_histories')
        .select('*')
        .eq('patient_id', patientId)
        .single();
      
      if (healthError && healthError.code !== 'PGRST116') {
        console.error("Erro ao carregar histórico de saúde:", healthError);
      }
      
      // Carregar plano de tratamento
      const { data: treatmentData, error: treatmentError } = await supabase
        .from('treatments')
        .select('*')
        .eq('patient_id', patientId)
        .single();
      
      if (treatmentError && treatmentError.code !== 'PGRST116') {
        console.error("Erro ao carregar plano de tratamento:", treatmentError);
      }
      
      setPatientDetails({
        healthHistory: healthData || null,
        treatment: treatmentData || null
      });
      
    } catch (error) {
      console.error('Erro ao carregar detalhes do paciente:', error);
      toast.error('Erro ao carregar detalhes do paciente');
    } finally {
      setLoadingDetails(false);
    }
  };

  // Compartilhar formulário
  const handleShare = (id: string) => {
    const patient = patients.find(p => p.id === id);
    if (patient) {
      setSelectedPatient(patient);
      const link = `${window.location.origin}/public/form?id=${id}`;
      setShareLink(link);
      setShowShareDialog(true);
    }
  };

  // Ver detalhes do paciente
  const handleViewDetails = async (id: string) => {
    const patient = patients.find(p => p.id === id);
    if (patient) {
      setSelectedPatient(patient);
      await loadPatientDetails(id);
      setShowDetailsDialog(true);
    }
  };

  // Exportar formulário para PDF
  const handleExport = async (id: string) => {
    try {
      setLoadingExport(true);
      const patient = patients.find(p => p.id === id);
      
      if (patient) {
        setSelectedPatient(patient);
        await loadPatientDetails(id);
        setShowExportDialog(true);
      }
    } catch (error) {
      console.error('Erro ao preparar exportação:', error);
      toast.error('Erro ao preparar exportação do formulário');
    } finally {
      setLoadingExport(false);
    }
  };

  // Copiar link para a área de transferência
  const copyToClipboardHandler = async () => {
    setIsCopying(true);
    try {
      const success = await copyToClipboard(shareLink);
      
      if (success) {
        toast.success('Link copiado para a área de transferência');
      } else {
        toast.error('Não foi possível copiar o link. Tente copiar manualmente.');
      }
    } catch (error) {
      console.error('Erro ao copiar link:', error);
      toast.error('Erro ao copiar o link');
    } finally {
      setIsCopying(false);
    }
  };

  // Variável para o link de compartilhamento
  let shareLink = '';
  if (selectedPatient) {
    shareLink = `${window.location.origin}/public/form?id=${selectedPatient.id}`;
  }

  // Limpar busca
  const clearSearch = () => {
    setSearchTerm('');
  };

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
            <Button onClick={() => navigate('/admin/forms/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Formulário
            </Button>
            
            <Button variant="outline" onClick={() => navigate('/admin/agenda')}>
              <Calendar className="h-4 w-4 mr-2" />
              Agenda
            </Button>
          </div>
        </div>
        
        {/* Cards com estatísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Pacientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <User className="h-5 w-5 text-primary mr-2" />
                <span className="text-2xl font-bold">{counts.total}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Rascunhos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-yellow-500 mr-2" />
                <span className="text-2xl font-bold">{counts.rascunho}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Enviados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-blue-500 mr-2" />
                <span className="text-2xl font-bold">{counts.enviado}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Assinados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-2xl font-bold">{counts.assinado}</span>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Filtros */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nome do paciente ou responsável..."
              className="pl-10 pr-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={clearSearch}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          
          <div className="w-full md:w-48">
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Período" />
              </SelectTrigger>
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
        
        {/* Mensagem de erro */}
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-md flex items-center gap-2">
            <span className="flex-shrink-0">⚠️</span>
            <p>{error}</p>
            <Button 
              variant="ghost" 
              size="sm" 
              className="ml-auto"
              onClick={fetchPatients}
            >
              Tentar novamente
            </Button>
          </div>
        )}
        
        {/* Lista de formulários */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredPatients.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPatients.map((patient) => (
              <PatientFormCard
                key={patient.id}
                patient={patient}
                onShare={handleShare}
                onViewDetails={handleViewDetails}
                onExport={handleExport}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">Nenhum paciente encontrado</p>
            {searchTerm && (
              <Button 
                variant="link" 
                onClick={clearSearch}
                className="mt-2"
              >
                Limpar busca
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Diálogo de compartilhamento */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Compartilhar Formulário</DialogTitle>
            <DialogDescription>
              Compartilhe este link com o paciente para que ele possa assinar o formulário.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex items-center space-x-2 mt-4">
            <Input 
              value={shareLink} 
              readOnly 
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <Button 
              onClick={copyToClipboardHandler} 
              variant="secondary"
              disabled={isCopying}
            >
              {isCopying ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-1" />
              )}
              {isCopying ? "Copiando..." : "Copiar"}
            </Button>
          </div>
          
          <p className="text-sm text-gray-500 mt-2">
            Formulário para: <span className="font-medium">{selectedPatient?.nome}</span>
          </p>
          
          <DialogFooter className="mt-4">
            <Button onClick={() => setShowShareDialog(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de detalhes */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Paciente</DialogTitle>
          </DialogHeader>
          
          {loadingDetails ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : selectedPatient ? (
            <div className="space-y-6">
              <Tabs defaultValue="info">
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="info">Informações Básicas</TabsTrigger>
                  <TabsTrigger value="health">Histórico de Saúde</TabsTrigger>
                  <TabsTrigger value="treatment">Plano de Tratamento</TabsTrigger>
                </TabsList>
                
                <TabsContent value="info">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Nome</h3>
                        <p className="font-medium">{selectedPatient.nome}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Data de Nascimento</h3>
                        <p>{formatDate(selectedPatient.data_nascimento)} ({getAge(selectedPatient.data_nascimento)} anos)</p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Responsável</h3>
                        <p>{selectedPatient.nome_responsavel}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">CPF</h3>
                        <p>{selectedPatient.cpf}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Telefone</h3>
                        <p>{selectedPatient.telefone}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Status</h3>
                        <p className="capitalize">
                          {selectedPatient.status === 'rascunho' && <span className="text-yellow-600">Rascunho</span>}
                          {selectedPatient.status === 'enviado' && <span className="text-blue-600">Enviado</span>}
                          {selectedPatient.status === 'assinado' && <span className="text-green-600">Assinado</span>}
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Endereço</h3>
                      <p>{selectedPatient.endereco}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Observações</h3>
                      <p>{selectedPatient.observacoes || 'Nenhuma observação'}</p>
                    </div>
                    
                    {selectedPatient.assinatura_timestamp && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Data da Assinatura</h3>
                        <p>{formatDate(selectedPatient.assinatura_timestamp)}</p>
                      </div>
                    )}
                    
                    {selectedPatient.assinatura_base64 && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Assinatura do Responsável</h3>
                        <div className="border p-2 rounded-md bg-gray-50">
                          <img 
                            src={selectedPatient.assinatura_base64} 
                            alt="Assinatura do responsável" 
                            className="max-h-20" 
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="health">
                  {patientDetails.healthHistory ? (
                    <div className="space-y-6">
                      <div>
                        <h3 className="font-medium border-b pb-1 mb-2">Informações Gerais</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Queixa Principal</h4>
                            <p>{patientDetails.healthHistory.queixa_principal}</p>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Tipo de Parto</h4>
                            <p>{patientDetails.healthHistory.tipo_parto}</p>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Aleitamento</h4>
                            <p>{patientDetails.healthHistory.aleitamento}</p>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Problemas na Gestação</h4>
                            <p>{patientDetails.healthHistory.problemas_gestacao}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="font-medium border-b pb-1 mb-2">Saúde</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Alergias</h4>
                            <p>{patientDetails.healthHistory.alergias}</p>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Tratamento Médico</h4>
                            <p>{patientDetails.healthHistory.tratamento_medico}</p>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Uso de Medicamentos</h4>
                            <p>{patientDetails.healthHistory.uso_medicamentos}</p>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Presença de Doença</h4>
                            <p>{patientDetails.healthHistory.presenca_doenca}</p>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Problemas Cardíacos</h4>
                            <p>{patientDetails.healthHistory.problemas_cardiacos}</p>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Problemas Renais</h4>
                            <p>{patientDetails.healthHistory.problemas_renais}</p>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Problemas Gástricos</h4>
                            <p>{patientDetails.healthHistory.problemas_gastricos}</p>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Problemas Respiratórios</h4>
                            <p>{patientDetails.healthHistory.problemas_respiratorios}</p>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Alteração de Coagulação</h4>
                            <p>{patientDetails.healthHistory.alteracao_coagulacao}</p>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Internações Recentes</h4>
                            <p>{patientDetails.healthHistory.internacoes_recentes}</p>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Vacinação em Dia</h4>
                            <p>{patientDetails.healthHistory.vacinacao_dia ? 'Sim' : 'Não'}</p>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Peso Atual</h4>
                            <p>{patientDetails.healthHistory.peso_atual}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="font-medium border-b pb-1 mb-2">Informações Odontológicas</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Idade do Primeiro Dente</h4>
                            <p>{patientDetails.healthHistory.idade_primeiro_dente}</p>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Anestesia Odontológica</h4>
                            <p>{patientDetails.healthHistory.anestesia_odontologica ? 'Sim' : 'Não'}</p>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Frequência de Escovação</h4>
                            <p>{patientDetails.healthHistory.frequencia_escovacao}</p>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Creme Dental</h4>
                            <p>{patientDetails.healthHistory.creme_dental}</p>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Contém Flúor</h4>
                            <p>{patientDetails.healthHistory.contem_fluor ? 'Sim' : 'Não'}</p>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Uso de Fio Dental</h4>
                            <p>{patientDetails.healthHistory.uso_fio_dental ? 'Sim' : 'Não'}</p>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Quem Realiza a Escovação</h4>
                            <p>{patientDetails.healthHistory.quem_realiza_escovacao}</p>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Uso de Mamadeira</h4>
                            <p>{patientDetails.healthHistory.uso_mamadeira ? 'Sim' : 'Não'}</p>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Refeições Diárias</h4>
                            <p>{patientDetails.healthHistory.refeicoes_diarias}</p>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Fonte de Açúcar</h4>
                            <p>{patientDetails.healthHistory.fonte_acucar}</p>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Hábito de Sucção</h4>
                            <p>{patientDetails.healthHistory.habito_succao ? 'Sim' : 'Não'}</p>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Roer Unhas</h4>
                            <p>{patientDetails.healthHistory.roer_unhas ? 'Sim' : 'Não'}</p>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Dormir de Boca Aberta</h4>
                            <p>{patientDetails.healthHistory.dormir_boca_aberta ? 'Sim' : 'Não'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-6 text-center">
                      <p className="text-gray-500">Nenhum histórico de saúde cadastrado para este paciente.</p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="treatment">
                  {patientDetails.treatment && patientDetails.treatment.plano_tratamento ? (
                    <div className="space-y-4">
                      <h3 className="font-medium border-b pb-1 mb-2">Plano de Tratamento</h3>
                      <div className="whitespace-pre-line bg-gray-50 p-4 rounded-md">
                        {patientDetails.treatment.plano_tratamento}
                      </div>
                    </div>
                  ) : (
                    <div className="py-6 text-center">
                      <p className="text-gray-500">Nenhum plano de tratamento cadastrado para este paciente.</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
              
              <div className="flex justify-between pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowDetailsDialog(false);
                    navigate(`/admin/forms/edit/${selectedPatient.id}`);
                  }}
                >
                  Editar Formulário
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      Ações
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => {
                      setShowDetailsDialog(false);
                      handleShare(selectedPatient.id);
                    }}>
                      Compartilhar Link
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      setShowDetailsDialog(false);
                      handleExport(selectedPatient.id);
                    }}>
                      Exportar PDF
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center">
              <p className="text-gray-500">Paciente não encontrado.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Diálogo de Exportação PDF */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Exportar Formulário</DialogTitle>
            <DialogDescription>
              Visualize e exporte o formulário do paciente como PDF
            </DialogDescription>
          </DialogHeader>
          
          {loadingExport || !selectedPatient ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="my-4">
                <PatientFormPDFViewer 
                  patient={selectedPatient}
                  healthHistory={patientDetails.healthHistory}
                  treatment={patientDetails.treatment}
                  logoUrl={settings?.logo_url}
                />
              </div>
              
              <DialogFooter>
                <PDFDownloadLink
                  document={
                    <PatientFormPDF
                      patient={selectedPatient}
                      healthHistory={patientDetails.healthHistory}
                      treatment={patientDetails.treatment}
                      logoUrl={settings?.logo_url}
                    />
                  }
                  fileName={`formulario_${selectedPatient.nome.replace(/\s+/g, '_').toLowerCase()}.pdf`}
                >
                  {({ loading: pdfLoading }) => (
                    <Button disabled={pdfLoading}>
                      <Download className="h-4 w-4 mr-2" />
                      {pdfLoading ? 'Preparando PDF...' : 'Baixar PDF'}
                    </Button>
                  )}
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