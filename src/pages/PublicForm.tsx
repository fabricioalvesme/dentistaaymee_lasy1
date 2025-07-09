import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase, Patient, HealthHistory, Treatment } from '@/lib/supabaseClient';
import { SignaturePad } from '@/components/forms/SignaturePad';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';
import { Loader2, FileCheck } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

const PublicForm = () => {
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get('id');
  const navigate = useNavigate();
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [healthHistory, setHealthHistory] = useState<HealthHistory | null>(null);
  const [treatment, setTreatment] = useState<Treatment | null>(null);
  const [loading, setLoading] = useState(true);
  const [signature, setSignature] = useState('');
  const [saving, setSaving] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar dados do formulário
  useEffect(() => {
    async function loadForm() {
      if (!patientId) {
        setError('ID do formulário não fornecido');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Carregar dados do paciente
        const { data: patientData, error: patientError } = await supabase
          .from('patients')
          .select('*')
          .eq('id', patientId)
          .single();
        
        if (patientError) throw patientError;
        
        if (!patientData) {
          setError('Formulário não encontrado');
          setLoading(false);
          return;
        }
        
        // Verificar se já está assinado
        if (patientData.status === 'assinado') {
          setError('Este formulário já foi assinado');
          setLoading(false);
          return;
        }
        
        setPatient(patientData);
        
        // Carregar histórico de saúde
        const { data: healthData, error: healthError } = await supabase
          .from('health_histories')
          .select('*')
          .eq('patient_id', patientId)
          .single();
        
        if (healthError && healthError.code !== 'PGRST116') throw healthError;
        
        setHealthHistory(healthData);
        
        // Carregar plano de tratamento
        const { data: treatmentData, error: treatmentError } = await supabase
          .from('treatments')
          .select('*')
          .eq('patient_id', patientId)
          .single();
        
        if (treatmentError && treatmentError.code !== 'PGRST116') throw treatmentError;
        
        setTreatment(treatmentData);
      } catch (error) {
        console.error('Erro ao carregar formulário:', error);
        setError('Erro ao carregar o formulário. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    }
    
    loadForm();
  }, [patientId]);

  // Enviar assinatura
  const handleSubmit = async () => {
    if (!signature) {
      toast.error('Por favor, assine o formulário antes de enviar');
      return;
    }
    
    if (!patientId) {
      toast.error('ID do formulário não fornecido');
      return;
    }

    try {
      setSaving(true);
      
      // Atualizar status do paciente e salvar assinatura
      const { error } = await supabase
        .from('patients')
        .update({
          status: 'assinado',
          assinatura_base64: signature,
          assinatura_timestamp: new Date().toISOString()
        })
        .eq('id', patientId);
      
      if (error) throw error;
      
      // Mostrar diálogo de sucesso
      setShowSuccessDialog(true);
    } catch (error) {
      console.error('Erro ao enviar assinatura:', error);
      toast.error('Erro ao enviar assinatura. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-gray-600">Carregando formulário...</p>
          </div>
        </div>
        
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md px-4">
            <div className="bg-red-50 p-4 rounded-md mb-4">
              <p className="text-red-600">{error}</p>
            </div>
            
            <Button onClick={() => navigate('/')}>
              Voltar para a Página Inicial
            </Button>
          </div>
        </div>
        
        <Footer />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600 mb-4">Formulário não encontrado</p>
            <Button onClick={() => navigate('/')}>
              Voltar para a Página Inicial
            </Button>
          </div>
        </div>
        
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>Assinatura de Formulário - Dra. Aymée Frauzino</title>
      </Helmet>
      
      <Header />
      
      <main className="flex-1 py-16 container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h1 className="text-2xl font-bold mb-6 text-center text-primary">
              Formulário de Atendimento Odontológico
            </h1>
            
            <div className="space-y-8">
              {/* Dados do Paciente */}
              <section>
                <h2 className="text-xl font-semibold mb-4 pb-2 border-b">Dados do Paciente</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Nome</p>
                    <p>{patient.nome}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-500">Data de Nascimento</p>
                    <p>{formatDate(patient.data_nascimento)}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-500">Responsável</p>
                    <p>{patient.nome_responsavel}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-500">CPF</p>
                    <p>{patient.cpf}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-500">Telefone</p>
                    <p>{patient.telefone}</p>
                  </div>
                </div>
                
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-500">Endereço</p>
                  <p>{patient.endereco}</p>
                </div>
              </section>
              
              {/* Termo de Consentimento */}
              <section>
                <h2 className="text-xl font-semibold mb-4 pb-2 border-b">Termo de Consentimento</h2>
                
                <div className="bg-gray-50 p-4 rounded-md mb-4">
                  <p className="mb-4">
                    Eu, {patient.nome_responsavel}, responsável pelo(a) paciente {patient.nome}, 
                    autorizo a realização do tratamento odontológico proposto pela Dra. Aymée Frauzino.
                  </p>
                  
                  <p className="mb-4">Declaro ter sido informado(a) sobre:</p>
                  
                  <ul className="list-disc pl-5 mb-4 space-y-2">
                    <li>O diagnóstico do meu filho(a) e o plano de tratamento proposto;</li>
                    <li>Os procedimentos a serem realizados e suas finalidades;</li>
                    <li>Os riscos e limitações inerentes ao tratamento odontológico;</li>
                    <li>Possíveis complicações decorrentes do não tratamento;</li>
                    <li>A necessidade de cooperação do paciente durante e após o tratamento;</li>
                    <li>A importância de retornos periódicos para manutenção dos resultados;</li>
                    <li>Os custos aproximados dos procedimentos a serem realizados.</li>
                  </ul>
                  
                  <p className="mb-4">
                    Estou ciente que a odontologia não é uma ciência exata e que os resultados esperados, 
                    embora previsíveis, não podem ser garantidos, pois dependem de fatores como resposta 
                    biológica individual, cooperação durante o tratamento e cuidados posteriores.
                  </p>
                  
                  <p className="mb-4">
                    Concordo com o orçamento apresentado e com a forma de pagamento estabelecida.
                  </p>
                  
                  <p>
                    Este consentimento pode ser revogado a qualquer momento, por escrito, 
                    antes da realização dos procedimentos.
                  </p>
                </div>
              </section>
              
              {/* Plano de Tratamento */}
              {treatment && (
                <section>
                  <h2 className="text-xl font-semibold mb-4 pb-2 border-b">Plano de Tratamento</h2>
                  
                  <div className="bg-gray-50 p-4 rounded-md whitespace-pre-line">
                    {treatment.plano_tratamento}
                  </div>
                </section>
              )}
              
              {/* Assinatura */}
              <section>
                <h2 className="text-xl font-semibold mb-4 pb-2 border-b">Assinatura do Responsável</h2>
                
                <div className="mb-4">
                  <p className="mb-2">
                    Ao assinar abaixo, confirmo que li e compreendi todas as informações contidas neste documento
                    e concordo com os termos do tratamento odontológico.
                  </p>
                </div>
                
                <SignaturePad onChange={setSignature} />
                
                <Button 
                  className="w-full mt-6" 
                  disabled={!signature || saving}
                  onClick={handleSubmit}
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando assinatura...
                    </>
                  ) : (
                    'Assinar e Enviar'
                  )}
                </Button>
              </section>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
      
      {/* Diálogo de sucesso */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <FileCheck className="text-green-500 h-6 w-6 mr-2" />
              Assinatura Enviada com Sucesso!
            </DialogTitle>
            <DialogDescription>
              Obrigado por confirmar seu formulário de atendimento. Seu registro foi concluído.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-green-50 p-4 rounded-md my-4">
            <p className="text-green-800">
              Seu formulário foi assinado e enviado para a Dra. Aymée Frauzino. Você pode fechar esta página agora.
            </p>
          </div>
          
          <DialogFooter>
            <Button onClick={() => navigate('/')}>
              Voltar para a Página Inicial
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PublicForm;