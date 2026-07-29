import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Transaction, TransactionType, TransactionCategory } from '../types';
import { formatDateToYYYYMMDD, getCustomCategories, addCustomCategory } from '../utils';
import { CategoryPicker } from '../components/CategoryPicker';

interface TransactionDetailsProps {
  onSave: (transactions: Omit<Transaction, 'id'>[]) => void;
  transactions?: Transaction[];
}

const TransactionDetails: React.FC<TransactionDetailsProps> = ({ onSave, transactions = [] }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();

  // Obter data preferencial (da URL ?date=..., do mês selecionado no Dashboard, ou data atual)
  const getInitialDate = () => {
    const queryDate = new URLSearchParams(location.search).get('date');
    if (queryDate) return queryDate;
    const savedActiveDate = sessionStorage.getItem('activeMonthDate');
    if (savedActiveDate) return savedActiveDate;
    return formatDateToYYYYMMDD(new Date());
  };
  
  const [desc, setDesc] = useState('');
  const [val, setVal] = useState('');
  const [date, setDate] = useState(getInitialDate());
  const [type, setType] = useState<TransactionType>(TransactionType.EXIT);
  
  const [customCategoriesList, setCustomCategoriesList] = useState<string[]>(() => getCustomCategories());
  const [cat, setCat] = useState<string>(TransactionCategory.FOOD);

  const [repeat, setRepeat] = useState<'NONE' | 'MONTHLY'>('NONE');
  const [launchType, setLaunchType] = useState<'FIXED' | 'INSTALLMENT'>('FIXED');
  const [installments, setInstallments] = useState('1');

  const isEditing = !!id;

  useEffect(() => {
    if (id && transactions.length > 0) {
      const existing = transactions.find(t => t.id === id);
      if (existing) {
        setDesc(existing.description);
        setVal(existing.amount.toString());
        setDate(existing.date);
        setType(existing.type);
        setCat(existing.category);
        setRepeat(existing.repetition || 'NONE');
        setLaunchType(existing.installmentType || 'FIXED');
        setInstallments(existing.installmentsCount?.toString() || '1');
      }
    }
  }, [id, transactions]);

  const handleAddCustomCategory = (newCat: string) => {
    const updated = addCustomCategory(newCat);
    setCustomCategoriesList(updated);
    return updated;
  };

  const handleSetToday = () => {
    setDate(formatDateToYYYYMMDD(new Date()));
  };

  const handleSetYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    setDate(formatDateToYYYYMMDD(d));
  };

  const handleSave = () => {
    if (!desc || !val) return;

    const finalCategory = cat || TransactionCategory.OTHERS;
    const amountPerParcel = parseFloat(val);
    
    if (isEditing) {
      onSave([{
        description: desc,
        amount: amountPerParcel,
        date: date,
        type: type,
        category: finalCategory,
        repetition: repeat,
        installmentType: launchType,
        installmentsCount: launchType === 'INSTALLMENT' ? parseInt(installments) : undefined
      }]);
    } else {
      const count = launchType === 'INSTALLMENT' ? parseInt(installments) : 1;
      const generatedTransactions: Omit<Transaction, 'id'>[] = [];

      for (let i = 0; i < count; i++) {
        const baseDate = new Date(date + "T12:00:00");
        baseDate.setMonth(baseDate.getMonth() + i);
        
        const formattedDate = formatDateToYYYYMMDD(baseDate);
        const parcelDesc = count > 1 ? `${desc} (${i + 1}/${count})` : desc;

        generatedTransactions.push({
          description: parcelDesc,
          amount: amountPerParcel,
          date: formattedDate,
          type,
          category: finalCategory,
          repetition: repeat,
          installmentType: launchType,
          installmentsCount: count > 1 ? count : undefined
        });
      }
      onSave(generatedTransactions);
    }
    
    navigate(-1);
  };

  return (
    <div className="pb-40 bg-slate-50 dark:bg-slate-900 min-h-screen">
      <header className="ios-gradient w-full px-4 py-8 text-white rounded-b-[40px] shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between relative z-10">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <span className="material-symbols-outlined">arrow_back_ios_new</span>
          </button>
          <h1 className="text-xl font-bold">{isEditing ? 'Editar Lançamento' : 'Novo Lançamento'}</h1>
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
              className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-800 border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-primary/50 transition-all dark:text-white font-medium" 
              placeholder="Ex: Compra de Celular, Aluguel, Gasolina..." 
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
              className="w-full py-4 px-3 bg-white dark:bg-slate-800 border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-primary/50 dark:text-white font-bold"
            >
              <option value={TransactionType.EXIT}>Saída</option>
              <option value={TransactionType.ENTRY}>Entrada</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">Categoria</label>
            <CategoryPicker
              value={cat}
              onChange={setCat}
              customCategories={customCategoriesList}
              onAddCustomCategory={handleAddCustomCategory}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">Valor</label>
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

        <div className="space-y-2">
          <div className="flex justify-between items-center ml-1">
            <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Data do Lançamento</label>
            <div className="flex gap-2">
              <button 
                type="button" 
                onClick={handleSetToday}
                className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md hover:bg-primary/20"
              >
                Hoje
              </button>
              <button 
                type="button" 
                onClick={handleSetYesterday}
                className="text-[10px] font-bold text-slate-500 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-md hover:bg-slate-300"
              >
                Ontem
              </button>
            </div>
          </div>
          <input 
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full px-4 py-4 bg-white dark:bg-slate-800 border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-primary/50 dark:text-white font-medium" 
            type="date" 
          />
        </div>

        {!isEditing && (
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
        )}
      </main>

      <div className="fixed bottom-0 left-0 w-full p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-white/5 z-50">
        <button 
          onClick={handleSave}
          className="ios-gradient w-full py-4 rounded-2xl text-white font-black text-lg shadow-xl active:scale-95 transition-transform flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined">{isEditing ? 'save' : 'check_circle'}</span>
          {isEditing ? 'SALVAR ALTERAÇÕES' : 'CONFIRMAR LANÇAMENTO'}
        </button>
      </div>
    </div>
  );
};

export default TransactionDetails;
