import { supabase } from './supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { isUserAdmin } from './adminService';

export interface SubscriptionConfig {
  blockActive: boolean; // Se o bloqueio do dia 01 está ligado
  stripePaymentLink: string; // URL do Stripe Payment Link
  whatsappSupport: string; // Número de WhatsApp para suporte
  monthlyPrice: number; // Valor (R$ 4,99)
}

const DEFAULT_CONFIG: SubscriptionConfig = {
  blockActive: false, // Inicia DESATIVADO por padrão para segurança máxima dos 118 usuários
  stripePaymentLink: 'https://buy.stripe.com/6oUfZh0fccHVbCCgvt4Rq00',
  whatsappSupport: '5511999999999',
  monthlyPrice: 4.99,
};

const CONFIG_STORAGE_KEY = 'controle_mensal_sub_config';

/**
 * 1. Obter as configurações de assinatura e bloqueio
 */
export async function getSubscriptionConfig(): Promise<SubscriptionConfig> {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'subscription_config')
      .single();

    if (!error && data && data.value) {
      const val = data.value;
      return {
        blockActive: Boolean(val.block_active),
        stripePaymentLink: val.stripe_link || '',
        whatsappSupport: val.whatsapp || '',
        monthlyPrice: Number(val.price) || 4.99,
      };
    }
  } catch {
    // fallback para localStorage
  }

  const saved = localStorage.getItem(CONFIG_STORAGE_KEY);
  if (saved) {
    try {
      return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
    } catch {}
  }

  return DEFAULT_CONFIG;
}

/**
 * 2. Salvar as configurações (apenas Admin)
 */
export async function saveSubscriptionConfig(config: SubscriptionConfig): Promise<boolean> {
  // Salva no localStorage local
  localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));

  try {
    const { error } = await supabase.from('system_settings').upsert({
      key: 'subscription_config',
      value: {
        block_active: config.blockActive,
        stripe_link: config.stripePaymentLink,
        whatsapp: config.whatsappSupport,
        price: config.monthlyPrice,
      },
      updated_at: new Date().toISOString(),
    });

    if (!error) return true;
  } catch {
    // fallback
  }

  return true;
}

/**
 * 3. Verifica se o usuário atual precisa ser bloqueado pelo pop-up de R$ 4,99
 * Retorna true se deve BLOQUEAR, ou false se o acesso é PERMITIDO.
 */
export async function checkUserMustBeBlocked(user: SupabaseUser | null | undefined): Promise<boolean> {
  // 1. Se não houver usuário logado, não bloqueia por aqui (vai para tela de login)
  if (!user || !user.email) return false;

  // 2. Administradores NUNCA são bloqueados
  if (isUserAdmin(user)) {
    return false;
  }

  // 3. PRIORIDADE MÁXIMA: Checa via RPC (SECURITY DEFINER = bypassa RLS sempre)
  try {
    const { data: rpcUsers, error: rpcErr } = await supabase.rpc('get_admin_users');
    if (!rpcErr && Array.isArray(rpcUsers)) {
      const myProfile = rpcUsers.find((u: any) => u.id === user.id);
      if (myProfile) {
        // Se foi bloqueado manualmente no painel admin, BLOQUEIA NA HORA!
        if (myProfile.status === 'Bloqueado') {
          return true;
        }
        // Se possui plano mensal pago e ainda dentro da validade, LIBERA!
        if (myProfile.plan === 'MENSAL_4_99' && myProfile.plan_expires_at) {
          const expiresAt = new Date(myProfile.plan_expires_at);
          if (expiresAt > new Date()) {
            return false;
          }
        }
      }
    }
  } catch (err) {
    console.warn('Erro ao verificar via RPC:', err);
  }

  // 4. Fallback: Tenta query direta na tabela profiles
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, plan_expires_at, status')
      .eq('id', user.id)
      .maybeSingle();

    if (profile) {
      // Se foi bloqueado manualmente no painel admin, BLOQUEIA NA HORA!
      if (profile.status === 'Bloqueado') {
        return true;
      }

      // Se possui plano mensal pago e ainda dentro da validade, LIBERA!
      if (profile.plan === 'MENSAL_4_99' && profile.plan_expires_at) {
        const expiresAt = new Date(profile.plan_expires_at);
        if (expiresAt > new Date()) {
          return false;
        }
      }
    }
  } catch (err) {
    console.warn('Erro ao verificar status individual do profile:', err);
  }

  // 5. Checa na tabela subscriptions se possui assinatura ativa
  try {
    const { data: subData } = await supabase
      .from('subscriptions')
      .select('status, current_period_end')
      .eq('user_id', user.id)
      .eq('status', 'ativa')
      .order('created_at', { ascending: false })
      .limit(1);

    if (subData && subData.length > 0) {
      const sub = subData[0];
      if (sub.current_period_end) {
        const expiresAt = new Date(sub.current_period_end);
        if (expiresAt > new Date()) {
          return false; // Assinatura válida!
        }
      }
    }
  } catch (err) {
    console.warn('Erro ao verificar subscriptions:', err);
  }

  // 6. REGRA DO DIA 01: Obtém a configuração do sistema
  const config = await getSubscriptionConfig();

  // Se a chave geral de bloqueio do dia 01 estiver desligada, permite o acesso dos não-bloqueados
  if (!config.blockActive) {
    return false;
  }

  // Se a chave geral do dia 01 está LIGADA e o usuário não possui pagamento para o mês:
  return true;
}

