import { Control } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TreatmentRecordsForm } from './TreatmentRecordsForm';

interface TreatmentPlanFormProps {
  control: Control<any>;
  patientId?: string;
  patientName: string;
}

export function TreatmentPlanForm({ control, patientId, patientName }: TreatmentPlanFormProps) {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="proposed" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="proposed">Plano Proposto</TabsTrigger>
          <TabsTrigger value="completed">Tratamentos Realizados</TabsTrigger>
        </TabsList>
        
        <TabsContent value="proposed" className="space-y-4 mt-6">
          <h3 className="text-lg font-medium">Plano de Tratamento Proposto</h3>
          
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
        </TabsContent>
        
        <TabsContent value="completed" className="mt-6">
          <TreatmentRecordsForm 
            patientId={patientId}
            patientName={patientName}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}