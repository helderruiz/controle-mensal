
export enum TransactionType {
  ENTRY = 'ENTRADA',
  EXIT = 'SAÍDA'
}

export enum TransactionCategory {
  SALARY = 'Salário',
  RENT = 'Aluguel',
  FOOD = 'Alimentação',
  TRANSPORT = 'Transporte',
  ENTERTAINMENT = 'Lazer',
  SHOPPING = 'Compras',
  BILLS = 'Contas',
  OTHERS = 'Outros'
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: TransactionType;
  category: TransactionCategory;
  repetition?: 'NONE' | 'MONTHLY';
  installmentType?: 'FIXED' | 'INSTALLMENT';
  installmentsCount?: number;
}

export interface User {
  name: string;
  email: string;
  isPremium: boolean;
  avatarUrl: string;
}
