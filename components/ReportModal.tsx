import React from 'react';
import { formatBRL } from '../utils';

export interface ReportData {
  periodLabel: string;
  totalEntries: number;
  totalExits: number;
  balance: number;
  categories: { name: string; value: number; count: number }[];
  isMonthly: boolean;
}

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ReportData;
}

const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, data }) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-sm flex flex-col justify-start overflow-y-auto animate-fadeIn">
      {/* Barra de Ações Superior (fixa) */}
      <div className="sticky top-0 z-50 bg-slate-900 border-b border-white/10 px-4 py-3 flex items-center justify-between shadow-xl print:hidden">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition active:scale-95"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          <span>Voltar aos Relatórios</span>
        </button>

        <button
          type="button"
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-blue-600 text-white font-bold text-xs shadow-lg shadow-blue-500/30 transition active:scale-95"
        >
          <span className="material-symbols-outlined text-base">print</span>
          <span>Imprimir / Salvar PDF</span>
        </button>
      </div>

      {/* Conteúdo do Relatório */}
      <div className="flex-1 p-4 sm:p-6 max-w-2xl w-full mx-auto">
        <div className="bg-white text-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 print:shadow-none print:border-none print:p-0">
          {/* Cabeçalho */}
          <div className="flex items-start justify-between border-b-2 border-primary pb-4 mb-6">
            <div>
              <h1 className="text-2xl font-black text-primary tracking-tight font-display">
                Controle Mensal
              </h1>
              <p className="text-xs font-bold text-slate-500 mt-0.5">
                Relatório Financeiro • {data.periodLabel}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-semibold text-slate-400 block">
                Gerado em {new Date().toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>

          {/* Grid de Resumo */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 text-center">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Entradas
              </span>
              <span className="text-sm font-black text-emerald-600">
                R$ {formatBRL(data.totalEntries)}
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 text-center">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Saídas
              </span>
              <span className="text-sm font-black text-rose-600">
                R$ {formatBRL(data.totalExits)}
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 text-center">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Saldo
              </span>
              <span className={`text-sm font-black ${data.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                R$ {formatBRL(data.balance)}
              </span>
            </div>
          </div>

          {/* Tabela de Categorias */}
          <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
            Detalhamento por Categoria (Gastos)
          </h2>
          <div className="border border-slate-200 rounded-2xl overflow-hidden mb-6">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-[10px] font-bold uppercase text-slate-600 border-b border-slate-200">
                  <th className="py-2.5 px-3">Categoria</th>
                  <th className="py-2.5 px-3 text-center">Qtd</th>
                  <th className="py-2.5 px-3 text-right">Total Gasto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {data.categories.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-slate-400">
                      Nenhum gasto registrado neste período.
                    </td>
                  </tr>
                ) : (
                  data.categories.map((c, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-semibold text-slate-700">{c.name}</td>
                      <td className="py-2.5 px-3 text-center text-slate-400">{c.count}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-rose-600">
                        R$ {formatBRL(c.value)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Rodapé */}
          <div className="border-t border-slate-100 pt-4 text-center">
            <p className="text-[10px] text-slate-400 font-medium">
              Relatório gerado pelo aplicativo Controle Mensal • Gestão Financeira Pessoal
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportModal;
