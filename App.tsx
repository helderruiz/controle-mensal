
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
import { Transaction, TransactionType, TransactionCategory } from './types';

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    description: 'Palheta / Sup.GPS',
    amount: 36.90,
    date: '2024-02-16',
    type: TransactionType.EXIT,
    category: TransactionCategory.TRANSPORT
  },
  {
    id: '2',
    description: 'Prest. Casa',
    amount: 800.00,
    date: '2024-02-12',
    type: TransactionType.EXIT,
    category: TransactionCategory.RENT
  },
  {
    id: '3',
    description: 'Salário',
    amount: 4847.70,
    date: '2025-05-05',
    type: TransactionType.ENTRY,
    category: TransactionCategory.SALARY
  },
  {
    id: '4',
    description: 'iFood - Restaurante',
    amount: 42.90,
    date: '2025-05-20',
    type: TransactionType.EXIT,
    category: TransactionCategory.FOOD
  }
];

const App: React.FC = () => {
  // null = ainda carregando, Session = logado, false = não logado
  const [session, setSession] = useState<Session | null | false>(null);

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('transactions');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  useEffect(() => {
    // Obter sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session ?? false);
    });

    // Ouvir mudanças de autenticação (login, logout, refresh de token)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session ?? false);
    });

    return () => subscription.unsubscribe();
  }, []);

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

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const updateTransaction = (id: string, updatedData: Omit<Transaction, 'id'>) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...updatedData, id } : t));
  };

  // Aguardando resolução da sessão inicial
  if (session === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-primary text-4xl animate-spin" style={{ animationDuration: '1s' }}>
            progress_activity
          </span>
          <p className="text-slate-400 text-sm font-medium">Carregando...</p>
        </div>
      </div>
    );
  }

  const isAuthenticated = session !== false;

  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/" replace /> : <Login />
        } />
        <Route path="/signup" element={
          isAuthenticated ? <Navigate to="/" replace /> : <Signup />
        } />

        <Route element={isAuthenticated ? <Layout /> : <Navigate to="/login" replace />}>
          <Route index element={<Dashboard transactions={transactions} addTransaction={(t) => addTransactions([t])} deleteTransaction={deleteTransaction} />} />
          <Route path="/reports" element={<Reports transactions={transactions} />} />
          <Route path="/transactions" element={<Transactions transactions={transactions} deleteTransaction={deleteTransaction} />} />
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
  );
};

export default App;
