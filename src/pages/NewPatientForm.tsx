import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroupField } from '@/components/forms/RadioGroupField';
import { CheckboxField } from '@/components/forms/CheckboxField';
import { YesNoField } from '@/components/forms/YesNoField';
import { SignaturePad } from '@/components/forms/SignaturePad';
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Loader2, Save } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';

// Validação do formulário
const patientFormSchema = z.object({
  // Dados Pessoais
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').trim(),
  data_nascimento: z.string().min(1, 'Data de nascimento é obrigatória'),
  endereco: z.string().min(5, 'Endereço deve ter pelo menos 5 caracteres'),
  nome_responsavel: z.string().min(3, 'Nome do responsável deve ter pelo menos 3 caracteres').trim(),
  cpf: z.string().min(11, 'CPF inválido').max(14, 'CPF inválido'),
  telefone: z.string().min(10, 'Telefone inválido').trim(),
  observacoes: z.string().optional(),
  
  // Termo de Atendimento
  local: z.string().default('Morrinhos-GO'),
  data_termo: z.string().min(1, 'Data é obrigatória'),
  termo_aceite: z.boolean().refine(val => val === true, {
    message: 'Você precisa aceitar o termo para continuar',
  }),
  assinatura_responsavel: z.string().min(1, 'Assinatura é obrigatória'),
  
  // Histórico de Saúde
  queixa_principal: z.string().min(1, 'Queixa principal é obrigatória'),
  tipo_parto: z.enum(['Natural', 'Cesárea']),
  aleitamento: z.enum(['Materno', 'Fórmula']),
  
  problemas_gestacao: z.string(),
  problemas_gestacao_detalhes: z.string().optional(),
  
  alergias: z.string(),
  alergias_detalhes: z.string().optional(),
  
  tratamento_medico: z.string(),
  tratamento_medico_detalhes: z.string().optional(),
  
  uso_medicamentos: z.string(),
  uso_medicamentos_detalhes: z.string().optional(),
  
  presenca_doenca: z.string(),
  presenca_doenca_detalhes: z.string().optional(),
  
  idade_primeiro_dente: z.string(),
  anestesia_odontologica: z.boolean().default(false),
  frequencia_escovacao: z.string(),
  creme_dental: z.string(),
  contem_fluor: z.boolean().default(true),
  uso_fio_dental: z.boolean().default(false),
  quem_realiza_escovacao: z.string(),
  uso_mamadeira: z.boolean().default(false),
  refeicoes_diarias: z.string(),
  fonte_acucar: z.string(),
  habito_succao: z.boolean().default(false),
  roer_unhas: z.boolean().default(false),
  dormir_boca_aberta: z.boolean().default(false),
  vacinacao_dia: z.boolean().default(true),
  
  problemas_cardiacos: z.string(),
  problemas_cardiacos_detalhes: z.string().optional(),
  
  problemas_renais: z.string(),
  problemas_renais_detalhes: z.string().optional(),
  
  problemas_gastricos: z.string(),
  problemas_gastricos_detalhes: z.string().optional(),
  
  problemas_respiratorios: z.string(),
  problemas_respiratorios_detalhes: z.string().optional(),
  
  alteracao_coagulacao: z.string(),
  alteracao_coagulacao_detalhes: z.string().optional(),
  
  internacoes_recentes: z.string(),
  internacoes_recentes_detalhes: z.string().optional(),
  
  peso_atual: z.string(),
  
  // Plano de Tratamento
  plano_tratamento: z.string().optional(),
  
  // Assinatura
  assinatura_dentista: z.string().optional(),
});

type PatientFormValues = z.infer<typeof patientFormSchema>;

