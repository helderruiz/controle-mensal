import React, { useState } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { SubscriptionConfig, buildStripeCheckoutUrl } from '../lib/subscriptionService';

interface SubscriptionBlockModalProps {
  user: SupabaseUser;
  config: SubscriptionConfig;
  onRefreshStatus: () => void;
}

const SubscriptionBlockModal: React.FC<SubscriptionBlockModalProps> = ({
  user,
  config,
  onRefreshStatus,
}) => {
  const [checking, setChecking] = useState(false);
  const [copiedPix, setCopiedPix] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/#/login';
    window.location.reload();
  };

  const handlePaymentClick = () => {
    if (!config.stripePaymentLink || config.stripePaymentLink.trim() === '') {
      alert(
        'O link do Stripe ainda está sendo configurado pelo administrador. Você pode entrar em contato pelo WhatsApp para liberação imediata!'
      );
      return;
    }

    const checkoutUrl = buildStripeCheckoutUrl(config.stripePaymentLink, user);
    window.open(checkoutUrl, '_blank');
  };

  const handleCheckStatus = async () => {
    setChecking(true);
    await onRefreshStatus();
    setTimeout(() => setChecking(false), 1200);
  };

  const whatsappUrl = `https://wa.me/${config.whatsappSupport.replace(/\D/g, '')}?text=${encodeURIComponent(
    `Olá Helder! Estou no Controle Mensal e gostaria de ativar minha assinatura de R$ 4,99 para o e-mail: ${user.email}`
  )}`;

  return (
    <div className="fixed inset-0 z-[999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0b132b] border border-blue-500/30 rounded-3xl max-w-lg w-full p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden animate-fadeIn my-auto">
        {/* Decorative background glows */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-3 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-600/30 border border-white/20">
            <span className="material-symbols-outlined text-3xl font-bold text-white">
              lock
            </span>
          </div>

          <div>
            <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400 uppercase tracking-wider mb-2">
              Renovação Mensal do Aplicativo
            </span>
            <h2 className="text-2xl font-extrabold text-white tracking-tight font-display">
              Mantenha Seu Acesso Ativo
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Todo dia 01 renovamos o sistema para manter seus dados seguros, gráficos e backup na nuvem.
            </p>
          </div>
        </div>

        {/* Pricing Card */}
        <div className="mt-6 bg-[#070d1e] border border-blue-500/20 rounded-2xl p-5 text-center relative z-10 shadow-inner">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Assinatura Mensal
          </p>
          <div className="flex items-baseline justify-center gap-1 mt-2">
            <span className="text-sm font-bold text-slate-400">R$</span>
            <span className="text-4xl font-black text-white tracking-tight">4,99</span>
            <span className="text-sm font-semibold text-slate-400">/ mês</span>
          </div>
          <p className="text-[11px] text-emerald-400 font-semibold mt-1">
            Apenas R$ 0,16 por dia • Cancele quando quiser
          </p>
        </div>

        {/* Benefits list */}
        <div className="mt-5 space-y-2.5 text-xs text-slate-300 relative z-10">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-emerald-400 text-lg">check_circle</span>
            <span>Lançamentos, despesas e parcelamentos ilimitados</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-emerald-400 text-lg">check_circle</span>
            <span>Relatórios analíticos e gráficos dinâmicos</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-emerald-400 text-lg">check_circle</span>
            <span>Sincronização e backup automático na nuvem</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-emerald-400 text-lg">check_circle</span>
            <span>Acesso em qualquer celular ou computador</span>
          </div>
        </div>

        {/* Main Action Buttons */}
        <div className="mt-6 space-y-3 relative z-10">
          <button
            onClick={handlePaymentClick}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-base shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all"
          >
            <span className="material-symbols-outlined text-xl">credit_card</span>
            <span>Pagar R$ 4,99 com Stripe</span>
          </button>

          <button
            onClick={handleCheckStatus}
            disabled={checking}
            className="w-full py-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-slate-300 text-xs font-semibold flex items-center justify-center gap-2 transition"
          >
            <span className={`material-symbols-outlined text-base ${checking ? 'animate-spin' : ''}`}>
              sync
            </span>
            <span>{checking ? 'Verificando pagamento...' : 'Já realizei o pagamento / Atualizar'}</span>
          </button>
        </div>

        {/* Support & Logout footer */}
        <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400 relative z-10">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-emerald-400 transition flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm text-emerald-400">chat</span>
            <span>Dúvidas? WhatsApp</span>
          </a>

          <button
            onClick={handleLogout}
            className="hover:text-rose-400 transition flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">logout</span>
            <span>Sair da Conta</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionBlockModal;

