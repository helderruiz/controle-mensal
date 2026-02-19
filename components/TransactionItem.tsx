
import React from 'react';
import { Transaction, TransactionType } from '../types';
import { CATEGORY_ICONS, CATEGORY_COLORS } from '../constants';

interface TransactionItemProps {
  transaction: Transaction;
  onDelete: (id: string) => void;
  /** Tamanho do ícone de categoria. Padrão: 'md' */
  iconSize?: 'sm' | 'md';
}

const TransactionItem: React.FC<TransactionItemProps> = ({ transaction: t, onDelete, iconSize = 'md' }) => {
  const iconDimension = iconSize === 'sm' ? 'w-10 h-10 rounded-xl' : 'w-12 h-12 rounded-lg';

  return (
    <div className="flex items-center gap-4 bg-white dark:bg-white/5 p-4 rounded-xl border border-slate-100 dark:border-white/10 shadow-sm">
      <div className={`${iconDimension} flex items-center justify-center ${CATEGORY_COLORS[t.category] || 'bg-slate-100 text-slate-500'}`}>
        <span className="material-symbols-outlined">{CATEGORY_ICONS[t.category] || 'receipt'}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm truncate text-slate-700 dark:text-slate-200">{t.description}</p>
        <p className="text-[10px] text-slate-500 dark:text-slate-400">{t.category} • {t.date}</p>
      </div>
      <div className="text-right shrink-0">
        <p className={`font-bold text-sm ${t.type === TransactionType.ENTRY ? 'text-emerald-500' : 'text-rose-500'}`}>
          {t.type === TransactionType.ENTRY ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
        <button
          onClick={() => onDelete(t.id)}
          className="text-[10px] text-slate-400 uppercase font-medium hover:text-rose-500 transition-colors"
        >
          Excluir
        </button>
      </div>
    </div>
  );
};

export default TransactionItem;
