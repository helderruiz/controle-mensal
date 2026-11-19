import React, { useEffect, useRef, useState } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { SubscriptionConfig, buildStripeCheckoutUrl } from '../lib/subscriptionService';
import pixLogo from '../img/pix-logo.png';

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
  const [whatsAppFeedback, setWhatsAppFeedback] = useState('');
  const refreshStatusRef = useRef(onRefreshStatus);
  refreshStatusRef.current = onRefreshStatus;

  const pixKey = config.pixKey || '8c9b8ea3-1550-4159-a2e7-59947cf6a5f4';

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixKey);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 3000);
  };



  useEffect(() => {
    let lastRefreshAt = 0;
    let refreshInFlight = false;
    const refreshWhenReturning = () => {
      if (document.visibilityState !== 'visible' || refreshInFlight) return;

      // Some Android WebViews emit focus and visibilitychange together. Avoid
      // duplicate requests, and only refresh when the external app returns.
      const now = Date.now();
      if (now - lastRefreshAt < 1500) return;
      lastRefreshAt = now;
      refreshInFlight = true;
      Promise.resolve(refreshStatusRef.current())
        .catch((error) => console.error('Falha ao atualizar assinatura ao retornar:', error))
        .finally(() => { refreshInFlight = false; });
    };
    window.addEventListener('focus', refreshWhenReturning);
    window.addEventListener('pageshow', refreshWhenReturning);
    document.addEventListener('visibilitychange', refreshWhenReturning);

    return () => {
      window.removeEventListener('focus', refreshWhenReturning);
      window.removeEventListener('pageshow', refreshWhenReturning);
      document.removeEventListener('visibilitychange', refreshWhenReturning);
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
    try {
      await onRefreshStatus();
    } catch (error) {
      console.error('Falha ao verificar status da assinatura:', error);
    } finally {
      setTimeout(() => setChecking(false), 1200);
    }
  };

  const rawPhone = (config.whatsappSupport || '5517936261493').replace(/\D/g, '');
  const rawText = `Olá Controle Mensal! Segue o comprovante do pagamento da minha mensalidade de R$ 4,99 para liberação da minha conta.\n\nE-mail cadastrado: ${user.email}`;
  const encodedText = encodeURIComponent(rawText);
  const whatsappUrl = `https://api.whatsapp.com/send?phone=${rawPhone}&text=${encodedText}`;
  const nativeWhatsAppUrl = `whatsapp://send?phone=${rawPhone}&text=${encodedText}`;

  const handleOpenWhatsApp = (e: React.MouseEvent) => {
    e.preventDefault();

    // Detecta se está rodando dentro do Kodular WebView (AppInventor)
    const isKodularWebView = !!(window as any).AppInventor;
    const isAndroidWebView = /;\s*wv\)|\bWebView\b/i.test(navigator.userAgent);
    const copyMessageAsFallback = () => {
      if (!navigator.clipboard?.writeText) {
        setWhatsAppFeedback('NÃ£o foi possÃ­vel abrir o WhatsApp neste navegador.');
        setTimeout(() => setWhatsAppFeedback(''), 5000);
        return;
      }
      void navigator.clipboard.writeText(rawText).then(() => {
        setWhatsAppFeedback('Mensagem copiada! Abra o WhatsApp e envie a mensagem.');
        setTimeout(() => setWhatsAppFeedback(''), 5000);
      }).catch(() => {
        setWhatsAppFeedback('NÃ£o foi possÃ­vel abrir o WhatsApp neste navegador.');
        setTimeout(() => setWhatsAppFeedback(''), 5000);
      });
    };

    if (isKodularWebView) {
      // Usa a API nativa do Kodular para sinalizar o app Android.
      // O Kodular intercepta via evento "WebViewStringChange" e abre o WhatsApp
      // pelo Activity Starter, sem navegar o WebView (evita tela branca).
      try {
        // Envia a URI diretamente: no Kodular, o evento WebViewStringChanged
        // pode usar o valor como DataUri do Activity Starter.
        (window as any).AppInventor.setWebViewString(nativeWhatsAppUrl);
        setWhatsAppFeedback('Abrindo WhatsApp...');
        setTimeout(() => setWhatsAppFeedback(''), 3000);
      } catch {
        // Fallback: copia mensagem e instrui usuário
        copyMessageAsFallback();
      }
    } else if (isAndroidWebView) {
      // Sem a ponte nativa, window.open pode redirecionar esta mesma janela
      // para whatsapp:// e exibir ERR_UNKNOWN_URL_SCHEME.
      copyMessageAsFallback();
    } else {
      // Navegador normal (desktop/mobile): abre em nova aba
      window.open(whatsappUrl, '_blank');
    }
  };

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
            className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm sm:text-base shadow-xl shadow-blue-600/30 flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
          >
            <span className="material-symbols-outlined text-2xl shrink-0">credit_card</span>
            <span className="leading-tight text-center">Pagar R$ 4,99 no Cartão (Desbloqueio Imediato)</span>
          </button>

          {/* Opção 2: PIX Direto com Copia e Cola + Envio no WhatsApp */}
          <div className="bg-[#0e1b38] border border-emerald-500/30 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-md">
            <div className="flex items-center gap-3">
              <img
                src={pixLogo}
                alt="Logo PIX"
                className="h-8 w-auto object-contain filter brightness-110"
              />
              <span className="text-sm font-bold text-white uppercase tracking-wider">
                Pague com PIX (R$ 4,99)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={pixKey}
                className="w-full bg-[#070d1e] border border-emerald-500/30 rounded-xl px-3 py-2.5 text-xs font-mono text-emerald-300 select-all focus:outline-none truncate"
              />
              <button
                onClick={handleCopyPix}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-md shadow-emerald-600/20 active:scale-95"
              >
                <span className="material-symbols-outlined text-base">
                  {copiedPix ? 'check' : 'content_copy'}
                </span>
                <span>{copiedPix ? 'Copiado!' : 'Copiar'}</span>
              </button>
            </div>

            {/* Botão de Enviar Comprovante no WhatsApp (Compatível com Kodular Webview) */}
            <button
              onClick={handleOpenWhatsApp}
              className="w-full py-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 shadow-sm active:scale-[0.99]"
            >
              <span className="material-symbols-outlined text-lg text-emerald-400">send</span>
              <span>Enviar Comprovante no WhatsApp</span>
            </button>

            {/* Feedback do WhatsApp */}
            {whatsAppFeedback && (
              <p className="text-center text-xs text-emerald-400 font-semibold animate-pulse">
                {whatsAppFeedback}
              </p>
            )}

            {/* Aviso sobre tempo de validação do PIX */}
            <div className="flex items-start gap-2 bg-[#070d1e]/80 p-2.5 rounded-xl border border-white/5 text-[11px] text-slate-400 leading-tight">
              <span className="material-symbols-outlined text-sm text-amber-400 shrink-0 mt-0.5">
                schedule
              </span>
              <p>
                Como a validação do PIX é manual, a liberação pode levar alguns minutos até conferirmos a mensagem no WhatsApp. Para liberação imediata em segundos, utilize a opção do Cartão acima.
              </p>
            </div>
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
          <button
            onClick={handleOpenWhatsApp}
            className="hover:text-emerald-400 transition flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm text-emerald-400">chat</span>
            <span>Dúvidas? WhatsApp</span>
          </button>

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

