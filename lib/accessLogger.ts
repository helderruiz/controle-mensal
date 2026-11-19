import { supabase } from './supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';

// Cache em memória para evitar inserções duplicadas no mesmo ciclo de renderização
const recentLogTimestamps = new Map<string, number>();

/**
 * Registra um evento de "Visita ao Sistema" na tabela access_logs.
 * Evita duplicidade no mesmo minuto (debounce de 60 segundos por sessão).
 */
export async function recordAccessLog(user: SupabaseUser | null | undefined): Promise<void> {
  if (!user || !user.email) return;

  const nowTime = Date.now();
  const sessionKey = `cm_last_session_log_${user.id}`;

  // 1. Previne envio duplicado dentro de 60 segundos na mesma aba/sessão
  const lastMemory = recentLogTimestamps.get(user.id);
  if (lastMemory && nowTime - lastMemory < 60 * 1000) {
    return;
  }

  try {
    const lastSession = sessionStorage.getItem(sessionKey);
    if (lastSession && nowTime - Number(lastSession) < 60 * 1000) {
      return;
    }
  } catch {}

  recentLogTimestamps.set(user.id, nowTime);
  try {
    sessionStorage.setItem(sessionKey, String(nowTime));
  } catch {}

  try {
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
  } catch {
    // Falha silenciosa
  }
}

