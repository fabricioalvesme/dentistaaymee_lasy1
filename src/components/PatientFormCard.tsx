import { Patient } from '@/lib/supabaseClient';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Pencil, Share2, FileText } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface PatientFormCardProps {
  patient: Patient;
  onShare: (id: string) => void;
  onViewDetails: (id: string) => void;
  onExport: (id: string) => void;
}

export function PatientFormCard({ 
  patient, 
  onShare, 
  onViewDetails, 
  onExport 
}: PatientFormCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
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
          <p><span className="font-medium">Telefone:</span> {patient.telefone}</p>
        </div>
      </CardContent>
      
      <CardFooter className="flex flex-wrap gap-2 pt-2">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 w-full">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onViewDetails(patient.id)}
            className="text-xs md:text-sm flex items-center justify-center"
          >
            <Eye className="h-4 w-4 mr-1" />
            <span>Detalhes</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm"
            asChild
            className="text-xs md:text-sm flex items-center justify-center"
          >
            <Link to={`/admin/forms/edit/${patient.id}`}>
              <Pencil className="h-4 w-4 mr-1" />
              <span>Editar</span>
            </Link>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onExport(patient.id)}
            className="text-xs md:text-sm flex items-center justify-center"
          >
            <FileText className="h-4 w-4 mr-1" />
            <span>Exportar</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onShare(patient.id)}
            className="text-xs md:text-sm flex items-center justify-center"
          >
            <Share2 className="h-4 w-4 mr-1" />
            <span>Compartilhar</span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

function StatusBadge({ status }: { status: Patient['status'] }) {
  if (status === 'rascunho') {
    return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Rascunho</Badge>;
  }
  
  if (status === 'enviado') {
    return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Enviado</Badge>;
  }
  
  if (status === 'assinado') {
    return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Assinado</Badge>;
  }
  
  return null;
}