import { useState, useEffect } from 'react';
import { Control } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { supabase, TreatmentRecord } from '@/lib/supabaseClient';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Loader2, Calendar, FileText } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const treatmentRecordSchema = z.object({
  data_realizacao: z.string().min(1, 'Data é obrigatória'),
  descricao_procedimento: z.string().min(3, 'Descrição deve ter pelo menos 3 caracteres'),
});

type TreatmentRecordFormValues = z.infer<typeof treatmentRecordSchema>;

interface TreatmentRecordsFormProps {
  patientId?: string;
  patientName: string;
}

export function TreatmentRecordsForm({ patientId, patientName }: TreatmentRecordsFormProps) {
  const [records, setRecords] = useState<TreatmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingRecord, setEditingRecord] = useState<TreatmentRecord | null>(null);

  const form = useForm<TreatmentRecordFormValues>({
    resolver: zodResolver(treatmentRecordSchema),
    defaultValues: {
      data_realizacao: '',
      descricao_procedimento: '',
    },
  });

  // Carregar registros de tratamento
  const loadTreatmentRecords = async () => {
    if (!patientId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('Carregando registros de tratamento para paciente:', patientId);

      const { data, error } = await supabase
        .from('treatment_records')
        .select('*')
        .eq('patient_id', patientId)
        .order('data_realizacao', { ascending: false });

      if (error) {
        console.error('Erro ao carregar registros:', error);
        throw error;
      }

      console.log('Registros carregados:', data?.length || 0);
      setRecords(data || []);
    } catch (error) {
      console.error('Erro ao carregar registros de tratamento:', error);
      toast.error('Erro ao carregar registros de tratamento');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTreatmentRecords();
  }, [patientId]);

  // Salvar registro
  const onSubmit = async (data: TreatmentRecordFormValues) => {
    if (!patientId) {
      toast.error('Paciente deve ser salvo antes de adicionar registros de tratamento');
      return;
    }

    try {
      setSaving(true);
      console.log('Salvando registro de tratamento:', data);

      const recordData = {
        patient_id: patientId,
        data_realizacao: data.data_realizacao,
        descricao_procedimento: data.descricao_procedimento,
      };

      let result;

      if (editingRecord) {
        // Atualizar registro existente
        result = await supabase
          .from('treatment_records')
          .update(recordData)
          .eq('id', editingRecord.id)
          .select();
      } else {
        // Criar novo registro
        result = await supabase
          .from('treatment_records')
          .insert([recordData])
          .select();
      }

      if (result.error) {
        console.error('Erro ao salvar registro:', result.error);
        throw result.error;
      }

      console.log('Registro salvo com sucesso');
      toast.success(editingRecord ? 'Registro atualizado com sucesso!' : 'Registro adicionado com sucesso!');

      // Resetar formulário e fechar dialog
      form.reset();
      setShowDialog(false);
      setEditingRecord(null);

      // Recarregar registros
      await loadTreatmentRecords();
    } catch (error: any) {
      console.error('Erro ao salvar registro:', error);
      toast.error('Erro ao salvar registro: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setSaving(false);
    }
  };

  // Excluir registro
  const handleDelete = async (recordId: string) => {
    try {
      setDeleting(true);
      console.log('Excluindo registro:', recordId);

      const { error } = await supabase
        .from('treatment_records')
        .delete()
        .eq('id', recordId);

      if (error) {
        console.error('Erro ao excluir registro:', error);
        throw error;
      }

      console.log('Registro excluído com sucesso');
      toast.success('Registro excluído com sucesso!');

      // Recarregar registros
      await loadTreatmentRecords();
    } catch (error: any) {
      console.error('Erro ao excluir registro:', error);
      toast.error('Erro ao excluir registro: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setDeleting(false);
    }
  };

  // Abrir dialog para edição
  const handleEdit = (record: TreatmentRecord) => {
    setEditingRecord(record);
    form.reset({
      data_realizacao: record.data_realizacao,
      descricao_procedimento: record.descricao_procedimento,
    });
    setShowDialog(true);
  };

  // Abrir dialog para novo registro
  const handleNew = () => {
    setEditingRecord(null);
    form.reset({
      data_realizacao: '',
      descricao_procedimento: '',
    });
    setShowDialog(true);
  };

  if (!patientId) {
    return (
      <div className="bg-yellow-50 p-4 rounded-md text-yellow-800">
        <p>Para registrar tratamentos realizados, primeiro salve o formulário do paciente.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Tratamentos Realizados</h3>
          <p className="text-sm text-gray-500">
            Registre os procedimentos já executados para {patientName}
          </p>
        </div>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button onClick={handleNew}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Registro
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingRecord ? 'Editar Registro' : 'Novo Registro de Tratamento'}
              </DialogTitle>
              <DialogDescription>
                {editingRecord 
                  ? 'Edite as informações do tratamento realizado'
                  : 'Adicione um novo registro de tratamento realizado'
                }
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="data_realizacao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Realização*</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="descricao_procedimento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição do Procedimento*</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Descreva o procedimento realizado..."
                          className="resize-none h-24"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowDialog(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      editingRecord ? 'Atualizar' : 'Adicionar'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : records.length > 0 ? (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">Data</TableHead>
                <TableHead>Procedimento Realizado</TableHead>
                <TableHead className="w-24 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      {formatDate(record.data_realizacao)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-start">
                      <FileText className="h-4 w-4 mr-2 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="whitespace-pre-line">{record.descricao_procedimento}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(record)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir registro?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação não pode ser desfeita. O registro do tratamento será permanentemente excluído.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-red-500 hover:bg-red-600"
                              onClick={() => handleDelete(record.id)}
                              disabled={deleting}
                            >
                              {deleting ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Excluindo...
                                </>
                              ) : (
                                'Excluir'
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-md">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-2">Nenhum tratamento realizado registrado</p>
          <Button variant="link" onClick={handleNew}>
            Adicionar primeiro registro
          </Button>
        </div>
      )}
    </div>
  );
}