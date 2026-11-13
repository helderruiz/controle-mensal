import React, { useState, useEffect } from 'react';
import {
  getSubscriptionsList,
  SubscriptionItem,
} from '../../lib/adminService';
import {
  getSubscriptionConfig,
  saveSubscriptionConfig,
  activateUserSubscription,
  SubscriptionConfig,
} from '../../lib/subscriptionService';

const AdminSubscriptions: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Configurações do Stripe e Bloqueio
  const [config, setConfig] = useState<SubscriptionConfig>({
    blockActive: false,
    stripePaymentLink: 'https://buy.stripe.com/6oUfZh0fccHVbCCgvt4Rq00',
    whatsappSupport: '5511999999999',
    monthlyPrice: 4.99,
  });
  const [savingConfig, setSavingConfig] = useState(false);
  const [configSavedToast, setConfigSavedToast] = useState(false);

  // Modal para liberação manual
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualEmail, setManualEmail] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualDays, setManualDays] = useState(30);
  const [savingManual, setSavingManual] = useState(false);

  useEffect(() => {
    loadAll();
  }, [search]);

  const loadAll = async () => {
    setLoading(true);
    const [cfg, subsRes] = await Promise.all([
      getSubscriptionConfig(),
      getSubscriptionsList(search),
    ]);
    setConfig(cfg);
    setSubscriptions(subsRes.subscriptions);
    setLoading(false);
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    await saveSubscriptionConfig(config);
    setSavingConfig(false);
    setConfigSavedToast(true);
    setTimeout(() => setConfigSavedToast(false), 3000);
  };

  const handleManualActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualEmail.trim()) return;
    setSavingManual(true);
    await activateUserSubscription(
      `manual-${Date.now()}`,
      manualEmail.trim(),
      manualName.trim() || manualEmail.split('@')[0],
      manualDays
    );
    setSavingManual(false);
    setShowManualModal(false);
    setManualEmail('');
    setManualName('');
    loadAll();
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Page Title & Manual Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Assinaturas
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Gestão da mensalidade de R$ 4,99, integrações com Stripe e bloqueio automático no dia 01.
          </p>
        </div>

        <button
          onClick={() => setShowManualModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-600/20 shrink-0"
        >
          <span className="material-symbols-outlined text-base">add_card</span>
          <span>Liberar Assinatura Manual</span>
        </button>
      </div>

      {/* Card 1: Configuração do Bloqueio e Stripe (Controle Máximo) */}
      <form onSubmit={handleSaveConfig} className="bg-[#0c142b] border border-[#172445] rounded-2xl p-6 space-y-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-[#172445] pb-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-blue-400 text-2xl">
              tune
            </span>
            <div>
              <h2 className="text-base font-bold text-white">
                Configurações de Cobrança e Bloqueio
              </h2>
              <p className="text-xs text-slate-400">
                Você controla exatamente quando o bloqueio do dia 01 deve ser ativado para os usuários.
              </p>
            </div>
          </div>

          {/* Toggle de Bloqueio Geral */}
          <div className="flex items-center gap-3 bg-[#070d1e] border border-[#172445] px-4 py-2 rounded-xl">
            <span className="text-xs font-semibold text-slate-300">
              {config.blockActive ? 'Bloqueio ATIVADO' : 'Bloqueio DESATIVADO (Modo Seguro)'}
            </span>
            <button
              type="button"
              onClick={() => setConfig(prev => ({ ...prev, blockActive: !prev.blockActive }))}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ${
                config.blockActive ? 'bg-emerald-500 justify-end' : 'bg-slate-700 justify-start'
              }`}
            >
              <div className="bg-white w-4 h-4 rounded-full shadow-md" />
            </button>
          </div>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Stripe Link */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Link de Pagamento do Stripe (Payment Link)
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-base">
                link
              </span>
              <input
                type="url"
                value={config.stripePaymentLink}
                onChange={e => setConfig(prev => ({ ...prev, stripePaymentLink: e.target.value }))}
                placeholder="https://buy.stripe.com/exemplo..."
                className="w-full bg-[#070d1e] border border-[#172445] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition font-mono"
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Cole aqui o Payment Link criado no seu painel Stripe com o valor de R$ 4,99.
            </p>
          </div>

          {/* WhatsApp Suporte */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              WhatsApp para Dúvidas/Suporte
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-base">
                chat
              </span>
              <input
                type="text"
                value={config.whatsappSupport}
                onChange={e => setConfig(prev => ({ ...prev, whatsappSupport: e.target.value }))}
                placeholder="Ex: 5511999999999"
                className="w-full bg-[#070d1e] border border-[#172445] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition font-mono"
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Número com DDD (ex: 5511988887777).
            </p>
          </div>
        </div>

        {/* Save button & feedback */}
        <div className="flex items-center justify-between pt-2">
          <div>
            {configSavedToast && (
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 animate-fadeIn">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                Configurações salvas com sucesso!
              </span>
            )}
          </div>
          <button
            type="submit"
            disabled={savingConfig}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 transition shadow-lg shadow-blue-600/20 disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-base">save</span>
            <span>{savingConfig ? 'Salvando...' : 'Salvar Configurações'}</span>
          </button>
        </div>
      </form>

      {/* Card 2: Tabela de Assinaturas Ativas (Screenshot 3) */}
      <div className="bg-[#0c142b] border border-[#172445] rounded-2xl overflow-hidden shadow-sm">
        {/* Table Header Bar with Search */}
        <div className="p-5 sm:p-6 border-b border-[#172445] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-white tracking-tight">
            Assinaturas Ativas
          </h2>

          <div className="relative">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-lg">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por assinante..."
              className="w-full sm:w-80 bg-[#070d1e] border border-[#172445] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
            />
          </div>
        </div>

        {/* Subscriptions Table */}
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto scrollbar-thin">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-[#0a1126] border-b border-[#172445]">
              <tr>
                <th className="py-4 px-6 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Profissional / Usuário
                </th>
                <th className="py-4 px-6 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Plano
                </th>
                <th className="py-4 px-6 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Vencimento
                </th>
                <th className="py-4 px-6 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#172445]">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-16 text-center text-slate-400 text-xs">
                    <span className="material-symbols-outlined animate-spin text-2xl text-blue-500 mb-2">
                      progress_activity
                    </span>
                    <p>Carregando assinaturas...</p>
                  </td>
                </tr>
              ) : subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-20 text-center text-slate-400 text-sm font-medium">
                    Nenhuma assinatura premium encontrada.
                  </td>
                </tr>
              ) : (
                subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-white/[0.02] transition">
                    <td className="py-4 px-6">
                      <p className="text-sm font-bold text-white">{sub.userName}</p>
                      <p className="text-xs text-slate-400 font-mono">{sub.userEmail}</p>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-xs font-semibold text-slate-200">
                        {sub.plan}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-xs font-semibold text-slate-300">
                        {sub.expiresAt}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                        {sub.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Liberação Manual */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0d162f] border border-[#1d2a4e] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1d2a4e] pb-3">
              <h3 className="text-base font-bold text-white">
                Liberar Acesso / Assinatura Manual
              </h3>
              <button
                onClick={() => setShowManualModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleManualActivate} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  E-mail do Usuário
                </label>
                <input
                  type="email"
                  required
                  value={manualEmail}
                  onChange={e => setManualEmail(e.target.value)}
                  placeholder="usuario@gmail.com"
                  className="w-full bg-[#070d1e] border border-[#172445] rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Nome (Opcional)
                </label>
                <input
                  type="text"
                  value={manualName}
                  onChange={e => setManualName(e.target.value)}
                  placeholder="Nome do assinante"
                  className="w-full bg-[#070d1e] border border-[#172445] rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Dias de Acesso
                </label>
                <select
                  value={manualDays}
                  onChange={e => setManualDays(Number(e.target.value))}
                  className="w-full bg-[#070d1e] border border-[#172445] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value={30}>30 Dias (1 Mês)</option>
                  <option value={60}>60 Dias (2 Meses)</option>
                  <option value={90}>90 Dias (3 Meses)</option>
                  <option value={365}>1 Ano (365 Dias)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 text-slate-300 hover:text-white text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingManual}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20"
                >
                  {savingManual ? 'Liberando...' : 'Confirmar Liberação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSubscriptions;
