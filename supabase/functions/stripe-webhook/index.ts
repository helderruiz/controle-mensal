import Stripe from 'npm:stripe@^22';
import { createClient } from 'npm:@supabase/supabase-js@2';

const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!stripeSecretKey || !webhookSecret || !supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing Stripe or Supabase webhook environment variables');
}

const stripe = new Stripe(stripeSecretKey);
const cryptoProvider = Stripe.createSubtleCryptoProvider();
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

Deno.serve(async (request) => {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) return new Response('Missing Stripe signature', { status: 400 });

  let event: Stripe.Event;
  try {
    const body = await request.text();
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      cryptoProvider,
    );
  } catch (error) {
    console.error('Stripe signature verification failed:', error);
    return new Response('Invalid Stripe signature', { status: 400 });
  }

  if (!['checkout.session.completed', 'checkout.session.async_payment_succeeded'].includes(event.type)) {
    return Response.json({ received: true, ignored: true });
  }

  const checkout = event.data.object as Stripe.Checkout.Session;
  if (checkout.payment_status !== 'paid' || checkout.currency !== 'brl' || checkout.amount_total !== 499) {
    console.warn('Ignoring checkout with unexpected payment details', {
      eventId: event.id,
      paymentStatus: checkout.payment_status,
      currency: checkout.currency,
      amountTotal: checkout.amount_total,
    });
    return Response.json({ received: true, ignored: true });
  }

  const email = checkout.customer_details?.email?.trim().toLowerCase()
    || checkout.customer_email?.trim().toLowerCase();
  if (!email) {
    console.error('Paid checkout has no customer email', { eventId: event.id });
    return new Response('Checkout customer email is required', { status: 422 });
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email')
    .ilike('email', email)
    .maybeSingle();

  if (profileError) {
    console.error('Could not find the checkout profile', profileError);
    return new Response('Could not resolve checkout customer', { status: 500 });
  }
  if (!profile) {
    console.error('No profile matches the paid checkout email', { email, eventId: event.id });
    return new Response('No account matches checkout email', { status: 422 });
  }
  if (checkout.client_reference_id && checkout.client_reference_id !== profile.id) {
    console.error('Checkout reference does not match the Stripe customer email', { eventId: event.id });
    return new Response('Checkout account reference mismatch', { status: 422 });
  }

  const customerName = checkout.customer_details?.name?.trim()
    || profile.email?.split('@')[0]
    || 'Usuário';
  const { error: activationError } = await supabase.rpc('activate_stripe_checkout', {
    p_event_id: event.id,
    p_checkout_session_id: checkout.id,
    p_user_id: profile.id,
    p_user_email: email,
    p_user_name: customerName,
    p_amount_cents: checkout.amount_total,
    p_currency: checkout.currency,
  });

  if (activationError) {
    console.error('Could not activate subscription from Stripe event', activationError);
    return new Response('Could not activate subscription', { status: 500 });
  }

  return Response.json({ received: true });
});
