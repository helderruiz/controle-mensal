import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Transaction, TransactionType, TransactionCategory } from '../types';
import { filterByMonth, formatBRL, formatDateToYYYYMMDD, parseDateSafe, getCustomCategories, addCustomCategory, parseCurrencyInput } from '../utils';
import SummaryCard from '../components/SummaryCard';
import TransactionItem from '../components/TransactionItem';
import { CategoryPicker } from '../components/CategoryPicker';

interface DashboardProps {
  transactions: Transaction[];
  addTransaction: (t: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string, deleteSeries?: boolean) => void;
}

const months = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const Dashboard: React.FC<DashboardProps> = ({ transactions, addTransaction, deleteTransaction }) => {
  const navigate = useNavigate();
  const today = new Date();
  
  const [currentDate, setCurrentDate] = useState(() => {
    const saved = sessionStorage.getItem('activeMonthDate');
    return saved ? parseDateSafe(saved) : new Date();
  });

  const [quickDate, setQuickDate] = useState<string>(() => {
    return formatDateToYYYYMMDD(currentDate);
  });

  const [desc, setDesc] = useState('');
  const [val, setVal] = useState('');
  const [type, setType] = useState<TransactionType>(TransactionType.EXIT);
  const [category, setCategory] = useState<string>(TransactionCategory.FOOD);
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  // Lista combinada de categorias (padrão + customizadas do localStorage)
  const [customCategories, setCustomCategories] = useState<string[]>(() => getCustomCategories());

  const handleAddCustomCategory = (newCat: string, emoji: string) => {
    const updated = addCustomCategory(newCat, emoji);
    setCustomCategories(updated);
    return updated;
  };

  // Recarregar categorias caso o usuário navegue ou mude algo
  useEffect(() => {
    setCustomCategories(getCustomCategories());
  }, []);

  // Atualiza quickDate e sessionStorage sempre que o mês ativo muda
  useEffect(() => {
    const isCurrentMonth = 
      currentDate.getMonth() === today.getMonth() && 
      currentDate.getFullYear() === today.getFullYear();
    
    const newQuickDate = isCurrentMonth 
      ? formatDateToYYYYMMDD(today)
      : formatDateToYYYYMMDD(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));
    
    setQuickDate(newQuickDate);
    sessionStorage.setItem('activeMonthDate', newQuickDate);
  }, [currentDate]);

  const handlePrevMonth = () =>
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));

  const handleNextMonth = () =>
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));

  const handleSelectMonthYear = (monthIndex: number, year: number) => {
    setCurrentDate(new Date(year, monthIndex, 1));
    setShowMonthPicker(false);
  };

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
    const amount = parseCurrencyInput(val);
    if (!desc || amount === null || amount <= 0) return;
    addTransaction({
      description: desc,
      amount,
      date: quickDate,
      type,
      category: category || TransactionCategory.OTHERS
    });
    setDesc('');
    setVal('');
  };

  const currentMonthTransactions = filteredTransactions;

  // Gerar anos para o modal de seleção (ano atual +/- 3 anos)
  const currentYear = currentDate.getFullYear();
  const availableYears = Array.from({ length: 7 }, (_, i) => currentYear - 3 + i);

  return (
    <div className="pb-24 relative">
      <header className="ios-gradient pt-12 pb-20 px-6 rounded-b-[40px] shadow-lg">
        <div className="flex items-center justify-between mb-8">
          <button onClick={handlePrevMonth} className="text-white/80 hover:text-white transition-colors p-1">
            <span className="material-symbols-outlined text-3xl">chevron_left</span>
          </button>
          
          <button 
            onClick={() => setShowMonthPicker(true)}
            className="text-center group flex flex-col items-center cursor-pointer hover:opacity-90 transition-opacity"
          >
            <div className="flex items-center gap-1.5">
              <h1 className="text-white text-xl font-bold font-display uppercase tracking-widest">
                {months[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h1>
              <span className="material-symbols-outlined text-white/80 text-sm group-hover:translate-y-0.5 transition-transform">
                calendar_month
              </span>
            </div>
            <p className="text-blue-100 text-[10px] opacity-80 uppercase font-bold mt-0.5 bg-white/10 px-2 py-0.5 rounded-full">
              Alterar Mês
            </p>
          </button>

          <button onClick={handleNextMonth} className="text-white/80 hover:text-white transition-colors p-1">
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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className="material-symbols-outlined text-primary text-xl font-bold">add_circle</span>
            <h2 className="text-lg font-bold">Rápido Lançamento</h2>
          </div>
          <button 
            onClick={() => navigate(`/transaction/new?date=${quickDate}`)}
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
          >
            Lançamento Completo
            <span className="material-symbols-outlined text-sm">open_in_new</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
          <div>
            <input
              value={desc}
              onChange={e => setDesc(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl focus:ring-2 focus:ring-primary text-sm p-3 placeholder:text-slate-400 dark:placeholder:text-slate-600 dark:text-white"
              placeholder="O que você gastou ou recebeu?"
              type="text"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">R$</span>
              <input
                value={val}
                onChange={e => setVal(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl focus:ring-2 focus:ring-primary text-xs p-3.5 pl-8 dark:text-white font-bold"
                placeholder="0,00"
                type="text"
                inputMode="decimal"
                aria-label="Valor do lançamento"
              />
            </div>

            <select
              value={type}
              onChange={e => setType(e.target.value as TransactionType)}
              className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl focus:ring-2 focus:ring-primary text-xs p-3.5 dark:text-white font-bold"
            >
              <option value={TransactionType.EXIT}>Saída</option>
              <option value={TransactionType.ENTRY}>Entrada</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Categoria</label>
            <CategoryPicker
              value={category}
              onChange={setCategory}
              customCategories={customCategories}
              onAddCustomCategory={handleAddCustomCategory}
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 whitespace-nowrap">Data do lançamento:</span>
            <input
              type="date"
              value={quickDate}
              onChange={e => setQuickDate(e.target.value)}
              className="flex-1 bg-slate-50 dark:bg-slate-900 border-none rounded-xl focus:ring-2 focus:ring-primary text-xs p-2.5 dark:text-white font-medium"
            />
          </div>

          <button type="submit" className="w-full ios-gradient text-white font-bold py-3.5 rounded-xl shadow-lg active:scale-[0.98] transition-transform flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-lg">check</span>
            REGISTRAR LANÇAMENTO
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
        <div className="max-h-[400px] overflow-y-auto pr-1 scrollbar-hide">
          <div className="space-y-3">
            {currentMonthTransactions.map(t => (
              <TransactionItem 
                key={t.id} 
                transaction={t} 
                onDelete={deleteTransaction} 
                onEdit={(id) => navigate(`/transaction/edit/${id}`)}
                iconSize="sm" 
              />
            ))}
            {currentMonthTransactions.length === 0 && (
              <div className="text-center py-8">
                <span className="material-symbols-outlined text-slate-200 text-5xl">inventory_2</span>
                <p className="text-center text-slate-400 text-sm mt-2">Sem registros em {months[currentDate.getMonth()]}.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Modal de Seleção Direta de Mês e Ano */}
      {showMonthPicker && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold dark:text-white">Selecionar Mês e Ano</h3>
              <button 
                onClick={() => setShowMonthPicker(false)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="mb-4">
              <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Ano</label>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {availableYears.map(year => (
                  <button
                    key={year}
                    onClick={() => handleSelectMonthYear(currentDate.getMonth(), year)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all ${
                      year === currentDate.getFullYear()
                        ? 'bg-primary text-white shadow-md'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Mês</label>
              <div className="grid grid-cols-3 gap-2">
                {months.map((monthName, idx) => (
                  <button
                    key={monthName}
                    onClick={() => handleSelectMonthYear(idx, currentDate.getFullYear())}
                    className={`p-3 rounded-2xl text-xs font-bold transition-all text-center ${
                      idx === currentDate.getMonth()
                        ? 'bg-primary text-white shadow-md'
                        : 'bg-slate-50 dark:bg-slate-700/50 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {monthName.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-between gap-2">
              <button
                onClick={() => handleSelectMonthYear(today.getMonth(), today.getFullYear())}
                className="flex-1 py-2.5 text-xs font-bold text-primary bg-primary/10 rounded-xl hover:bg-primary/20"
              >
                Mês Atual
              </button>
              <button
                onClick={() => setShowMonthPicker(false)}
                className="flex-1 py-2.5 text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-700 rounded-xl"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="mt-12 mb-4 text-center">
        <p className="text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-widest font-bold">Desenvolvido por VirtualZ</p>
      </footer>
    </div>
  );
};

export default Dashboard;
