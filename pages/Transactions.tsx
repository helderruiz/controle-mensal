import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Transaction, TransactionType } from '../types';
import TransactionItem from '../components/TransactionItem';
import FilterChip from '../components/FilterChip';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '../constants';
import { formatBRL, getCustomCategoryEmoji, parseDateSafe } from '../utils';

interface TransactionsProps {
  transactions: Transaction[];
  deleteTransaction: (id: string, deleteSeries?: boolean) => void;
}

interface InstallmentGroupProps {
  transactions: Transaction[];
  expanded: boolean;
  onToggle: () => void;
  onDelete: (id: string, deleteSeries?: boolean) => void;
  onEdit: (id: string) => void;
}

const getInstallmentBaseDescription = (description: string) =>
  description.replace(/\s*\(\d+\/\d+\)\s*$/, '').trim();

/**
 * Lançamentos novos usam installmentGroupId. Para os registros já existentes,
 * que só guardam o número da parcela na descrição, criamos uma chave estável
 * para que também possam ser exibidos em grupo.
 */
const getInstallmentGroupKey = (transaction: Transaction): string | undefined => {
  if (transaction.installmentGroupId) return `id:${transaction.installmentGroupId}`;

  const isLegacyInstallment =
    transaction.installmentType === 'INSTALLMENT' &&
    (transaction.installmentsCount || 0) > 1 &&
    /\(\d+\/\d+\)\s*$/.test(transaction.description);

  if (!isLegacyInstallment) return undefined;

  return [
    'legacy',
    getInstallmentBaseDescription(transaction.description).toLowerCase(),
    transaction.amount,
    transaction.category,
    transaction.type,
    transaction.installmentsCount,
  ].join(':');
};

