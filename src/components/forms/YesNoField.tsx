import { useState, useEffect } from 'react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Control } from "react-hook-form";
import { Textarea } from "@/components/ui/textarea";

interface YesNoFieldProps {
  control: Control<any>;
  name: string;
  detailName: string;
  label: string;
  description?: string;
}

export function YesNoField({
  control,
  name,
  detailName,
  label,
  description
}: YesNoFieldProps) {
  const [showDetail, setShowDetail] = useState(false);

  return (
    <div className="space-y-2">
      <FormField
        control={control}
        name={name}
        render={({ field }) => {
          // Atualiza o estado quando o valor do campo muda
          useEffect(() => {
            setShowDetail(field.value === "sim");
          }, [field.value]);

          return (
            <FormItem className="space-y-1">
              <FormLabel>{label}</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={(value) => {
                    field.onChange(value);
                    setShowDetail(value === "sim");
                  }}
                  defaultValue={field.value}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sim" id={`${name}-sim`} />
                    <Label htmlFor={`${name}-sim`}>Sim</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="nao" id={`${name}-nao`} />
                    <Label htmlFor={`${name}-nao`}>Não</Label>
                  </div>
                </RadioGroup>
              </FormControl>
              {description && <FormDescription>{description}</FormDescription>}
              <FormMessage />
            </FormItem>
          );
        }}
      />

      {showDetail && (
        <FormField
          control={control}
          name={detailName}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea
                  placeholder="Forneça mais detalhes..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );
}