import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
} from '@/components/ui/form';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Save, Share2 } from 'lucide-react';

import { copyToClipboard } from '@/lib/utils';
import { Reminder } from '@/lib/types/reminder';
import { useNotifications } from '@/hooks/useNotifications';

import { PatientDataForm } from '@/components/forms/patient-form/PatientDataForm';
import { HealthHistoryForm } from '@/components/forms/patient-form/HealthHistoryForm';
import { TreatmentPlanForm } from '@/components/forms/patient-form/TreatmentPlanForm';
import { ReturnSchedulerTab } from '@/components/forms/patient-form/ReturnSchedulerTab';

// Schema para o formulário de paciente
const patientSchema = z.object({
  // Dados pessoais
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  data_nascimento: z.string().min(1, 'Data de nascimento é obrigatória'),
  endereco: z.string().min(1, 'Endereço é obrigatório'),
  nome_responsavel: z.string().min(3, 'Nome do responsável deve ter pelo menos 3 caracteres'),
  cpf: z.string().min(11, 'CPF inválido'),
  telefone: z.string().min(10, 'Telefone inválido'),
  observacoes: z.string().optional(),
  
  // Histórico de saúde - Informações básicas
  queixa_principal: z.string().min(1, 'Queixa principal é obrigatória'),
  tipo_parto: z.string().min(1, 'Tipo de parto é obrigatório'),
  aleitamento: z.string().min(1, 'Tipo de aleitamento é obrigatório'),
  
  // Condições Médicas
  alergia_medicamentos: z.boolean().default(false),
  desc_alergia_medicamentos: z.string().optional(),
  alergia_alimentar: z.boolean().default(false),
  desc_alergia_alimentar: z.string().optional(),
  doenca_cardiaca: z.boolean().default(false),
  desc_doenca_cardiaca: z.string().optional(),
  diabetes: z.boolean().default(false),
  desc_diabetes: z.string().optional(),
  disturbios_neurologicos: z.boolean().default(false),
  desc_disturbios_neurologicos: z.string().optional(),
  epilepsia_convulsoes: z.boolean().default(false),
  desc_epilepsia_convulsoes: z.string().optional(),
  hipertensao: z.boolean().default(false),
  desc_hipertensao: z.string().optional(),
  asma: z.boolean().default(false),
  desc_asma: z.string().optional(),
  doenca_renal: z.boolean().default(false),
  desc_doenca_renal: z.string().optional(),
  sindromes_geneticas: z.boolean().default(false),
  desc_sindromes_geneticas: z.string().optional(),
  doenca_autoimune: z.boolean().default(false),
  desc_doenca_autoimune: z.string().optional(),
  disturbios_coagulacao: z.boolean().default(false),
  desc_disturbios_coagulacao: z.string().optional(),
  
  // Medicamentos
  uso_atual_medicamentos: z.boolean().default(false),
  desc_uso_atual_medicamentos: z.string().optional(),
  medicamentos_continuos: z.boolean().default(false),
  desc_medicamentos_continuos: z.string().optional(),
  uso_recente_antibioticos: z.boolean().default(false),
  desc_uso_recente_antibioticos: z.string().optional(),
  suplementos_nutricionais: z.boolean().default(false),
  desc_suplementos_nutricionais: z.string().optional(),
  
  // Histórico Odontológico
  tratamento_odontologico_anterior: z.boolean().default(false),
  desc_tratamento_odontologico_anterior: z.string().optional(),
  reacao_negativa_odontologica: z.boolean().default(false),
  desc_reacao_negativa_odontologica: z.string().optional(),
  necessidade_sedacao_especial: z.boolean().default(false),
  desc_necessidade_sedacao_especial: z.string().optional(),
  trauma_dental: z.boolean().default(false),
  desc_trauma_dental: z.string().optional(),
  
  // Comportamento e Atendimento
  ansiedade_consultas: z.boolean().default(false),
  desc_ansiedade_consultas: z.string().optional(),
  dificuldade_colaboracao: z.boolean().default(false),
  desc_dificuldade_colaboracao: z.string().optional(),
  historico_internacoes: z.boolean().default(false),
  desc_historico_internacoes: z.string().optional(),
  necessidades_especiais: z.boolean().default(false),
  desc_necessidades_especiais: z.string().optional(),
  
  // Aspectos Pediátricos
  nascimento_prematuro: z.boolean().default(false),
  desc_nascimento_prematuro: z.string().optional(),
  parto_complicacoes: z.boolean().default(false),
  desc_parto_complicacoes: z.string().optional(),
  uso_chupeta: z.boolean().default(false),
  desc_uso_chupeta: z.string().optional(),
  habitos_succao_bruxismo: z.boolean().default(false),
  desc_habitos_succao_bruxismo: z.string().optional(),
  amamentacao_prolongada: z.boolean().default(false),
  desc_amamentacao_prolongada: z.string().optional(),
  alimentacao_especial: z.boolean().default(false),
  desc_alimentacao_especial: z.string().optional(),
  
  // Cirurgias e Internações
  realizou_cirurgia: z.boolean().default(false),
  desc_realizou_cirurgia: z.string().optional(),
  foi_internado: z.boolean().default(false),
  desc_foi_internado: z.string().optional(),
  transfusao_sangue: z.boolean().default(false),
  desc_transfusao_sangue: z.string().optional(),
  
  // Histórico Familiar
  doencas_hereditarias: z.boolean().default(false),
  desc_doencas_hereditarias: z.string().optional(),
  historico_alergias_familia: z.boolean().default(false),
  desc_historico_alergias_familia: z.string().optional(),
  problemas_dentarios_familia: z.boolean().default(false),
  desc_problemas_dentarios_familia: z.string().optional(),
  
  // Outros campos que já existiam
  problemas_gestacao: z.string().optional(),
  presenca_doenca: z.string().optional(),
  idade_primeiro_dente: z.string().optional(),
  anestesia_odontologica: z.boolean().default(false),
  frequencia_escovacao: z.string().optional(),
  creme_dental: z.string().optional(),
  contem_fluor: z.boolean().default(true),
  uso_fio_dental: z.boolean().default(false),
  quem_realiza_escovacao: z.string().optional(),
  uso_mamadeira: z.boolean().default(false),
  refeicoes_diarias: z.string().optional(),
  fonte_acucar: z.string().optional(),
  habito_succao: z.boolean().default(false),
  roer_unhas: z.boolean().default(false),
  dormir_boca_aberta: z.boolean().default(false),
  vacinacao_dia: z.boolean().default(true),
  problemas_cardiacos: z.string().optional(),
  problemas_renais: z.string().optional(),
  problemas_gastricos: z.string().optional(),
  problemas_respiratorios: z.string().optional(),
  alteracao_coagulacao: z.string().optional(),
  internacoes_recentes: z.string().optional(),
  peso_atual: z.string().optional(),
  
  // Plano de tratamento
  plano_tratamento: z.string().optional(),
});

