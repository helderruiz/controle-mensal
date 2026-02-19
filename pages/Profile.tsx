
import React from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface ProfileProps {
  session: Session;
}

const Profile: React.FC<ProfileProps> = ({ session }) => {
  const user = session.user;
  const fullName = user.user_metadata?.full_name || 'Usuário';
  const email = user.email || '';
  const initials = fullName
    .split(' ')
    .slice(0, 2)
    .map((n: string) => n[0])
    .join('')
    .toUpperCase();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // onAuthStateChange no App.tsx redireciona automaticamente
  };

  return (
    <div className="pb-24">
      <div className="ios-gradient px-6 pb-12 pt-16 flex flex-col items-center text-center rounded-b-[40px]">
        <div className="relative mb-6">
          {/* Avatar com iniciais */}
          <div className="w-28 h-28 rounded-full border-4 border-white/20 overflow-hidden bg-white/20 shadow-xl flex items-center justify-center">
            <span className="text-white text-4xl font-black">{initials}</span>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white mb-1 font-display">{fullName}</h2>
        <p className="text-white/70 text-sm font-medium">{email}</p>
      </div>

      <div className="flex-1 px-4 mt-8 space-y-4">
        {/* Card de informações */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-sm border border-slate-100 dark:border-white/5">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Conta</p>
          </div>
          <div className="px-6 py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-lg">mail</span>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">E-mail</p>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{email}</p>
            </div>
          </div>
        </div>

        {/* Botão de logout */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-sm border border-slate-100 dark:border-white/5 p-6">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-between p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/10 text-rose-500 active:scale-[0.98] transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-900/20 flex items-center justify-center">
                <span className="material-symbols-outlined font-bold">logout</span>
              </div>
              <span className="text-lg font-bold">Sair da Conta</span>
            </div>
            <span className="material-symbols-outlined text-rose-300">chevron_right</span>
          </button>

          <p className="text-center text-slate-400 text-[10px] mt-8 uppercase font-bold tracking-widest">
            Versão 2.4.0 • Built with Love
          </p>
        </div>
      </div>
    </div>
  );
};

export default Profile;
