import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { supabase } from '@/lib/supabaseClient';
import { cn } from '@/lib/utils';

interface Patient {
  id: string;
  nome: string;
}

interface PatientSelectProps {
  value: string | undefined;
  onChange: (value: string | undefined) => void;
}

export function PatientSelect({ value, onChange }: PatientSelectProps) {
  const [open, setOpen] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPatients() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('patients')
          .select('id, nome')
          .order('nome', { ascending: true });

        if (error) throw error;
        setPatients(data || []);
      } catch (error) {
        console.error('Erro ao buscar pacientes:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchPatients();
  }, []);

  const selectedPatient = patients.find((patient) => patient.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedPatient
            ? selectedPatient.nome
            : 'Selecione um paciente...'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Buscar paciente..." />
          <CommandList>
            <CommandEmpty>
              {loading ? 'Carregando...' : 'Nenhum paciente encontrado.'}
            </CommandEmpty>
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  onChange(undefined);
                  setOpen(false);
                }}
              >
                Nenhum (evento geral)
              </CommandItem>
              {patients.map((patient) => (
                <CommandItem
                  key={patient.id}
                  value={patient.nome}
                  onSelect={() => {
                    onChange(patient.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === patient.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {patient.nome}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}