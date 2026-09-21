
import React, { useState, useMemo } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, Tooltip,
} from 'recharts';
import { Transaction, TransactionType } from '../types';
import { COLORS, CATEGORY_ICONS, CATEGORY_COLORS } from '../constants';
import { formatBRL, filterByMonth, parseDateSafe, getCustomCategoryEmoji } from '../utils';

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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

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
    const categoryMap: Record<string, { value: number; count: number }> = {};
    exits.forEach(t => {
      if (!categoryMap[t.category]) {
        categoryMap[t.category] = { value: 0, count: 0 };
      }
      categoryMap[t.category].value += t.amount;
      categoryMap[t.category].count += 1;
    });
    const categoryData = Object.entries(categoryMap)
      .map(([name, data]) => ({ name, value: data.value, count: data.count }))
      .sort((a, b) => b.value - a.value);

    return { totalExits, totalEntries, balance, categoryData, exits };
  }, [transactions, currentDate]);

  // Fluxo exibido na visão mensal: seis meses até o período selecionado.
  const recentCashFlow = useMemo(() => {
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

    return months;
  }, [transactions, currentDate]);

  // --- DADOS PARA MODO ANUAL (janeiro a dezembro do ano selecionado) ---
  const annualData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, monthIndex) => {
      const d = new Date(currentDate.getFullYear(), monthIndex, 1);
      const filtered = filterByMonth(transactions, d);
      const entries = filtered.filter(t => t.type === TransactionType.ENTRY).reduce((acc, t) => acc + t.amount, 0);
      const exits = filtered.filter(t => t.type === TransactionType.EXIT).reduce((acc, t) => acc + t.amount, 0);

      return {
        month: MONTH_SHORT[monthIndex],
        entries,
        exits,
        balance: entries - exits,
      };
    });

    // Total do ano atual
    const yearTotal = transactions.filter(t => {
      const date = parseDateSafe(t.date);
      return date.getFullYear() === currentDate.getFullYear();
    });
    const totalEntries = yearTotal.filter(t => t.type === TransactionType.ENTRY).reduce((a, t) => a + t.amount, 0);
    const exits = yearTotal.filter(t => t.type === TransactionType.EXIT);
    const totalExits = exits.reduce((a, t) => a + t.amount, 0);

    // Distribuição por categoria anual (saídas)
    const categoryMap: Record<string, { value: number; count: number }> = {};
    exits.forEach(t => {
      if (!categoryMap[t.category]) {
        categoryMap[t.category] = { value: 0, count: 0 };
      }
      categoryMap[t.category].value += t.amount;
      categoryMap[t.category].count += 1;
    });
    const categoryData = Object.entries(categoryMap)
      .map(([name, data]) => ({ name, value: data.value, count: data.count }))
      .sort((a, b) => b.value - a.value);

    return { months, totalEntries, totalExits, balance: totalEntries - totalExits, categoryData, exits };
  }, [transactions, currentDate]);

  const isMonthly = viewMode === 'monthly';
  const categoryData = isMonthly ? monthlyData.categoryData : annualData.categoryData;
  const totalExits = isMonthly ? monthlyData.totalExits : annualData.totalExits;
  const totalEntries = isMonthly ? monthlyData.totalEntries : annualData.totalEntries;
  const balance = isMonthly ? monthlyData.balance : annualData.balance;
  const cashFlowData = isMonthly ? recentCashFlow : annualData.months;
  const cashFlowPeriodLabel = isMonthly ? 'Últimos 6 meses' : `Ano de ${currentDate.getFullYear()}`;
  const periodLabel = isMonthly
    ? `${MONTH_NAMES[currentDate.getMonth()]} de ${currentDate.getFullYear()}`
    : `Ano de ${currentDate.getFullYear()}`;

  // Lista de saídas do período selecionado
  const currentPeriodExits = isMonthly ? monthlyData.exits : annualData.exits;

  // Transações da categoria selecionada para o modal de extrato
  const selectedCategoryTransactions = useMemo(() => {
    if (!selectedCategory) return [];
    return currentPeriodExits
      .filter(t => t.category === selectedCategory)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedCategory, currentPeriodExits]);

  const selectedCategoryTotal = useMemo(() => {
    return selectedCategoryTransactions.reduce((acc, t) => acc + t.amount, 0);
  }, [selectedCategoryTransactions]);

  const selectedCategoryEmoji = selectedCategory ? getCustomCategoryEmoji(selectedCategory) : undefined;

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
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Distribuição de Saídas
            </h2>
            <span className="text-[10px] text-primary dark:text-blue-400 font-medium">
              Toque para ver extrato
            </span>
          </div>

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
                      className="cursor-pointer"
                      onClick={(entry) => setSelectedCategory(entry.name)}
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

              {/* Legenda interativa por categoria */}
              <div className="space-y-2.5 mt-6">
                {categoryData.map((cat, idx) => {
                  const pct = totalExits > 0 ? ((cat.value / totalExits) * 100).toFixed(1) : '0';
                  const color = CHART_COLORS[idx % CHART_COLORS.length];
                  const emoji = getCustomCategoryEmoji(cat.name);
                  return (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => setSelectedCategory(cat.name)}
                      className="w-full flex items-center gap-3 p-3.5 bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 active:scale-[0.99] rounded-2xl transition-all border border-transparent hover:border-slate-200 dark:hover:border-white/10 text-left group"
                    >
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}20` }}>
                        {emoji ? (
                          <span className="text-lg">{emoji}</span>
                        ) : (
                          <span className="material-symbols-outlined text-lg" style={{ color }}>
                            {CATEGORY_ICONS[cat.name] || 'category'}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate group-hover:text-primary transition-colors">
                            {cat.name}
                          </p>
                          <span className="text-[9px] font-semibold text-slate-400 bg-slate-200/60 dark:bg-white/10 px-1.5 py-0.5 rounded-full shrink-0">
                            {cat.count} {cat.count === 1 ? 'item' : 'itens'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-12 bg-slate-200 dark:bg-white/10 rounded-full h-1 overflow-hidden shrink-0">
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }}></div>
                          </div>
                          <p className="text-[10px] text-slate-400 font-medium">{pct}% do total</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 flex items-center gap-2">
                        <div>
                          <p className="text-xs font-black text-slate-800 dark:text-white">R$ {formatBRL(cat.value)}</p>
                          <p className="text-[9px] text-primary dark:text-blue-400 font-semibold mt-0.5">ver extrato</p>
                        </div>
                        <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 group-hover:text-primary group-hover:translate-x-0.5 transition-all text-base">
                          chevron_right
                        </span>
                      </div>
                    </button>
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

        {/* Gráfico de Barras — fluxo de caixa */}
        <section>
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-lg font-bold">Fluxo de Caixa</h2>
            <span className="text-xs text-primary font-bold">{cashFlowPeriodLabel}</span>
          </div>
          <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashFlowData} barGap={2}>
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
            <button
              type="button"
              onClick={() => setSelectedCategory(categoryData[0].name)}
              className="w-full text-left rounded-2xl p-4 flex items-center gap-4 transition-transform active:scale-[0.99]"
              style={{ backgroundColor: `${CHART_COLORS[0]}15` }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${CHART_COLORS[0]}30` }}
              >
                <span className="material-symbols-outlined text-xl" style={{ color: CHART_COLORS[0] }}>
                  trending_down
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-slate-700 dark:text-slate-200 truncate">{categoryData[0].name}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {totalExits > 0 ? ((categoryData[0].value / totalExits) * 100).toFixed(1) : 0}% do total • {categoryData[0].count} {categoryData[0].count === 1 ? 'despesa' : 'despesas'}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-black text-sm" style={{ color: CHART_COLORS[0] }}>
                  R$ {formatBRL(categoryData[0].value)}
                </p>
                <span className="text-[9px] font-semibold text-primary dark:text-blue-400">ver detalhes →</span>
              </div>
            </button>
          </section>
        )}
      </main>

      {/* Modal / Extrato Detalhado da Categoria Selecionada */}
      {selectedCategory && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedCategory(null)}
        >
          <div 
            className="bg-white dark:bg-slate-900 w-full max-w-lg max-h-[85vh] rounded-t-[32px] sm:rounded-3xl p-6 shadow-2xl flex flex-col animate-in slide-in-from-bottom-6 duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Barra de arraste no mobile */}
            <div className="w-12 h-1.5 bg-slate-200 dark:bg-white/10 rounded-full mx-auto mb-4 sm:hidden"></div>

            {/* Cabeçalho do Extrato */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/10">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${CATEGORY_COLORS[selectedCategory] || 'bg-blue-500/20 text-blue-500'}`}>
                  {selectedCategoryEmoji ? (
                    <span className="text-2xl">{selectedCategoryEmoji}</span>
                  ) : (
                    <span className="material-symbols-outlined text-2xl">
                      {CATEGORY_ICONS[selectedCategory] || 'receipt'}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white truncate">
                    {selectedCategory}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    Extrato • {periodLabel}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                className="w-9 h-9 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/20 transition-colors shrink-0 ml-2"
                title="Fechar"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Resumo do Valor Total */}
            <div className="my-4 p-4 rounded-2xl bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/20 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">Total Gasto na Categoria</p>
                <p className="text-xl font-black text-rose-600 dark:text-rose-400 mt-0.5">
                  R$ {formatBRL(selectedCategoryTotal)}
                </p>
              </div>
              <div className="text-right">
                <span className="inline-block text-xs font-bold px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-700 dark:text-rose-300">
                  {selectedCategoryTransactions.length} {selectedCategoryTransactions.length === 1 ? 'lançamento' : 'lançamentos'}
                </span>
              </div>
            </div>

            {/* Lista de Gastos / Extrato */}
            <div className="overflow-y-auto flex-1 pr-1 space-y-2.5 my-2 divide-y divide-slate-100 dark:divide-white/5">
              {selectedCategoryTransactions.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">
                  Nenhum gasto encontrado para esta categoria no período.
                </div>
              ) : (
                selectedCategoryTransactions.map((item) => {
                  const isInstallment = !!(item.installmentGroupId || (item.installmentType === 'INSTALLMENT' && item.installmentsCount && item.installmentsCount > 1));
                  // Formatando data DD/MM/YYYY
                  const d = parseDateSafe(item.date);
                  const formattedDate = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

                  return (
                    <div key={item.id} className="pt-2.5 first:pt-0 flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                          {item.description}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-[10px] text-slate-400 font-medium">
                            {formattedDate}
                          </span>
                          {isInstallment && (
                            <span className="text-[9px] font-bold bg-blue-500/10 text-blue-500 px-1.5 py-0.2 rounded-full">
                              PARCELADO
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-black text-rose-500">
                          - R$ {formatBRL(item.amount)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Rodapé do Modal */}
            <div className="pt-4 border-t border-slate-100 dark:border-white/10 mt-auto">
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                className="w-full py-3 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-sm transition-colors"
              >
                Fechar Extrato
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;

