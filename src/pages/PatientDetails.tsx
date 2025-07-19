import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { PatientDetailsContent } from '@/components/patient/PatientDetailsContent';
import { supabase, Patient, HealthHistory, Treatment } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Share2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { copyToClipboard } from '@/lib/utils';

const PatientDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [healthHistory, setHealthHistory] = useState<HealthHistory | null>(null);
  const [treatment, setTreatment] = useState<Treatment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      toast.error("ID do paciente não fornecido.");
      navigate('/admin/dashboard');
      return;
    }

    async function loadDetails() {
      try {
        setLoading(true);
        setError(null);

        const { data: patientData, error: patientError } = await supabase
          .from('patients')
          .select('*')
          .eq('id', id)
          .single();

        if (patientError || !patientData) {
          throw new Error('Paciente não encontrado.');
        }
        setPatient(patientData);

        const [healthHistoryResult, treatmentResult] = await Promise.all([
          supabase.from('health_histories').select('*').eq('patient_id', id).single(),
          supabase.from('treatments').select('*').eq('patient_id', id).single()
        ]);

        setHealthHistory(healthHistoryResult.data);
        setTreatment(treatmentResult.data);

      } catch (err: any) {
        console.error("Erro ao carregar detalhes do paciente:", err);
        setError(err.message || 'Não foi possível carregar os detalhes do paciente.');
        toast.error(err.message || 'Não foi possível carregar os detalhes do paciente.');
      } finally {
        setLoading(false);
      }
    }

    loadDetails();
  }, [id, navigate]);

  const handleShare = async (patientId: string) => {
    const shareLink = `${window.location.origin}/public/form?id=${patientId}`;
    const success = await copyToClipboard(shareLink);
    if (success) {
      toast.success("Link de compartilhamento copiado!");
    } else {
      toast.error("Falha ao copiar o link.");
    }
  };

  const handleExport = () => {
    // A lógica de exportação para PDF é complexa e será mantida no dashboard por enquanto.
    // Esta é uma melhoria futura.
    toast.info("Para exportar, por favor, use o botão 'Exportar' no dashboard.");
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="bg-red-50 text-red-700 p-4 rounded-md">
          <p className="font-medium">{error}</p>
          <Button variant="link" onClick={() => navigate('/admin/dashboard')} className="mt-2">
            Voltar para o Dashboard
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Helmet>
        <title>Detalhes de {patient?.nome || 'Paciente'} - Dra. Aymée Frauzino</title>
      </Helmet>
      
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={() => navigate('/admin/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para o Dashboard
          </Button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h1 className="text-2xl font-bold mb-1">Detalhes do Paciente</h1>
            <p className="text-gray-500 mb-6">Visualizando o prontuário de {patient?.nome}</p>
            
            {patient && (
                <PatientDetailsContent
                    patient={patient}
                    healthHistory={healthHistory}
                    treatment={treatment}
                    onShare={() => handleShare(patient.id)}
                    onExport={handleExport}
                />
            )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default PatientDetails;