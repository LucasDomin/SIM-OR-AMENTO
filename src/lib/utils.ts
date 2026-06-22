import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatDateFull(dateString: string): string {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'Draft':
      return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
    case 'Sent':
      return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
    case 'Approved':
      return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
    case 'Rejected':
      return 'text-red-400 bg-red-400/10 border-red-400/20';
    case 'Expired':
      return 'text-neutral-400 bg-neutral-400/10 border-neutral-400/20';
    default:
      return 'text-neutral-400 bg-neutral-400/10 border-neutral-400/20';
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case 'Draft': return 'Rascunho';
    case 'Sent': return 'Enviado';
    case 'Approved': return 'Aprovado';
    case 'Rejected': return 'Rejeitado';
    case 'Expired': return 'Expirado';
    default: return status;
  }
}
