import React from 'react';
import { 
  Document, 
  Page, 
  Text, 
  View, 
  StyleSheet, 
  Image,
  PDFViewer
} from '@react-pdf/renderer';
import { Patient, HealthHistory, Treatment } from '@/lib/supabaseClient';

// Estilos para o PDF
const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#3B82F6',
    borderBottomStyle: 'solid',
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#3B82F6',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    backgroundColor: '#F3F8FF',
    padding: 5,
  },
  fieldRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  fieldLabel: {
    fontWeight: 'bold',
    fontSize: 10,
    width: '30%',
  },
  fieldValue: {
    fontSize: 10,
    width: '70%',
  },
  fullWidthField: {
    marginBottom: 8,
  },
  fullWidthLabel: {
    fontWeight: 'bold',
    fontSize: 10,
    marginBottom: 2,
  },
  fullWidthValue: {
    fontSize: 10,
    marginBottom: 6,
  },
  signatureSection: {
    marginTop: 30,
  },
  signatureImage: {
    height: 100,
    marginBottom: 5,
  },
  signatureDate: {
    fontSize: 9,
    color: '#6B7280',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    borderTopStyle: 'solid',
    paddingTop: 10,
  },
  footerText: {
    fontSize: 8,
    color: '#9CA3AF',
  },
  logoImage: {
    width: 150,
    height: 50,
    objectFit: 'contain',
    alignSelf: 'center',
    marginBottom: 10,
  },
  consentSection: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 4,
  },
  consentText: {
    fontSize: 9,
    color: '#4B5563',
    lineHeight: 1.5,
  },
  pageNumber: {
    position: 'absolute',
    bottom: 15,
    right: 30,
    fontSize: 8,
    color: '#9CA3AF',
  },
  booleanValue: {
    fontSize: 10,
  },
});

// Função para formatar data
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

// Função para formatar valor booleano
function formatBoolean(value: boolean | undefined): string {
  if (value === undefined) return 'Não informado';
  return value ? 'Sim' : 'Não';
}

// Componente para exibir um campo com label e valor
const Field = ({ label, value }: { label: string, value: string | null | undefined }) => (
  <View style={styles.fieldRow}>
    <Text style={styles.fieldLabel}>{label}:</Text>
    <Text style={styles.fieldValue}>{value || 'Não informado'}</Text>
  </View>
);

// Componente para exibir um campo booleano
const BooleanField = ({ label, value }: { label: string, value: boolean | undefined }) => (
  <View style={styles.fieldRow}>
    <Text style={styles.fieldLabel}>{label}:</Text>
    <Text style={[styles.fieldValue, styles.booleanValue]}>
      {formatBoolean(value)}
    </Text>
  </View>
);

// Componente para exibir um campo de texto completo
const FullWidthField = ({ label, value }: { label: string, value: string | null | undefined }) => (
  <View style={styles.fullWidthField}>
    <Text style={styles.fullWidthLabel}>{label}:</Text>
    <Text style={styles.fullWidthValue}>{value || 'Não informado'}</Text>
  </View>
);

interface PatientFormPDFProps {
  patient: Patient;
  healthHistory?: HealthHistory | null;
  treatment?: Treatment | null;
  logoUrl?: string;
}

