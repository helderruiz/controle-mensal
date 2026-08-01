
import React, { useState } from 'react';
import { Transaction, TransactionType } from '../types';
import { CATEGORY_ICONS, CATEGORY_COLORS } from '../constants';
import { getCustomCategoryEmoji } from '../utils';

interface TransactionItemProps {
  transaction: Transaction;
  onDelete: (id: string, deleteSeries?: boolean) => void;
  onEdit?: (id: string) => void;
  /** Tamanho do ícone de categoria. Padrão: 'md' */
  iconSize?: 'sm' | 'md';
}

const TransactionItem: React.FC<TransactionItemProps> = ({ transaction: t, onDelete, onEdit, iconSize = 'md' }) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const iconDimension = iconSize === 'sm' ? 'w-10 h-10 rounded-xl' : 'w-12 h-12 rounded-lg';
  const isInstallment = !!(t.installmentGroupId || (t.installmentType === 'INSTALLMENT' && t.installmentsCount && t.installmentsCount > 1));
  const categoryEmoji = getCustomCategoryEmoji(t.category);

  const handleDeleteClick = () => {
    if (isInstallment) {
      setShowDeleteModal(true);
    } else {
      onDelete(t.id);
    }
  };

  return (
    <>
      <div className="flex items-center gap-4 bg-white dark:bg-white/5 p-4 rounded-xl border border-slate-100 dark:border-white/10 shadow-sm">
        <div className={`${iconDimension} flex items-center justify-center ${CATEGORY_COLORS[t.category] || 'bg-slate-100 text-slate-500'} shrink-0`}>
          {categoryEmoji ? <span className="text-xl">{categoryEmoji}</span> : <span className="material-symbols-outlined">{CATEGORY_ICONS[t.category] || 'receipt'}</span>}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm truncate text-slate-700 dark:text-slate-200">{t.description}</p>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <p className="text-[10px] text-slate-500 dark:text-slate-400">{t.category} • {t.date}</p>
            {isInstallment && (
              <span className="text-[9px] font-bold bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded-full">
                PARCELADO
              </span>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className={`font-bold text-sm ${t.type === TransactionType.ENTRY ? 'text-emerald-500' : 'text-rose-500'}`}>
            {t.type === TransactionType.ENTRY ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <div className="flex justify-end gap-2 mt-1">
            {onEdit && (
              <button
                onClick={() => onEdit(t.id)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-primary transition-all"
                title="Editar"
              >
                <span className="material-symbols-outlined text-lg">edit</span>
              </button>
            )}
            <button
              onClick={handleDeleteClick}
              className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-rose-500 transition-all"
              title="Excluir"
            >
              <span className="material-symbols-outlined text-lg">delete</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Confirmação de Exclusão de Parcelas */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-t-[32px] sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-5 duration-200">
            {/* Ícone de aviso */}
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-rose-500">credit_card_off</span>
              </div>
            </div>

            <h3 className="text-lg font-bold text-center dark:text-white mb-1">Excluir Parcelamento</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center mb-6 leading-relaxed">
              Esta transação faz parte de um parcelamento.<br />
              Como deseja excluí-la?
            </p>

            {/* Descrição da transação */}
            <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-3 mb-5 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${CATEGORY_COLORS[t.category] || 'bg-slate-100 text-slate-500'}`}>
                {categoryEmoji ? <span className="text-base">{categoryEmoji}</span> : <span className="material-symbols-outlined text-sm">{CATEGORY_ICONS[t.category] || 'receipt'}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{t.description}</p>
                <p className="text-[10px] text-slate-400">R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>

            <div className="space-y-3">
              {/* Opção: Excluir todas as parcelas */}
              <button
                onClick={() => { onDelete(t.id, true); setShowDeleteModal(false); }}
                className="w-full p-4 bg-rose-500/5 border-2 border-rose-500/30 hover:bg-rose-500/10 hover:border-rose-500/60 rounded-2xl text-left transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-500/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-rose-500 text-lg">delete_sweep</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-rose-600 dark:text-rose-400">Quitar / Excluir todas as parcelas</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Remove esta e todas as parcelas futuras desta dívida</p>
                  </div>
                </div>
              </button>

              {/* Opção: Excluir apenas esta */}
              <button
                onClick={() => { onDelete(t.id, false); setShowDeleteModal(false); }}
                className="w-full p-4 bg-slate-50 dark:bg-white/5 border-2 border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 rounded-2xl text-left transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-white/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-slate-500 dark:text-slate-400 text-lg">delete</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Excluir apenas esta parcela</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">As outras parcelas continuam normalmente</p>
                  </div>
                </div>
              </button>

              {/* Cancelar */}
              <button
                onClick={() => setShowDeleteModal(false)}
                className="w-full py-3 text-sm font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TransactionItem;
