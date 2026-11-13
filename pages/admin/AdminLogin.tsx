import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ADMIN_EMAIL, isUserAdmin } from '../../lib/adminService';

const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState(ADMIN_EMAIL);
  const [password, setPassword] = useState('Ruiz@166123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    setLoading(true);

    try {
      // 1. Tenta fazer login com a senha informada
      let { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      // 2. Se a conta ainda não existir no Supabase Auth, cria automaticamente
      if (signInError && (signInError.message.includes('Invalid login') || signInError.message.includes('not found'))) {
        setInfoMessage('Criando sua conta de administrador no Supabase...');
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: 'Helder Ruiz Marcelino',
              role: 'admin',
            },
          },
        });

        if (signUpError) {
          setError(signUpError.message);
          setLoading(false);
          return;
        }

        // Se a confirmação de e-mail estiver desabilitada no Supabase, a sessão já existe
        if (signUpData.session) {
          data = signUpData;
          signInError = null;
        } else {
          // Tenta logar novamente
          const retry = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });
          data = retry.data;
          signInError = retry.error;
        }
      }

      if (signInError) {
        setError(signInError.message === 'Invalid login credentials' 
          ? 'E-mail ou senha incorretos. Se ainda não confirmou o e-mail no Supabase, verifique sua caixa de entrada.'
          : signInError.message);
        setLoading(false);
        return;
      }

      // 3. Valida se o usuário logado é realmente o administrador
      if (!isUserAdmin(data.user)) {
        await supabase.auth.signOut();
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

  const handleFillCredentials = () => {
    setEmail(ADMIN_EMAIL);
    setPassword('Ruiz@166123');
    setError('');
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

        {/* Quick Fill Button */}
        <button
          type="button"
          onClick={handleFillCredentials}
          className="w-full py-2 px-3 rounded-xl bg-blue-600/10 border border-blue-500/30 text-blue-300 hover:bg-blue-600/20 text-xs font-semibold flex items-center justify-center gap-2 transition"
        >
          <span className="material-symbols-outlined text-sm">key</span>
          <span>Preencher credenciais de Helder Ruiz</span>
        </button>

        {/* Form */}
        <form onSubmit={handleAdminLogin} className="space-y-4">
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

          {infoMessage && (
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs">
              {infoMessage}
            </div>
          )}

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

