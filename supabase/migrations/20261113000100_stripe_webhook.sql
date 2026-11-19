-- Atomic, idempotent Stripe payment activation. The service role is the only
-- caller allowed to execute this function; the browser never receives this key.
create table if not exists public.stripe_webhook_events (
  event_id text primary key,
  checkout_session_id text not null unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  processed_at timestamptz not null default now()
);

alter table public.stripe_webhook_events enable row level security;
revoke all on public.stripe_webhook_events from anon, authenticated;
grant all on public.stripe_webhook_events to service_role;

create or replace function public.activate_stripe_checkout(
  p_event_id text,
  p_checkout_session_id text,
  p_user_id uuid,
  p_user_email text,
  p_user_name text,
  p_amount_cents integer,
  p_currency text
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_expires timestamptz := now() + interval '30 days';
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'service role required';
  end if;
  if p_amount_cents <> 499 or lower(p_currency) <> 'brl' then
    raise exception 'unexpected payment amount or currency';
  end if;

  insert into public.stripe_webhook_events (event_id, checkout_session_id, user_id)
  values (p_event_id, p_checkout_session_id, p_user_id)
  on conflict do nothing;

  if not found then
    return;
  end if;

  update public.profiles
  set plan = 'MENSAL_4_99',
      plan_expires_at = v_expires,
      status = 'Ativo',
      email = p_user_email,
      full_name = coalesce(nullif(p_user_name, ''), full_name),
      updated_at = now()
  where id = p_user_id;

  if not found then
    raise exception 'profile not found';
  end if;

  insert into public.subscriptions (
    user_id, user_name, user_email, plan_name, amount, status,
    gateway, gateway_subscription_id, current_period_end
  ) values (
    p_user_id, p_user_name, p_user_email, 'Mensal R$ 4,99', 4.99,
    'ativa', 'stripe', p_checkout_session_id, v_expires
  );
end;
$$;

revoke all on function public.activate_stripe_checkout(text, text, uuid, text, text, integer, text)
  from public, anon, authenticated;
grant execute on function public.activate_stripe_checkout(text, text, uuid, text, text, integer, text)
  to service_role;

-- The old client-callable RPC could activate arbitrary accounts without a
-- payment. Keep manual activation in the admin interface instead.
revoke all on function public.admin_activate_subscription(uuid, text, text, integer)
  from public, anon, authenticated;
