import React, { useState, useEffect } from 'react';
import {
  getSubscriptionsList,
  SubscriptionItem,
} from '../../lib/adminService';

const AdminSubscriptions: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscriptions();
  }, [search]);

  const loadSubscriptions = async () => {
    setLoading(true);
    const { subscriptions: list } = await getSubscriptionsList(search);
    setSubscriptions(list);
    setLoading(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Assinaturas
        </h1>
      </div>

      {/* Main Container (Image 3) */}
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
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#172445] bg-[#091024]/60">
                <th className="py-4 px-6 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Profissional / Usuário
                </th>
                <th className="py-4 px-6 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Plano
                </th>
                <th className="py-4 px-6 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Status
                </th>
                <th className="py-4 px-6 text-[11px] font-bold uppercase tracking-wider text-slate-400 text-right">
                  Ações
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
                // Exata mensagem da Imagem 3
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
                      <p className="text-xs text-slate-400">{sub.userEmail}</p>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-xs font-semibold text-slate-200">
                        {sub.plan}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        {sub.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button className="text-slate-400 hover:text-white p-2">
                        <span className="material-symbols-outlined text-lg">more_vert</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Subscription Model Info Card */}
      <div className="bg-[#0b142b] border border-[#182647] rounded-2xl p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
          <span className="material-symbols-outlined text-xl">payments</span>
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-white">
            Preparado para a Assinatura Mensal de R$ 4,99
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Esta tela está configurada para exibir as assinaturas recorrentes dos seus usuários. Na próxima fase, vincularemos o botão de pagamento (via Pix / Cartão) no app dos usuários para que eles ativem o plano de R$ 4,99 e apareçam automaticamente aqui como assinantes ativos.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminSubscriptions;

