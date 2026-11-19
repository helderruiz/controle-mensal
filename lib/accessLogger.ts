import { supabase } from './supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';

// Cache em memória para evitar chamadas simultâneas imediatas no mesmo ciclo de render
const inFlightLog = new Set<string>();

/**
 * Registra um evento de "Visita ao Sistema" na tabela access_logs.
 * Limita a 1 registro a cada 30 minutos por usuário usando localStorage.
 */
export async function recordAccessLog(user: SupabaseUser | null | undefined): Promise<void> {
  if (!user || !user.email) return;

  const storageKey = `cm_access_log_${user.id}`;
  const nowTime = Date.now();

  // 1. Bloqueia se já estiver disparando neste milissegundo (evita duplo trigger do getSession + onAuthStateChange)
  if (inFlightLog.has(user.id)) {
    return;
  }

  // 2. Bloqueia se já registrou acesso nos últimos 30 minutos (persiste mesmo ao fechar e abrir a aba/app)
  try {
    const lastLogged = localStorage.getItem(storageKey);
    if (lastLogged && nowTime - Number(lastLogged) < 30 * 60 * 1000) {
      return;
    }
  } catch {}

  inFlightLog.add(user.id);
  // Atualiza timestamp local imediatamente antes de ir ao banco
  try {
    localStorage.setItem(storageKey, String(nowTime));
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
  } finally {
    setTimeout(() => {
      inFlightLog.delete(user.id);
    }, 5000);
  }
}

