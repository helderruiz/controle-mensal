import React from 'react';

interface WhatsNewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WhatsNewModal: React.FC<WhatsNewModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9990] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-[#0b132b] border border-blue-500/30 rounded-3xl max-w-md w-full p-6 text-white shadow-2xl relative overflow-hidden my-auto">
        {/* Efeitos decorativos de fundo */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-blue-600/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Cabeçalho */}
        <div className="text-center relative z-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-lg shadow-blue-600/40 border border-white/20 mb-3">
            <span className="material-symbols-outlined text-2xl text-white">sparkles</span>
          </div>

          <span className="inline-block px-3 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/20 border border-blue-500/40 text-blue-300 uppercase tracking-widest mb-1.5">
            Atualização 4.2
          </span>
          <h2 className="text-xl font-extrabold text-white tracking-tight font-display">
            Novidades no Controle Mensal!
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Preparamos novos recursos para te ajudar a economizar mais todo mês.
          </p>
        </div>

        {/* Lista de Novidades */}
        <div className="mt-5 space-y-3 relative z-10">
          {/* Novidade 1: Meta de Economia */}
          <div className="bg-[#0e1b38] border border-blue-500/20 rounded-2xl p-3.5 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-lg">flag</span>
            </div>
            <div>
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Meta de Economia do Mês</span>
                <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded-full font-bold">Novo</span>
              </h3>
              <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                Defina uma meta de quanto quer poupar e acompanhe a barra de progresso no seu painel.
              </p>
            </div>
          </div>

          {/* Novidade 2: Exportação em PDF e Compartilhamento */}
          <div className="bg-[#0e1b38] border border-blue-500/20 rounded-2xl p-3.5 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-lg">picture_as_pdf</span>
            </div>
            <div>
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Relatórios em PDF e WhatsApp</span>
                <span className="text-[9px] bg-rose-500/20 text-rose-300 px-1.5 py-0.2 rounded-full font-bold">Novo</span>
              </h3>
              <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                Gere o resumo completo do mês com extrato de gastos por categoria para salvar em PDF ou enviar pelo WhatsApp.
              </p>
            </div>
          </div>

          {/* Novidade 3: Programa de Indicação */}
          <div className="bg-[#0e1b38] border border-blue-500/20 rounded-2xl p-3.5 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-lg">card_giftcard</span>
            </div>
            <div>
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Indique Amigos e Ganhe</span>
                <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1.5 py-0.2 rounded-full font-bold">Grátis</span>
              </h3>
              <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                Compartilhe seu link exclusivo na aba Perfil. A cada amigo que assinar, você ganha 1 mês grátis!
              </p>
            </div>
          </div>
        </div>

        {/* Botão de Fechar / Explorar */}
        <div className="mt-6 relative z-10">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-blue-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <span>Bora Começar!</span>
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default WhatsNewModal;
