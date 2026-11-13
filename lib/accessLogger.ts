import { supabase } from './supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';

/**
 * Registra um evento de "Visita ao Sistema" na tabela access_logs.
 * Executado de forma silenciosa e não-bloqueante (nunca quebra a experiência do usuário).
 */
export async function recordAccessLog(user: SupabaseUser | null | undefined): Promise<void> {
  if (!user || !user.email) return;

  try {
    // Evita chamadas duplicadas na mesma sessão do navegador
    const sessionKey = `access_logged_${user.id}_${new Date().toISOString().slice(0, 10)}`;
    if (sessionStorage.getItem(sessionKey)) {
      return;
    }

    const userName =
      user.user_metadata?.full_name ||
      user.email.split('@')[0] ||
      'Usuário';

    // Salva o log no Supabase
    await supabase.from('access_logs').insert([
      {
        user_id: user.id,
        user_name: userName,
        user_email: user.email,
        action: 'Visita ao Sistema',
      },
    ]);

    sessionStorage.setItem(sessionKey, 'true');
  } catch {
    // Falha silenciosa para não afetar o app em caso de offline ou antes de rodar o SQL
  }
}

