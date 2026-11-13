import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { isUserAdmin } from '../../lib/adminService';
import AdminLayout from './AdminLayout';

interface AdminGuardProps {
  session: Session | null | false;
  children: React.ReactNode;
}

const AdminGuard: React.FC<AdminGuardProps> = ({ session, children }) => {
  // 1. Ainda carregando sessão
  if (session === null) {
    return (
      <div className="min-h-screen bg-[#070d1e] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 animate-pulse">
            <span className="material-symbols-outlined text-3xl font-bold">shield</span>
          </div>
          <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase animate-pulse">
            Verificando permissões...
          </p>
        </div>
      </div>
    );
  }

  // 2. Não autenticado -> redireciona para a tela de login do Admin
  if (session === false) {
    return <Navigate to="/admin/login" replace />;
  }

  // 3. Autenticado, mas NÃO é administrador
  if (!isUserAdmin(session.user)) {
    return (
      <div className="min-h-screen bg-[#070d1e] flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#0c142b] border border-rose-500/30 rounded-3xl p-8 text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
            <span className="material-symbols-outlined text-3xl">gpp_bad</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Acesso Restrito</h2>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Você está logado como <strong className="text-slate-200">{session.user.email}</strong>, que não possui privilégios de administrador.
            </p>
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <Link
              to="/admin/login"
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
            >
              Entrar com a Conta de Administrador
            </Link>
            <Link
              to="/"
              className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-xs transition"
            >
              Voltar ao Meu Controle Financeiro
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 4. Administrador autenticado -> Renderiza dentro do layout administrativo
  return <AdminLayout>{children}</AdminLayout>;
};

export default AdminGuard;

