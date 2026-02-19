
import { Transaction } from './types';

/**
 * Filtra transações pelo mês e ano de uma data de referência.
 */
export const filterByMonth = (transactions: Transaction[], referenceDate: Date): Transaction[] => {
  return transactions.filter(t => {
    const tDate = new Date(t.date);
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
