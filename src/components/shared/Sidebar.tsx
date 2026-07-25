'use client';

import React from 'react';
import {
  Activity, ArrowRightLeft, PieChart, PiggyBank, Receipt,
  Layers, Sparkles, LogOut, X, Wallet, TrendingUp, Banknote, Settings, Gem
} from 'lucide-react';

import { motion } from 'framer-motion';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userName: string;
  userEmail: string;
  logout: () => void;
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

function NavItem({ icon, label, active, onClick }: NavItemProps) {
  return (
    <motion.button
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-semibold transition-colors duration-200 cursor-pointer border border-transparent ${active
          ? 'bg-blue-600 text-white shadow-md'
          : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700'
        }`}
    >
      <span className={`transition-transform duration-200 shrink-0 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
        {icon}
      </span>
      <span className="truncate flex-1 text-left">{label}</span>
    </motion.button>
  );
}

export function Sidebar({
  activeTab,
  setActiveTab,
  userName,
  userEmail,
  logout
}: SidebarProps) {
  const handleNavClick = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <>
      {/* Sidebar Container (Desktop Only) */}
      <aside className="hidden md:flex flex-col relative w-64 bg-white p-5 border-r border-slate-200">

        {/* Brand Header */}
        <div className="flex items-center justify-between mb-8 mt-2 px-1">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100">
              <Gem className="text-blue-600" size={20} />
            </div>
            <span className="font-extrabold text-lg tracking-tight text-slate-800">
              DIAMOND Finance
            </span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 pb-4 no-scrollbar">
          <NavItem icon={<Activity size={18} />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => handleNavClick('dashboard')} />
          <NavItem icon={<ArrowRightLeft size={18} />} label="Transaksi" active={activeTab === 'transactions'} onClick={() => handleNavClick('transactions')} />
          <NavItem icon={<PieChart size={18} />} label="Budget" active={activeTab === 'budget'} onClick={() => handleNavClick('budget')} />
          <NavItem icon={<Banknote size={18} />} label="Sumber Dana" active={activeTab === 'income-sources'} onClick={() => handleNavClick('income-sources')} />
          <NavItem icon={<Wallet size={18} />} label="Rekening" active={activeTab === 'accounts'} onClick={() => handleNavClick('accounts')} />
          <NavItem icon={<Layers size={18} />} label="Kategori" active={activeTab === 'categories'} onClick={() => handleNavClick('categories')} />
          <NavItem icon={<PiggyBank size={18} />} label="Tabungan" active={activeTab === 'goals'} onClick={() => handleNavClick('goals')} />
          <NavItem icon={<Receipt size={18} />} label="Tagihan & Langganan" active={activeTab === 'bills'} onClick={() => handleNavClick('bills')} />
          <NavItem icon={<ArrowRightLeft size={18} className="rotate-90" />} label="Hutang & Piutang" active={activeTab === 'debts'} onClick={() => handleNavClick('debts')} />
          <NavItem icon={<TrendingUp size={18} />} label="Rekap Laporan" active={activeTab === 'reports'} onClick={() => handleNavClick('reports')} />
          <NavItem icon={<Settings size={18} />} label="Pengaturan" active={activeTab === 'settings'} onClick={() => handleNavClick('settings')} />
        </nav>

        {/* User Footer */}
        <div className="mt-auto pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between px-2 cursor-pointer group">
            <div className="flex items-center gap-3 overflow-hidden" onClick={() => setActiveTab('profile')}>
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-700 font-bold shrink-0 border border-blue-100">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col truncate">
                <span className="text-sm font-bold text-slate-800 truncate">{userName}</span>
                <span className="text-xs text-slate-500 truncate">{userEmail}</span>
              </div>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
