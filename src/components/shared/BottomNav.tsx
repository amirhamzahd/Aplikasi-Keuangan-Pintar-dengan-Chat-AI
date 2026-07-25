'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  Wallet, 
  Plus, 
  PieChart, 
  Grid3X3,
  Bot,
  PencilLine,
  ArrowRightLeft,
  PiggyBank,
  Receipt,
  TrendingUp,
  Settings,
  Banknote,
  Layers,
  X,
  LogOut
} from 'lucide-react';
import { Modal } from '../ui/Modal';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onAddTransactionClick: () => void;
  onAiChatClick: () => void;
  userName: string;
  userEmail: string;
  logout: () => void;
}

export function BottomNav({ activeTab, setActiveTab, onAddTransactionClick, onAiChatClick, userName, userEmail, logout }: BottomNavProps) {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId);
    setShowMoreMenu(false);
  };

  const menuUtama = [
    { id: 'transactions', icon: <ArrowRightLeft size={22} />, label: 'Riwayat Transaksi', color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 'income-sources', icon: <Banknote size={22} />, label: 'Sumber Dana', color: 'text-teal-500', bg: 'bg-teal-50' },
    { id: 'categories', icon: <Layers size={22} />, label: 'Kategori', color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { id: 'bills', icon: <Receipt size={22} />, label: 'Tagihan', color: 'text-rose-500', bg: 'bg-rose-50' },
    { id: 'reports', icon: <TrendingUp size={22} />, label: 'Laporan', color: 'text-purple-500', bg: 'bg-purple-50' },
  ];

  const menuEkstra = [
    { id: 'settings', icon: <Settings size={22} />, label: 'Pengaturan', color: 'text-slate-600', bg: 'bg-slate-100' },
    { id: 'goals', icon: <PiggyBank size={22} />, label: 'Target Keuangan', color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { id: 'debts', icon: <ArrowRightLeft size={22} className="rotate-90" />, label: 'Utang-Piutang', color: 'text-amber-500', bg: 'bg-amber-50' },
  ];

  const allMoreItems = [...menuUtama, ...menuEkstra];

  return (
    <>
      {/* 1. Add Menu Overlay */}
      <AnimatePresence>
        {showAddMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddMenu(false)}
              className="fixed inset-0 bg-slate-900/20 z-[40] md:hidden"
            />
            <motion.div
              initial={{ y: 300 }}
              animate={{ y: 0 }}
              exit={{ y: 300 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-24 left-4 right-4 z-[40] grid grid-cols-2 gap-3 md:hidden"
            >
              <button
                onClick={() => {
                  setShowAddMenu(false);
                  onAddTransactionClick();
                }}
                className="bg-white p-4 rounded-3xl shadow-xl border border-slate-100 flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600 shadow-sm border border-slate-200/50">
                  <PencilLine size={28} />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm mb-0.5">Catat Manual</h3>
                  <p className="text-[10px] text-slate-500 font-medium leading-tight px-1">Isi form transaksi secara detail</p>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowAddMenu(false);
                  onAiChatClick();
                }}
                className="bg-white p-4 rounded-3xl shadow-xl border border-blue-100 flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform text-center relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-md relative z-10">
                  <Bot size={28} />
                </div>
                <div className="relative z-10">
                  <h3 className="font-extrabold text-blue-900 text-sm mb-0.5">Chat AI Assistant</h3>
                  <p className="text-[10px] text-blue-600/80 font-medium leading-tight px-1">Otomatis pakai suara atau teks</p>
                </div>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 2. More Menu (Lainnya) Bottom Sheet */}
      <AnimatePresence>
        {showMoreMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMoreMenu(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] md:hidden"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-20 left-4 right-4 z-[70] bg-white rounded-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] md:hidden max-h-[75vh] flex flex-col"
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-md z-10 rounded-t-3xl">
                <h3 className="font-extrabold text-slate-800 text-lg tracking-tight">Eksplorasi</h3>
                <button 
                  onClick={() => setShowMoreMenu(false)}
                  className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 active:scale-95 transition-transform"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-4 overflow-y-auto overflow-x-hidden no-scrollbar pb-4 space-y-4">
                
                {/* Profile Banner */}
                <div 
                  className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200/60 rounded-2xl"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-100 border-2 border-white shadow-sm flex items-center justify-center text-blue-700 font-bold text-lg shrink-0">
                    {userName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="flex flex-col flex-1 truncate">
                    <span className="font-extrabold text-slate-800 text-sm truncate">{userName || 'Pengguna'}</span>
                    <span className="text-[11px] text-slate-500 font-medium truncate">{userEmail || 'user@example.com'}</span>
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button onClick={() => handleNavClick('profile')} className="p-1.5 text-slate-500 hover:text-slate-700 bg-white border border-slate-200/60 rounded-full shadow-sm active:scale-95" title="Pengaturan Profil">
                      <Settings size={14} />
                    </button>
                    <button onClick={() => { setShowMoreMenu(false); logout(); }} className="p-1.5 text-danger/70 hover:text-danger bg-rose-50 border border-rose-100 rounded-full shadow-sm active:scale-95" title="Keluar Akun">
                      <LogOut size={14} />
                    </button>
                  </div>
                </div>

                {/* Grid Menu Keseluruhan */}
                <div className="space-y-2.5">
                  <h4 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider px-1">Menu Utama</h4>
                  <div className="grid grid-cols-4 gap-y-4 gap-x-2">
                    {allMoreItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleNavClick(item.id)}
                        className="flex flex-col items-center gap-2 group active:scale-90 transition-transform"
                      >
                        <div className={`w-12 h-12 rounded-[14px] ${activeTab === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : `${item.bg} ${item.color}`} flex items-center justify-center transition-colors border border-black/[0.03]`}>
                          {item.icon}
                        </div>
                        <span className={`text-[9px] font-bold text-center leading-[1.1] px-1 ${activeTab === item.id ? 'text-blue-600' : 'text-slate-600'}`}>
                          {item.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 3. Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200/60 pb-safe shadow-[0_-5px_20px_rgba(0,0,0,0.03)] md:hidden">
        <div className="flex items-end justify-between px-2 h-16 pb-2">
          
          <button 
            onClick={() => handleNavClick('dashboard')}
            className={`flex-1 flex flex-col items-center justify-center gap-1 min-w-[64px] ${activeTab === 'dashboard' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Activity size={activeTab === 'dashboard' ? 24 : 22} className={activeTab === 'dashboard' ? 'fill-blue-600/20' : ''} />
            <span className={`text-[10px] ${activeTab === 'dashboard' ? 'font-bold' : 'font-semibold'}`}>Beranda</span>
          </button>
          
          <button 
            onClick={() => handleNavClick('accounts')}
            className={`flex-1 flex flex-col items-center justify-center gap-1 min-w-[64px] ${activeTab === 'accounts' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Wallet size={activeTab === 'accounts' ? 24 : 22} className={activeTab === 'accounts' ? 'fill-blue-600/20' : ''} />
            <span className={`text-[10px] ${activeTab === 'accounts' ? 'font-bold' : 'font-semibold'}`}>Rekening</span>
          </button>

          {/* Center FAB */}
          <div className="flex-shrink-0 w-16 flex justify-center -translate-y-4">
            <button 
              onClick={() => {
                setShowAddMenu(!showAddMenu);
                setShowMoreMenu(false);
              }}
              className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-transform active:scale-95 ${showAddMenu ? 'bg-slate-800 rotate-45' : 'bg-blue-600'}`}
            >
              <Plus size={32} strokeWidth={2.5} />
            </button>
          </div>
          
          <button 
            onClick={() => handleNavClick('budget')}
            className={`flex-1 flex flex-col items-center justify-center gap-1 min-w-[64px] ${activeTab === 'budget' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <PieChart size={activeTab === 'budget' ? 24 : 22} className={activeTab === 'budget' ? 'fill-blue-600/20' : ''} />
            <span className={`text-[10px] ${activeTab === 'budget' ? 'font-bold' : 'font-semibold'}`}>Budget</span>
          </button>
          
          <button 
            onClick={() => {
              setShowMoreMenu(true);
              setShowAddMenu(false);
            }}
            className={`flex-1 flex flex-col items-center justify-center gap-1 min-w-[64px] ${allMoreItems.some(m => m.id === activeTab) ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Grid3X3 size={allMoreItems.some(m => m.id === activeTab) ? 24 : 22} className={allMoreItems.some(m => m.id === activeTab) ? 'fill-blue-600/20' : ''} />
            <span className={`text-[10px] ${allMoreItems.some(m => m.id === activeTab) ? 'font-bold' : 'font-semibold'}`}>Lainnya</span>
          </button>

        </div>
      </nav>
    </>
  );
}
