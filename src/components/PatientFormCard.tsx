import { Patient } from '@/lib/supabaseClient';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Pencil, Share2, FileText, MessageCircle, Trash2, Loader2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Link } from 'react-router-dom';
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
} from "@/components/ui/alert-dialog";

interface PatientFormCardProps {
  patient: Patient;
  onShare: () => void;
  onViewDetails: () => void;
  onExport: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}

export function PatientFormCard({ 
  patient, 
  onShare, 
  onViewDetails, 
  onExport,
  onDelete,
  isDeleting
}: PatientFormCardProps) {
  const openWhatsApp = () => {
    if (patient.telefone) {
      const phone = patient.telefone.replace(/\D/g, '');
      window.open(`https://api.whatsapp.com/send?phone=55${phone}`, '_blank');
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow flex flex-col">
      <CardContent className="pt-6 flex-grow">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-semibold text-lg truncate">{patient.nome}</h3>
            <p className="text-sm text-muted-foreground">
              {formatDate(patient.created_at)}
            </p>
          </div>
          <StatusBadge status={patient.status} />
        </div>
        
        <div className="text-sm space-y-1">
          <p><span className="font-medium">Responsável:</span> {patient.nome_responsavel}</p>
          <p>
            <span className="font-medium">Telefone:</span> 
            <Button
              variant="link"
              size="sm"
              className="p-0 h-auto font-normal text-blue-600 hover:text-blue-800 pl-1"
              onClick={openWhatsApp}
            >
              {patient.telefone}
            </Button>
          </p>
        </div>
      </CardContent>
      
      <CardFooter className="flex flex-wrap gap-2 pt-4 border-t mt-auto">
        <div className="grid grid-cols-3 gap-1 w-full">
          <Button variant="ghost" size="sm" onClick={onViewDetails}><Eye className="h-4 w-4 mr-1" />Ver</Button>
          <Button variant="ghost" size="sm" asChild><Link to={`/admin/forms/edit/${patient.id}`}><Pencil className="h-4 w-4 mr-1" />Editar</Link></Button>
          <Button variant="ghost" size="sm" onClick={onExport}><FileText className="h-4 w-4 mr-1" />Exportar</Button>
          <Button variant="ghost" size="sm" onClick={onShare}><Share2 className="h-4 w-4 mr-1" />Link</Button>
          <Button variant="ghost" size="sm" onClick={openWhatsApp} className="text-green-600 hover:text-green-700"><MessageCircle className="h-4 w-4 mr-1" />WhatsApp</Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 mr-1" />}
                Excluir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir o formulário de <span className="font-bold">{patient.nome}</span>? Todos os dados associados (histórico, tratamento, lembretes) serão permanentemente removidos. Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete} className="bg-red-600 hover:bg-red-700">Confirmar Exclusão</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardFooter>
    </Card>
  );
}

function StatusBadge({ status }: { status: Patient['status'] }) {
  const styles = {
    rascunho: "bg-yellow-50 text-yellow-700 border-yellow-200",
    enviado: "bg-blue-50 text-blue-700 border-blue-200",
    assinado: "bg-green-50 text-green-700 border-green-200",
  };
  return <Badge variant="outline" className={styles[status] || ''}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
}