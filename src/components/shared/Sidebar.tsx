'use client';

import React from 'react';
import { 
 Activity, ArrowRightLeft, PieChart, PiggyBank, Receipt, 
 Layers, Sparkles, LogOut, X, Wallet, TrendingUp, Banknote, Settings, Gem
} from 'lucide-react';

interface SidebarProps {
 activeTab: string;
 setActiveTab: (tab: string) => void;
 isMobileOpen: boolean;
 setIsMobileOpen: (open: boolean) => void;
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
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
        active 
          ? 'bg-[#3366D6] text-white shadow-md scale-[1.02]' 
          : 'text-blue-100 hover:bg-white/10 hover:text-white'
      }`}
    >
      <span className={`transition-transform duration-200 shrink-0 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
        {icon}
      </span>
      <span className="truncate flex-1 text-left">{label}</span>
    </button>
  );
}

export function Sidebar({ 
 activeTab, 
 setActiveTab, 
 isMobileOpen, 
 setIsMobileOpen, 
 userName,
 userEmail,
 logout 
}: SidebarProps) {
 const handleNavClick = (tab: string) => {
 setActiveTab(tab);
 setIsMobileOpen(false);
 };

 return (
 <>
 {/* Mobile Drawer Backdrop */}
 {isMobileOpen && (
 <div 
 className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
 onClick={() => setIsMobileOpen(false)}
 />
 )}

 {/* Sidebar Container */}
 <aside className={`fixed inset-y-0 left-0 z-50 w-72 md:w-64 flex flex-col transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
 isMobileOpen ? 'translate-x-0' : '-translate-x-full'
 } bg-[#1D4ED8] p-5 border-r border-blue-900/50 shadow-xl`}>
 
 {/* Brand Header */}
 <div className="flex items-center justify-between mb-8 mt-2 px-1">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
            <Gem className="text-white" size={20} />
          </div>
          <span className="font-extrabold text-lg tracking-tight text-white">
 DIAMOND Finance
 </span>
 </div>
 {/* Close button for mobile */}
 <button 
 className="md:hidden p-1.5 rounded-lg text-blue-200 hover:bg-white/10 hover:text-white transition"
 onClick={() => setIsMobileOpen(false)}
 >
 <X size={18} />
 </button>
 </div>

 {/* Navigation Menu (Floating AI Chatbot tab removed!) */}
 <nav className="flex-1 space-y-1 overflow-y-auto pr-2 pb-4">
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

 {/* User Footer (Theme toggler removed!) */}
 <div className="mt-auto pt-4 border-t border-white/10">
 <div className="flex items-center justify-between px-2 cursor-pointer group">
 <div className="flex items-center gap-3 overflow-hidden">
 <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold shrink-0 border border-white/30">
 {userName.charAt(0).toUpperCase()}
 </div>
 <div className="flex flex-col truncate">
 <span className="text-sm font-bold text-white truncate">{userName}</span>
 <span className="text-xs text-blue-200 truncate">{userEmail}</span>
 </div>
 </div>
 <button 
 onClick={logout}
 title="Logout"
 className="p-2 text-blue-200 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
 >
 <LogOut size={16} />
 </button>
 </div>
 </div>
 </aside>
 </>
 );
}