// Componente principal do PDF
export const PatientFormPDF: React.FC<PatientFormPDFProps> = ({ 
  patient, 
  healthHistory, 
  treatment,
  logoUrl
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        {logoUrl && <Image src={logoUrl} style={styles.logoImage} />}
        <Text style={styles.headerTitle}>Formulário de Atendimento Odontológico</Text>
        <Text style={styles.headerSubtitle}>Dra. Aymée Frauzino - Odontopediatra</Text>
      </View>

      {/* Dados do Paciente */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dados do Paciente</Text>
        <Field label="Nome" value={patient.nome} />
        <Field label="Data de Nascimento" value={formatDate(patient.data_nascimento)} />
        <Field label="Responsável" value={patient.nome_responsavel} />
        <Field label="CPF" value={patient.cpf} />
        <Field label="Telefone" value={patient.telefone} />
        <FullWidthField label="Endereço" value={patient.endereco} />
        {patient.observacoes && (
          <FullWidthField label="Observações" value={patient.observacoes} />
        )}
      </View>

      {/* Histórico de Saúde */}
      {healthHistory && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Histórico de Saúde</Text>
          
          <View style={{ marginBottom: 10 }}>
            <Text style={styles.fullWidthLabel}>Queixa Principal:</Text>
            <Text style={styles.fullWidthValue}>{healthHistory.queixa_principal}</Text>
          </View>
          
          <Field label="Tipo de Parto" value={healthHistory.tipo_parto} />
          <Field label="Aleitamento" value={healthHistory.aleitamento} />
          
          {healthHistory.problemas_gestacao && (
            <FullWidthField label="Problemas na Gestação" value={healthHistory.problemas_gestacao} />
          )}
          
          {healthHistory.alergias && (
            <FullWidthField label="Alergias" value={healthHistory.alergias} />
          )}
          
          {healthHistory.tratamento_medico && (
            <FullWidthField label="Tratamento Médico" value={healthHistory.tratamento_medico} />
          )}
          
          {healthHistory.uso_medicamentos && (
            <FullWidthField label="Uso de Medicamentos" value={healthHistory.uso_medicamentos} />
          )}
          
          <BooleanField label="Vacinação em Dia" value={healthHistory.vacinacao_dia} />
          <BooleanField label="Anestesia Odontológica" value={healthHistory.anestesia_odontologica} />
          <BooleanField label="Uso de Fio Dental" value={healthHistory.uso_fio_dental} />
          <BooleanField label="Hábito de Sucção" value={healthHistory.habito_succao} />
          <BooleanField label="Roer Unhas" value={healthHistory.roer_unhas} />
          <BooleanField label="Dorme de Boca Aberta" value={healthHistory.dormir_boca_aberta} />
        </View>
      )}

      {/* Plano de Tratamento */}
      {treatment && treatment.plano_tratamento && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Plano de Tratamento</Text>
          <Text style={styles.fullWidthValue}>{treatment.plano_tratamento}</Text>
        </View>
      )}

      {/* Termo de Consentimento */}
      <View style={styles.consentSection}>
        <Text style={[styles.fullWidthLabel, { marginBottom: 5 }]}>Termo de Consentimento:</Text>
        <Text style={styles.consentText}>
          Declaro que a Dra. Aymée Ávila Frauzino me explicou os propósitos, riscos, custos e alternativas do tratamento odontológico proposto. 
          Estou ciente de que o sucesso depende da resposta biológica do organismo e das técnicas empregadas. 
          Comprometo-me a seguir as orientações e arcar com os custos estipulados.
        </Text>
      </View>

      {/* Assinatura */}
      {patient.assinatura_base64 && (
        <View style={styles.signatureSection}>
          <Text style={styles.fullWidthLabel}>Assinatura do Responsável:</Text>
          <Image src={patient.assinatura_base64} style={styles.signatureImage} />
          {patient.assinatura_timestamp && (
            <Text style={styles.signatureDate}>
              Data da assinatura: {formatDate(patient.assinatura_timestamp)}
            </Text>
          )}
        </View>
      )}

      {/* Rodapé */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Este documento é parte integrante do prontuário odontológico do paciente.
        </Text>
      </View>
      
      <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
        `${pageNumber} / ${totalPages}`
      )} />
    </Page>
  </Document>
);

interface PDFViewerComponentProps {
  patient: Patient;
  healthHistory?: HealthHistory | null;
  treatment?: Treatment | null;
  logoUrl?: string;
}

// Componente de visualização do PDF
export const PatientFormPDFViewer: React.FC<PDFViewerComponentProps> = ({ 
  patient,
  healthHistory,
  treatment,
  logoUrl
}) => {
  return (
    <PDFViewer style={{ width: '100%', height: '70vh' }}>
      <PatientFormPDF 
        patient={patient}
        healthHistory={healthHistory}
        treatment={treatment}
        logoUrl={logoUrl}
      />
    </PDFViewer>
  );
};