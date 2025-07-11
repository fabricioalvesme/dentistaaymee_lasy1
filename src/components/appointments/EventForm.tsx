import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const appointmentSchema = z.object({
  titulo: z.string().min(3, 'Título deve ter pelo menos 3 caracteres'),
  descricao: z.string().optional(),
  data: z.date(),
  hora_inicio: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido'),
  hora_fim: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido'),
  patient_id: z.string().optional(),
  cor: z.string().optional(),
});

export type AppointmentFormValues = z.infer<typeof appointmentSchema>;

interface EventFormProps {
  defaultValues: AppointmentFormValues;
  onSubmit: (data: AppointmentFormValues) => Promise<void>;
  isEditing: boolean;
  onCancel: () => void;
  isSaving?: boolean;
}

// Opções de cores para eventos
const colorOptions = [
  { value: "#3B82F6", label: "Azul (Padrão)" },
  { value: "#10B981", label: "Verde" },
  { value: "#F59E0B", label: "Amarelo" },
  { value: "#EF4444", label: "Vermelho" },
  { value: "#8B5CF6", label: "Roxo" },
  { value: "#EC4899", label: "Rosa" },
  { value: "#6B7280", label: "Cinza" },
];

export function EventForm({ defaultValues, onSubmit, isEditing, onCancel, isSaving = false }: EventFormProps) {
  const [submitting, setSubmitting] = useState(false);
  
  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      ...defaultValues,
      cor: defaultValues.cor || "#3B82F6" // Cor padrão se não definida
    },
  });

  // Atualizar o formulário quando os valores padrão mudarem
  useEffect(() => {
    form.reset(defaultValues);
  }, [form, defaultValues]);

  const handleSubmit = async (data: AppointmentFormValues) => {
    try {
      setSubmitting(true);
      console.log("Enviando formulário:", data);
      await onSubmit(data);
    } catch (error) {
      console.error("Erro ao salvar evento:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="titulo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título*</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="cor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cor do evento</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value || "#3B82F6"}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma cor" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {colorOptions.map((color) => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center">
                        <div 
                          className="w-4 h-4 rounded-full mr-2" 
                          style={{ backgroundColor: color.value }}
                        />
                        {color.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="descricao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Detalhes do evento..." 
                  className="resize-none"
                  {...field} 
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="data"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data*</FormLabel>
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={field.value}
                  onSelect={(date) => date && field.onChange(date)}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                  className="mx-auto border rounded-md"
                />
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="hora_inicio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hora de Início*</FormLabel>
                <FormControl>
                  <Input 
                    type="time" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="hora_fim"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hora de Término*</FormLabel>
                <FormControl>
                  <Input 
                    type="time" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="flex justify-end gap-2 mt-8">
          <Button 
            type="button" 
            variant="outline"
            onClick={onCancel}
          >
            Cancelar
          </Button>
          
          <Button 
            type="submit" 
            disabled={submitting || isSaving}
          >
            {submitting || isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditing ? 'Salvando...' : 'Adicionando...'}
              </>
            ) : (
              isEditing ? 'Salvar Alterações' : 'Adicionar Evento'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}