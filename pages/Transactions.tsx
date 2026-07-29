import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Transaction, TransactionType } from '../types';
import TransactionItem from '../components/TransactionItem';
import FilterChip from '../components/FilterChip';
import { parseDateSafe } from '../utils';

interface TransactionsProps {
  transactions: Transaction[];
  deleteTransaction: (id: string) => void;
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const Transactions: React.FC<TransactionsProps> = ({ transactions, deleteTransaction }) => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'ALL' | 'ENTRY' | 'EXIT'>('ALL');
  const [selectedMonthYear, setSelectedMonthYear] = useState<string>('ALL'); // 'ALL' ou 'YYYY-MM'
  const [search, setSearch] = useState('');

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
              Movimentações ({filtered.length})
            </h2>
          </div>
          <div className="space-y-3 pb-20">
            {filtered.map(t => (
              <TransactionItem 
                key={t.id} 
                transaction={t} 
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
