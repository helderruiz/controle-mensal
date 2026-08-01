import React, { useRef, useState } from 'react';
import { TransactionCategory } from '../types';
import { CATEGORY_ICONS, CATEGORY_COLORS } from '../constants';
import { getCustomCategoryEmoji } from '../utils';

interface CategoryPickerProps {
  value: string;
  onChange: (category: string) => void;
  customCategories: string[];
  onAddCustomCategory: (newCategory: string, emoji: string) => string[];
  onRemoveCustomCategory: (category: string) => string[];
}

const CATEGORY_EMOJIS = ['🏷️', '🏠', '🚗', '⛽', '💊', '🐾', '🍔', '🛒', '🎓', '🎮', '💡', '💰'];

export const CategoryPicker: React.FC<CategoryPickerProps> = ({
  value,
  onChange,
  customCategories,
  onAddCustomCategory,
  onRemoveCustomCategory,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatEmoji, setNewCatEmoji] = useState(CATEGORY_EMOJIS[0]);
  const [categoryToRemove, setCategoryToRemove] = useState<string | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);

  const defaultCategories = Object.values(TransactionCategory);
  
  // Categorias extras sem duplicar com as padrão
  const extraCategories = customCategories.filter(
    c => !defaultCategories.includes(c as any)
  );

  const handleSelect = (catName: string) => {
    onChange(catName);
    setIsOpen(false);
    setIsAdding(false);
  };

  const handleCreateNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const trimmed = newCatName.trim();
    onAddCustomCategory(trimmed, newCatEmoji);
    onChange(trimmed);
    setNewCatName('');
    setNewCatEmoji(CATEGORY_EMOJIS[0]);
    setIsAdding(false);
    setIsOpen(false);
  };

  const clearLongPress = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    longPressTimer.current = null;
  };

  const startLongPress = (category: string) => {
    didLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      setCategoryToRemove(category);
    }, 600);
  };

  const confirmRemoveCategory = () => {
    if (!categoryToRemove) return;
    onRemoveCustomCategory(categoryToRemove);
    if (value === categoryToRemove) onChange(TransactionCategory.OTHERS);
    setCategoryToRemove(null);
  };

  // Ícone e cor da categoria selecionada
  const selectedIcon = CATEGORY_ICONS[value] || 'category';
  const selectedColor = CATEGORY_COLORS[value] || 'bg-slate-500/20 text-slate-500';
  const selectedEmoji = getCustomCategoryEmoji(value);

  return (
    <>
      {/* Botão Gatilho Estilizado */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-between p-3.5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 rounded-2xl shadow-sm hover:border-primary/50 transition-all text-left group"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${selectedColor}`}>
            {selectedEmoji ? <span className="text-lg">{selectedEmoji}</span> : <span className="material-symbols-outlined text-lg">{selectedIcon}</span>}
          </div>
          <span className="font-bold text-sm text-slate-700 dark:text-slate-200 truncate">
            {value || 'Selecionar Categoria'}
          </span>
        </div>
        <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors shrink-0">
          unfold_more
        </span>
      </button>

      {/* Bottom Sheet / Modal Moderno */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-[32px] sm:rounded-3xl p-6 shadow-2xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom-5 duration-200">
            {/* Cabeçalho do Modal */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary font-bold">category</span>
                <h3 className="text-lg font-bold dark:text-white">Selecionar Categoria</h3>
              </div>
              <button
                type="button"
                onClick={() => { setIsOpen(false); setIsAdding(false); }}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Conteúdo com rolagem */}
            <div className="flex-1 overflow-y-auto py-4 space-y-6 scrollbar-hide">
              {/* Botão de Adicionar Categoria */}
              {!isAdding ? (
                <button
                  type="button"
                  onClick={() => setIsAdding(true)}
                  className="w-full p-4 bg-gradient-to-r from-primary/10 to-blue-500/10 dark:from-primary/20 dark:to-blue-500/20 border-2 border-dashed border-primary/40 rounded-2xl flex items-center justify-center gap-2 text-primary font-bold text-sm hover:bg-primary/15 active:scale-[0.99] transition-all"
                >
                  <span className="material-symbols-outlined text-xl">add_circle</span>
                  Criar Nova Categoria
                </button>
              ) : (
                <form onSubmit={handleCreateNew} className="bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-primary/40 space-y-3 animate-in fade-in zoom-in-95">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-primary uppercase tracking-wider">Nova Categoria</label>
                    <button
                      type="button"
                      onClick={() => setIsAdding(false)}
                      className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-white"
                    >
                      Cancelar
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCatName}
                      onChange={e => setNewCatName(e.target.value)}
                      placeholder="Ex: Gasolina, Farmácia, Pets..."
                      className="flex-1 bg-white dark:bg-slate-800 border-none rounded-xl text-sm p-3 focus:ring-2 focus:ring-primary dark:text-white font-medium"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="ios-gradient text-white px-4 py-3 rounded-xl font-bold text-xs shadow-md active:scale-95 transition-transform"
                    >
                      Salvar
                    </button>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Escolha um ícone</p>
                    <div className="grid grid-cols-6 gap-2">
                      {CATEGORY_EMOJIS.map(emoji => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setNewCatEmoji(emoji)}
                          aria-label={`Usar ícone ${emoji}`}
                          className={`h-10 rounded-xl text-lg transition-all ${newCatEmoji === emoji ? 'bg-primary/15 ring-2 ring-primary scale-105' : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-white/10'}`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </form>
              )}

              {/* Categorias Personalizadas (se existirem) */}
              {extraCategories.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
                    Minhas Categorias
                  </p>
                  <div className="grid grid-cols-2 gap-2.5">
                    {extraCategories.map(catName => {
                      const icon = CATEGORY_ICONS[catName] || 'category';
                      const color = CATEGORY_COLORS[catName] || 'bg-slate-500/20 text-slate-500';
                      const emoji = getCustomCategoryEmoji(catName);
                      const isSelected = value === catName;

                      return (
                        <button
                          key={catName}
                          type="button"
                          onClick={() => {
                            if (didLongPress.current) {
                              didLongPress.current = false;
                              return;
                            }
                            handleSelect(catName);
                          }}
                          onTouchStart={() => startLongPress(catName)}
                          onTouchEnd={clearLongPress}
                          onTouchCancel={clearLongPress}
                          onContextMenu={event => {
                            event.preventDefault();
                            setCategoryToRemove(catName);
                          }}
                          className={`flex items-center gap-3 p-3 rounded-2xl border transition-all text-left ${
                            isSelected
                              ? 'border-primary bg-primary/10 shadow-sm'
                              : 'border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 hover:border-slate-200 dark:hover:border-white/10'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                            {emoji ? <span className="text-base">{emoji}</span> : <span className="material-symbols-outlined text-sm">{icon}</span>}
                          </div>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate flex-1">
                            {catName}
                          </span>
                          {isSelected && (
                            <span className="material-symbols-outlined text-primary text-sm font-bold">check</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Categorias Padrão */}
              <div>
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
                  Categorias Padrão
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  {defaultCategories.map(catName => {
                    const icon = CATEGORY_ICONS[catName] || 'category';
                    const color = CATEGORY_COLORS[catName] || 'bg-slate-500/20 text-slate-500';
                    const isSelected = value === catName;

                    return (
                      <button
                        key={catName}
                        type="button"
                        onClick={() => handleSelect(catName)}
                        className={`flex items-center gap-3 p-3 rounded-2xl border transition-all text-left ${
                          isSelected
                            ? 'border-primary bg-primary/10 shadow-sm'
                            : 'border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 hover:border-slate-200 dark:hover:border-white/10'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                          <span className="material-symbols-outlined text-sm">{icon}</span>
                        </div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate flex-1">
                          {catName}
                        </span>
                        {isSelected && (
                          <span className="material-symbols-outlined text-primary text-sm font-bold">check</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {categoryToRemove && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-t-[32px] sm:rounded-3xl p-6 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-2xl">delete</span>
            </div>
            <h3 className="text-lg font-bold text-center dark:text-white">Excluir categoria?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center mt-2 leading-relaxed">
              “{categoryToRemove}” deixará de estar disponível para novos lançamentos. Os lançamentos antigos não serão alterados.
            </p>
            <div className="flex gap-3 mt-6">
              <button type="button" onClick={() => setCategoryToRemove(null)} className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-200 font-bold text-sm">Cancelar</button>
              <button type="button" onClick={confirmRemoveCategory} className="flex-1 py-3 rounded-xl bg-rose-500 text-white font-bold text-sm">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
