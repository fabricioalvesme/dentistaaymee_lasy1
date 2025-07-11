import { Control } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';

interface TreatmentPlanFormProps {
  control: Control<any>;
}

export function TreatmentPlanForm({ control }: TreatmentPlanFormProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Plano de Tratamento</h3>
      
      <FormField
        control={control}
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
  );
}