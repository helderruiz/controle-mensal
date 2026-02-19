
import React from 'react';

export const COLORS = {
  emerald: '#10B981',
  rose: '#F43F5E',
  blue: '#3B82F6',
  amber: '#F59E0B',
};

export const CATEGORY_ICONS: Record<string, string> = {
  Salário: 'payments',
  Aluguel: 'home',
  Alimentação: 'restaurant',
  Transporte: 'directions_car',
  Lazer: 'celebration',
  Compras: 'shopping_bag',
  Contas: 'bolt',
  Outros: 'category'
};

export const CATEGORY_COLORS: Record<string, string> = {
  Salário: 'bg-emerald-500/20 text-emerald-500',
  Aluguel: 'bg-blue-500/20 text-blue-500',
  Alimentação: 'bg-orange-500/20 text-orange-500',
  Transporte: 'bg-cyan-500/20 text-cyan-500',
  Lazer: 'bg-pink-500/20 text-pink-500',
  Compras: 'bg-purple-500/20 text-purple-500',
  Contas: 'bg-yellow-500/20 text-yellow-500',
  Outros: 'bg-slate-500/20 text-slate-500'
};
