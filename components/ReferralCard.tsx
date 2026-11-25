import React, { useState } from 'react';
import { User } from '@supabase/supabase-js';

interface ReferralCardProps {
  user: User;
}

const ReferralCard: React.FC<ReferralCardProps> = ({ user }) => {
  const [copied, setCopied] = useState(false);

  // Código de indicação amigável baseado no ID único do usuário (primeiros 6 dígitos maiúsculos)
  const referralCode = user.id ? user.id.replace(/-/g, '').slice(0, 6).toUpperCase() : 'CMVIP';

  // Link de convite apontando para o app com o código como parâmetro de indicação
  const referralUrl = `${window.location.origin}/#/signup?ref=${referralCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleShareWhatsApp = () => {
    const text = `Oi! Estou usando o *Controle Mensal* para organizar minhas finanças e economizar. Crie sua conta com meu link de convite e teste grátis:\n${referralUrl}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="bg-gradient-to-br from-indigo-900/40 via-purple-900/20 to-blue-900/40 border border-indigo-500/30 rounded-3xl p-5 shadow-lg relative overflow-hidden">
      {/* Detalhe de fundo */}
      <div className="absolute -top-10 -right-10 w-28 h-28 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Cabeçalho */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-2xl">card_giftcard</span>
        </div>
        <div>
          <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest block">
            Programa de Indicação
          </span>
          <h3 className="text-base font-extrabold text-white">
            Indique Amigos e Ganhe
          </h3>
        </div>
      </div>

      <p className="text-xs text-slate-300 leading-relaxed mb-4">
        Convide seus amigos para organizar o dinheiro com o Controle Mensal. Cada amigo que assinar pelo seu link te dá direito a <strong className="text-emerald-400">1 mês grátis</strong> de mensalidade!
      </p>

      {/* Caixa do Código de Convite */}
      <div className="bg-black/30 border border-white/10 rounded-2xl p-3 flex items-center justify-between gap-2 mb-3">
        <div>
          <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">
            Seu Código de Indicação
          </span>
          <span className="text-sm font-black font-mono text-purple-300">
            {referralCode}
          </span>
        </div>

        <button
          type="button"
          onClick={handleCopyLink}
          className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center gap-1.5 active:scale-95 shadow-md shadow-purple-600/30"
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
        className="w-full py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition flex items-center justify-center gap-2 active:scale-95"
      >
        <span className="material-symbols-outlined text-base text-emerald-400">share</span>
        <span>Compartilhar Convite no WhatsApp</span>
      </button>
    </div>
  );
};

export default ReferralCard;
