
import React from 'react';

interface FormFieldProps {
  label: string;
  icon: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  /** Slot extra no lado direito do input (ex: botão de ver senha) */
  rightSlot?: React.ReactNode;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  icon,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  rightSlot,
}) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
      {label}
    </label>
    <div className="relative group">
      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
        {icon}
      </span>
      <input
        required={required}
        value={value}
        onChange={onChange}
        className="w-full pl-12 pr-4 py-4 bg-slate-100 dark:bg-white/5 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all dark:text-white"
        placeholder={placeholder}
        type={type}
      />
      {rightSlot && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          {rightSlot}
        </div>
      )}
    </div>
  </div>
);

export default FormField;
