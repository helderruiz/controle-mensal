
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Transaction, TransactionType } from '../types';
import TransactionItem from '../components/TransactionItem';
import FilterChip from '../components/FilterChip';

interface TransactionsProps {
  transactions: Transaction[];
  deleteTransaction: (id: string) => void;
}

const Transactions: React.FC<TransactionsProps> = ({ transactions, deleteTransaction }) => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'ALL' | 'ENTRY' | 'EXIT'>('ALL');
  const [search, setSearch] = useState('');

  const filtered = transactions.filter(t => {
    const matchesFilter =
      filter === 'ALL' ||
      t.type === (filter === 'ENTRY' ? TransactionType.ENTRY : TransactionType.EXIT);
    const matchesSearch =
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden">
      <header className="flex-shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="px-4 pt-6 pb-2 flex items-center justify-between">
          <h1 className="text-lg font-bold tracking-tight">Extrato Detalhado</h1>
          <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-white/10">
            <span className="material-symbols-outlined">download</span>
          </button>
        </div>

        <div className="px-4 py-4 flex gap-3">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">search</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-100 dark:bg-white/5 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/50"
              placeholder="Buscar transação..."
              type="text"
            />
          </div>
        </div>

        <div className="flex gap-2 px-4 pb-4 overflow-x-auto hide-scrollbar">
          <FilterChip active={filter === 'ALL'} label="Tudo" onClick={() => setFilter('ALL')} />
          <FilterChip active={filter === 'ENTRY'} label="Entradas" onClick={() => setFilter('ENTRY')} />
          <FilterChip active={filter === 'EXIT'} label="Saídas" onClick={() => setFilter('EXIT')} />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6 space-y-6 scrollbar-hide">
        <section>
          <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 px-1">
            Minhas Movimentações
          </h2>
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
              <p className="text-center text-slate-400 text-sm py-10 italic">Nenhum resultado encontrado.</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Transactions;
