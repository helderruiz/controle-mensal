
import React from 'react';

interface FilterChipProps {
  active: boolean;
  label: string;
  onClick: () => void;
}

const FilterChip: React.FC<FilterChipProps> = ({ active, label, onClick }) => (
  <button
    onClick={onClick}
    className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
      active
        ? 'bg-primary text-white'
        : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300'
    }`}
  >
    {label}
  </button>
);

export default FilterChip;
