import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltam variáveis de ambiente do Supabase. Verifique as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
};

export type Treatment = {
  id: string;
  patient_id: string;
  plano_tratamento: string;
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
};

export type Appointment = {
  id: string;
  titulo: string;
  descricao: string;
  data_hora_inicio: string;
  data_hora_fim: string;
  patient_id?: string;
};