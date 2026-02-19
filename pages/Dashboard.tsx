
import React, { useState } from 'react';
import { Transaction, TransactionType, TransactionCategory } from '../types';
import { filterByMonth, formatBRL } from '../utils';
import SummaryCard from '../components/SummaryCard';
import TransactionItem from '../components/TransactionItem';

interface DashboardProps {
  transactions: Transaction[];
  addTransaction: (t: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
}

const months = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const Dashboard: React.FC<DashboardProps> = ({ transactions, addTransaction, deleteTransaction }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [desc, setDesc] = useState('');
  const [val, setVal] = useState('');
  const [type, setType] = useState<TransactionType>(TransactionType.ENTRY);

  const handlePrevMonth = () =>
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));

  const handleNextMonth = () =>
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));

  const filteredTransactions = filterByMonth(transactions, currentDate);

  const entries = filteredTransactions
    .filter(t => t.type === TransactionType.ENTRY)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const exits = filteredTransactions
    .filter(t => t.type === TransactionType.EXIT)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const balance = entries - exits;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc || !val) return;
    addTransaction({
      description: desc,
      amount: parseFloat(val),
      date: new Date().toISOString().split('T')[0],
      type,
      category: TransactionCategory.OTHERS
    });
    setDesc('');
    setVal('');
  };

  const recentTransactions = filteredTransactions.slice(0, 5);

  return (
    <div className="pb-24">
      <header className="ios-gradient pt-12 pb-20 px-6 rounded-b-[40px] shadow-lg">
        <div className="flex items-center justify-between mb-8">
          <button onClick={handlePrevMonth} className="text-white/80 hover:text-white transition-colors">
            <span className="material-symbols-outlined text-3xl">chevron_left</span>
          </button>
          <div className="text-center">
            <h1 className="text-white text-xl font-bold font-display uppercase tracking-widest">
              {months[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h1>
            <p className="text-blue-100 text-[10px] opacity-70 uppercase font-bold mt-1">Visão Mensal</p>
          </div>
          <button onClick={handleNextMonth} className="text-white/80 hover:text-white transition-colors">
            <span className="material-symbols-outlined text-3xl">chevron_right</span>
          </button>
        </div>

        <div className="flex flex-col items-center">
          <p className="text-blue-100/70 text-xs font-bold uppercase mb-1">Saldo do Mês</p>
          <p className="text-white text-4xl font-extrabold tracking-tighter">
            R$ {formatBRL(balance)}
          </p>
        </div>
      </header>

      <div className="px-4 -mt-12">
        <div className="grid grid-cols-2 gap-4">
          <SummaryCard label="Entradas" value={entries} color="text-emerald-600 dark:text-emerald-400" icon="trending_up" />
          <SummaryCard label="Saídas" value={exits} color="text-rose-600 dark:text-rose-400" icon="trending_down" />
        </div>
      </div>

      <section className="mt-8 px-6">
        <div className="flex items-center space-x-2 mb-4">
          <span className="material-symbols-outlined text-primary text-xl font-bold">add_circle</span>
          <h2 className="text-lg font-bold">Rápido Lançamento</h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
          <div>
            <input
              value={desc}
              onChange={e => setDesc(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl focus:ring-2 focus:ring-primary text-sm p-3 placeholder:text-slate-400 dark:placeholder:text-slate-600"
              placeholder="O que você gastou hoje?"
              type="text"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">R$</span>
              <input
                value={val}
                onChange={e => setVal(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl focus:ring-2 focus:ring-primary text-sm p-3 pl-9"
                placeholder="0,00"
                type="number"
                step="0.01"
              />
            </div>
            <select
              value={type}
              onChange={e => setType(e.target.value as TransactionType)}
              className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl focus:ring-2 focus:ring-primary text-sm p-3"
            >
              <option value={TransactionType.ENTRY}>Entrada</option>
              <option value={TransactionType.EXIT}>Saída</option>
            </select>
          </div>
          <button type="submit" className="w-full ios-gradient text-white font-bold py-3.5 rounded-xl shadow-lg active:scale-[0.98] transition-transform">
            REGISTRAR
          </button>
        </form>
      </section>

      <section className="mt-8 px-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className="material-symbols-outlined text-primary text-xl">list_alt</span>
            <h2 className="text-lg font-bold">Transações de {months[currentDate.getMonth()]}</h2>
          </div>
        </div>
        <div className="space-y-3">
          {recentTransactions.map(t => (
            <TransactionItem key={t.id} transaction={t} onDelete={deleteTransaction} iconSize="sm" />
          ))}
          {recentTransactions.length === 0 && (
            <div className="text-center py-8">
              <span className="material-symbols-outlined text-slate-200 text-5xl">inventory_2</span>
              <p className="text-center text-slate-400 text-sm mt-2">Sem registros este mês.</p>
            </div>
          )}
        </div>
      </section>

      <footer className="mt-12 mb-4 text-center">
        <p className="text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-widest font-bold">Desenvolvido por VirtualZ</p>
      </footer>
    </div>
  );
};

export default Dashboard;
