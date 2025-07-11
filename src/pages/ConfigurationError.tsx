import { AlertTriangle } from 'lucide-react';

const ConfigurationError = ({ error }: { error: string }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-lg w-full bg-white p-8 rounded-lg shadow-md text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
          <AlertTriangle className="h-6 w-6 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mt-4">
          Erro de Configuração
        </h1>
        <p className="text-gray-600 mt-2">
          Ocorreu um problema crítico que impede o funcionamento do sistema.
        </p>
        <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-md text-left text-sm">
          <p className="font-semibold">Detalhes do erro:</p>
          <p>{error}</p>
        </div>
        <p className="text-sm text-gray-500 mt-6">
          Por favor, entre em contato com o suporte técnico para resolver este problema.
        </p>
      </div>
    </div>
  );
};

export default ConfigurationError;