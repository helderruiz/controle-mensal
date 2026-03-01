
import { Transaction } from './types';

/**
 * Converte uma string de data "YYYY-MM-DD" para um objeto Date
 * de forma segura, evitando deslocamentos de fuso horário.
 */
export const parseDateSafe = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  // O mês no objeto Date é 0-indexado (0 = Janeiro, 1 = Fevereiro, ...)
  return new Date(year, month - 1, day);
};

/**
 * Filtra transações pelo mês e ano de uma data de referência.
 */
export const filterByMonth = (transactions: Transaction[], referenceDate: Date): Transaction[] => {
  return transactions.filter(t => {
    const tDate = parseDateSafe(t.date);
    return (
      tDate.getMonth() === referenceDate.getMonth() &&
      tDate.getFullYear() === referenceDate.getFullYear()
    );
  });
};

/**
 * Formata um número como moeda brasileira (R$).
 */
export const formatBRL = (value: number): string =>
  value.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
