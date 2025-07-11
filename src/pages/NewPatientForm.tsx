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
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
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

import { RadioGroupField } from '@/components/forms/RadioGroupField';
import { CheckboxField } from '@/components/forms/CheckboxField';
import { YesNoField } from '@/components/forms/YesNoField';
import { copyToClipboard } from '@/lib/utils';

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
  
  // Histórico de saúde
  queixa_principal: z.string().min(1, 'Queixa principal é obrigatória'),
  tipo_parto: z.string().min(1, 'Tipo de parto é obrigatório'),
  aleitamento: z.string().min(1, 'Tipo de aleitamento é obrigatório'),
  problemas_gestacao: z.string().optional(),
  alergias: z.string().optional(),
  tratamento_medico: z.string().optional(),
  uso_medicamentos: z.string().optional(),
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
      problemas_gestacao: '',
      alergias: '',
      tratamento_medico: '',
      uso_medicamentos: '',
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

  // Carregar dados do paciente se estiver editando
  useEffect(() => {
    if (id) {
      async function loadPatient() {
        try {
          setLoading(true);
          console.log("Carregando dados do paciente:", id);
          
          // Buscar dados do paciente
          const { data: patient, error: patientError } = await supabase
            .from('patients')
            .select('*')
            .eq('id', id)
            .single();
          
          if (patientError) {
            console.error("Erro ao carregar paciente:", patientError);
            toast.error('Erro ao carregar dados do paciente');
            return;
          }
          
          if (!patient) {
            console.error("Paciente não encontrado");
            toast.error('Paciente não encontrado');
            navigate('/admin/dashboard');
            return;
          }
          
          console.log("Dados do paciente carregados:", patient);
          
          // Buscar histórico de saúde
          const { data: healthHistory, error: historyError } = await supabase
            .from('health_histories')
            .select('*')
            .eq('patient_id', id)
            .single();
          
          if (historyError && historyError.code !== 'PGRST116') {
            console.error("Erro ao carregar histórico de saúde:", historyError);
          }
          
          console.log("Histórico de saúde:", healthHistory);
          
          // Buscar plano de tratamento
          const { data: treatment, error: treatmentError } = await supabase
            .from('treatments')
            .select('*')
            .eq('patient_id', id)
            .single();
          
          if (treatmentError && treatmentError.code !== 'PGRST116') {
            console.error("Erro ao carregar plano de tratamento:", treatmentError);
          }
          
          console.log("Plano de tratamento:", treatment);
          
          // Preencher formulário com dados
          form.reset({
            // Dados pessoais
            nome: patient.nome,
            data_nascimento: patient.data_nascimento,
            endereco: patient.endereco,
            nome_responsavel: patient.nome_responsavel,
            cpf: patient.cpf,
            telefone: patient.telefone,
            observacoes: patient.observacoes || '',
            
            // Histórico de saúde
            queixa_principal: healthHistory?.queixa_principal || '',
            tipo_parto: healthHistory?.tipo_parto || '',
            aleitamento: healthHistory?.aleitamento || '',
            problemas_gestacao: healthHistory?.problemas_gestacao || '',
            alergias: healthHistory?.alergias || '',
            tratamento_medico: healthHistory?.tratamento_medico || '',
            uso_medicamentos: healthHistory?.uso_medicamentos || '',
            presenca_doenca: healthHistory?.presenca_doenca || '',
            idade_primeiro_dente: healthHistory?.idade_primeiro_dente || '',
            anestesia_odontologica: healthHistory?.anestesia_odontologica || false,
            frequencia_escovacao: healthHistory?.frequencia_escovacao || '',
            creme_dental: healthHistory?.creme_dental || '',
            contem_fluor: healthHistory?.contem_fluor || true,
            uso_fio_dental: healthHistory?.uso_fio_dental || false,
            quem_realiza_escovacao: healthHistory?.quem_realiza_escovacao || '',
            uso_mamadeira: healthHistory?.uso_mamadeira || false,
            refeicoes_diarias: healthHistory?.refeicoes_diarias || '',
            fonte_acucar: healthHistory?.fonte_acucar || '',
            habito_succao: healthHistory?.habito_succao || false,
            roer_unhas: healthHistory?.roer_unhas || false,
            dormir_boca_aberta: healthHistory?.dormir_boca_aberta || false,
            vacinacao_dia: healthHistory?.vacinacao_dia || true,
            problemas_cardiacos: healthHistory?.problemas_cardiacos || '',
            problemas_renais: healthHistory?.problemas_renais || '',
            problemas_gastricos: healthHistory?.problemas_gastricos || '',
            problemas_respiratorios: healthHistory?.problemas_respiratorios || '',
            alteracao_coagulacao: healthHistory?.alteracao_coagulacao || '',
            internacoes_recentes: healthHistory?.internacoes_recentes || '',
            peso_atual: healthHistory?.peso_atual || '',
            
            // Plano de tratamento
            plano_tratamento: treatment?.plano_tratamento || '',
          });
          
        } catch (error) {
          console.error("Erro ao carregar dados:", error);
          toast.error('Erro ao carregar dados');
        } finally {
          setLoading(false);
        }
      }
      
      loadPatient();
    }
  }, [id, navigate, form]);

  // Função para validar a aba atual e passar para a próxima
  const validateTabAndContinue = async () => {
    try {
      // Validar campos de acordo com a aba atual
      if (activeTab === 'dados-pessoais') {
        // Validar campos da aba dados pessoais
        const isValid = await form.trigger([
          'nome', 'data_nascimento', 'endereco', 'nome_responsavel', 'cpf', 'telefone'
        ]);
        
        if (isValid) {
          setActiveTab('historico-saude');
        }
      } else if (activeTab === 'historico-saude') {
        // Validar campos da aba histórico de saúde
        const isValid = await form.trigger([
          'queixa_principal', 'tipo_parto', 'aleitamento'
        ]);
        
        if (isValid) {
          setActiveTab('plano-tratamento');
        }
      }
    } catch (error) {
      console.error('Erro ao validar campos:', error);
    }
  };

  // Função para salvar o formulário
  const onSubmit = async (data: PatientFormValues, share: boolean = false) => {
    try {
      setSaving(true);
      console.log("Salvando formulário:", data);
      
      // Preparar dados do paciente
      const patientData = {
        nome: data.nome,
        data_nascimento: data.data_nascimento,
        endereco: data.endereco,
        nome_responsavel: data.nome_responsavel,
        cpf: data.cpf,
        telefone: data.telefone,
        observacoes: data.observacoes,
        status: share ? 'enviado' : 'rascunho',
      };
      
      // Preparar dados do histórico de saúde
      const healthHistoryData = {
        queixa_principal: data.queixa_principal,
        tipo_parto: data.tipo_parto,
        aleitamento: data.aleitamento,
        problemas_gestacao: data.problemas_gestacao,
        alergias: data.alergias,
        tratamento_medico: data.tratamento_medico,
        uso_medicamentos: data.uso_medicamentos,
        presenca_doenca: data.presenca_doenca,
        idade_primeiro_dente: data.idade_primeiro_dente,
        anestesia_odontologica: data.anestesia_odontologica,
        frequencia_escovacao: data.frequencia_escovacao,
        creme_dental: data.creme_dental,
        contem_fluor: data.contem_fluor,
        uso_fio_dental: data.uso_fio_dental,
        quem_realiza_escovacao: data.quem_realiza_escovacao,
        uso_mamadeira: data.uso_mamadeira,
        refeicoes_diarias: data.refeicoes_diarias,
        fonte_acucar: data.fonte_acucar,
        habito_succao: data.habito_succao,
        roer_unhas: data.roer_unhas,
        dormir_boca_aberta: data.dormir_boca_aberta,
        vacinacao_dia: data.vacinacao_dia,
        problemas_cardiacos: data.problemas_cardiacos,
        problemas_renais: data.problemas_renais,
        problemas_gastricos: data.problemas_gastricos,
        problemas_respiratorios: data.problemas_respiratorios,
        alteracao_coagulacao: data.alteracao_coagulacao,
        internacoes_recentes: data.internacoes_recentes,
        peso_atual: data.peso_atual,
      };
      
      // Preparar dados do plano de tratamento
      const treatmentData = {
        plano_tratamento: data.plano_tratamento,
      };
      
      let patientId = id;
      
      if (id) {
        // Atualizar paciente existente
        console.log("Atualizando paciente existente:", id);
        const { error: updateError } = await supabase
          .from('patients')
          .update(patientData)
          .eq('id', id);
        
        if (updateError) {
          console.error("Erro ao atualizar paciente:", updateError);
          throw updateError;
        }
      } else {
        // Criar novo paciente
        console.log("Criando novo paciente");
        const { data: newPatient, error: insertError } = await supabase
          .from('patients')
          .insert([patientData])
          .select();
        
        if (insertError) {
          console.error("Erro ao criar paciente:", insertError);
          throw insertError;
        }
        
        if (!newPatient || newPatient.length === 0) {
          throw new Error("Erro ao criar paciente: nenhum dado retornado");
        }
        
        patientId = newPatient[0].id;
        console.log("Novo paciente criado, ID:", patientId);
      }
      
      // Salvar histórico de saúde
      if (patientId) {
        // Verificar se já existe um histórico para este paciente
        const { data: existingHistory } = await supabase
          .from('health_histories')
          .select('id')
          .eq('patient_id', patientId)
          .single();
        
        if (existingHistory) {
          // Atualizar histórico existente
          console.log("Atualizando histórico existente:", existingHistory.id);
          const { error: historyError } = await supabase
            .from('health_histories')
            .update({
              ...healthHistoryData,
              patient_id: patientId
            })
            .eq('id', existingHistory.id);
          
          if (historyError) {
            console.error("Erro ao atualizar histórico de saúde:", historyError);
            throw historyError;
          }
        } else {
          // Criar novo histórico
          console.log("Criando novo histórico de saúde");
          const { error: historyError } = await supabase
            .from('health_histories')
            .insert([{
              ...healthHistoryData,
              patient_id: patientId
            }]);
          
          if (historyError) {
            console.error("Erro ao criar histórico de saúde:", historyError);
            throw historyError;
          }
        }
        
        // Verificar se já existe um plano de tratamento para este paciente
        const { data: existingTreatment } = await supabase
          .from('treatments')
          .select('id')
          .eq('patient_id', patientId)
          .single();
        
        if (existingTreatment) {
          // Atualizar plano existente
          console.log("Atualizando plano de tratamento existente:", existingTreatment.id);
          const { error: treatmentError } = await supabase
            .from('treatments')
            .update({
              ...treatmentData,
              patient_id: patientId
            })
            .eq('id', existingTreatment.id);
          
          if (treatmentError) {
            console.error("Erro ao atualizar plano de tratamento:", treatmentError);
            throw treatmentError;
          }
        } else if (data.plano_tratamento) {
          // Criar novo plano apenas se houver texto
          console.log("Criando novo plano de tratamento");
          const { error: treatmentError } = await supabase
            .from('treatments')
            .insert([{
              ...treatmentData,
              patient_id: patientId
            }]);
          
          if (treatmentError) {
            console.error("Erro ao criar plano de tratamento:", treatmentError);
            throw treatmentError;
          }
        }
        
        if (share) {
          // Gerar link de compartilhamento
          const shareLink = `${window.location.origin}/public/form?id=${patientId}`;
          setShareLink(shareLink);
          setShowShareDialog(true);
        } else {
          toast.success('Formulário salvo com sucesso!');
          navigate('/admin/dashboard');
        }
      }
    } catch (error: any) {
      console.error('Erro ao salvar formulário:', error);
      toast.error('Erro ao salvar formulário: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setSaving(false);
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

  return (
    <AdminLayout>
      <Helmet>
        <title>Novo Formulário - Dra. Aymée Frauzino</title>
      </Helmet>
      
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Novo Formulário Clínico</h1>
          <p className="text-gray-500">Preencha os dados do paciente e histórico de saúde</p>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => onSubmit(data, false))}>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full grid grid-cols-3 mb-8">
                  <TabsTrigger value="dados-pessoais">Dados Pessoais</TabsTrigger>
                  <TabsTrigger value="historico-saude">Histórico de Saúde</TabsTrigger>
                  <TabsTrigger value="plano-tratamento">Plano de Tratamento</TabsTrigger>
                </TabsList>
                
                {/* Aba de Dados Pessoais */}
                <TabsContent value="dados-pessoais" className="space-y-6 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="nome"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do Paciente*</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="data_nascimento"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Nascimento*</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="nome_responsavel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do Responsável*</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="cpf"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CPF do Responsável*</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="000.000.000-00"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="telefone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone de Contato*</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="(00) 00000-0000"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="endereco"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Endereço Completo*</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="observacoes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Informações adicionais relevantes..."
                            className="resize-none h-20"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end">
                    <Button 
                      type="button" 
                      onClick={validateTabAndContinue}
                    >
                      Próximo
                    </Button>
                  </div>
                </TabsContent>
                
                {/* Aba de Histórico de Saúde */}
                <TabsContent value="historico-saude" className="space-y-6 pt-4">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Informações Gerais</h3>
                    
                    <FormField
                      control={form.control}
                      name="queixa_principal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Queixa Principal*</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="Descreva o principal motivo da consulta..."
                              className="resize-none"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <RadioGroupField
                        control={form.control}
                        name="tipo_parto"
                        label="Tipo de Parto*"
                        options={[
                          { value: 'Normal', label: 'Normal' },
                          { value: 'Cesárea', label: 'Cesárea' }
                        ]}
                      />
                      
                      <RadioGroupField
                        control={form.control}
                        name="aleitamento"
                        label="Aleitamento*"
                        options={[
                          { value: 'Materno', label: 'Materno' },
                          { value: 'Fórmula', label: 'Fórmula' },
                          { value: 'Misto', label: 'Misto' }
                        ]}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="problemas_gestacao"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Problemas durante a gestação</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="Descreva se houve algum problema durante a gestação..."
                              className="resize-none"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Saúde Geral</h3>
                    
                    <FormField
                      control={form.control}
                      name="alergias"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Alergias</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="Medicamentos, alimentos ou outras alergias..."
                              className="resize-none"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="tratamento_medico"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tratamento Médico</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="Está em tratamento médico atualmente? Qual?"
                              className="resize-none"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="uso_medicamentos"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Uso de Medicamentos</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="Medicamentos utilizados regularmente..."
                              className="resize-none"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="presenca_doenca"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Presença de Doença</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="Doenças diagnosticadas..."
                              className="resize-none"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="vacinacao_dia"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md">
                            <FormControl>
                              <CheckboxField
                                control={form.control}
                                name="vacinacao_dia"
                                label="Vacinação em dia"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="peso_atual"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Peso Atual</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="Peso em kg"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-between">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setActiveTab('dados-pessoais')}
                    >
                      Voltar
                    </Button>
                    
                    <Button type="button" onClick={validateTabAndContinue}>
                      Próximo
                    </Button>
                  </div>
                </TabsContent>
                
                {/* Aba de Plano de Tratamento */}
                <TabsContent value="plano-tratamento" className="space-y-6 pt-4">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Plano de Tratamento</h3>
                    
                    <FormField
                      control={form.control}
                      name="plano_tratamento"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Plano de Tratamento Proposto</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="Descreva o plano de tratamento proposto para o paciente..."
                              className="resize-none min-h-[200px]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setActiveTab('historico-saude')}
                    >
                      Voltar
                    </Button>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button 
                        type="submit" 
                        disabled={saving}
                      >
                        {saving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Salvar como Rascunho
                          </>
                        )}
                      </Button>
                      
                      <Button 
                        type="button" 
                        onClick={() => onSubmit(form.getValues(), true)}
                        disabled={saving}
                        variant="secondary"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processando...
                          </>
                        ) : (
                          <>
                            <Share2 className="mr-2 h-4 w-4" />
                            Salvar e Compartilhar
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </form>
          </Form>
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
                "Copiar"
              )}
            </Button>
          </div>
          
          <DialogFooter className="mt-4">
            <Button 
              onClick={() => {
                setShowShareDialog(false);
                navigate('/admin/dashboard');
              }}
            >
              Ir para Dashboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default NewPatientForm;