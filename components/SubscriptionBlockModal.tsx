import React, { useEffect, useRef, useState } from 'react';
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
  const refreshStatusRef = useRef(onRefreshStatus);
  refreshStatusRef.current = onRefreshStatus;

  const pixKey = config.pixKey || '17936261493';

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixKey);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 3000);
  };

  useEffect(() => {
    const refreshWhenReturning = () => {
      if (document.visibilityState === 'visible') void refreshStatusRef.current();
    };
    window.addEventListener('focus', refreshWhenReturning);
    document.addEventListener('visibilitychange', refreshWhenReturning);
    const interval = window.setInterval(refreshWhenReturning, 5000);

    return () => {
      window.removeEventListener('focus', refreshWhenReturning);
      document.removeEventListener('visibilitychange', refreshWhenReturning);
      window.clearInterval(interval);
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/#/login';
    window.location.reload();
  };

  const handlePaymentClick = () => {
    if (!config.stripePaymentLink || config.stripePaymentLink.trim() === '') {
      alert(
        'O link do Stripe ainda está sendo configurado pelo administrador. Você pode pagar via PIX abaixo para liberação imediata!'
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

  const rawPhone = (config.whatsappSupport || '5517936261493').replace(/\D/g, '');
  const whatsappUrl = `https://wa.me/${rawPhone}?text=${encodeURIComponent(
    `Olá Controle Mensal! Segue o comprovante do pagamento da minha mensalidade de R$ 4,99 para liberação da minha conta.\n\nE-mail cadastrado: ${user.email}`
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

        {/* Main Action Buttons: Cartão Stripe & PIX Direto */}
        <div className="mt-6 space-y-3 relative z-10">
          {/* Opção 1: Cartão de Crédito via Stripe */}
          <button
            onClick={handlePaymentClick}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all"
          >
            <span className="material-symbols-outlined text-xl">credit_card</span>
            <span>Pagar R$ 4,99 no Cartão (Desbloqueio Imediato)</span>
          </button>

          {/* Opção 2: PIX Direto com Copia e Cola + Envio no WhatsApp */}
          <div className="bg-[#0e1b38] border border-emerald-500/30 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Ou Pague com PIX (R$ 4,99)
                </span>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Sem Taxas
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={pixKey}
                className="w-full bg-[#070d1e] border border-emerald-500/30 rounded-xl px-3 py-2 text-xs font-mono text-emerald-300 select-all focus:outline-none"
              />
              <button
                onClick={handleCopyPix}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-md shadow-emerald-600/20"
              >
                <span className="material-symbols-outlined text-sm">
                  {copiedPix ? 'check' : 'content_copy'}
                </span>
                <span>{copiedPix ? 'Copiado!' : 'Copiar'}</span>
              </button>
            </div>

            {/* Botão de Enviar Comprovante no WhatsApp */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
            >
              <span className="material-symbols-outlined text-base text-emerald-400">send</span>
              <span>Enviar Comprovante no WhatsApp</span>
            </a>
          </div>

          {/* Botão de Verificar Status */}
          <button
            onClick={handleCheckStatus}
            disabled={checking}
            className="w-full py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-400 hover:text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition"
          >
            <span className={`material-symbols-outlined text-sm ${checking ? 'animate-spin' : ''}`}>
              sync
            </span>
            <span>{checking ? 'Verificando liberação...' : 'Já realizei o pagamento / Atualizar'}</span>
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

