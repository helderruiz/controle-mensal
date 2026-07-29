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

/**
 * Formata um objeto Date para a string "YYYY-MM-DD" no fuso horário local.
 */
export const formatDateToYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const CUSTOM_CATEGORIES_KEY = 'custom_categories';

/**
 * Obtém a lista de categorias personalizadas do localStorage.
 */
export const getCustomCategories = (): string[] => {
  try {
    const saved = localStorage.getItem(CUSTOM_CATEGORIES_KEY);
    return saved ? JSON.parse(saved) : ['Gasolina', 'Farmácia'];
  } catch (e) {
    return ['Gasolina', 'Farmácia'];
  }
};

/**
 * Adiciona uma nova categoria personalizada ao localStorage se ainda não existir.
 */
export const addCustomCategory = (newCategory: string): string[] => {
  const trimmed = newCategory.trim();
  if (!trimmed) return getCustomCategories();
  
  const current = getCustomCategories();
  // Verificar sem diferenciar maiúsculas/minúsculas
  const exists = current.some(c => c.toLowerCase() === trimmed.toLowerCase());
  
  if (!exists) {
    const updated = [...current, trimmed];
    localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(updated));
    return updated;
  }
  
  return current;
};
