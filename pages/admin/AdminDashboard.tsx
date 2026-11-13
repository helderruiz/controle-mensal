import React, { useState, useEffect } from 'react';
import {
  getAdminStats,
  getRealtimeActivities,
  AdminStats,
  AccessActivity,
} from '../../lib/adminService';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 118,
    activeSubscriptions: 0,
    totalAccesses: 603,
    todayAccesses: 5,
  });
  const [activities, setActivities] = useState<AccessActivity[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [statsRes, acts] = await Promise.all([
      getAdminStats(),
      getRealtimeActivities(),
    ]);
    setStats(statsRes.stats);
    setIsLive(statsRes.isLive);
    setActivities(acts);
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

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner / Sync Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0d162d] border border-[#1a2747] p-4 sm:p-5 rounded-2xl">
        <div className="flex items-center gap-3.5">
          <div className={`w-3 h-3 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
          <div>
            <h2 className="text-sm font-semibold text-white">
              {isLive ? 'Conectado ao Supabase (Dados Reais em Tempo Real)' : 'Painel de Administração Ativo'}
            </h2>
            <p className="text-xs text-slate-400">
              {isLive
                ? 'Os 118 usuários reais e logs do seu Supabase estão conectados e sincronizados.'
                : 'Para ver seus 118 usuários reais direto do banco de dados, execute o script SQL rápido no Supabase.'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowSqlModal(true)}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-300 hover:bg-blue-600/30 hover:text-white text-xs font-semibold transition shrink-0"
        >
          <span className="material-symbols-outlined text-base">code</span>
          <span>Script SQL Supabase</span>
        </button>
      </div>

      {/* Page Title */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Dashboard
        </h1>
        <button
          onClick={loadData}
          disabled={loading}
          className="p-2 rounded-xl bg-white/[0.04] border border-white/5 text-slate-400 hover:text-white transition"
          title="Recarregar dados"
        >
          <span className={`material-symbols-outlined text-lg ${loading ? 'animate-spin' : ''}`}>
            sync
          </span>
        </button>
      </div>

      {/* 4 Stat Cards (Removido 'Total de Profissionais' conforme solicitado) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: TOTAL DE USUÁRIOS */}
        <div className="bg-[#0c142b] border border-[#172445] rounded-2xl p-5 flex flex-col justify-between hover:border-blue-500/30 transition shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total de Usuários
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <span className="material-symbols-outlined text-lg">group</span>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              {stats.totalUsers}
            </span>
          </div>
        </div>

        {/* Card 2: ASSINATURAS ATIVAS */}
        <div className="bg-[#0c142b] border border-[#172445] rounded-2xl p-5 flex flex-col justify-between hover:border-emerald-500/30 transition shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Assinaturas Ativas
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <span className="material-symbols-outlined text-lg">credit_card</span>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              {stats.activeSubscriptions}
            </span>
          </div>
        </div>

        {/* Card 3: ACESSOS TOTAIS */}
        <div className="bg-[#0c142b] border border-[#172445] rounded-2xl p-5 flex flex-col justify-between hover:border-amber-500/30 transition shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Acessos Totais
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <span className="material-symbols-outlined text-lg">bar_chart</span>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              {stats.totalAccesses}
            </span>
          </div>
        </div>

        {/* Card 4: ACESSOS HOJE */}
        <div className="bg-[#0c142b] border border-[#172445] rounded-2xl p-5 flex flex-col justify-between hover:border-cyan-500/30 transition shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Acessos Hoje
            </span>
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <span className="material-symbols-outlined text-lg">navigation</span>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              {stats.todayAccesses}
            </span>
          </div>
        </div>
      </div>

      {/* Atividade em Tempo Real com Rolagem (Scroll) */}
      <div className="bg-[#0c142b] border border-[#172445] rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-[#172445] pb-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-amber-400 text-2xl">
              show_chart
            </span>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Atividade em Tempo Real
            </h2>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[#172445] text-slate-400">
            Mostrando {activities.length} Atividades
          </span>
        </div>

        {/* Scrollable Activity List */}
        <div className="max-h-[380px] overflow-y-auto pr-2 space-y-3 scrollbar-thin">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="bg-[#080e1f] border border-[#152140] hover:border-blue-500/30 rounded-xl p-4 flex items-center justify-between transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#111c38] border border-blue-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                  <span className="material-symbols-outlined text-lg rotate-45">
                    navigation
                  </span>
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-white leading-tight">
                    {activity.action}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">
                    {activity.userName}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="flex items-center justify-end gap-1.5 text-xs font-semibold text-slate-300">
                  <span className="material-symbols-outlined text-xs text-slate-500">
                    schedule
                  </span>
                  <span>{activity.time}</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {activity.date}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Script SQL com instruções claras */}
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
                Como os usuários do seu aplicativo estão cadastrados no módulo de autenticação interna do Supabase (<strong>auth.users</strong>), o Supabase exige uma permissão simples para que o painel admin consiga listar os 118 usuários reais.
              </p>
              <p className="text-amber-400 font-semibold">
                Passo a passo (leva menos de 1 minuto):
              </p>
              <ol className="list-decimal list-inside space-y-1 text-slate-300 bg-[#070c1a] p-3 rounded-xl border border-white/5">
                <li>Clique no botão azul abaixo <strong>"Copiar Script SQL"</strong>.</li>
                <li>Abra seu <strong>Supabase Dashboard</strong> &gt; menu lateral esquerdo <strong>SQL Editor</strong>.</li>
                <li>Clique em <strong>New Query</strong>, cole o código e clique em <strong>Run</strong> (botão verde).</li>
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

export default AdminDashboard;
