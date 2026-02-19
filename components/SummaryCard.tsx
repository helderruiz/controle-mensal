
import React from 'react';

interface SummaryCardProps {
  label: string;
  value: number;
  color: string;
  icon: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ label, value, color, icon }) => (
  <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-md border border-slate-100 dark:border-slate-700 flex flex-col items-center">
    <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${color.replace('text-', 'bg-').replace('600', '50').replace('400', '900/20')}`}>
      <span className={`material-symbols-outlined text-sm ${color}`}>{icon}</span>
    </div>
    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{label}</p>
    <p className={`${color} font-black text-sm mt-1`}>
      R$ {value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
    </p>
  </div>
);

export default SummaryCard;
