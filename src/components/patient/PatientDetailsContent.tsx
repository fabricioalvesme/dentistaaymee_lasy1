import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Tabs, 
  TabsList, 
  TabsTrigger, 
  TabsContent 
} from '@/components/ui/tabs';
import { Patient, HealthHistory, Treatment } from '@/lib/supabaseClient';
import { formatDate, getAge } from '@/lib/utils';
import { PatientRemindersSection } from './PatientRemindersSection';
import { ReturnScheduler } from './ReturnScheduler';
import { Reminder } from '@/lib/types/reminder';
import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface PatientDetailsContentProps {
  patient: Patient;
  healthHistory?: HealthHistory | null;
  treatment?: Treatment | null;
  onShare?: (id: string) => void;
  onExport?: (id: string) => void;
  onClose?: () => void;
}

export function PatientDetailsContent({
  patient,
  healthHistory,
  treatment,
  onShare,
  onExport,
  onClose
}: PatientDetailsContentProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('info');
  const [reminders, setReminders] = useState<Reminder[]>([]);
  
  const handleReminderCreated = (reminder: Reminder) => {
    setReminders(prev => [...prev, reminder]);
  };
  
  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="info">Informações</TabsTrigger>
          <TabsTrigger value="health">Histórico</TabsTrigger>
          <TabsTrigger value="treatment">Tratamento</TabsTrigger>
          <TabsTrigger value="reminders">Lembretes</TabsTrigger>
        </TabsList>
        
        <TabsContent value="info">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Nome</h3>
                <p className="font-medium">{patient.nome}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Data de Nascimento</h3>
                <p>{formatDate(patient.data_nascimento)} ({getAge(patient.data_nascimento)} anos)</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Responsável</h3>
                <p>{patient.nome_responsavel}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">CPF</h3>
                <p>{patient.cpf}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Telefone</h3>
                <p>{patient.telefone}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Status</h3>
                <p className="capitalize">
                  {patient.status === 'rascunho' && <span className="text-yellow-600">Rascunho</span>}
                  {patient.status === 'enviado' && <span className="text-blue-600">Enviado</span>}
                  {patient.status === 'assinado' && <span className="text-green-600">Assinado</span>}
                </p>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Endereço</h3>
              <p>{patient.endereco}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Observações</h3>
              <p>{patient.observacoes || 'Nenhuma observação'}</p>
            </div>
            
            {patient.assinatura_timestamp && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Data da Assinatura</h3>
                <p>{formatDate(patient.assinatura_timestamp)}</p>
              </div>
            )}
            
            {patient.assinatura_base64 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Assinatura do Responsável</h3>
                <div className="border p-2 rounded-md bg-gray-50">
                  <img 
                    src={patient.assinatura_base64} 
                    alt="Assinatura do responsável" 
                    className="max-h-20" 
                  />
                </div>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="health">
          {healthHistory ? (
            <div className="space-y-6">
              <div>
                <h3 className="font-medium border-b pb-1 mb-2">Informações Gerais</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Queixa Principal</h4>
                    <p>{healthHistory.queixa_principal}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Tipo de Parto</h4>
                    <p>{healthHistory.tipo_parto}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Aleitamento</h4>
                    <p>{healthHistory.aleitamento}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Problemas na Gestação</h4>
                    <p>{healthHistory.problemas_gestacao}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium border-b pb-1 mb-2">Saúde</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Alergias</h4>
                    <p>{healthHistory.alergias}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Tratamento Médico</h4>
                    <p>{healthHistory.tratamento_medico}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Uso de Medicamentos</h4>
                    <p>{healthHistory.uso_medicamentos}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Presença de Doença</h4>
                    <p>{healthHistory.presenca_doenca}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium border-b pb-1 mb-2">Informações Odontológicas</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Idade do Primeiro Dente</h4>
                    <p>{healthHistory.idade_primeiro_dente}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Anestesia Odontológica</h4>
                    <p>{healthHistory.anestesia_odontologica ? 'Sim' : 'Não'}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Frequência de Escovação</h4>
                    <p>{healthHistory.frequencia_escovacao}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Creme Dental</h4>
                    <p>{healthHistory.creme_dental}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Contém Flúor</h4>
                    <p>{healthHistory.contem_fluor ? 'Sim' : 'Não'}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Uso de Fio Dental</h4>
                    <p>{healthHistory.uso_fio_dental ? 'Sim' : 'Não'}</p>
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
          {treatment && treatment.plano_tratamento ? (
            <div className="space-y-4">
              <h3 className="font-medium border-b pb-1 mb-2">Plano de Tratamento</h3>
              <div className="whitespace-pre-line bg-gray-50 p-4 rounded-md">
                {treatment.plano_tratamento}
              </div>
            </div>
          ) : (
            <div className="py-6 text-center">
              <p className="text-gray-500">Nenhum plano de tratamento cadastrado para este paciente.</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="reminders">
          <div className="space-y-6">
            <div>
              <h3 className="font-medium border-b pb-1 mb-2">Lembretes de Retorno</h3>
              <PatientRemindersSection 
                patientId={patient.id}
                patientName={patient.nome}
                patientPhone={patient.telefone}
              />
            </div>
            
            <div>
              <h3 className="font-medium border-b pb-1 mb-2">Agendar Novo Retorno</h3>
              <ReturnScheduler 
                patientId={patient.id}
                patientName={patient.nome}
                existingReminders={reminders}
                onReminderCreated={handleReminderCreated}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-between pt-4 border-t">
        <Button 
          variant="outline" 
          onClick={() => {
            if (onClose) onClose();
            navigate(`/admin/forms/edit/${patient.id}`);
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
            {onShare && (
              <DropdownMenuItem onClick={() => onShare(patient.id)}>
                Compartilhar Link
              </DropdownMenuItem>
            )}
            {onExport && (
              <DropdownMenuItem onClick={() => onExport(patient.id)}>
                Exportar PDF
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}