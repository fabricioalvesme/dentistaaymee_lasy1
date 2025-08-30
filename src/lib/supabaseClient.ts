export { supabase } from './supabase';

// Verificar se há erro de inicialização
export const supabaseError = null; // Removendo verificação de erro que pode causar problemas

// Tipos para as tabelas do Supabase
export type Patient = {
  id: string;
  created_at: string;
  nome: string;
  data_nascimento: string;
  endereco: string;
  nome_responsavel: string;
  cpf: string;
  telefone: string;
  observacoes: string;
  status: 'rascunho' | 'enviado' | 'assinado';
  assinatura_base64: string | null;
  assinatura_timestamp: string | null;
  assinatura_dentista: string | null;
};

export type HealthHistory = {
  id: string;
  patient_id: string;
  queixa_principal: string;
  tipo_parto: 'Natural' | 'Cesárea';
  aleitamento: 'Materno' | 'Fórmula';
  problemas_gestacao: string;
  alergias: string;
  tratamento_medico: string;
  uso_medicamentos: string;
  presenca_doenca: string;
  idade_primeiro_dente: string;
  anestesia_odontologica: boolean;
  frequencia_escovacao: string;
  creme_dental: string;
  contem_fluor: boolean;
  uso_fio_dental: boolean;
  quem_realiza_escovacao: string;
  uso_mamadeira: boolean;
  refeicoes_diarias: string;
  fonte_acucar: string;
  habito_succao: boolean;
  roer_unhas: boolean;
  dormir_boca_aberta: boolean;
  vacinacao_dia: boolean;
  problemas_cardiacos: string;
  problemas_renais: string;
  problemas_gastricos: string;
  problemas_respiratorios: string;
  alteracao_coagulacao: string;
  internacoes_recentes: string;
  peso_atual: string;
  alergia_medicamentos: boolean;
  desc_alergia_medicamentos: string;
  alergia_alimentar: boolean;
  desc_alergia_alimentar: string;
  doenca_cardiaca: boolean;
  desc_doenca_cardiaca: string;
  diabetes: boolean;
  desc_diabetes: string;
  disturbios_neurologicos: boolean;
  desc_disturbios_neurologicos: string;
  epilepsia_convulsoes: boolean;
  desc_epilepsia_convulsoes: string;
  hipertensao: boolean;
  desc_hipertensao: string;
  asma: boolean;
  desc_asma: string;
  doenca_renal: boolean;
  desc_doenca_renal: string;
  sindromes_geneticas: boolean;
  desc_sindromes_geneticas: string;
  doenca_autoimune: boolean;
  desc_doenca_autoimune: string;
  disturbios_coagulacao: boolean;
  desc_disturbios_coagulacao: string;
  uso_atual_medicamentos: boolean;
  desc_uso_atual_medicamentos: string;
  medicamentos_continuos: boolean;
  desc_medicamentos_continuos: string;
  uso_recente_antibioticos: boolean;
  desc_uso_recente_antibioticos: string;
  suplementos_nutricionais: boolean;
  desc_suplementos_nutricionais: string;
  tratamento_odontologico_anterior: boolean;
  desc_tratamento_odontologico_anterior: string;
  reacao_negativa_odontologica: boolean;
  desc_reacao_negativa_odontologica: string;
  necessidade_sedacao_especial: boolean;
  desc_necessidade_sedacao_especial: string;
  trauma_dental: boolean;
  desc_trauma_dental: string;
  ansiedade_consultas: boolean;
  desc_ansiedade_consultas: string;
  dificuldade_colaboracao: boolean;
  desc_dificuldade_colaboracao: string;
  historico_internacoes: boolean;
  desc_historico_internacoes: string;
  necessidades_especiais: boolean;
  desc_necessidades_especiais: string;
  nascimento_prematuro: boolean;
  desc_nascimento_prematuro: string;
  parto_complicacoes: boolean;
  desc_parto_complicacoes: string;
  uso_chupeta: boolean;
  desc_uso_chupeta: string;
  habitos_succao_bruxismo: boolean;
  desc_habitos_succao_bruxismo: string;
  amamentacao_prolongada: boolean;
  desc_amamentacao_prolongada: string;
  alimentacao_especial: boolean;
  desc_alimentacao_especial: string;
  realizou_cirurgia: boolean;
  desc_realizou_cirurgia: string;
  foi_internado: boolean;
  desc_foi_internado: string;
  transfusao_sangue: boolean;
  desc_transfusao_sangue: string;
  doencas_hereditarias: boolean;
  desc_doencas_hereditarias: string;
  historico_alergias_familia: boolean;
  desc_historico_alergias_familia: string;
  problemas_dentarios_familia: boolean;
  desc_problemas_dentarios_familia: string;
};

export type Treatment = {
  id: string;
  patient_id: string;
  plano_tratamento: string;
};

export type TreatmentRecord = {
  id: string;
  patient_id: string;
  data_realizacao: string;
  descricao_procedimento: string;
  created_at: string;
  updated_at: string;
};

export type TreatmentHistory = {
  id: string;
  patient_id: string;
  data: string;
  descricao: string;
  assinatura_paciente: string | null;
  assinatura_dentista: string | null;
};

export type Settings = {
  id: string;
  meta_title: string;
  meta_description: string;
  about_text: string;
  services_text: string;
  convenios_text: string;
  logo_url: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  updated_at: string;
};

export type Appointment = {
  id: string;
  titulo: string;
  descricao: string;
  data_hora_inicio: string;
  data_hora_fim: string;
  patient_id?: string;
  cor?: string; // Nova propriedade para cor do evento
};