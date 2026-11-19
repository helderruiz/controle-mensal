import { supabase } from './supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';

/**
 * Registra um evento de "Visita ao Sistema" na tabela access_logs.
 * Executado de forma silenciosa e não-bloqueante (nunca quebra a experiência do usuário).
 */
export async function recordAccessLog(user: SupabaseUser | null | undefined): Promise<void> {
  if (!user || !user.email) return;

  try {
    // Evita chamadas duplicadas nos últimos 15 minutos na mesma sessão
    const nowTime = Date.now();
    const lastLogged = sessionStorage.getItem(`last_access_log_${user.id}`);
    if (lastLogged && nowTime - Number(lastLogged) < 15 * 60 * 1000) {
      return;
    }

    const userName =
      user.user_metadata?.full_name ||
      user.email.split('@')[0] ||
      'Usuário';

    // Salva o log no Supabase
    const { error } = await supabase.from('access_logs').insert([
      {
        user_id: user.id,
        user_name: userName,
        user_email: user.email,
        action: 'Visita ao Sistema',
      },
    ]);

    if (!error) {
      sessionStorage.setItem(`last_access_log_${user.id}`, String(nowTime));
    }
  } catch {
    // Falha silenciosa para não afetar o app
  }
}

