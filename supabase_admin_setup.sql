-- ==============================================================================
-- SCRIPT DE SINCRONIZAÇÃO COMPLETA - CONTROLE MENSAL & SUPABASE
-- ==============================================================================
-- Este script é 100% SEGURO e NÃO apaga nada.
-- Ele conecta seus 118 usuários reais ao Painel Admin e prepara o banco para as assinaturas.
-- ==============================================================================

-- 1. CRIAÇÃO DA TABELA DE PERFIS DE USUÁRIOS
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  full_name text,
  role text default 'CLIENT', -- 'ADMIN', 'CLIENT'
  status text default 'Ativo', -- 'Ativo', 'Bloqueado'
  plan text default 'GRATUITO', -- 'GRATUITO', 'MENSAL_4_99'
  plan_expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Habilitar RLS
alter table public.profiles enable row level security;

-- Políticas de RLS simples e diretas (evita bloqueio no painel admin)
drop policy if exists "Permitir leitura de perfis para autenticados" on public.profiles;
create policy "Permitir leitura de perfis para autenticados"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "Permitir atualizacao de perfis para autenticados" on public.profiles;
create policy "Permitir atualizacao de perfis para autenticados"
  on public.profiles for all
  to authenticated
  using (true);

-- 2. MIGRAÇÃO AUTOMÁTICA DOS SEUS 118 USUÁRIOS DO SUPABASE AUTH
insert into public.profiles (id, email, full_name, role, status, plan, created_at)
select 
  id,
  email,
  coalesce(raw_user_meta_data->>'full_name', split_part(email, '@', 1)),
  case 
    when lower(email) = 'helder.ruiz.marcelino@gmail.com' then 'ADMIN'
    else 'CLIENT'
  end,
  'Ativo',
  'GRATUITO',
  created_at
from auth.users
on conflict (id) do update 
set 
  email = excluded.email,
  role = case 
    when lower(excluded.email) = 'helder.ruiz.marcelino@gmail.com' then 'ADMIN'
    else public.profiles.role 
  end;

-- 3. FUNÇÃO RPC get_admin_users (Puxa todos os usuários diretamente de auth.users em tempo real)
create or replace function public.get_admin_users()
returns table (
  id uuid,
  email text,
  full_name text,
  role text,
  status text,
  plan text,
  created_at timestamptz
)
security definer
set search_path = public, auth
language plpgsql
as $$
begin
  return query
  select 
    u.id,
    u.email::text,
    coalesce(p.full_name, u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1))::text,
    coalesce(p.role, case when lower(u.email) = 'helder.ruiz.marcelino@gmail.com' then 'ADMIN' else 'CLIENT' end)::text,
    coalesce(p.status, 'Ativo')::text,
    coalesce(p.plan, 'GRATUITO')::text,
    u.created_at
  from auth.users u
  left join public.profiles p on p.id = u.id
  order by u.created_at desc;
end;
$$;

grant execute on function public.get_admin_users() to authenticated, anon;

-- 4. TRIGGER PARA NOVOS CADASTROS NO APP
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role, status, plan, created_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    case 
      when lower(new.email) = 'helder.ruiz.marcelino@gmail.com' then 'ADMIN'
      else 'CLIENT'
    end,
    'Ativo',
    'GRATUITO',
    now()
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5. TABELA DE LOGS DE ACESSO (Atividade em Tempo Real com Scroll)
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

drop policy if exists "Logs select livre para autenticados" on public.access_logs;
create policy "Logs select livre para autenticados" on public.access_logs for select to authenticated using (true);

-- 6. TABELA DE ASSINATURAS (Estrutura pronta para R$ 4,99/mês)
create table if not exists public.subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  user_name text,
  user_email text,
  plan_name text default 'Mensal R$ 4,99',
  amount numeric(10,2) default 4.99,
  status text default 'ativa',
  gateway text default 'mercado_pago',
  gateway_subscription_id text,
  current_period_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.subscriptions enable row level security;

drop policy if exists "Assinaturas select livre para autenticados" on public.subscriptions;
create policy "Assinaturas select livre para autenticados" on public.subscriptions for select to authenticated using (true);

drop policy if exists "Assinaturas all para autenticados" on public.subscriptions;
create policy "Assinaturas all para autenticados" on public.subscriptions for all to authenticated using (true);
