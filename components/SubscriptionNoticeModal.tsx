import React from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface SubscriptionNoticeModalProps {
  user: SupabaseUser;
  onDismiss: () => void;
}

const SubscriptionNoticeModal: React.FC<SubscriptionNoticeModalProps> = ({ user, onDismiss }) => {
  // Extrai o primeiro nome do usuário de forma amigável
  const rawName = user.user_metadata?.full_name || user.email?.split('@')[0] || '';
  const firstName = rawName.trim().split(' ')[0];
  const capitalizedName = firstName ? firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase() : '';

  return (
    <div className="fixed inset-0 z-[998] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-[#0b132b] border border-blue-500/30 rounded-3xl max-w-md w-full p-6 sm:p-7 text-white shadow-2xl relative overflow-hidden my-auto">
        {/* Glow de fundo */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative space-y-5">
          {/* Ícone de Destaque */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
              <span className="material-symbols-outlined text-2xl text-white">
                rocket_launch
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20">
                Novidades & Evolução
              </span>
              <h2 className="text-lg font-bold text-white mt-1">
                {capitalizedName ? `Olá, ${capitalizedName}!` : 'Olá!'}
              </h2>
            </div>
          </div>

          {/* Mensagem Principal Construtiva */}
          <div className="space-y-3 text-slate-300 text-xs sm:text-sm leading-relaxed">
            <p>
              Nosso compromisso é ajudar você a organizar suas finanças com máxima praticidade e segurança todos os dias.
            </p>
            <p>
              Para continuarmos mantendo nossos servidores rápidos, seguros e trazendo atualizações frequentes e novos recursos, o <strong>Controle Mensal</strong> passará a ter uma assinatura simples de apenas:
            </p>

            {/* Card de Preço Amigável */}
            <div className="bg-[#121c38] border border-blue-500/20 rounded-2xl p-4 text-center space-y-1">
              <div className="text-2xl font-extrabold text-white">
                R$ 4,99 <span className="text-xs font-normal text-slate-400">/ mês</span>
              </div>
              <p className="text-xs font-semibold text-emerald-400">
                ✨ Menos de R$ 0,16 centavos por dia!
              </p>
            </div>

            <p className="text-xs text-slate-400">
              Seus dados e históricos financeiros já registrados continuam 100% seguros e preservados. Obrigado por fazer parte da nossa jornada!
            </p>
          </div>

          {/* Botão de Entendido / Fechar */}
          <button
            onClick={onDismiss}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold text-sm transition shadow-lg shadow-blue-600/25 active:scale-[0.99] flex items-center justify-center gap-2"
          >
            <span>Entendido, vamos em frente!</span>
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionNoticeModal;
