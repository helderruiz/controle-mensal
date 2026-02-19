
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Transaction, TransactionType, TransactionCategory } from '../types';

interface TransactionDetailsProps {
  onSave: (transactions: Omit<Transaction, 'id'>[]) => void;
}

const TransactionDetails: React.FC<TransactionDetailsProps> = ({ onSave }) => {
  const navigate = useNavigate();
  const [desc, setDesc] = useState('');
  const [val, setVal] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<TransactionType>(TransactionType.EXIT);
  const [cat, setCat] = useState<TransactionCategory>(TransactionCategory.FOOD);
  const [repeat, setRepeat] = useState<'NONE' | 'MONTHLY'>('NONE');
  const [launchType, setLaunchType] = useState<'FIXED' | 'INSTALLMENT'>('FIXED');
  const [installments, setInstallments] = useState('1');

  const handleSave = () => {
    if (!desc || !val) return;

    const amountPerParcel = parseFloat(val);
    const count = launchType === 'INSTALLMENT' ? parseInt(installments) : 1;
    const generatedTransactions: Omit<Transaction, 'id'>[] = [];

    // Gerar N transações para os meses seguintes
    for (let i = 0; i < count; i++) {
      const baseDate = new Date(date + "T12:00:00"); // Meio-dia para evitar problemas de fuso
      baseDate.setMonth(baseDate.getMonth() + i);
      
      const formattedDate = baseDate.toISOString().split('T')[0];
      const parcelDesc = count > 1 ? `${desc} (${i + 1}/${count})` : desc;

      generatedTransactions.push({
        description: parcelDesc,
        amount: amountPerParcel,
        date: formattedDate,
        type,
        category: cat,
        repetition: repeat,
        installmentType: launchType,
        installmentsCount: count > 1 ? count : undefined
      });
    }

    onSave(generatedTransactions);
    navigate('/');
  };

  return (
    <div className="pb-40 bg-slate-50 dark:bg-slate-900 min-h-screen">
      <header className="ios-gradient w-full px-4 py-8 text-white rounded-b-[40px] shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between relative z-10">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <span className="material-symbols-outlined">arrow_back_ios_new</span>
          </button>
          <h1 className="text-xl font-bold">Novo Lançamento</h1>
          <div className="w-10"></div>
        </div>
      </header>

      <main className="px-6 py-8 space-y-6">
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">Descrição</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">edit_note</span>
            <input 
              value={desc}
              onChange={e => setDesc(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-800 border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-primary/50 transition-all dark:text-white" 
              placeholder="Ex: Compra de Celular, Aluguel..." 
              type="text" 
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">Tipo</label>
            <select 
              value={type}
              onChange={e => setType(e.target.value as TransactionType)}
              className="w-full py-4 bg-white dark:bg-slate-800 border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-primary/50"
            >
              <option value={TransactionType.EXIT}>Saída</option>
              <option value={TransactionType.ENTRY}>Entrada</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">Categoria</label>
            <select 
              value={cat}
              onChange={e => setCat(e.target.value as TransactionCategory)}
              className="w-full py-4 bg-white dark:bg-slate-800 border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-primary/50"
            >
              {Object.values(TransactionCategory).map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">Valor da Parcela</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
            <input 
              value={val}
              onChange={e => setVal(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-800 border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-primary/50 font-black text-2xl dark:text-white" 
              placeholder="0,00" 
              type="number"
              step="0.01"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">Data de Início</label>
          <input 
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full px-4 py-4 bg-white dark:bg-slate-800 border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-primary/50 dark:text-white" 
            type="date" 
          />
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm space-y-4">
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-white/5 pb-2">Forma de Lançamento</p>
          <div className="flex gap-4">
            <button 
              onClick={() => setLaunchType('FIXED')}
              className={`flex-1 p-3 rounded-2xl border-2 transition-all font-bold text-xs ${launchType === 'FIXED' ? 'border-primary bg-primary/5 text-primary' : 'border-slate-50 dark:border-white/5 text-slate-400'}`}
            >
              Único / Fixo
            </button>
            <button 
              onClick={() => setLaunchType('INSTALLMENT')}
              className={`flex-1 p-3 rounded-2xl border-2 transition-all font-bold text-xs ${launchType === 'INSTALLMENT' ? 'border-primary bg-primary/5 text-primary' : 'border-slate-50 dark:border-white/5 text-slate-400'}`}
            >
              Parcelado
            </button>
          </div>

          {launchType === 'INSTALLMENT' && (
            <div className="pt-4 border-t border-slate-50 dark:border-white/5 animate-in fade-in slide-in-from-top-2">
               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Quantidade de Parcelas</label>
               <div className="flex items-center gap-3 mt-1">
                 <input 
                  value={installments}
                  onChange={e => setInstallments(e.target.value)}
                  className="flex-1 p-4 bg-slate-50 dark:bg-slate-900 border-none rounded-xl focus:ring-2 focus:ring-primary dark:text-white font-bold"
                  type="number"
                  min="1"
                  max="48"
                 />
                 <span className="text-xs font-bold text-slate-400">meses</span>
               </div>
               <p className="text-[10px] text-blue-500 mt-2 font-medium italic">
                 * Serão criados {installments} lançamentos automáticos nos próximos meses.
               </p>
            </div>
          )}
        </div>
      </main>

      <div className="fixed bottom-0 left-0 w-full p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-white/5 z-50">
        <button 
          onClick={handleSave}
          className="ios-gradient w-full py-4 rounded-2xl text-white font-black text-lg shadow-xl active:scale-95 transition-transform flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined">check_circle</span>
          CONFIRMAR LANÇAMENTO
        </button>
      </div>
    </div>
  );
};

export default TransactionDetails;
