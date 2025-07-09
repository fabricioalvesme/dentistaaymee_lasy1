import { Instagram, Phone, MapPin, Clock } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export function Footer() {
  const { settings } = useTheme();
  
  // Informações de contato
  const whatsapp = "556492527548";
  const instagram = "@dra.aymeefrauzino_";
  const endereco = "Av. Exemplo, 123 - Centro, Morrinhos - GO";
  const cnpj = "00.000.000/0001-00";
  
  // Horários
  const horarios = [
    "Segunda a Sexta: 8h às 18h",
    "Sábado: 8h às 12h",
    "Domingo: Fechado"
  ];

  return (
    <footer id="contato" className="bg-gray-50 pt-12 pb-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Coluna 1: Logo e info */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-primary">
              Dra. Aymée Frauzino
            </h3>
            <p className="text-gray-600">
              Odontopediatria especializada com atendimento humanizado para crianças de todas as idades.
            </p>
            <p className="text-sm text-gray-500">
              CNPJ: {cnpj}
            </p>
          </div>

          {/* Coluna 2: Contato */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-gray-800">Contato</h4>
            <ul className="space-y-3">
              <li>
                <a 
                  href={`https://wa.me/${whatsapp}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center text-gray-600 hover:text-primary transition-colors"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  <span>WhatsApp: {formatPhone(whatsapp)}</span>
                </a>
              </li>
              <li>
                <a 
                  href={`https://instagram.com/${instagram.replace('@', '')}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center text-gray-600 hover:text-primary transition-colors"
                >
                  <Instagram className="h-4 w-4 mr-2" />
                  <span>Instagram: {instagram}</span>
                </a>
              </li>
              <li className="flex items-start">
                <MapPin className="h-4 w-4 mr-2 mt-1 flex-shrink-0" />
                <span className="text-gray-600">{endereco}</span>
              </li>
            </ul>
          </div>

          {/* Coluna 3: Horários */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-gray-800">Horários</h4>
            <ul className="space-y-2">
              {horarios.map((horario, index) => (
                <li key={index} className="flex items-center text-gray-600">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>{horario}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Coluna 4: Convênios */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-gray-800">Convênios</h4>
            <div className="text-gray-600" dangerouslySetInnerHTML={{ 
              __html: settings?.convenios_text || 'Unimed, Bradesco Saúde, Amil, SulAmérica e outros. Consulte disponibilidade.'
            }} />
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-200 mt-8 pt-6 text-center text-gray-500 text-sm">
          <p>
            &copy; {new Date().getFullYear()} Dra. Aymée Frauzino - Odontopediatra. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}

// Função para formatar telefone
function formatPhone(phone: string): string {
  if (phone.startsWith('55')) {
    // Remove código do país
    phone = phone.substring(2);
  }
  
  // Formato: (XX) XXXXX-XXXX
  if (phone.length === 11) {
    return `(${phone.substring(0, 2)}) ${phone.substring(2, 7)}-${phone.substring(7)}`;
  }
  
  // Formato: (XX) XXXX-XXXX
  if (phone.length === 10) {
    return `(${phone.substring(0, 2)}) ${phone.substring(2, 6)}-${phone.substring(6)}`;
  }
  
  return phone;
}