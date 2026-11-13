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
  stripePaymentLink: '',
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

  // 3. Obtém a configuração do sistema
  const config = await getSubscriptionConfig();

  // 4. Se a chave geral de bloqueio estiver DESLIGADA no painel, NENHUM usuário é bloqueado
  if (!config.blockActive) {
    return false;
  }

  // 5. Verifica se o usuário tem assinatura ativa ou período válido no Supabase
  try {
    // Checa na tabela subscriptions
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
          return false; // Assinatura paga e válida!
        }
      } else {
        return false;
      }
    }

    // Checa na tabela profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, plan_expires_at, status')
      .eq('id', user.id)
      .single();

    if (profile) {
      if (profile.status === 'Bloqueado') {
        return true;
      }
      if (profile.plan === 'MENSAL_4_99' && profile.plan_expires_at) {
        const expiresAt = new Date(profile.plan_expires_at);
        if (expiresAt > new Date()) {
          return false; // Válido!
        }
      }
    }
  } catch {
    // Em caso de falha de conexão, para não prejudicar o usuário em produção, não bloqueia
    return false;
  }

  // Se o bloqueio está ativado e o usuário não possui pagamento para o mês corrente:
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
    // 1. Atualiza profiles
    await supabase.from('profiles').upsert({
      id: userId,
      email: userEmail,
      full_name: userName,
      plan: 'MENSAL_4_99',
      plan_expires_at: expiresAt.toISOString(),
      status: 'Ativo',
      updated_at: new Date().toISOString(),
    });

    // 2. Insere registro em subscriptions
    await supabase.from('subscriptions').insert([
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