/**
 * 4. Ativar ou prorrogar assinatura de um usuário manualmente (chamado pelo Admin)
 */
export async function activateUserSubscription(
  userId: string,
  userEmail: string,
  userName: string,
  days = 30
): Promise<boolean> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + days);

  try {
    // 1. Tenta RPC direta
    const { error: rpcErr } = await supabase.rpc('admin_activate_subscription', {
      target_user_id: userId,
      target_email: userEmail,
      target_name: userName,
      days: days,
    });

    if (!rpcErr) return true;

    // 2. Fallback para upsert em profiles
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: userId,
      email: userEmail,
      full_name: userName,
      plan: 'MENSAL_4_99',
      plan_expires_at: expiresAt.toISOString(),
      status: 'Ativo',
      updated_at: new Date().toISOString(),
    });

    // 3. Fallback para insert em subscriptions
    const { error: subscriptionError } = await supabase.from('subscriptions').insert([
      {
        user_id: userId,
        user_name: userName,
        user_email: userEmail,
        plan_name: 'Mensal R$ 4,99 (Stripe/Manual)',
        amount: 4.99,
        status: 'ativa',
        gateway: 'stripe',
        current_period_end: expiresAt.toISOString(),
      },
    ]);

    if (profileError || subscriptionError) {
      console.error('Falha ao gravar assinatura:', profileError || subscriptionError);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Erro ao ativar assinatura manual:', err);
    return false;
  }
}

/**
 * 5. Gerar link de checkout do Stripe com identificação do usuário
 */
export function buildStripeCheckoutUrl(
  stripeBaseLink: string,
  user: SupabaseUser | null | undefined
): string {
  if (!stripeBaseLink) return '#';
  const cleanLink = stripeBaseLink.trim();

  try {
    const url = new URL(cleanLink);
    if (user?.id) {
      url.searchParams.set('client_reference_id', user.id);
    }
    if (user?.email) {
      url.searchParams.set('prefilled_email', user.email);
    }
    return url.toString();
  } catch {
    // Se não for URL completa, apenas anexa os parâmetros
    const sep = cleanLink.includes('?') ? '&' : '?';
    const emailParam = user?.email ? `prefilled_email=${encodeURIComponent(user.email)}` : '';
    const userParam = user?.id ? `client_reference_id=${user.id}` : '';
    const params = [emailParam, userParam].filter(Boolean).join('&');
    return params ? `${cleanLink}${sep}${params}` : cleanLink;
  }
}

