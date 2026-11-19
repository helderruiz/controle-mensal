import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { isUserAdmin } from '../../lib/adminService';

const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) {
        setError(signInError.message === 'Invalid login credentials' 
          ? 'E-mail ou senha incorretos. Se ainda não confirmou o e-mail no Supabase, verifique sua caixa de entrada.'
          : signInError.message);
        setLoading(false);
        return;
      }

      // 3. Valida se o usuário logado é realmente o administrador
      if (!isUserAdmin(data.user)) {
        await supabase.auth.signOut({ scope: 'local' });
        setError('Acesso negado: Este e-mail não possui permissão de administrador.');
        setLoading(false);
        return;
      }

      // Redireciona com sucesso ao painel
      navigate('/admin/dashboard', { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Ocorreu um erro ao conectar ao servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070d1e] flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#0c142b] border border-[#172545] rounded-3xl p-8 sm:p-10 shadow-2xl space-y-6">
        {/* Header Icon */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-lg">
            <span className="material-symbols-outlined text-3xl font-bold">shield</span>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight font-display">
              Admin Panel
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Acesso restrito à gestão do Controle Mensal
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleAdminLogin} className="space-y-4" autoComplete="off">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              E-mail do Administrador
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-lg">
                mail
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="off"
                className="w-full bg-[#070d1e] border border-[#172445] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
                placeholder="admin@exemplo.com"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Senha
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-lg">
                lock
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="w-full bg-[#070d1e] border border-[#172445] rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <span className="material-symbols-outlined text-lg">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2">
              <span className="material-symbols-outlined text-sm mt-0.5">error</span>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined text-base animate-spin">
                  progress_activity
                </span>
                <span>Acessando...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-base">login</span>
                <span>Entrar no Painel Admin</span>
              </>
            )}
          </button>
        </form>

        {/* Back Link */}
        <div className="text-center pt-2">
          <Link
            to="/"
            className="text-xs text-slate-400 hover:text-white transition flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            <span>Voltar ao aplicativo</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;