type PatientFormValues = z.infer<typeof patientSchema>;

const NewPatientForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dados-pessoais');
  const [loading, setLoading] = useState(id ? true : false);
  const [saving, setSaving] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [isCopying, setIsCopying] = useState(false);
  const [patientReminders, setPatientReminders] = useState<Reminder[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  const { getPatientReminders } = useNotifications();
  
  // Inicializar formulário com valores padrão
  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      nome: '',
      data_nascimento: '',
      endereco: '',
      nome_responsavel: '',
      cpf: '',
      telefone: '',
      observacoes: '',
      queixa_principal: '',
      tipo_parto: '',
      aleitamento: '',
      alergia_medicamentos: false,
      alergia_alimentar: false,
      doenca_cardiaca: false,
      diabetes: false,
      disturbios_neurologicos: false,
      epilepsia_convulsoes: false,
      hipertensao: false,
      asma: false,
      doenca_renal: false,
      sindromes_geneticas: false,
      doenca_autoimune: false,
      disturbios_coagulacao: false,
      uso_atual_medicamentos: false,
      medicamentos_continuos: false,
      uso_recente_antibioticos: false,
      suplementos_nutricionais: false,
      tratamento_odontologico_anterior: false,
      reacao_negativa_odontologica: false,
      necessidade_sedacao_especial: false,
      trauma_dental: false,
      ansiedade_consultas: false,
      dificuldade_colaboracao: false,
      historico_internacoes: false,
      necessidades_especiais: false,
      nascimento_prematuro: false,
      parto_complicacoes: false,
      uso_chupeta: false,
      habitos_succao_bruxismo: false,
      amamentacao_prolongada: false,
      alimentacao_especial: false,
      realizou_cirurgia: false,
      foi_internado: false,
      transfusao_sangue: false,
      doencas_hereditarias: false,
      historico_alergias_familia: false,
      problemas_dentarios_familia: false,
      problemas_gestacao: '',
      presenca_doenca: '',
      idade_primeiro_dente: '',
      anestesia_odontologica: false,
      frequencia_escovacao: '',
      creme_dental: '',
      contem_fluor: true,
      uso_fio_dental: false,
      quem_realiza_escovacao: '',
      uso_mamadeira: false,
      refeicoes_diarias: '',
      fonte_acucar: '',
      habito_succao: false,
      roer_unhas: false,
      dormir_boca_aberta: false,
      vacinacao_dia: true,
      problemas_cardiacos: '',
      problemas_renais: '',
      problemas_gastricos: '',
      problemas_respiratorios: '',
      alteracao_coagulacao: '',
      internacoes_recentes: '',
      peso_atual: '',
      plano_tratamento: '',
    }
  });

  // Carregar lembretes de retorno do paciente
  const loadPatientReminders = async (patientId: string) => {
    try {
      const reminders = await getPatientReminders(patientId);
      const returnReminders = reminders.filter(r => r.type === 'return');
      setPatientReminders(returnReminders);
      return returnReminders;
    } catch (error) {
      console.error("Erro ao carregar lembretes:", error);
      return [];
    }
  };

  // Carregar dados do paciente se estiver editando
  useEffect(() => {
    if (id) {
      async function loadPatient() {
        try {
          setLoading(true);
          setLoadError(null);
          
          const { data: patient, error: patientError } = await supabase
            .from('patients')
            .select('*')
            .eq('id', id)
            .single();
          
          if (patientError || !patient) {
            setLoadError('Erro ao carregar dados do paciente.');
            toast.error('Erro ao carregar dados do paciente.');
            setLoading(false);
            return;
          }
          
          const { data: healthHistory } = await supabase
            .from('health_histories')
            .select('*')
            .eq('patient_id', id)
            .single();
          
          const { data: treatment } = await supabase
            .from('treatments')
            .select('*')
            .eq('patient_id', id)
            .single();
          
          await loadPatientReminders(id);
          
          form.reset({
            nome: patient.nome || '',
            data_nascimento: patient.data_nascimento || '',
            endereco: patient.endereco || '',
            nome_responsavel: patient.nome_responsavel || '',
            cpf: patient.cpf || '',
            telefone: patient.telefone || '',
            observacoes: patient.observacoes || '',
            queixa_principal: healthHistory?.queixa_principal || '',
            tipo_parto: healthHistory?.tipo_parto || '',
            aleitamento: healthHistory?.aleitamento || '',
            alergia_medicamentos: healthHistory?.alergia_medicamentos || false,
            desc_alergia_medicamentos: healthHistory?.desc_alergia_medicamentos || '',
            alergia_alimentar: healthHistory?.alergia_alimentar || false,
            desc_alergia_alimentar: healthHistory?.desc_alergia_alimentar || '',
            doenca_cardiaca: healthHistory?.doenca_cardiaca || false,
            desc_doenca_cardiaca: healthHistory?.desc_doenca_cardiaca || '',
            diabetes: healthHistory?.diabetes || false,
            desc_diabetes: healthHistory?.desc_diabetes || '',
            disturbios_neurologicos: healthHistory?.disturbios_neurologicos || false,
            desc_disturbios_neurologicos: healthHistory?.desc_disturbios_neurologicos || '',
            epilepsia_convulsoes: healthHistory?.epilepsia_convulsoes || false,
            desc_epilepsia_convulsoes: healthHistory?.desc_epilepsia_convulsoes || '',
            hipertensao: healthHistory?.hipertensao || false,
            desc_hipertensao: healthHistory?.desc_hipertensao || '',
            asma: healthHistory?.asma || false,
            desc_asma: healthHistory?.desc_asma || '',
            doenca_renal: healthHistory?.doenca_renal || false,
            desc_doenca_renal: healthHistory?.desc_doenca_renal || '',
            sindromes_geneticas: healthHistory?.sindromes_geneticas || false,
            desc_sindromes_geneticas: healthHistory?.desc_sindromes_geneticas || '',
            doenca_autoimune: healthHistory?.doenca_autoimune || false,
            desc_doenca_autoimune: healthHistory?.desc_doenca_autoimune || '',
            disturbios_coagulacao: healthHistory?.disturbios_coagulacao || false,
            desc_disturbios_coagulacao: healthHistory?.desc_disturbios_coagulacao || '',
            uso_atual_medicamentos: healthHistory?.uso_atual_medicamentos || false,
            desc_uso_atual_medicamentos: healthHistory?.desc_uso_atual_medicamentos || '',
            medicamentos_continuos: healthHistory?.medicamentos_continuos || false,
            desc_medicamentos_continuos: healthHistory?.desc_medicamentos_continuos || '',
            uso_recente_antibioticos: healthHistory?.uso_recente_antibioticos || false,
            desc_uso_recente_antibioticos: healthHistory?.desc_uso_recente_antibioticos || '',
            suplementos_nutricionais: healthHistory?.suplementos_nutricionais || false,
            desc_suplementos_nutricionais: healthHistory?.desc_suplementos_nutricionais || '',
            tratamento_odontologico_anterior: healthHistory?.tratamento_odontologico_anterior || false,
            desc_tratamento_odontologico_anterior: healthHistory?.desc_tratamento_odontologico_anterior || '',
            reacao_negativa_odontologica: healthHistory?.reacao_negativa_odontologica || false,
            desc_reacao_negativa_odontologica: healthHistory?.desc_reacao_negativa_odontologica || '',
            necessidade_sedacao_especial: healthHistory?.necessidade_sedacao_especial || false,
            desc_necessidade_sedacao_especial: healthHistory?.desc_necessidade_sedacao_especial || '',
            trauma_dental: healthHistory?.trauma_dental || false,
            desc_trauma_dental: healthHistory?.desc_trauma_dental || '',
            ansiedade_consultas: healthHistory?.ansiedade_consultas || false,
            desc_ansiedade_consultas: healthHistory?.desc_ansiedade_consultas || '',
            dificuldade_colaboracao: healthHistory?.dificuldade_colaboracao || false,
            desc_dificuldade_colaboracao: healthHistory?.desc_dificuldade_colaboracao || '',
            historico_internacoes: healthHistory?.historico_internacoes || false,
            desc_historico_internacoes: healthHistory?.desc_historico_internacoes || '',
            necessidades_especiais: healthHistory?.necessidades_especiais || false,
            desc_necessidades_especiais: healthHistory?.desc_necessidades_especiais || '',
            nascimento_prematuro: healthHistory?.nascimento_prematuro || false,
            desc_nascimento_prematuro: healthHistory?.desc_nascimento_prematuro || '',
            parto_complicacoes: healthHistory?.parto_complicacoes || false,
            desc_parto_complicacoes: healthHistory?.desc_parto_complicacoes || '',
            uso_chupeta: healthHistory?.uso_chupeta || false,
            desc_uso_chupeta: healthHistory?.desc_uso_chupeta || '',
            habitos_succao_bruxismo: healthHistory?.habitos_succao_bruxismo || false,
            desc_habitos_succao_bruxismo: healthHistory?.desc_habitos_succao_bruxismo || '',
            amamentacao_prolongada: healthHistory?.amamentacao_prolongada || false,
            desc_amamentacao_prolongada: healthHistory?.desc_amamentacao_prolongada || '',
            alimentacao_especial: healthHistory?.alimentacao_especial || false,
            desc_alimentacao_especial: healthHistory?.desc_alimentacao_especial || '',
            realizou_cirurgia: healthHistory?.realizou_cirurgia || false,
            desc_realizou_cirurgia: healthHistory?.desc_realizou_cirurgia || '',
            foi_internado: healthHistory?.foi_internado || false,
            desc_foi_internado: healthHistory?.desc_foi_internado || '',
            transfusao_sangue: healthHistory?.transfusao_sangue || false,
            desc_transfusao_sangue: healthHistory?.desc_transfusao_sangue || '',
            doencas_hereditarias: healthHistory?.doencas_hereditarias || false,
            desc_doencas_hereditarias: healthHistory?.desc_doencas_hereditarias || '',
            historico_alergias_familia: healthHistory?.historico_alergias_familia || false,
            desc_historico_alergias_familia: healthHistory?.desc_historico_alergias_familia || '',
            problemas_dentarios_familia: healthHistory?.problemas_dentarios_familia || false,
            desc_problemas_dentarios_familia: healthHistory?.desc_problemas_dentarios_familia || '',
            problemas_gestacao: healthHistory?.problemas_gestacao || '',
            presenca_doenca: healthHistory?.presenca_doenca || '',
            idade_primeiro_dente: healthHistory?.idade_primeiro_dente || '',
            anestesia_odontologica: healthHistory?.anestesia_odontologica !== undefined ? healthHistory.anestesia_odontologica : false,
            frequencia_escovacao: healthHistory?.frequencia_escovacao || '',
            creme_dental: healthHistory?.creme_dental || '',
            contem_fluor: healthHistory?.contem_fluor !== undefined ? healthHistory.contem_fluor : true,
            uso_fio_dental: healthHistory?.uso_fio_dental !== undefined ? healthHistory.uso_fio_dental : false,
            quem_realiza_escovacao: healthHistory?.quem_realiza_escovacao || '',
            uso_mamadeira: healthHistory?.uso_mamadeira !== undefined ? healthHistory.uso_mamadeira : false,
            refeicoes_diarias: healthHistory?.refeicoes_diarias || '',
            fonte_acucar: healthHistory?.fonte_acucar || '',
            habito_succao: healthHistory?.habito_succao !== undefined ? healthHistory.habito_succao : false,
            roer_unhas: healthHistory?.roer_unhas !== undefined ? healthHistory.roer_unhas : false,
            dormir_boca_aberta: healthHistory?.dormir_boca_aberta !== undefined ? healthHistory.dormir_boca_aberta : false,
            vacinacao_dia: healthHistory?.vacinacao_dia !== undefined ? healthHistory.vacinacao_dia : true,
            problemas_cardiacos: healthHistory?.problemas_cardiacos || '',
            problemas_renais: healthHistory?.problemas_renais || '',
            problemas_gastricos: healthHistory?.problemas_gastricos || '',
            problemas_respiratorios: healthHistory?.problemas_respiratorios || '',
            alteracao_coagulacao: healthHistory?.alteracao_coagulacao || '',
            internacoes_recentes: healthHistory?.internacoes_recentes || '',
            peso_atual: healthHistory?.peso_atual || '',
            plano_tratamento: treatment?.plano_tratamento || '',
          });
        } catch (error) {
          setLoadError('Erro ao carregar dados do formulário.');
          toast.error('Erro ao carregar dados do formulário.');
        } finally {
          setLoading(false);
        }
      }
      loadPatient();
    }
  }, [id, form, getPatientReminders]);

  // Função para validar a aba atual e passar para a próxima
  const validateTabAndContinue = async (nextTab: string) => {
    let fieldsToValidate: (keyof PatientFormValues)[] = [];
    if (activeTab === 'dados-pessoais') {
      fieldsToValidate = ['nome', 'data_nascimento', 'endereco', 'nome_responsavel', 'cpf', 'telefone'];
    } else if (activeTab === 'historico-saude') {
      fieldsToValidate = ['queixa_principal', 'tipo_parto', 'aleitamento'];
    }
    
    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) {
      setActiveTab(nextTab);
    } else {
      toast.info('Por favor, preencha todos os campos obrigatórios (*).');
    }
  };

  // Função para salvar o formulário
  const onSubmit = async (data: PatientFormValues, share: boolean = false) => {
    try {
      setSaving(true);
      
      const patientData = {
        nome: data.nome, data_nascimento: data.data_nascimento, endereco: data.endereco,
        nome_responsavel: data.nome_responsavel, cpf: data.cpf, telefone: data.telefone,
        observacoes: data.observacoes, status: share ? 'enviado' : 'rascunho',
      };
      
      const healthHistoryData = {
        queixa_principal: data.queixa_principal, tipo_parto: data.tipo_parto, aleitamento: data.aleitamento,
        alergia_medicamentos: data.alergia_medicamentos, desc_alergia_medicamentos: data.desc_alergia_medicamentos,
        alergia_alimentar: data.alergia_alimentar, desc_alergia_alimentar: data.desc_alergia_alimentar,
        doenca_cardiaca: data.doenca_cardiaca, desc_doenca_cardiaca: data.desc_doenca_cardiaca,
        diabetes: data.diabetes, desc_diabetes: data.desc_diabetes,
        disturbios_neurologicos: data.disturbios_neurologicos, desc_disturbios_neurologicos: data.desc_disturbios_neurologicos,
        epilepsia_convulsoes: data.epilepsia_convulsoes, desc_epilepsia_convulsoes: data.desc_epilepsia_convulsoes,
        hipertensao: data.hipertensao, desc_hipertensao: data.desc_hipertensao,
        asma: data.asma, desc_asma: data.desc_asma,
        doenca_renal: data.doenca_renal, desc_doenca_renal: data.desc_doenca_renal,
        sindromes_geneticas: data.sindromes_geneticas, desc_sindromes_geneticas: data.desc_sindromes_geneticas,
        doenca_autoimune: data.doenca_autoimune, desc_doenca_autoimune: data.desc_doenca_autoimune,
        disturbios_coagulacao: data.disturbios_coagulacao, desc_disturbios_coagulacao: data.desc_disturbios_coagulacao,
        uso_atual_medicamentos: data.uso_atual_medicamentos, desc_uso_atual_medicamentos: data.desc_uso_atual_medicamentos,
        medicamentos_continuos: data.medicamentos_continuos, desc_medicamentos_continuos: data.desc_medicamentos_continuos,
        uso_recente_antibioticos: data.uso_recente_antibioticos, desc_uso_recente_antibioticos: data.desc_uso_recente_antibioticos,
        suplementos_nutricionais: data.suplementos_nutricionais, desc_suplementos_nutricionais: data.desc_suplementos_nutricionais,
        tratamento_odontologico_anterior: data.tratamento_odontologico_anterior, desc_tratamento_odontologico_anterior: data.desc_tratamento_odontologico_anterior,
        reacao_negativa_odontologica: data.reacao_negativa_odontologica, desc_reacao_negativa_odontologica: data.desc_reacao_negativa_odontologica,
        necessidade_sedacao_especial: data.necessidade_sedacao_especial, desc_necessidade_sedacao_especial: data.desc_necessidade_sedacao_especial,
        trauma_dental: data.trauma_dental, desc_trauma_dental: data.desc_trauma_dental,
        ansiedade_consultas: data.ansiedade_consultas, desc_ansiedade_consultas: data.desc_ansiedade_consultas,
        dificuldade_colaboracao: data.dificuldade_colaboracao, desc_dificuldade_colaboracao: data.desc_dificuldade_colaboracao,
        historico_internacoes: data.historico_internacoes, desc_historico_internacoes: data.desc_historico_internacoes,
        necessidades_especiais: data.necessidades_especiais, desc_necessidades_especiais: data.desc_necessidades_especiais,
        nascimento_prematuro: data.nascimento_prematuro, desc_nascimento_prematuro: data.desc_nascimento_prematuro,
        parto_complicacoes: data.parto_complicacoes, desc_parto_complicacoes: data.desc_parto_complicacoes,
        uso_chupeta: data.uso_chupeta, desc_uso_chupeta: data.desc_uso_chupeta,
        habitos_succao_bruxismo: data.habitos_succao_bruxismo, desc_habitos_succao_bruxismo: data.desc_habitos_succao_bruxismo,
        amamentacao_prolongada: data.amamentacao_prolongada, desc_amamentacao_prolongada: data.desc_amamentacao_prolongada,
        alimentacao_especial: data.alimentacao_especial, desc_alimentacao_especial: data.desc_alimentacao_especial,
        realizou_cirurgia: data.realizou_cirurgia, desc_realizou_cirurgia: data.desc_realizou_cirurgia,
        foi_internado: data.foi_internado, desc_foi_internado: data.desc_foi_internado,
        transfusao_sangue: data.transfusao_sangue, desc_transfusao_sangue: data.desc_transfusao_sangue,
        doencas_hereditarias: data.doencas_hereditarias, desc_doencas_hereditarias: data.desc_doencas_hereditarias,
        historico_alergias_familia: data.historico_alergias_familia, desc_historico_alergias_familia: data.desc_historico_alergias_familia,
        problemas_dentarios_familia: data.problemas_dentarios_familia, desc_problemas_dentarios_familia: data.desc_problemas_dentarios_familia,
        problemas_gestacao: data.problemas_gestacao, presenca_doenca: data.presenca_doenca,
        idade_primeiro_dente: data.idade_primeiro_dente, anestesia_odontologica: data.anestesia_odontologica,
        frequencia_escovacao: data.frequencia_escovacao, creme_dental: data.creme_dental,
        contem_fluor: data.contem_fluor, uso_fio_dental: data.uso_fio_dental,
        quem_realiza_escovacao: data.quem_realiza_escovacao, uso_mamadeira: data.uso_mamadeira,
        refeicoes_diarias: data.refeicoes_diarias, fonte_acucar: data.fonte_acucar,
        habito_succao: data.habito_succao, roer_unhas: data.roer_unhas,
        dormir_boca_aberta: data.dormir_boca_aberta, vacinacao_dia: data.vacinacao_dia,
        problemas_cardiacos: data.problemas_cardiacos, problemas_renais: data.problemas_renais,
        problemas_gastricos: data.problemas_gastricos, problemas_respiratorios: data.problemas_respiratorios,
        alteracao_coagulacao: data.alteracao_coagulacao, internacoes_recentes: data.internacoes_recentes,
        peso_atual: data.peso_atual,
      };
      
      const treatmentData = { plano_tratamento: data.plano_tratamento };
      
      let patientId = id;
      
      if (id) {
        const { error } = await supabase.from('patients').update(patientData).eq('id', id);
        if (error) throw error;
      } else {
        const { data: newPatient, error } = await supabase.from('patients').insert([patientData]).select();
        if (error || !newPatient) throw error || new Error("Falha ao criar paciente.");
        patientId = newPatient[0].id;
      }
      
      if (patientId) {
        const { data: existingHistory } = await supabase.from('health_histories').select('id').eq('patient_id', patientId).single();
        if (existingHistory) {
          const { error } = await supabase.from('health_histories').update({ ...healthHistoryData, patient_id: patientId }).eq('id', existingHistory.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('health_histories').insert([{ ...healthHistoryData, patient_id: patientId }]);
          if (error) throw error;
        }
        
        const { data: existingTreatment } = await supabase.from('treatments').select('id').eq('patient_id', patientId).single();
        if (existingTreatment) {
          const { error } = await supabase.from('treatments').update({ ...treatmentData, patient_id: patientId }).eq('id', existingTreatment.id);
          if (error) throw error;
        } else if (data.plano_tratamento) {
          const { error } = await supabase.from('treatments').insert([{ ...treatmentData, patient_id: patientId }]);
          if (error) throw error;
        }
        
        if (share) {
          const shareLink = `${window.location.origin}/public/form?id=${patientId}`;
          setShareLink(shareLink);
          setShowShareDialog(true);
        } else {
          toast.success('Formulário salvo com sucesso!');
          navigate('/admin/dashboard');
        }
      }
    } catch (error: any) {
      toast.error('Erro ao salvar formulário: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboardHandler = async () => {
    setIsCopying(true);
    const success = await copyToClipboard(shareLink);
    toast[success ? 'success' : 'error'](success ? 'Link copiado!' : 'Falha ao copiar.');
    setIsCopying(false);
  };

  const handleReminderCreated = (reminder: Reminder) => {
    setPatientReminders(prev => [...prev, reminder]);
  };

  return (
    <AdminLayout>
      <Helmet>
        <title>{id ? 'Editar Formulário' : 'Novo Formulário'} - Dra. Aymée Frauzino</title>
      </Helmet>
      
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{id ? 'Editar Formulário' : 'Novo Formulário'} Clínico</h1>
          <p className="text-gray-500">Preencha os dados do paciente e histórico de saúde</p>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : loadError ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
            <p className="font-medium">{loadError}</p>
            <Button variant="outline" onClick={() => window.location.reload()} className="mt-2">Tentar novamente</Button>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => onSubmit(data, false))}>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full grid grid-cols-2 md:grid-cols-4 mb-8">
                  <TabsTrigger value="dados-pessoais">Dados Pessoais</TabsTrigger>
                  <TabsTrigger value="historico-saude">Histórico de Saúde</TabsTrigger>
                  <TabsTrigger value="plano-tratamento">Plano de Tratamento</TabsTrigger>
                  <TabsTrigger value="agendamento-retorno">Agendamento de Retorno</TabsTrigger>
                </TabsList>
                
                <TabsContent value="dados-pessoais" className="space-y-6 pt-4">
                  <PatientDataForm control={form.control} />
                  <div className="flex justify-end">
                    <Button type="button" onClick={() => validateTabAndContinue('historico-saude')}>Próximo</Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="historico-saude" className="space-y-6 pt-4">
                  <HealthHistoryForm control={form.control} />
                  <div className="flex justify-between">
                    <Button type="button" variant="outline" onClick={() => setActiveTab('dados-pessoais')}>Voltar</Button>
                    <Button type="button" onClick={() => validateTabAndContinue('plano-tratamento')}>Próximo</Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="plano-tratamento" className="space-y-6 pt-4">
                  <TreatmentPlanForm control={form.control} />
                  <div className="flex justify-between">
                    <Button type="button" variant="outline" onClick={() => setActiveTab('historico-saude')}>Voltar</Button>
                    <Button type="button" onClick={() => validateTabAndContinue('agendamento-retorno')}>Próximo</Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="agendamento-retorno" className="space-y-6 pt-4">
                  <ReturnSchedulerTab 
                    patientId={id}
                    patientName={form.getValues('nome')}
                    patientReminders={patientReminders}
                    onReminderCreated={handleReminderCreated}
                  />
                  <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setActiveTab('plano-tratamento')}>Voltar</Button>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button type="submit" disabled={saving}>
                        {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</> : <><Save className="mr-2 h-4 w-4" />Salvar como Rascunho</>}
                      </Button>
                      <Button type="button" onClick={() => onSubmit(form.getValues(), true)} disabled={saving} variant="secondary">
                        {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processando...</> : <><Share2 className="mr-2 h-4 w-4" />Salvar e Compartilhar</>}
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </form>
          </Form>
        )}
      </div>
      
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Compartilhar Formulário</DialogTitle>
            <DialogDescription>Compartilhe este link com o paciente para que ele possa assinar o formulário.</DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 mt-4">
            <Input value={shareLink} readOnly onClick={(e) => (e.target as HTMLInputElement).select()} />
            <Button onClick={copyToClipboardHandler} variant="secondary" disabled={isCopying}>
              {isCopying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Copiar"}
            </Button>
          </div>
          <DialogFooter className="mt-4">
            <Button onClick={() => { setShowShareDialog(false); navigate('/admin/dashboard'); }}>Ir para Dashboard</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default NewPatientForm;