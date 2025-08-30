// Este hook foi removido para evitar dependências circulares
// O tratamento de erros de autenticação agora é feito diretamente no AuthContext
export function useAuthErrorHandler() {
  return {
    handleSupabaseError: async () => false
  };
}