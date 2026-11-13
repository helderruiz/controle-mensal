-- ==============================================================================
-- SCRIPT DE CONFIGURAÇÃO DO PAINEL ADMIN & ASSINATURAS - CONTROLE MENSAL
-- ==============================================================================
-- Este script é 100% SEGURO e NÃO altera nem remove transações ou usuários existentes.
-- Ele prepara as tabelas para:
-- 1) Perfis de usuários (com detecção do Admin Helder)
-- 2) Migração automática dos 118 usuários já existentes no Supabase Auth
-- 3) Registro de novos usuários automático via Trigger
-- 4) Logs de Acesso em Tempo Real (Visita ao Sistema)
-- 5) Tabela de Assinaturas (Pronta para o plano de R$ 4,99/mês)
-- ==============================================================================

-- 1. TABELA DE PERFIS DE USUÁRIOS
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  full_name text,
  role text default 'CLIENT', -- 'ADMIN', 'CLIENT', 'PROFESSIONAL'
  status text default 'Ativo', -- 'Ativo', 'Bloqueado'
  plan text default 'GRATUITO', -- 'TRIAL', 'GRATUITO', 'MENSAL_4_99'
  plan_expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Habilitar RLS em profiles
alter table public.profiles enable row level security;

-- Políticas de segurança
drop policy if exists "Usuários podem ver seu próprio perfil" on public.profiles;
create policy "Usuários podem ver seu próprio perfil"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Usuários podem atualizar seu próprio perfil" on public.profiles;
create policy "Usuários podem atualizar seu próprio perfil"
  on public.profiles for update
  using (auth.uid() = id);

drop policy if exists "Admins têm acesso total a perfis" on public.profiles;
create policy "Admins têm acesso total a perfis"
  on public.profiles for all
  using (
    auth.jwt()->>'email' = 'helder.ruiz.marcelino@gmail.com'
    or exists (
      select 1 from public.profiles 
      where id = auth.uid() and role = 'ADMIN'
    )
  );

-- 2. MIGRAÇÃO SEGURA DOS USUÁRIOS JÁ CADASTRADOS (SEUS 118 USUÁRIOS)
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

-- 3. TRIGGER PARA NOVOS CADASTROS NO APP IREM AUTOMATICAMENTE PARA PUBLIC.PROFILES
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

-- 4. TABELA DE LOGS DE ACESSO (ATIVIDADE EM TEMPO REAL)
create table if not exists public.access_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete set null,
  user_name text,
  user_email text,
  action text default 'Visita ao Sistema',
  created_at timestamptz default now()
);

alter table public.access_logs enable row level security;

drop policy if exists "Qualquer autenticado pode registrar seu acesso" on public.access_logs;
create policy "Qualquer autenticado pode registrar seu acesso"
  on public.access_logs for insert
  with check (true);

drop policy if exists "Admins podem ler os logs de acesso" on public.access_logs;
create policy "Admins podem ler os logs de acesso"
  on public.access_logs for select
  using (
    auth.jwt()->>'email' = 'helder.ruiz.marcelino@gmail.com'
    or exists (
      select 1 from public.profiles 
      where id = auth.uid() and role = 'ADMIN'
    )
  );

-- 5. TABELA DE ASSINATURAS (PREPARADA PARA A ETAPA DAS ASSINATURAS DE R$ 4,99)
create table if not exists public.subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  user_name text,
  user_email text,
  plan_name text default 'Mensal R$ 4,99',
  amount numeric(10,2) default 4.99,
  status text default 'ativa', -- 'ativa', 'pendente', 'cancelada', 'expirada'
  gateway text default 'mercado_pago',
  gateway_subscription_id text,
  current_period_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.subscriptions enable row level security;

drop policy if exists "Usuários podem ver sua assinatura" on public.subscriptions;
create policy "Usuários podem ver sua assinatura"
  on public.subscriptions for select
  using (auth.uid() = user_id);

drop policy if exists "Admins têm acesso total a assinaturas" on public.subscriptions;
create policy "Admins têm acesso total a assinaturas"
  on public.subscriptions for all
  using (
    auth.jwt()->>'email' = 'helder.ruiz.marcelino@gmail.com'
    or exists (
      select 1 from public.profiles 
      where id = auth.uid() and role = 'ADMIN'
    )
  );

