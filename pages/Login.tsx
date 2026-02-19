
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import FormField from '../components/FormField';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });

    if (error) {
      setError(
        error.message === 'Invalid login credentials'
          ? 'E-mail ou senha incorretos.'
          : error.message
      );
    }
    // Se sucesso, o onAuthStateChange no App.tsx redireciona automaticamente

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col overflow-hidden">
      <div className="ios-gradient h-[45dvh] w-full flex flex-col items-center justify-center relative overflow-hidden shrink-0">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute top-20 -right-20 w-60 h-60 bg-white/10 rounded-full blur-3xl"></div>
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-20 h-20 bg-white rounded-[32px] flex items-center justify-center shadow-2xl shadow-blue-900/40 mb-6">
            <span className="material-symbols-outlined text-primary text-5xl font-bold">account_balance_wallet</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight font-display">Bem-vindo</h1>
          <p className="text-blue-100/80 mt-1 text-sm">Controle suas finanças com facilidade</p>
        </div>
      </div>

      <div className="flex-1 bg-white dark:bg-slate-900 -mt-10 rounded-t-[40px] relative z-20 px-8 pt-12 flex flex-col shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <FormField
            label="E-mail"
            icon="mail"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="seuemail@exemplo.com"
            required
          />

          <div className="space-y-1.5">
            <FormField
              label="Senha"
              icon="lock"
              type="password"
              value={pass}
              onChange={e => setPass(e.target.value)}
              placeholder="••••••••"
              required
              rightSlot={
                <button className="text-slate-400" type="button">
                  <span className="material-symbols-outlined">visibility</span>
                </button>
              }
            />
            <div className="text-right">
              <a className="text-xs font-semibold text-primary dark:text-blue-400" href="#">Esqueci minha senha</a>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 px-4 py-3 rounded-xl text-sm font-medium">
              <span className="material-symbols-outlined text-base">error</span>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="ios-gradient w-full py-4 rounded-2xl text-white font-bold text-lg shadow-xl shadow-blue-600/30 active:scale-[0.98] transition-all disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined text-xl animate-spin" style={{ animationDuration: '1s' }}>progress_activity</span>
                Entrando...
              </>
            ) : 'ENTRAR'}
          </button>
        </form>

        <div className="mt-auto pb-12">
          <div className="flex flex-col items-center gap-6">
            <div className="w-full flex items-center gap-4">
              <div className="h-px bg-slate-100 dark:bg-slate-800 flex-1"></div>
              <span className="text-slate-400 text-[10px] font-bold">OU ENTRE COM</span>
              <div className="h-px bg-slate-100 dark:bg-slate-800 flex-1"></div>
            </div>
            <div className="flex gap-4">
              <button className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/5 flex items-center justify-center shadow-sm active:scale-90 transition-transform">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                </svg>
              </button>
            </div>
            <p className="text-sm text-slate-500 font-medium">
              Não tem uma conta?
              <Link to="/signup" className="text-primary dark:text-blue-400 font-bold ml-1">Criar conta</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