const NewPatientForm = () => {
  const [activeTab, setActiveTab] = useState('dados-pessoais');
  const [saving, setSaving] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [newPatientId, setNewPatientId] = useState<string | null>(null);
  const navigate = useNavigate();

  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: {
      nome: '',
      data_nascimento: '',
      endereco: '',
      nome_responsavel: '',
      cpf: '',
      telefone: '',
      observacoes: '',
      
      local: 'Morrinhos-GO',
      data_termo: new Date().toISOString().split('T')[0],
      termo_aceite: false,
      assinatura_responsavel: '',
      
      queixa_principal: '',
      tipo_parto: 'Natural',
      aleitamento: 'Materno',
      
      problemas_gestacao: 'nao',
      alergias: 'nao',
      tratamento_medico: 'nao',
      uso_medicamentos: 'nao',
      presenca_doenca: 'nao',
      
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
      
      problemas_cardiacos: 'nao',
      problemas_renais: 'nao',
      problemas_gastricos: 'nao',
      problemas_respiratorios: 'nao',
      alteracao_coagulacao: 'nao',
      internacoes_recentes: 'nao',
      
      peso_atual: '',
      plano_tratamento: '',
    }
  });

  // Enviar formulário
  const onSubmit = async (data: PatientFormValues, asDraft: boolean = false) => {
    try {
      setSaving(true);
      console.log("Iniciando salvamento do formulário:", data);
      
      // Preparar dados para o Supabase
      const patientData = {
        nome: data.nome,
        data_nascimento: data.data_nascimento,
        endereco: data.endereco,
        nome_responsavel: data.nome_responsavel,
        cpf: data.cpf,
        telefone: data.telefone,
        observacoes: data.observacoes || '',
        status: asDraft ? 'rascunho' : 'enviado',
        assinatura_base64: data.assinatura_responsavel || null,
        assinatura_timestamp: new Date().toISOString(),
        assinatura_dentista: data.assinatura_dentista || null,
      };
      
      console.log("Dados do paciente preparados:", patientData);
      
      // Inserir paciente
      const { data: patientResult, error: patientError } = await supabase
        .from('patients')
        .insert([patientData])
        .select('id')
        .single();
      
      if (patientError) {
        console.error("Erro ao inserir paciente:", patientError);
        throw patientError;
      }
      
      console.log("Paciente inserido com sucesso:", patientResult);
      const patientId = patientResult.id;
      
      // Histórico de saúde
      const healthData = {
        patient_id: patientId,
        queixa_principal: data.queixa_principal,
        tipo_parto: data.tipo_parto,
        aleitamento: data.aleitamento,
        problemas_gestacao: data.problemas_gestacao === 'sim' 
          ? data.problemas_gestacao_detalhes || 'Sim' 
          : 'Não',
        alergias: data.alergias === 'sim' 
          ? data.alergias_detalhes || 'Sim' 
          : 'Não',
        tratamento_medico: data.tratamento_medico === 'sim' 
          ? data.tratamento_medico_detalhes || 'Sim' 
          : 'Não',
        uso_medicamentos: data.uso_medicamentos === 'sim' 
          ? data.uso_medicamentos_detalhes || 'Sim' 
          : 'Não',
        presenca_doenca: data.presenca_doenca === 'sim' 
          ? data.presenca_doenca_detalhes || 'Sim' 
          : 'Não',
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
        problemas_cardiacos: data.problemas_cardiacos === 'sim' 
          ? data.problemas_cardiacos_detalhes || 'Sim' 
          : 'Não',
        problemas_renais: data.problemas_renais === 'sim' 
          ? data.problemas_renais_detalhes || 'Sim' 
          : 'Não',
        problemas_gastricos: data.problemas_gastricos === 'sim' 
          ? data.problemas_gastricos_detalhes || 'Sim' 
          : 'Não',
        problemas_respiratorios: data.problemas_respiratorios === 'sim' 
          ? data.problemas_respiratorios_detalhes || 'Sim' 
          : 'Não',
        alteracao_coagulacao: data.alteracao_coagulacao === 'sim' 
          ? data.alteracao_coagulacao_detalhes || 'Sim' 
          : 'Não',
        internacoes_recentes: data.internacoes_recentes === 'sim' 
          ? data.internacoes_recentes_detalhes || 'Sim' 
          : 'Não',
        peso_atual: data.peso_atual,
      };
      
      console.log("Dados de histórico de saúde preparados");
      
      const { error: healthError } = await supabase
        .from('health_histories')
        .insert([healthData]);
      
      if (healthError) {
        console.error("Erro ao inserir histórico de saúde:", healthError);
        throw healthError;
      }
      
      console.log("Histórico de saúde inserido com sucesso");
      
      // Plano de tratamento
      if (data.plano_tratamento) {
        console.log("Preparando para inserir plano de tratamento");
        const { error: treatmentError } = await supabase
          .from('treatments')
          .insert([{
            patient_id: patientId,
            plano_tratamento: data.plano_tratamento
          }]);
        
        if (treatmentError) {
          console.error("Erro ao inserir plano de tratamento:", treatmentError);
          throw treatmentError;
        }
        
        console.log("Plano de tratamento inserido com sucesso");
      }
      
      // Termo de atendimento
      console.log("Preparando para inserir termo de consentimento");
      const { error: consentError } = await supabase
        .from('consent_forms')
        .insert([{
          patient_id: patientId,
          local: data.local,
          data: data.data_termo
        }]);
      
      if (consentError) {
        console.error("Erro ao inserir termo de consentimento:", consentError);
        throw consentError;
      }
      
      console.log("Termo de consentimento inserido com sucesso");
      
      if (asDraft) {
        toast.success('Rascunho salvo com sucesso!');
        navigate('/admin/dashboard');
      } else {
        setNewPatientId(patientId);
        setShowSuccessDialog(true);
      }
    } catch (error) {
      console.error('Erro ao salvar formulário:', error);
      toast.error('Erro ao salvar formulário. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  // Função para navegar entre abas
  const goToNextTab = () => {
    if (activeTab === 'dados-pessoais') {
      setActiveTab('termo-atendimento');
    } else if (activeTab === 'termo-atendimento') {
      setActiveTab('historico-saude');
    } else if (activeTab === 'historico-saude') {
      setActiveTab('plano-tratamento');
    }
  };

  // Função para validar campos da aba atual antes de avançar
  const validateTabAndContinue = async () => {
    let fieldsToValidate: string[] = [];
    
    if (activeTab === 'dados-pessoais') {
      fieldsToValidate = ['nome', 'data_nascimento', 'endereco', 'nome_responsavel', 'cpf', 'telefone'];
    } else if (activeTab === 'termo-atendimento') {
      fieldsToValidate = ['local', 'data_termo', 'termo_aceite', 'assinatura_responsavel'];
    } else if (activeTab === 'historico-saude') {
      fieldsToValidate = [
        'queixa_principal', 'tipo_parto', 'aleitamento', 
        'idade_primeiro_dente', 'frequencia_escovacao', 
        'creme_dental', 'quem_realiza_escovacao', 
        'refeicoes_diarias', 'fonte_acucar', 'peso_atual'
      ];
    }
    
    const result = await form.trigger(fieldsToValidate as any);
    
    if (result) {
      goToNextTab();
    }
  };

  // Função para copiar texto para área de transferência com fallback
  const copyToClipboard = (text: string) => {
    try {
      // Método 1: Usar a Clipboard API moderna
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text)
          .then(() => {
            toast.success('Link copiado para a área de transferência');
          })
          .catch(err => {
            console.error("Erro ao usar navigator.clipboard:", err);
            // Se falhar, vai para o método de fallback
            copyToClipboardFallback(text);
          });
      } else {
        // Se a API não estiver disponível, usa o método de fallback
        copyToClipboardFallback(text);
      }
    } catch (err) {
      console.error("Erro ao copiar texto:", err);
      // Tenta o método de fallback em caso de erro
      copyToClipboardFallback(text);
    }
  };

  // Método alternativo para copiar texto usando seleção
  const copyToClipboardFallback = (text: string) => {
    try {
      // Cria um elemento temporário
      const textArea = document.createElement('textarea');
      textArea.value = text;
      
      // Configura o elemento para não ser visível
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      
      // Seleciona e copia o texto
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        toast.success('Link copiado para a área de transferência');
      } else {
        toast.error('Não foi possível copiar o link automaticamente. Por favor, copie-o manualmente.');
      }
    } catch (err) {
      console.error("Erro no método fallback:", err);
      toast.error('Não foi possível copiar o link. Por favor, copie-o manualmente.');
    }
  };

  const termoAtendimentoText = `
    <p class="mb-4">Declaro que a Dra. Aymée Ávila Frauzino me explicou os propósitos, riscos, custos e alternativas do tratamento odontológico proposto. Estou ciente de que o sucesso depende da resposta biológica do organismo e das técnicas empregadas. Comprometo-me a seguir as orientações e arcar com os custos estipulados.</p>
    
    <p class="mb-4">Declaro ter sido informado(a) sobre:</p>
    
    <ul class="list-disc pl-5 mb-4 space-y-2">
      <li>O diagnóstico do meu filho(a) e o plano de tratamento proposto;</li>
      <li>Os procedimentos a serem realizados e suas finalidades;</li>
      <li>Os riscos e limitações inerentes ao tratamento odontológico;</li>
      <li>Possíveis complicações decorrentes do não tratamento;</li>
      <li>A necessidade de cooperação do paciente durante e após o tratamento;</li>
      <li>A importância de retornos periódicos para manutenção dos resultados;</li>
      <li>Os custos aproximados dos procedimentos a serem realizados.</li>
    </ul>
    
    <p class="mb-4">Estou ciente que a odontologia não é uma ciência exata e que os resultados esperados, embora previsíveis, não podem ser garantidos, pois dependem de fatores como resposta biológica individual, cooperação durante o tratamento e cuidados posteriores.</p>
    
    <p class="mb-4">Concordo com o orçamento apresentado e com a forma de pagamento estabelecida.</p>
    
    <p class="mb-4">Este consentimento pode ser revogado a qualquer momento, por escrito, antes da realização dos procedimentos.</p>
  `;

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
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => onSubmit(data, false))}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-4">
                <TabsTrigger value="dados-pessoais">Dados Pessoais</TabsTrigger>
                <TabsTrigger value="termo-atendimento">Termo de Atendimento</TabsTrigger>
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
                            onChange={(e) => {
                              // Formatar CPF
                              let value = e.target.value.replace(/\D/g, '');
                              if (value.length <= 11) {
                                value = value.replace(/(\d{3})(\d)/, '$1.$2');
                                value = value.replace(/(\d{3})(\d)/, '$1.$2');
                                value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
                              }
                              field.onChange(value);
                            }}
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
                        <FormLabel>Telefone Celular*</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="(00) 00000-0000"
                            onChange={(e) => {
                              // Formatar telefone
                              let value = e.target.value.replace(/\D/g, '');
                              if (value.length <= 11) {
                                value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
                                value = value.replace(/(\d)(\d{4})$/, '$1-$2');
                              }
                              field.onChange(value);
                            }}
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
                          placeholder="Informações adicionais relevantes..." 
                          className="resize-none h-20"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end">
                  <Button type="button" onClick={validateTabAndContinue}>
                    Próximo
                  </Button>
                </div>
              </TabsContent>
              
              {/* Aba de Termo de Atendimento */}
              <TabsContent value="termo-atendimento" className="space-y-6 pt-4">
                <div className="bg-gray-50 p-4 rounded-md border">
                  <h3 className="text-lg font-medium mb-4">Termo de Consentimento para Tratamento Odontológico</h3>
                  
                  <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: termoAtendimentoText }} />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="local"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Local*</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="data_termo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data*</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="termo_aceite"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-4 border">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Li e concordo com o termo de atendimento*
                        </FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="assinatura_responsavel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assinatura do Responsável*</FormLabel>
                      <FormControl>
                        <SignaturePad onChange={field.onChange} initialValue={field.value} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
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
              
              {/* Aba de Histórico de Saúde */}
              <TabsContent value="historico-saude" className="space-y-6 pt-4">
                <div>
                  <h3 className="text-lg font-medium mb-4">Informações Gerais</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="queixa_principal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Queixa Principal*</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Descreva o motivo principal da consulta..." 
                              className="resize-none"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="space-y-4">
                      <RadioGroupField
                        control={form.control}
                        name="tipo_parto"
                        label="Tipo de Parto*"
                        options={[
                          { value: 'Natural', label: 'Natural' },
                          { value: 'Cesárea', label: 'Cesárea' }
                        ]}
                      />
                      
                      <RadioGroupField
                        control={form.control}
                        name="aleitamento"
                        label="Aleitamento*"
                        options={[
                          { value: 'Materno', label: 'Materno' },
                          { value: 'Fórmula', label: 'Fórmula' }
                        ]}
                      />
                    </div>
                  </div>
                  
                  <div className="mt-6 space-y-6">
                    <YesNoField
                      control={form.control}
                      name="problemas_gestacao"
                      detailName="problemas_gestacao_detalhes"
                      label="Problemas durante a gestação?"
                    />
                    
                    <YesNoField
                      control={form.control}
                      name="alergias"
                      detailName="alergias_detalhes"
                      label="Possui alergias?"
                    />
                    
                    <YesNoField
                      control={form.control}
                      name="tratamento_medico"
                      detailName="tratamento_medico_detalhes"
                      label="Está em tratamento médico?"
                    />
                    
                    <YesNoField
                      control={form.control}
                      name="uso_medicamentos"
                      detailName="uso_medicamentos_detalhes"
                      label="Faz uso de medicamentos?"
                    />
                    
                    <YesNoField
                      control={form.control}
                      name="presenca_doenca"
                      detailName="presenca_doenca_detalhes"
                      label="Presença de alguma doença?"
                    />
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-4">Informações Odontológicas</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="idade_primeiro_dente"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Idade do primeiro dente*</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="space-y-4">
                      <CheckboxField
                        control={form.control}
                        name="anestesia_odontologica"
                        label="Já recebeu anestesia odontológica?"
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="frequencia_escovacao"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Frequência de escovação diária*</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="creme_dental"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Creme dental utilizado*</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="space-y-4">
                      <CheckboxField
                        control={form.control}
                        name="contem_fluor"
                        label="Contém flúor?"
                      />
                      
                      <CheckboxField
                        control={form.control}
                        name="uso_fio_dental"
                        label="Usa fio dental?"
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="quem_realiza_escovacao"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quem realiza a escovação da criança?*</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <CheckboxField
                        control={form.control}
                        name="uso_mamadeira"
                        label="Usa mamadeira?"
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="refeicoes_diarias"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número de refeições diárias*</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="fonte_acucar"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Principal fonte de açúcar*</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="space-y-4">
                      <CheckboxField
                        control={form.control}
                        name="habito_succao"
                        label="Hábito de sucção (chupeta)?"
                      />
                      
                      <CheckboxField
                        control={form.control}
                        name="roer_unhas"
                        label="Roe unhas?"
                      />
                      
                      <CheckboxField
                        control={form.control}
                        name="dormir_boca_aberta"
                        label="Dorme com a boca aberta?"
                      />
                      
                      <CheckboxField
                        control={form.control}
                        name="vacinacao_dia"
                        label="Vacinação em dia?"
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-4">Problemas de Saúde</h3>
                  
                  <div className="space-y-6">
                    <YesNoField
                      control={form.control}
                      name="problemas_cardiacos"
                      detailName="problemas_cardiacos_detalhes"
                      label="Problemas cardíacos?"
                    />
                    
                    <YesNoField
                      control={form.control}
                      name="problemas_renais"
                      detailName="problemas_renais_detalhes"
                      label="Problemas renais?"
                    />
                    
                    <YesNoField
                      control={form.control}
                      name="problemas_gastricos"
                      detailName="problemas_gastricos_detalhes"
                      label="Problemas gástricos?"
                    />
                    
                    <YesNoField
                      control={form.control}
                      name="problemas_respiratorios"
                      detailName="problemas_respiratorios_detalhes"
                      label="Problemas respiratórios?"
                    />
                    
                    <YesNoField
                      control={form.control}
                      name="alteracao_coagulacao"
                      detailName="alteracao_coagulacao_detalhes"
                      label="Alteração de coagulação?"
                    />
                    
                    <YesNoField
                      control={form.control}
                      name="internacoes_recentes"
                      detailName="internacoes_recentes_detalhes"
                      label="Internações recentes?"
                    />
                    
                    <FormField
                      control={form.control}
                      name="peso_atual"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Peso atual*</FormLabel>
                          <FormControl>
                            <Input {...field} />
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
                    onClick={() => setActiveTab('termo-atendimento')}
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
                <FormField
                  control={form.control}
                  name="plano_tratamento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plano de Tratamento & Orçamento</FormLabel>
                      <FormDescription>
                        Descreva o diagnóstico, procedimentos, custos e observações relevantes
                      </FormDescription>
                      <FormControl>
                        <Textarea 
                          placeholder="Descreva o plano de tratamento proposto..." 
                          className="resize-none min-h-40"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="assinatura_dentista"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assinatura do Dentista</FormLabel>
                      <FormControl>
                        <SignaturePad onChange={field.onChange} initialValue={field.value} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setActiveTab('historico-saude')}
                  >
                    Voltar
                  </Button>
                  
                  <div className="space-x-2">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => onSubmit(form.getValues(), true)}
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
                          Salvar Rascunho
                        </>
                      )}
                    </Button>
                    
                    <Button type="submit" disabled={saving}>
                      {saving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        'Salvar e Enviar'
                      )}
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </form>
        </Form>
      </div>
      
      {/* Diálogo de sucesso */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Formulário Enviado com Sucesso!</DialogTitle>
            <DialogDescription>
              O formulário foi salvo e está pronto para compartilhar com o paciente para assinatura.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex items-center space-x-2 mt-4">
            <Input 
              value={`${window.location.origin}/public/form?id=${newPatientId}`}
              readOnly 
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <Button 
              onClick={() => {
                const linkText = `${window.location.origin}/public/form?id=${newPatientId}`;
                copyToClipboard(linkText);
              }} 
              variant="secondary"
            >
              Copiar
            </Button>
          </div>
          
          <DialogFooter className="mt-4">
            <Button onClick={() => {
              setShowSuccessDialog(false);
              navigate('/admin/dashboard');
            }}>
              Ir para Dashboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default NewPatientForm;