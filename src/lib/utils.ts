import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Formatar data
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

// Formatar data com hora
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Formatador de CPF
export function formatCPF(cpf: string): string {
  cpf = cpf.replace(/\D/g, '');
  
  if (cpf.length <= 11) {
    cpf = cpf.padStart(11, '0');
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  
  return cpf;
}

// Formatador de telefone
export function formatPhone(phone: string): string {
  phone = phone.replace(/\D/g, '');
  
  if (phone.length === 11) {
    return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  
  if (phone.length === 10) {
    return phone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  
  return phone;
}

// Obter idade a partir da data de nascimento
export function getAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}

// Obter mês em português
export function getMonthName(month: number): string {
  const months = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro'
  ];
  
  return months[month];
}

// Criar um ID único
export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

/**
 * Função para copiar texto para a área de transferência com fallback
 * Resolve problemas de permissão da Clipboard API
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    // Método moderno (preferencial)
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    // Método fallback para navegadores que não suportam Clipboard API
    const textArea = document.createElement('textarea');
    textArea.value = text;
    
    // Torna o textarea invisível e o anexa ao DOM
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    
    // Seleciona o texto e tenta copiá-lo
    textArea.focus();
    textArea.select();
    
    const successful = document.execCommand('copy');
    
    // Remove o elemento temporário
    document.body.removeChild(textArea);
    
    return successful;
  } catch (error) {
    console.error('Erro ao copiar para a área de transferência:', error);
    return false;
  }
}