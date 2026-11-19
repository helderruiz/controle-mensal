
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import Dashboard from './pages/Dashboard';
import Reports from './pages/Reports';
import Transactions from './pages/Transactions';
import Profile from './pages/Profile';
import TransactionDetails from './pages/TransactionDetails';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Layout from './components/Layout';
import IOSInstallBanner from './components/IOSInstallBanner';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminSubscriptions from './pages/admin/AdminSubscriptions';
import AdminLogin from './pages/admin/AdminLogin';
import AdminGuard from './pages/admin/AdminGuard';
import SubscriptionBlockModal from './components/SubscriptionBlockModal';
import { recordAccessLog } from './lib/accessLogger';
import {
  checkUserMustBeBlocked,
  getSubscriptionConfig,
  SubscriptionConfig,
} from './lib/subscriptionService';
import { Transaction, TransactionType, TransactionCategory } from './types';
import { getInstallmentGroupKey } from './utils';
import logo from './img/icone controle financeiro.png';

const INITIAL_TRANSACTIONS: Transaction[] = [];

const App: React.FC = () => {
  // null = ainda carregando, Session = logado, false = não logado
  const [session, setSession] = useState<Session | null | false>(null);

  // Controle de Bloqueio por Assinatura (Dia 01)
  const [mustBeBlocked, setMustBeBlocked] = useState(false);
  const [subConfig, setSubConfig] = useState<SubscriptionConfig>({
    blockActive: false,
    stripePaymentLink: 'https://buy.stripe.com/6oUfZh0fccHVbCCgvt4Rq00',
    whatsappSupport: '5511999999999',
    monthlyPrice: 4.99,
  });

  const verifySubscriptionStatus = async (user?: any) => {
    const targetUser = user || (session ? (session as Session).user : null);
    if (!targetUser) {
      setMustBeBlocked(false);
      return;
    }
    const [cfg, blocked] = await Promise.all([
      getSubscriptionConfig(),
      checkUserMustBeBlocked(targetUser),
    ]);
    setSubConfig(cfg);
    setMustBeBlocked(blocked);
  };

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('transactions');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  useEffect(() => {
    // Obter sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session ?? false);
      if (session?.user) {
        recordAccessLog(session.user);
        verifySubscriptionStatus(session.user);
      }
    });

    // Ouvir mudanças de autenticação (login, logout, refresh de token)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session ?? false);
      if (session?.user) {
        recordAccessLog(session.user);
        verifySubscriptionStatus(session.user);
      } else {
        setMustBeBlocked(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // O retorno do Stripe só confirma que o checkout terminou. A liberação deve
  // vir de uma confirmação confiável do servidor (webhook), nunca do navegador.
  useEffect(() => {
    if (!session || !session.user) return;

    const currentUrl = new URL(window.location.href);
    const hashQuery = currentUrl.hash.includes('?')
      ? new URLSearchParams(currentUrl.hash.slice(currentUrl.hash.indexOf('?') + 1))
      : new URLSearchParams();
    const paymentStatus = currentUrl.searchParams.get('payment') || hashQuery.get('payment');
    if (paymentStatus !== 'success') return;

    void (async () => {
      await verifySubscriptionStatus(session.user);
      currentUrl.searchParams.delete('payment');
      if (currentUrl.hash.includes('?')) {
        const [route, query] = currentUrl.hash.split('?');
        const params = new URLSearchParams(query);
        params.delete('payment');
        currentUrl.hash = params.size ? `${route}?${params}` : route;
      }
      window.history.replaceState({}, document.title, currentUrl.toString());
      alert('O checkout foi concluído. Estamos aguardando a confirmação segura do pagamento. Se o acesso continuar bloqueado após alguns instantes, use “Já realizei o pagamento / Atualizar” ou contate o suporte.');
    })();
  }, [session]);

  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }, [transactions]);

  const addTransactions = (newItems: Omit<Transaction, 'id'>[]) => {
    const preparedItems = newItems.map(t => ({
      ...t,
      id: Math.random().toString(36).substr(2, 9)
    }));
    setTransactions(prev => [...preparedItems, ...prev]);
  };

  const deleteTransaction = (id: string, deleteSeries?: boolean) => {
    if (deleteSeries) {
      // Encontrar o groupId da transação
      const target = transactions.find(t => t.id === id);
      const groupKey = target ? getInstallmentGroupKey(target) : undefined;
      if (groupKey) {
        // Deletar todas as parcelas, inclusive registros antigos sem groupId.
        setTransactions(prev => prev.filter(t => getInstallmentGroupKey(t) !== groupKey));
        return;
      }
    }
    // Deletar apenas esta
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const updateTransaction = (id: string, updatedData: Omit<Transaction, 'id'>) => {
    const target = transactions.find(t => t.id === id);
    const groupKey = target ? getInstallmentGroupKey(target) : undefined;

    setTransactions(prev => prev.map(transaction => {
      const belongsToSeries = groupKey && getInstallmentGroupKey(transaction) === groupKey;
      if (!belongsToSeries && transaction.id !== id) return transaction;

      // Em parcelamentos, preserva as particularidades de cada parcela:
      // data, número na descrição e identificador do grupo.
      if (belongsToSeries) {
        return {
          ...transaction,
          ...updatedData,
          id: transaction.id,
          date: transaction.date,
          description: transaction.description,
          installmentGroupId: transaction.installmentGroupId,
          installmentType: transaction.installmentType,
          installmentsCount: transaction.installmentsCount,
        };
      }

      return { ...updatedData, id: transaction.id };
    }));
  };

  if (session === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-900">
        <div className="flex flex-col items-center gap-6">
          <img 
            src={logo} 
            alt="Logo Controle Financeiro" 
            className="w-32 h-32 animate-pulse" 
          />
          <p className="text-slate-400 text-sm font-medium animate-pulse">Carregando...</p>
        </div>
      </div>
    );
  }

  const isAuthenticated = session !== false;

  return (
    <>
      <HashRouter>
        <Routes>
          <Route path="/login" element={
            isAuthenticated ? <Navigate to="/" replace /> : <Login />
          } />
          <Route path="/signup" element={
            isAuthenticated ? <Navigate to="/" replace /> : <Signup />
          } />

          {/* Rotas Administrativas Seguras */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/dashboard" element={<AdminGuard session={session}><AdminDashboard /></AdminGuard>} />
          <Route path="/admin/users" element={<AdminGuard session={session}><AdminUsers /></AdminGuard>} />
          <Route path="/admin/subscriptions" element={<AdminGuard session={session}><AdminSubscriptions /></AdminGuard>} />

          <Route element={isAuthenticated ? <Layout /> : <Navigate to="/login" replace />}>
            <Route index element={<Dashboard transactions={transactions} deleteTransaction={deleteTransaction} />} />
            <Route path="/reports" element={<Reports transactions={transactions} />} />
            <Route path="/transactions" element={<Transactions transactions={transactions} deleteTransaction={(id, deleteSeries) => deleteTransaction(id, deleteSeries)} />} />
            <Route path="/profile" element={<Profile session={session as Session} />} />
          </Route>

          <Route path="/transaction/new" element={
            isAuthenticated ? <TransactionDetails onSave={addTransactions} /> : <Navigate to="/login" replace />
          } />
          <Route path="/transaction/edit/:id" element={
            isAuthenticated ? <TransactionDetails onSave={(data) => updateTransaction(window.location.hash.split('/').pop() || '', data[0])} transactions={transactions} /> : <Navigate to="/login" replace />
          } />
        </Routes>
      </HashRouter>
      <IOSInstallBanner />

      {/* Pop-up de Bloqueio Seguro de Assinatura (Dia 01) */}
      {mustBeBlocked && session && session.user && (
        <SubscriptionBlockModal
          user={session.user}
          config={subConfig}
          onRefreshStatus={() => verifySubscriptionStatus(session.user)}
        />
      )}
    </>
  );
};

export default App;
