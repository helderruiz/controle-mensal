import React, { useState, useEffect } from 'react';
import {
  getUsersList,
  toggleUserStatus,
  deleteUser,
  AdminUser,
} from '../../lib/adminService';

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionUser, setActionUser] = useState<{ user: AdminUser; action: 'toggle' | 'delete' } | null>(null);

  useEffect(() => {
    loadUsers();
  }, [search]);

  const loadUsers = async () => {
    setLoading(true);
    const { users: list } = await getUsersList(search);
    setUsers(list);
    setLoading(false);
  };

  const handleConfirmAction = async () => {
    if (!actionUser) return;
    const { user, action } = actionUser;

    if (action === 'toggle') {
      await toggleUserStatus(user.id, user.status);
    } else if (action === 'delete') {
      await deleteUser(user.id);
    }

    setActionUser(null);
    loadUsers();
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="px-3 py-1 rounded-lg text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 uppercase tracking-wider">
            Admin
          </span>
        );
      case 'PROFESSIONAL':
        return (
          <span className="px-3 py-1 rounded-lg text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30 uppercase tracking-wider">
            Professional
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-lg text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30 uppercase tracking-wider">
            Client
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Usuários
        </h1>
      </div>

      {/* Main Container (Image 2) */}
      <div className="bg-[#0c142b] border border-[#172445] rounded-2xl overflow-hidden shadow-sm">
        {/* Table Header Bar with Search */}
        <div className="p-5 sm:p-6 border-b border-[#172445] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-white tracking-tight">
            Gerenciar Usuários
          </h2>

          <div className="relative">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-lg">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou email..."
              className="w-full sm:w-80 bg-[#070d1e] border border-[#172445] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
            />
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#172445] bg-[#091024]/60">
                <th className="py-4 px-6 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Nome / Email
                </th>
                <th className="py-4 px-6 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Tipo
                </th>
                <th className="py-4 px-6 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Registro / Plano
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
                  <td colSpan={5} className="py-12 text-center text-slate-400 text-xs">
                    <span className="material-symbols-outlined animate-spin text-2xl text-blue-500 mb-2">
                      progress_activity
                    </span>
                    <p>Carregando usuários...</p>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 text-xs">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-white/[0.02] transition-colors group"
                  >
                    {/* NOME / EMAIL */}
                    <td className="py-4 px-6">
                      <p className="text-sm font-bold text-white leading-tight">
                        {user.name}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {user.email}
                      </p>
                    </td>

                    {/* TIPO */}
                    <td className="py-4 px-6">
                      {getRoleBadge(user.role)}
                    </td>

                    {/* REGISTRO / PLANO */}
                    <td className="py-4 px-6">
                      <p className="text-xs font-semibold text-slate-200">
                        {user.plan}
                      </p>
                      {user.planSubtitle && (
                        <p className={`text-[10px] font-bold tracking-wider mt-0.5 ${
                          user.planSubtitle.includes('EXPIRADO')
                            ? 'text-rose-400'
                            : user.planSubtitle.includes('TRIAL')
                            ? 'text-amber-400'
                            : 'text-slate-400'
                        }`}>
                          {user.planSubtitle}
                        </p>
                      )}
                    </td>

                    {/* STATUS */}
                    <td className="py-4 px-6">
                      {user.status === 'Ativo' ? (
                        <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
                          <span className="material-symbols-outlined text-base">
                            check_circle
                          </span>
                          <span>Ativo</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-rose-400 text-xs font-semibold">
                          <span className="material-symbols-outlined text-base">
                            block
                          </span>
                          <span>Bloqueado</span>
                        </div>
                      )}
                    </td>

                    {/* AÇÕES */}
                    <td className="py-4 px-6 text-right">
                      <div className="inline-flex items-center gap-2">
                        {/* Ativar/Desbloquear */}
                        <button
                          onClick={() => setActionUser({ user, action: 'toggle' })}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${
                            user.status === 'Ativo'
                              ? 'text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10'
                              : 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20'
                          }`}
                          title={user.status === 'Ativo' ? 'Usuário já ativo' : 'Desbloquear usuário'}
                        >
                          <span className="material-symbols-outlined text-lg">
                            check_circle
                          </span>
                        </button>

                        {/* Bloquear */}
                        <button
                          onClick={() => setActionUser({ user, action: 'toggle' })}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${
                            user.status === 'Bloqueado'
                              ? 'text-amber-400 bg-amber-500/10'
                              : 'text-slate-400 hover:text-amber-400 hover:bg-amber-500/10'
                          }`}
                          title="Bloquear usuário"
                        >
                          <span className="material-symbols-outlined text-lg">
                            block
                          </span>
                        </button>

                        {/* Excluir */}
                        <button
                          onClick={() => setActionUser({ user, action: 'delete' })}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                          title="Excluir usuário"
                        >
                          <span className="material-symbols-outlined text-lg">
                            delete
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {actionUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0d162f] border border-[#1d2a4e] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">
              {actionUser.action === 'delete' ? 'Excluir Usuário?' : 'Alterar Status do Usuário?'}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {actionUser.action === 'delete' ? (
                <>Tem certeza de que deseja excluir o usuário <strong>{actionUser.user.name}</strong> ({actionUser.user.email})?</>
              ) : (
                <>Deseja alterar o status de <strong>{actionUser.user.name}</strong> para <strong>{actionUser.user.status === 'Ativo' ? 'Bloqueado' : 'Ativo'}</strong>?</>
              )}
            </p>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                onClick={() => setActionUser(null)}
                className="px-4 py-2 rounded-xl bg-white/5 text-slate-300 hover:text-white text-xs font-semibold transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmAction}
                className={`px-4 py-2 rounded-xl text-white text-xs font-semibold transition shadow-md ${
                  actionUser.action === 'delete'
                    ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                    : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30'
                }`}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;