const InstallmentGroup: React.FC<InstallmentGroupProps> = ({ transactions, expanded, onToggle, onDelete, onEdit }) => {
  const latest = transactions[0];
  const oldest = transactions[transactions.length - 1];
  const description = getInstallmentBaseDescription(latest.description);
  const totalInstallments = latest.installmentsCount || transactions.length;
  const categoryEmoji = getCustomCategoryEmoji(latest.category);

  return (
    <div className="rounded-xl border border-blue-100 dark:border-blue-900/50 bg-blue-50/40 dark:bg-blue-950/20 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="w-full flex items-center gap-4 bg-white dark:bg-white/5 p-4 text-left hover:bg-blue-50/60 dark:hover:bg-white/10 transition-colors"
      >
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${CATEGORY_COLORS[latest.category] || 'bg-slate-100 text-slate-500'}`}>
          {categoryEmoji ? <span className="text-xl">{categoryEmoji}</span> : <span className="material-symbols-outlined">{CATEGORY_ICONS[latest.category] || 'receipt'}</span>}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm truncate text-slate-700 dark:text-slate-200">{description}</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
            {totalInstallments} parcelas • {oldest.date} a {latest.date}
          </p>
          <span className="inline-block mt-1 text-[9px] font-bold bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded-full">
            PARCELADO
          </span>
        </div>
        <div className="text-right shrink-0">
          <p className={`font-bold text-sm ${latest.type === TransactionType.ENTRY ? 'text-emerald-500' : 'text-rose-500'}`}>
            {latest.type === TransactionType.ENTRY ? '+' : '-'} R$ {formatBRL(latest.amount)}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">por parcela</p>
        </div>
        <span className={`material-symbols-outlined text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}>expand_more</span>
      </button>

      {expanded && (
        <div className="p-3 space-y-3 border-t border-blue-100 dark:border-blue-900/50">
          {transactions.map(transaction => (
            <TransactionItem
              key={transaction.id}
              transaction={transaction}
              onDelete={onDelete}
              onEdit={onEdit}
              iconSize="sm"
            />
          ))}
        </div>
      )}
    </div>
  );
};

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const Transactions: React.FC<TransactionsProps> = ({ transactions, deleteTransaction }) => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'ALL' | 'ENTRY' | 'EXIT'>('ALL');
  const [selectedMonthYear, setSelectedMonthYear] = useState<string>('ALL'); // 'ALL' ou 'YYYY-MM'
  const [search, setSearch] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => new Set());

  // Extrair meses/anos disponíveis nas transações para o filtro de mês
  const availableMonths = React.useMemo(() => {
    const set = new Set<string>();
    transactions.forEach(t => {
      const d = parseDateSafe(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      set.add(key);
    });
    return Array.from(set).sort().reverse();
  }, [transactions]);

  const filtered = transactions
    .filter(t => {
      const matchesFilter =
        filter === 'ALL' ||
        t.type === (filter === 'ENTRY' ? TransactionType.ENTRY : TransactionType.EXIT);
      
      const tDate = parseDateSafe(t.date);
      const tMonthKey = `${tDate.getFullYear()}-${String(tDate.getMonth() + 1).padStart(2, '0')}`;
      const matchesMonth = selectedMonthYear === 'ALL' || tMonthKey === selectedMonthYear;

      const matchesSearch =
        t.description.toLowerCase().includes(search.toLowerCase()) ||
        t.category.toLowerCase().includes(search.toLowerCase());
      
      return matchesFilter && matchesMonth && matchesSearch;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const installmentGroups = new Map<string, Transaction[]>();
  filtered.forEach(transaction => {
    const groupKey = getInstallmentGroupKey(transaction);
    if (!groupKey) return;
    const group = installmentGroups.get(groupKey) || [];
    group.push(transaction);
    installmentGroups.set(groupKey, group);
  });

  const visibleItems = filtered.reduce<Array<Transaction | Transaction[]>>((items, transaction) => {
    const groupKey = getInstallmentGroupKey(transaction);
    if (!groupKey) {
      items.push(transaction);
      return items;
    }

    const group = installmentGroups.get(groupKey) || [];
    if (group[0].id === transaction.id) items.push(group.length > 1 ? group : transaction);
    return items;
  }, []);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(current => {
      const next = new Set(current);
      next.has(groupId) ? next.delete(groupId) : next.add(groupId);
      return next;
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden">
      <header className="flex-shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="px-4 pt-6 pb-2 flex items-center justify-between">
          <h1 className="text-lg font-bold tracking-tight dark:text-white">Extrato Detalhado</h1>
        </div>

        <div className="px-4 py-3 flex gap-3">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">search</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-100 dark:bg-white/5 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/50 dark:text-white"
              placeholder="Buscar por descrição ou categoria..."
              type="text"
            />
          </div>

          <select
            value={selectedMonthYear}
            onChange={e => setSelectedMonthYear(e.target.value)}
            className="bg-slate-100 dark:bg-white/5 text-xs font-bold text-slate-700 dark:text-slate-200 border-none rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-primary/50"
          >
            <option value="ALL">Todos os meses</option>
            {availableMonths.map(key => {
              const [y, m] = key.split('-').map(Number);
              return (
                <option key={key} value={key}>
                  {MONTH_NAMES[m - 1]} / {y}
                </option>
              );
            })}
          </select>
        </div>

        <div className="flex gap-2 px-4 pb-4 overflow-x-auto hide-scrollbar">
          <FilterChip active={filter === 'ALL'} label="Tudo" onClick={() => setFilter('ALL')} />
          <FilterChip active={filter === 'ENTRY'} label="Entradas" onClick={() => setFilter('ENTRY')} />
          <FilterChip active={filter === 'EXIT'} label="Saídas" onClick={() => setFilter('EXIT')} />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6 space-y-6 scrollbar-hide">
        <section>
          <div className="flex justify-between items-center mb-3 px-1">
            <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Itens no extrato ({visibleItems.length})
            </h2>
          </div>
          <div className="space-y-3 pb-20">
            {visibleItems.map(item => Array.isArray(item) ? (
              <InstallmentGroup
                key={getInstallmentGroupKey(item[0])}
                transactions={item}
                expanded={expandedGroups.has(getInstallmentGroupKey(item[0])!)}
                onToggle={() => toggleGroup(getInstallmentGroupKey(item[0])!)}
                onDelete={deleteTransaction}
                onEdit={(id) => navigate(`/transaction/edit/${id}`)}
              />
            ) : (
              <TransactionItem
                key={item.id}
                transaction={item}
                onDelete={deleteTransaction}
                onEdit={(id) => navigate(`/transaction/edit/${id}`)}
              />
            ))}
            {filtered.length === 0 && (
              <div className="text-center text-slate-400 text-sm py-12 flex flex-col items-center gap-2">
                <span className="material-symbols-outlined text-4xl text-slate-300">receipt</span>
                <p>Nenhuma movimentação encontrada neste filtro.</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Transactions;
