import React, { useState, useEffect } from 'react';
import {
  getUsersList,
  toggleUserStatus,
  deleteUser,
  AdminUser,
} from '../../lib/adminService';
import { activateUserSubscription } from '../../lib/subscriptionService';

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [totalCount, setTotalCount] = useState(118);
  const [isLive, setIsLive] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionUser, setActionUser] = useState<{ user: AdminUser; action: 'toggle' | 'delete' } | null>(null);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadUsers();
  }, [search]);

  const loadUsers = async () => {
    setLoading(true);
    const res = await getUsersList(search);
    setUsers(res.users);
    setIsLive(res.isLive);
    setTotalCount(res.totalCount);
    setLoading(false);
  };

  const handleCopySql = () => {
    const sqlCode = `-- Sincronização direta dos 118 usuários reais do Supabase:
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  full_name text,
  role text default 'CLIENT',
  status text default 'Ativo',
  plan text default 'GRATUITO',
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
drop policy if exists "Permitir leitura profiles" on public.profiles;
create policy "Permitir leitura profiles" on public.profiles for select to authenticated using (true);
drop policy if exists "Permitir all profiles" on public.profiles;
create policy "Permitir all profiles" on public.profiles for all to authenticated using (true);

insert into public.profiles (id, email, full_name, role, status, plan, created_at)
select id, email, coalesce(raw_user_meta_data->>'full_name', split_part(email, '@', 1)),
  case when lower(email) = 'helder.ruiz.marcelino@gmail.com' then 'ADMIN' else 'CLIENT' end,
  'Ativo', 'GRATUITO', created_at
from auth.users on conflict (id) do nothing;

create or replace function public.get_admin_users()
returns table (id uuid, email text, full_name text, role text, status text, plan text, created_at timestamptz)
security definer language plpgsql as $$
begin
  return query select u.id, u.email::text,
    coalesce(p.full_name, u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1))::text,
    coalesce(p.role, case when lower(u.email) = 'helder.ruiz.marcelino@gmail.com' then 'ADMIN' else 'CLIENT' end)::text,
    coalesce(p.status, 'Ativo')::text, coalesce(p.plan, 'GRATUITO')::text, u.created_at
  from auth.users u left join public.profiles p on p.id = u.id order by u.created_at desc;
end; $$;
grant execute on function public.get_admin_users() to authenticated, anon;

create table if not exists public.access_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete set null,
  user_name text,
  user_email text,
  action text default 'Visita ao Sistema',
  created_at timestamptz default now()
);
alter table public.access_logs enable row level security;
drop policy if exists "Logs insert livre" on public.access_logs;
create policy "Logs insert livre" on public.access_logs for insert with check (true);
drop policy if exists "Logs select livre" on public.access_logs;
create policy "Logs select livre" on public.access_logs for select to authenticated using (true);

create table if not exists public.subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  user_name text,
  user_email text,
  plan_name text default 'Mensal R$ 4,99',
  amount numeric(10,2) default 4.99,
  status text default 'ativa',
  created_at timestamptz default now()
);
alter table public.subscriptions enable row level security;
drop policy if exists "Subs select livre" on public.subscriptions;
create policy "Subs select livre" on public.subscriptions for all to authenticated using (true);`;

    navigator.clipboard.writeText(sqlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleConfirmAction = async () => {
    if (!actionUser) return;
    const { user, action } = actionUser;

    if (action === 'toggle') {
      await toggleUserStatus(user.id, user.status, user.email, user.name);
    } else if (action === 'delete') {
      await deleteUser(user.id);
    }

    setActionUser(null);
    await loadUsers();
  };

  const handleGrantSubscription = async (user: AdminUser) => {
    const ok = window.confirm(`Deseja ativar o Plano Mensal R$ 4,99 por 30 dias para ${user.name} (${user.email})?`);
    if (!ok) return;
    await activateUserSubscription(user.id, user.email, user.name, 30);
    alert(`Assinatura de R$ 4,99 ativada por 30 dias para ${user.name}!`);
    loadUsers();
  };

  const handleToggleStatus = async (user: AdminUser) => {
    const nextStatus = user.status === 'Ativo' ? 'Bloqueado' : 'Ativo';
    const confirmMsg = nextStatus === 'Bloqueado'
      ? `Deseja realmente BLOQUEAR o acesso de ${user.name} (${user.email})? O pop-up de cobrança de R$ 4,99 aparecerá para esse usuário.`
      : `Deseja DESBLOQUEAR e liberar o acesso de ${user.name} (${user.email})?`;
    
    if (!window.confirm(confirmMsg)) return;

    const ok = await toggleUserStatus(user.id, user.status, user.email, user.name);
    if (ok) {
      alert(`Status de ${user.name} alterado para ${nextStatus} com sucesso!`);
      await loadUsers();
    } else {
      alert('Não foi possível atualizar no Supabase. Verifique a conexão.');
    }
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
      {/* Page Title & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Usuários
          </h1>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400">
            {totalCount} Usuários
          </span>
        </div>

        {/* Live status pill */}
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${isLive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          <span className="text-xs font-medium text-slate-400">
            {isLive ? 'Sincronizado ao Vivo com Supabase' : 'Aguardando Execução do Script SQL no Supabase'}
          </span>
        </div>
      </div>

      {/* Banner de alerta se os dados reais ainda não foram ativados no Supabase */}
      {!isLive && (
        <div className="bg-[#121c38] border border-amber-500/30 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-xl">info</span>
            </div>
            <div>
              <p className="text-xs font-bold text-white">
                Os nomes abaixo a partir do 6 são temporários (Usuário 6, 7, etc.)
              </p>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                Para carregar a lista real com os <strong>118 e-mails cadastrados no seu Supabase</strong>, execute o script SQL rápido no seu painel Supabase.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowSqlModal(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shrink-0 transition flex items-center gap-2 shadow-lg shadow-amber-500/10"
          >
            <span className="material-symbols-outlined text-base">code</span>
            <span>Copiar Script SQL</span>
          </button>
        </div>
      )}

      {/* Main Container with Scrollable Table */}
      <div className="bg-[#0c142b] border border-[#172445] rounded-2xl overflow-hidden shadow-sm flex flex-col">
        {/* Table Header Bar with Search */}
        <div className="p-5 sm:p-6 border-b border-[#172445] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white tracking-tight">
              Gerenciar Usuários
            </h2>
            <span className="text-xs text-slate-400 font-medium">
              ({users.length} exibidos)
            </span>
          </div>

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

        {/* Scrollable Table Container */}
        <div className="overflow-x-auto max-h-[620px] overflow-y-auto scrollbar-thin">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-[#0a1126] border-b border-[#172445] shadow-sm">
              <tr>
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
                  <td colSpan={5} className="py-16 text-center text-slate-400 text-xs">
                    <span className="material-symbols-outlined animate-spin text-2xl text-blue-500 mb-2">
                      progress_activity
                    </span>
                    <p>Carregando usuários do Supabase...</p>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-slate-400 text-xs">
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
                      <p className="text-xs text-slate-400 mt-0.5 font-mono">
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
                        {/* Ativar Plano R$ 4,99 */}
                        <button
                          onClick={() => handleGrantSubscription(user)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 transition"
                          title="Liberar / Ativar Plano Mensal R$ 4,99"
                        >
                          <span className="material-symbols-outlined text-lg">
                            credit_card
                          </span>
                        </button>

                        {/* Ativar/Desbloquear */}
                        <button
                          onClick={() => handleToggleStatus(user)}
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
                          onClick={() => handleToggleStatus(user)}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${
                            user.status === 'Bloqueado'
                              ? 'text-rose-400 bg-rose-500/10'
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

      {/* SQL Script Modal */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0d162f] border border-[#1d2a4e] rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1d2a4e] pb-4">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-amber-500 text-2xl">
                  database
                </span>
                <h3 className="text-lg font-bold text-white">
                  Sincronizar 118 Usuários Reais do Supabase
                </h3>
              </div>
              <button
                onClick={() => setShowSqlModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
              <p>
                Os 118 usuários do seu aplicativo estão cadastrados na tabela interna <strong>auth.users</strong> do Supabase. Para que o painel admin exiba os e-mails e nomes reais de cada um deles, basta rodar uma vez este script rápido:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-slate-300 bg-[#070c1a] p-3 rounded-xl border border-white/5 font-medium">
                <li>Clique no botão azul abaixo <strong>"Copiar Script SQL"</strong>.</li>
                <li>Abra seu <strong>Supabase Dashboard</strong> &gt; menu lateral <strong>SQL Editor</strong>.</li>
                <li>Clique em <strong>New Query</strong>, cole o código e aperte <strong>Run</strong>.</li>
              </ol>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowSqlModal(false)}
                className="px-4 py-2 rounded-xl bg-white/5 text-slate-300 hover:text-white text-xs font-semibold transition"
              >
                Fechar
              </button>
              <button
                onClick={handleCopySql}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 transition shadow-lg shadow-blue-600/30"
              >
                <span className="material-symbols-outlined text-sm">
                  {copied ? 'check' : 'content_copy'}
                </span>
                <span>{copied ? 'Copiado para a Área de Transferência!' : 'Copiar Script SQL'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
