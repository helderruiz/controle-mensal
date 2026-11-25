import React, { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { openSafeWhatsApp } from '../utils/safeWhatsApp';

interface ReferralCardProps {
  user: User;
}

const ReferralCard: React.FC<ReferralCardProps> = ({ user }) => {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState('');

  // Código de indicação amigável baseado no ID único do usuário (primeiros 6 dígitos maiúsculos)
  const referralCode = user.id ? user.id.replace(/-/g, '').slice(0, 6).toUpperCase() : 'CMVIP';

  // Link de convite apontando para o app com o código como parâmetro de indicação
  const referralUrl = `${window.location.origin}/#/signup?ref=${referralCode}`;

  const handleCopyLink = () => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleShareWhatsApp = () => {
    const text = `Oi! Estou usando o Controle Mensal para organizar minhas finanças e economizar. Crie sua conta com meu convite e teste grátis:\n${referralUrl}`;
    openSafeWhatsApp({
      text,
      onFeedback: (msg) => {
        setFeedback(msg);
        setTimeout(() => setFeedback(''), 4000);
      },
    });
  };

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-3xl p-6 shadow-sm relative overflow-hidden transition-all">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-2xl">card_giftcard</span>
        </div>
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest block">
              Programa de Indicação
            </span>
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-black bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm shadow-purple-500/30 uppercase tracking-wider animate-pulse">
              Novidade
            </span>
          </div>
          <h3 className="text-base font-extrabold text-slate-800 dark:text-white">
            Indique Amigos
          </h3>
        </div>
      </div>

      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
        Convide seus amigos para organizar o dinheiro com o Controle Mensal. Cada amigo que assinar pelo seu link te dá direito a <strong className="text-emerald-600 dark:text-emerald-400 font-bold">1 mês grátis</strong> de mensalidade!
      </p>

      {/* Caixa do Código de Convite */}
      <div className="bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-3 flex items-center justify-between gap-2 mb-3">
        <div>
          <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider block">
            Seu Código de Indicação
          </span>
          <span className="text-sm font-black font-mono text-slate-800 dark:text-slate-100">
            {referralCode}
          </span>
        </div>

        <button
          type="button"
          onClick={handleCopyLink}
          className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 active:scale-95 shadow-sm shadow-indigo-600/30"
        >
          <span className="material-symbols-outlined text-sm">
            {copied ? 'check' : 'content_copy'}
          </span>
          <span>{copied ? 'Copiado!' : 'Copiar Link'}</span>
        </button>
      </div>

      {/* Botão de Compartilhar no WhatsApp */}
      <button
        type="button"
        onClick={handleShareWhatsApp}
        className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 active:scale-95 shadow-sm shadow-emerald-600/20"
      >
        <span className="material-symbols-outlined text-base">share</span>
        <span>Compartilhar Convite no WhatsApp</span>
      </button>

      {feedback && (
        <p className="text-center text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-2 animate-fadeIn">
          {feedback}
        </p>
      )}
    </div>
  );
};

export default ReferralCard;
