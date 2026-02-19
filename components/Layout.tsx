
import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Painel', icon: 'dashboard' },
  { to: '/reports', label: 'Relatórios', icon: 'assessment' },
  { to: '/transactions', label: 'Extrato', icon: 'receipt_long' },
  { to: '/profile', label: 'Perfil', icon: 'person' },
];

const Layout: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-6 py-3 flex justify-between items-center z-50">
        {/* Primeiros 2 itens */}
        {navItems.slice(0, 2).map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center space-y-1 transition-colors ${isActive ? 'text-primary' : 'text-slate-400 dark:text-slate-500'}`
            }
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="text-[10px] font-bold">{item.label}</span>
          </NavLink>
        ))}

        {/* Botão central de nova transação */}
        <div className="-mt-8">
          <button
            onClick={() => navigate('/transaction/new')}
            className="ios-gradient p-4 rounded-full shadow-lg border-4 border-background-light dark:border-background-dark text-white active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined text-2xl">add</span>
          </button>
        </div>

        {/* Últimos 2 itens */}
        {navItems.slice(2).map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center space-y-1 transition-colors ${isActive ? 'text-primary' : 'text-slate-400 dark:text-slate-500'}`
            }
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="text-[10px] font-bold">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Dark mode toggle */}
      <button
        className="fixed top-4 right-4 bg-white/20 backdrop-blur-md p-2 rounded-full text-white shadow-sm z-50"
        onClick={() => document.documentElement.classList.toggle('dark')}
      >
        <span className="material-symbols-outlined text-sm">dark_mode</span>
      </button>
    </div>
  );
};

export default Layout;
