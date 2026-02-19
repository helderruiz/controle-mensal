
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import FormField from '../components/FormField';

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (pass.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: { full_name: name },
      },
    });

    setLoading(false);

    if (error) {
      if (error.message.includes('already registered')) {
        setError('Este e-mail já está cadastrado. Faça login.');
      } else {
        setError(error.message);
      }
      return;
    }

    // Se confirmação de e-mail estiver desabilitada, o onAuthStateChange
    // no App.tsx já redireciona. Caso contrário, vai para login.
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-900">
      <header className="px-6 pt-12 pb-8">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-white/5 text-slate-500 mb-6"
        >
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </button>
        <h1 className="text-3xl font-bold font-display">Criar Conta</h1>
        <p className="text-slate-500 mt-1">Comece a gerenciar suas finanças hoje mesmo.</p>
      </header>

      <main className="flex-1 px-8 pb-12">
        <form onSubmit={handleSubmit} className="space-y-6">
          <FormField
            label="Nome Completo"
            icon="person"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Seu nome"
            required
          />

          <FormField
            label="E-mail"
            icon="mail"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="seuemail@exemplo.com"
            required
          />

          <FormField
            label="Senha"
            icon="lock"
            type="password"
            value={pass}
            onChange={e => setPass(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            required
          />

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
                Criando conta...
              </>
            ) : 'CADASTRAR'}
          </button>
        </form>

        <div className="mt-12 text-center">
          <p className="text-sm text-slate-500 font-medium">
            Já tem uma conta?
            <Link to="/login" className="text-primary dark:text-blue-400 font-bold ml-1">Fazer Login</Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default Signup;
