import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PatientFormCard } from '@/components/PatientFormCard';
import { supabase, Patient } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { 
  Search, 
  Plus, 
  Calendar, 
  FileText, 
  User, 
  ChevronDown,
  Loader2
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

const Dashboard = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [shareLink, setShareLink] = useState('');
  const [counts, setCounts] = useState({
    total: 0,
    rascunho: 0,
    enviado: 0,
    assinado: 0
  });
  
  const navigate = useNavigate();

  // Carregar dados dos pacientes
  useEffect(() => {
    async function fetchPatients() {
      try {
        setLoading(true);
        
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
          throw error;
        }
        
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
    }
    
    fetchPatients();
  }, [periodFilter]);

  // Filtrar pacientes por nome
  const filteredPatients = patients.filter(patient => 
    patient.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.nome_responsavel.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
  const handleViewDetails = (id: string) => {
    const patient = patients.find(p => p.id === id);
    if (patient) {
      setSelectedPatient(patient);
      setShowDetailsDialog(true);
    }
  };

  // Exportar formulário
  const handleExport = (id: string) => {
    // Implementação futura para exportar como PDF/CSV
    toast.info('Funcionalidade de exportação em desenvolvimento');
  };

  // Copiar link para a área de transferência
  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink);
    toast.success('Link copiado para a área de transferência');
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
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
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
                onClick={() => setSearchTerm('')}
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
            <Button onClick={copyToClipboard} variant="secondary">Copiar</Button>
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Paciente</DialogTitle>
          </DialogHeader>
          
          {selectedPatient && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Nome</h3>
                  <p>{selectedPatient.nome}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Data de Nascimento</h3>
                  <p>{new Date(selectedPatient.data_nascimento).toLocaleDateString('pt-BR')}</p>
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
                  <p className="capitalize">{selectedPatient.status}</p>
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
                    <DropdownMenuItem onClick={() => handleExport(selectedPatient.id)}>
                      Exportar PDF
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default Dashboard;