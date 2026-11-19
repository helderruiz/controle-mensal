begin;

-- Pin admin authority to the existing Auth user ID, rather than client-editable
-- user metadata or an email string supplied by a client.
create table if not exists public.admin_identity (
  singleton boolean primary key default true check (singleton),
  user_id uuid not null unique references auth.users(id)
);

insert into public.admin_identity (singleton, user_id)
select true, id
from auth.users
where lower(email) = 'helder.ruiz.marcelino@gmail.com'
on conflict (singleton) do nothing;

do $$
begin
  if not exists (select 1 from public.admin_identity where singleton is true) then
    raise exception 'Admin Auth account was not found; create the admin Auth user before applying this migration.';
  end if;
end;
$$;

revoke all on table public.admin_identity from public, anon, authenticated;

create or replace function public.is_admin_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_identity
    where singleton is true
      and user_id = auth.uid()
  );
$$;

revoke all on function public.is_admin_user() from public, anon;
grant execute on function public.is_admin_user() to authenticated;

-- Some existing projects do not yet have this table from the setup script.
create table if not exists public.system_settings (
  key text primary key,
  value jsonb,
  updated_at timestamptz default now()
);

insert into public.system_settings (key, value)
values (
  'subscription_config',
  '{"block_active": false, "price": 4.99, "stripe_link": "https://buy.stripe.com/6oUfZh0fccHVbCCgvt4Rq00", "whatsapp": ""}'::jsonb
)
on conflict (key) do nothing;

-- Remove the permissive policies installed by the original setup script,
-- including any older policies that could otherwise combine with these.
do $$
declare
  policy_row record;
begin
  for policy_row in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('profiles', 'subscriptions', 'system_settings', 'access_logs')
  loop
    execute format(
      'drop policy %I on %I.%I',
      policy_row.policyname,
      policy_row.schemaname,
      policy_row.tablename
    );
  end loop;
end;
$$;

alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.system_settings enable row level security;
alter table public.access_logs enable row level security;

create policy profiles_read_own_or_admin
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.is_admin_user());

create policy profiles_admin_manage
  on public.profiles for all to authenticated
  using (public.is_admin_user())
  with check (public.is_admin_user());

create policy subscriptions_read_own_or_admin
  on public.subscriptions for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin_user());

create policy subscriptions_admin_manage
  on public.subscriptions for all to authenticated
  using (public.is_admin_user())
  with check (public.is_admin_user());

create policy settings_read_authenticated
  on public.system_settings for select to authenticated
  using (true);

create policy settings_admin_manage
  on public.system_settings for all to authenticated
  using (public.is_admin_user())
  with check (public.is_admin_user());

create policy access_logs_insert_own
  on public.access_logs for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy access_logs_admin_read
  on public.access_logs for select to authenticated
  using (public.is_admin_user());

create policy access_logs_admin_manage
  on public.access_logs for all to authenticated
  using (public.is_admin_user())
  with check (public.is_admin_user());

revoke all on table public.profiles, public.subscriptions, public.system_settings, public.access_logs
  from public, anon;
grant select, insert, update, delete on table public.profiles, public.subscriptions,
  public.system_settings, public.access_logs to authenticated;

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
set search_path = ''
language plpgsql
as $$
begin
  if not public.is_admin_user() then
    raise exception 'Forbidden' using errcode = '42501';
  end if;

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

create or replace function public.admin_set_user_status(target_user_id uuid, new_status text)
returns void
security definer
set search_path = ''
language plpgsql
as $$
begin
  if not public.is_admin_user() then
    raise exception 'Forbidden' using errcode = '42501';
  end if;

  if new_status not in ('Ativo', 'Bloqueado') then
    raise exception 'Invalid status' using errcode = '22023';
  end if;

  update public.profiles
  set status = new_status
  where id = target_user_id;

  if not found then
    insert into public.profiles (id, status)
    values (target_user_id, new_status);
  end if;
end;
$$;

create or replace function public.admin_activate_subscription(
  target_user_id uuid,
  target_email text,
  target_name text,
  days int default 30
)
returns void
security definer
set search_path = ''
language plpgsql
as $$
declare
  new_expires timestamptz;
begin
  if not public.is_admin_user() then
    raise exception 'Forbidden' using errcode = '42501';
  end if;

  if days < 1 or days > 365 then
    raise exception 'Invalid subscription duration' using errcode = '22023';
  end if;

  new_expires := now() + (days || ' days')::interval;

  update public.profiles
  set plan = 'MENSAL_4_99', plan_expires_at = new_expires, status = 'Ativo'
  where id = target_user_id;

  if not found then
    insert into public.profiles (id, email, full_name, plan, plan_expires_at, status)
    values (target_user_id, target_email, target_name, 'MENSAL_4_99', new_expires, 'Ativo');
  end if;

  insert into public.subscriptions (user_id, user_name, user_email, plan_name, amount, status, gateway, current_period_end)
  values (target_user_id, target_name, target_email, 'Mensal R$ 4,99', 4.99, 'ativa', 'stripe', new_expires);
end;
$$;

revoke all on function public.get_admin_users() from public, anon;
revoke all on function public.admin_set_user_status(uuid, text) from public, anon;
revoke all on function public.admin_activate_subscription(uuid, text, text, int) from public, anon;
grant execute on function public.get_admin_users() to authenticated;
grant execute on function public.admin_set_user_status(uuid, text) to authenticated;
grant execute on function public.admin_activate_subscription(uuid, text, text, int) to authenticated;

commit;
