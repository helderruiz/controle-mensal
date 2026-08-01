
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
import { Transaction, TransactionType, TransactionCategory } from './types';
import { getInstallmentGroupKey } from './utils';
import logo from './img/icone controle financeiro.png';

const INITIAL_TRANSACTIONS: Transaction[] = [];

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

          <Route element={isAuthenticated ? <Layout /> : <Navigate to="/login" replace />}>
            <Route index element={<Dashboard transactions={transactions} addTransaction={(t) => addTransactions([t])} deleteTransaction={deleteTransaction} />} />
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
    </>
  );
};

export default App;
