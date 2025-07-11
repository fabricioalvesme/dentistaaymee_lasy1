import { Control } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { RadioGroupField } from '@/components/forms/RadioGroupField';
import { YesNoField } from '@/components/forms/YesNoField';

interface HealthHistoryFormProps {
  control: Control<any>;
}

export function HealthHistoryForm({ control }: HealthHistoryFormProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Informações Gerais</h3>
        
        <FormField
          control={control}
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
            control={control}
            name="tipo_parto"
            label="Tipo de Parto*"
            options={[
              { value: 'Normal', label: 'Normal' },
              { value: 'Cesárea', label: 'Cesárea' }
            ]}
          />
          
          <RadioGroupField
            control={control}
            name="aleitamento"
            label="Aleitamento*"
            options={[
              { value: 'Materno', label: 'Materno' },
              { value: 'Fórmula', label: 'Fórmula' },
              { value: 'Misto', label: 'Misto' }
            ]}
          />
        </div>
      </div>
      
      <Separator />
      
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Condições Médicas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <YesNoField control={control} name="alergia_medicamentos" detailName="desc_alergia_medicamentos" label="Alergia a medicamentos" />
          <YesNoField control={control} name="alergia_alimentar" detailName="desc_alergia_alimentar" label="Alergia alimentar" />
          <YesNoField control={control} name="doenca_cardiaca" detailName="desc_doenca_cardiaca" label="Doença cardíaca" />
          <YesNoField control={control} name="diabetes" detailName="desc_diabetes" label="Diabetes" />
          <YesNoField control={control} name="disturbios_neurologicos" detailName="desc_disturbios_neurologicos" label="Distúrbios neurológicos" />
          <YesNoField control={control} name="epilepsia_convulsoes" detailName="desc_epilepsia_convulsoes" label="Epilepsia ou convulsões" />
          <YesNoField control={control} name="hipertensao" detailName="desc_hipertensao" label="Hipertensão" />
          <YesNoField control={control} name="asma" detailName="desc_asma" label="Asma" />
          <YesNoField control={control} name="doenca_renal" detailName="desc_doenca_renal" label="Doença renal" />
          <YesNoField control={control} name="sindromes_geneticas" detailName="desc_sindromes_geneticas" label="Síndromes genéticas" />
          <YesNoField control={control} name="doenca_autoimune" detailName="desc_doenca_autoimune" label="Doença autoimune" />
          <YesNoField control={control} name="disturbios_coagulacao" detailName="desc_disturbios_coagulacao" label="Distúrbios de coagulação" />
        </div>
      </div>
      
      <Separator />
      
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Medicamentos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <YesNoField control={control} name="uso_atual_medicamentos" detailName="desc_uso_atual_medicamentos" label="Uso atual de medicamentos" />
          <YesNoField control={control} name="medicamentos_continuos" detailName="desc_medicamentos_continuos" label="Medicamentos contínuos" />
          <YesNoField control={control} name="uso_recente_antibioticos" detailName="desc_uso_recente_antibioticos" label="Uso recente de antibióticos" />
          <YesNoField control={control} name="suplementos_nutricionais" detailName="desc_suplementos_nutricionais" label="Suplementos nutricionais" />
        </div>
      </div>
      
      <Separator />
      
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Histórico Odontológico</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <YesNoField control={control} name="tratamento_odontologico_anterior" detailName="desc_tratamento_odontologico_anterior" label="Já fez tratamento odontológico?" />
          <YesNoField control={control} name="reacao_negativa_odontologica" detailName="desc_reacao_negativa_odontologica" label="Já teve reação negativa em atendimento odontológico?" />
          <YesNoField control={control} name="necessidade_sedacao_especial" detailName="desc_necessidade_sedacao_especial" label="Já precisou de sedação ou anestesia especial?" />
          <YesNoField control={control} name="trauma_dental" detailName="desc_trauma_dental" label="Já sofreu trauma dental (quedas, batidas, fraturas)?" />
        </div>
      </div>
      
      <Separator />
      
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Comportamento e Atendimento</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <YesNoField control={control} name="ansiedade_consultas" detailName="desc_ansiedade_consultas" label="Ansiedade em consultas médicas ou odontológicas" />
          <YesNoField control={control} name="dificuldade_colaboracao" detailName="desc_dificuldade_colaboracao" label="Dificuldade de colaboração durante atendimento" />
          <YesNoField control={control} name="historico_internacoes" detailName="desc_historico_internacoes" label="Histórico de internações hospitalares" />
          <YesNoField control={control} name="necessidades_especiais" detailName="desc_necessidades_especiais" label="Presença de deficiência ou necessidades especiais" />
        </div>
      </div>
      
      <Separator />
      
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Aspectos Pediátricos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <YesNoField control={control} name="nascimento_prematuro" detailName="desc_nascimento_prematuro" label="Nascimento prematuro" />
          <YesNoField control={control} name="parto_complicacoes" detailName="desc_parto_complicacoes" label="Parto com complicações" />
          <YesNoField control={control} name="uso_chupeta" detailName="desc_uso_chupeta" label="Uso de chupeta" />
          <YesNoField control={control} name="habitos_succao_bruxismo" detailName="desc_habitos_succao_bruxismo" label="Hábitos de sucção ou bruxismo" />
          <YesNoField control={control} name="amamentacao_prolongada" detailName="desc_amamentacao_prolongada" label="Amamentação prolongada" />
          <YesNoField control={control} name="alimentacao_especial" detailName="desc_alimentacao_especial" label="Alimentação especial (seletividade ou restrições)" />
        </div>
      </div>
      
      <Separator />
      
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Cirurgias e Internações</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <YesNoField control={control} name="realizou_cirurgia" detailName="desc_realizou_cirurgia" label="Já realizou cirurgia?" />
          <YesNoField control={control} name="foi_internado" detailName="desc_foi_internado" label="Já foi internado?" />
          <YesNoField control={control} name="transfusao_sangue" detailName="desc_transfusao_sangue" label="Já teve transfusão de sangue?" />
        </div>
      </div>
      
      <Separator />
      
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Histórico Familiar</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <YesNoField control={control} name="doencas_hereditarias" detailName="desc_doencas_hereditarias" label="Doenças hereditárias" />
          <YesNoField control={control} name="historico_alergias_familia" detailName="desc_historico_alergias_familia" label="Histórico de alergias na família" />
          <YesNoField control={control} name="problemas_dentarios_familia" detailName="desc_problemas_dentarios_familia" label="Problemas dentários frequentes na família" />
        </div>
      </div>
    </div>
  );
}