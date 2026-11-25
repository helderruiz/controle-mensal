-- Schedule the first subscription block for December 1, 2026.
-- New accounts still receive their individual 30-day trial in the app logic.
update public.system_settings
set value = coalesce(value, '{}'::jsonb) || jsonb_build_object(
  'block_active', true,
  'block_start_date', '2026-12-01'
),
updated_at = now()
where key = 'subscription_config';

insert into public.system_settings (key, value)
values (
  'subscription_config',
  jsonb_build_object(
    'block_active', true,
    'block_start_date', '2026-12-01',
    'price', 4.99,
    'stripe_link', 'https://buy.stripe.com/6oUfZh0fccHVbCCgvt4Rq00',
    'whatsapp', '5517936261493'
  )
)
on conflict (key) do nothing;
