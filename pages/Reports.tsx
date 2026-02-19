
import React, { useState, useMemo } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, Tooltip,
} from 'recharts';
import { Transaction, TransactionType } from '../types';
import { COLORS } from '../constants';
import { formatBRL, filterByMonth } from '../utils';

interface ReportsProps {
  transactions: Transaction[];
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const MONTH_SHORT = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

const CHART_COLORS = [COLORS.blue, COLORS.emerald, COLORS.amber, COLORS.rose, '#60a5fa', '#a78bfa', '#34d399', '#fb923c'];

type ViewMode = 'monthly' | 'annual';

const Reports: React.FC<ReportsProps> = ({ transactions }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');
  const [currentDate, setCurrentDate] = useState(new Date());

  const handlePrevMonth = () =>
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  const handleNextMonth = () =>
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));

  const handlePrevYear = () =>
    setCurrentDate(prev => new Date(prev.getFullYear() - 1, prev.getMonth(), 1));
  const handleNextYear = () =>
    setCurrentDate(prev => new Date(prev.getFullYear() + 1, prev.getMonth(), 1));

  // --- DADOS PARA MODO MENSAL ---
  const monthlyData = useMemo(() => {
    const filtered = filterByMonth(transactions, currentDate);
    const exits = filtered.filter(t => t.type === TransactionType.EXIT);
    const entries = filtered.filter(t => t.type === TransactionType.ENTRY);

    const totalExits = exits.reduce((acc, t) => acc + t.amount, 0);
    const totalEntries = entries.reduce((acc, t) => acc + t.amount, 0);
    const balance = totalEntries - totalExits;

    // Distribuição por categoria (saídas)
    const categoryMap: Record<string, number> = {};
    exits.forEach(t => {
      categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
    });
    const categoryData = Object.entries(categoryMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return { totalExits, totalEntries, balance, categoryData };
  }, [transactions, currentDate]);

  // --- DADOS PARA MODO ANUAL (últimos 6 meses calculados) ---
  const annualData = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const filtered = filterByMonth(transactions, d);
      const entries = filtered.filter(t => t.type === TransactionType.ENTRY).reduce((acc, t) => acc + t.amount, 0);
      const exits = filtered.filter(t => t.type === TransactionType.EXIT).reduce((acc, t) => acc + t.amount, 0);
      months.push({
        month: MONTH_SHORT[d.getMonth()],
        entries,
        exits,
        balance: entries - exits,
      });
    }

    // Total do ano atual
    const yearTotal = transactions.filter(t => {
      const date = new Date(t.date);
      return date.getFullYear() === currentDate.getFullYear();
    });
    const totalEntries = yearTotal.filter(t => t.type === TransactionType.ENTRY).reduce((a, t) => a + t.amount, 0);
    const totalExits = yearTotal.filter(t => t.type === TransactionType.EXIT).reduce((a, t) => a + t.amount, 0);

    // Distribuição por categoria anual (saídas)
    const categoryMap: Record<string, number> = {};
    yearTotal.filter(t => t.type === TransactionType.EXIT).forEach(t => {
      categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
    });
    const categoryData = Object.entries(categoryMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return { months, totalEntries, totalExits, balance: totalEntries - totalExits, categoryData };
  }, [transactions, currentDate]);

  const isMonthly = viewMode === 'monthly';
  const categoryData = isMonthly ? monthlyData.categoryData : annualData.categoryData;
  const totalExits = isMonthly ? monthlyData.totalExits : annualData.totalExits;
  const totalEntries = isMonthly ? monthlyData.totalEntries : annualData.totalEntries;
  const balance = isMonthly ? monthlyData.balance : annualData.balance;

  return (
    <div className="pb-24">
      <header className="ios-gradient pt-12 pb-6 px-6 rounded-b-3xl shadow-lg">
        {/* Navegação de período */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={isMonthly ? handlePrevMonth : handlePrevYear}
            className="text-white/80 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-2xl">chevron_left</span>
          </button>
          <div className="text-center">
            <h1 className="text-xl font-bold text-white font-display uppercase tracking-widest">
              {isMonthly
                ? `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`
                : `${currentDate.getFullYear()}`}
            </h1>
            <p className="text-blue-100/70 text-[10px] uppercase font-bold mt-1">Relatórios Financeiros</p>
          </div>
          <button
            onClick={isMonthly ? handleNextMonth : handleNextYear}
            className="text-white/80 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-2xl">chevron_right</span>
          </button>
        </div>

        {/* Toggle Mensal / Anual */}
        <div className="bg-black/20 p-1 rounded-xl flex items-center">
          <button
            onClick={() => setViewMode('monthly')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${isMonthly ? 'bg-white text-primary shadow-sm' : 'text-white/80'}`}
          >
            Mensal
          </button>
          <button
            onClick={() => setViewMode('annual')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${!isMonthly ? 'bg-white text-primary shadow-sm' : 'text-white/80'}`}
          >
            Anual
          </button>
        </div>
      </header>

      <main className="px-6 py-8 space-y-10">

        {/* Cards de resumo */}
        <div className="grid grid-cols-3 gap-3 -mt-2">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-3 shadow-sm border border-slate-100 dark:border-white/5 text-center">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Entradas</p>
            <p className="text-emerald-500 font-black text-xs">R$ {formatBRL(totalEntries)}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-3 shadow-sm border border-slate-100 dark:border-white/5 text-center">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Saídas</p>
            <p className="text-rose-500 font-black text-xs">R$ {formatBRL(totalExits)}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-3 shadow-sm border border-slate-100 dark:border-white/5 text-center">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Saldo</p>
            <p className={`font-black text-xs ${balance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              R$ {formatBRL(balance)}
            </p>
          </div>
        </div>

        {/* Gráfico de Pizza — distribuição por categoria */}
        <section className="text-center">
          <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-6 uppercase tracking-wider">
            Distribuição de Saídas
          </h2>
          {categoryData.length > 0 ? (
            <>
              <div className="h-56 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [`R$ ${formatBRL(value)}`, 'Valor']}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                  <p className="text-[10px] text-slate-400 font-medium">Total Gasto</p>
                  <p className="text-lg font-black text-slate-700 dark:text-white">R$ {formatBRL(totalExits)}</p>
                </div>
              </div>

              {/* Legenda por categoria */}
              <div className="space-y-2 mt-6">
                {categoryData.map((cat, idx) => {
                  const pct = totalExits > 0 ? ((cat.value / totalExits) * 100).toFixed(1) : '0';
                  const color = CHART_COLORS[idx % CHART_COLORS.length];
                  return (
                    <div key={cat.name} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-white/5 rounded-xl">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }}></div>
                      <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 flex-1 text-left">{cat.name}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{pct}%</p>
                      <p className="text-xs font-bold text-slate-700 dark:text-white">R$ {formatBRL(cat.value)}</p>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="py-12 flex flex-col items-center gap-2">
              <span className="material-symbols-outlined text-slate-200 text-5xl">donut_large</span>
              <p className="text-slate-400 text-sm">Nenhuma saída registrada neste período.</p>
            </div>
          )}
        </section>

        {/* Gráfico de Barras — fluxo de caixa (últimos 6 meses, dados reais) */}
        <section>
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-lg font-bold">Fluxo de Caixa</h2>
            <span className="text-xs text-primary font-bold">Últimos 6 meses</span>
          </div>
          <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={annualData.months} barGap={2}>
                <XAxis dataKey="month" fontSize={9} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', fontSize: '11px' }}
                  formatter={(value: number, name: string) => [
                    `R$ ${formatBRL(value)}`,
                    name === 'entries' ? 'Entradas' : 'Saídas',
                  ]}
                />
                <Bar dataKey="entries" name="Entradas" fill={COLORS.emerald} radius={[4, 4, 0, 0]} barSize={10} />
                <Bar dataKey="exits" name="Saídas" fill={COLORS.rose} radius={[4, 4, 0, 0]} barSize={10} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex justify-center gap-6">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.emerald }}></div>
              <span className="text-[10px] font-semibold uppercase text-slate-500">Entradas</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.rose }}></div>
              <span className="text-[10px] font-semibold uppercase text-slate-500">Saídas</span>
            </div>
          </div>
        </section>

        {/* Top transações do período */}
        {categoryData.length > 0 && (
          <section>
            <h2 className="text-lg font-bold mb-4">
              Maior Categoria {isMonthly ? 'do Mês' : 'do Ano'}
            </h2>
            <div
              className="rounded-2xl p-4 flex items-center gap-4"
              style={{ backgroundColor: `${CHART_COLORS[0]}20` }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${CHART_COLORS[0]}30` }}
              >
                <span className="material-symbols-outlined text-xl" style={{ color: CHART_COLORS[0] }}>
                  trending_down
                </span>
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm text-slate-700 dark:text-slate-200">{categoryData[0].name}</p>
                <p className="text-[10px] text-slate-400">
                  {totalExits > 0 ? ((categoryData[0].value / totalExits) * 100).toFixed(1) : 0}% do total de saídas
                </p>
              </div>
              <p className="font-black text-sm" style={{ color: CHART_COLORS[0] }}>
                R$ {formatBRL(categoryData[0].value)}
              </p>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default Reports;
