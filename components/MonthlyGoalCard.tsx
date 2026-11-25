import React, { useState, useEffect } from 'react';
import { formatBRL } from '../utils';

interface MonthlyGoalCardProps {
  currentDate: Date;
  balance: number;
}

const MonthlyGoalCard: React.FC<MonthlyGoalCardProps> = ({ currentDate, balance }) => {
  const monthKey = `goal_${currentDate.getFullYear()}_${currentDate.getMonth()}`;
  
  const [goal, setGoal] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(monthKey);
      return saved ? Number(saved) : 0;
    } catch {
      return 0;
    }
  });

  const [isEditing, setIsEditing] = useState(false);
  const [inputVal, setInputVal] = useState('');

  // Atualiza meta quando mudar de mês
  useEffect(() => {
    try {
      const saved = localStorage.getItem(monthKey);
      setGoal(saved ? Number(saved) : 0);
    } catch {
      setGoal(0);
    }
    setIsEditing(false);
  }, [monthKey]);

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(inputVal.replace(',', '.'));
    const cleanGoal = isNaN(parsed) || parsed < 0 ? 0 : parsed;
    setGoal(cleanGoal);
    try {
      if (cleanGoal > 0) {
        localStorage.setItem(monthKey, cleanGoal.toString());
      } else {
        localStorage.removeItem(monthKey);
      }
    } catch {}
    setIsEditing(false);
  };

  const handleStartEditing = () => {
    setInputVal(goal > 0 ? goal.toString() : '');
    setIsEditing(true);
  };

  // Cálculos de progresso
  const currentSavings = Math.max(0, balance);
  const percentage = goal > 0 ? Math.min(100, Math.round((currentSavings / goal) * 100)) : 0;
  const isGoalReached = goal > 0 && currentSavings >= goal;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-white/5 relative overflow-hidden transition-all">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <span className="material-symbols-outlined text-lg">flag</span>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Meta de Economia do Mês
            </h3>
            {goal > 0 && !isEditing && (
              <p className="text-sm font-extrabold text-slate-800 dark:text-white">
                R$ {formatBRL(goal)}
              </p>
            )}
          </div>
        </div>

        {!isEditing && (
          <button
            onClick={handleStartEditing}
            className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1 bg-primary/10 px-2.5 py-1 rounded-full active:scale-95"
          >
            <span className="material-symbols-outlined text-xs">edit</span>
            <span>{goal > 0 ? 'Alterar' : 'Definir Meta'}</span>
          </button>
        )}
      </div>

      {/* Formulário de Edição */}
      {isEditing ? (
        <form onSubmit={handleSaveGoal} className="mt-2 space-y-2 animate-fadeIn">
          <label className="text-[11px] text-slate-500 font-medium block">
            Quanto você deseja economizar neste mês?
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">R$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                placeholder="Ex: 500,00"
                autoFocus
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-2 bg-primary text-white rounded-xl text-xs font-bold shadow-md shadow-primary/20 hover:opacity-95 active:scale-95 transition-all"
            >
              Salvar
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-2.5 py-2 text-slate-400 hover:text-slate-600 text-xs font-semibold"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : goal > 0 ? (
        /* Barra de Progresso e Status */
        <div className="space-y-2 mt-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              Economizado: <strong className={balance >= 0 ? "text-emerald-500" : "text-rose-500"}>R$ {formatBRL(balance)}</strong>
            </span>
            <span className="font-extrabold text-primary">
              {percentage}%
            </span>
          </div>

          {/* Barra */}
          <div className="w-full h-3 bg-slate-100 dark:bg-slate-700/60 rounded-full overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isGoalReached
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  : 'bg-gradient-to-r from-blue-500 to-indigo-500'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>

          {/* Mensagem Motivacional */}
          <div className="flex items-center gap-1.5 pt-0.5">
            <span className="material-symbols-outlined text-sm text-amber-500">
              {isGoalReached ? 'celebration' : percentage >= 75 ? 'trending_up' : 'lightbulb'}
            </span>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
              {isGoalReached
                ? '🎉 Parabéns! Você atingiu sua meta de economia deste mês!'
                : percentage >= 50
                ? 'Ótimo ritmo! Você já passou da metade da meta.'
                : currentSavings > 0
                ? `Faltam R$ ${formatBRL(Math.max(0, goal - currentSavings))} para alcançar sua meta.`
                : 'Seu saldo está negativo ou zerado. Reduza saídas para poupar.'}
            </p>
          </div>
        </div>
      ) : (
        /* Estado Vazio convidando a definir */
        <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
          Defina uma meta de economia para este mês e acompanhe seu progresso dia a dia.
        </p>
      )}
    </div>
  );
};

export default MonthlyGoalCard;
