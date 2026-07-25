'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTransactions } from '@/context/TransactionContext';
import { Sidebar } from '@/components/shared/Sidebar';
import { Header } from '@/components/shared/Header';
import { OverviewTab } from '@/components/dashboard/OverviewTab';
import { BottomNav } from '@/components/shared/BottomNav';
import { TransactionsTab } from '@/components/dashboard/TransactionsTab';
import { ChatTab } from '@/components/dashboard/ChatTab';
import { BudgetTab } from '@/components/dashboard/BudgetTab';
import { GoalsTab } from '@/components/dashboard/GoalsTab';
import { BillsTab } from '@/components/dashboard/BillsTab';
import { IncomeSourcesTab } from '@/components/dashboard/IncomeSourcesTab';
import { AccountsTab } from '@/components/dashboard/AccountsTab';
import { CategoriesTab } from '@/components/dashboard/CategoriesTab';
import { SettingsTab } from '@/components/dashboard/SettingsTab';
import { ProfileTab } from '@/components/dashboard/ProfileTab';
import { DebtsTab } from '@/components/dashboard/DebtsTab';
import { ReportsTab } from '@/components/dashboard/ReportsTab';
import { FloatingAIAssistant } from '@/components/shared/FloatingAIAssistant';
import { Footer } from '@/components/shared/Footer';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';


export default function DashboardPage() {
  const { user, isLoading, logout } = useAuth();
  const { addTransaction, accounts, categories } = useTransactions();
  
  // Navigation
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Manual Transaction Form States
  const [showAddModal, setShowAddModal] = useState(false);
  const [txDesc, setTxDesc] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txType, setTxType] = useState<'income' | 'expense'>('expense');
  const [txAccountId, setTxAccountId] = useState('');
  const [txCategory, setTxCategory] = useState('');
  const [txTags, setTxTags] = useState('');
  const [txDate, setTxDate] = useState('');
  const [formError, setFormError] = useState('');

  if (isLoading || !user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="animate-spin text-primary" size={36} />
      </div>
    );
  }

  // Strict guard: don't render dashboard if plan is NONE
  if (!user.planType || user.planType === 'NONE') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="animate-spin text-primary" size={36} />
        <p className="mt-4 text-slate-500 font-medium">Mengarahkan ke halaman paket...</p>
      </div>
    );
  }

  // Pre-fill account and category selection
  const handleOpenAddModal = () => {
    if (accounts.length > 0) {
      setTxAccountId(accounts[0].id);
    }
    if (categories.length > 0) {
      setTxCategory(categories[0].name);
    }
    setTxDate(new Date().toISOString().split('T')[0]);
    setFormError('');
    setShowAddModal(true);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const amountNum = parseFloat(txAmount);
    if (!txDesc.trim() || isNaN(amountNum) || amountNum <= 0 || !txAccountId) {
      setFormError('Harap isi semua field dengan benar.');
      return;
    }

    const tagsArray = txTags
      ? txTags.split(',').map(t => t.trim()).filter(Boolean)
      : [];

    addTransaction({
      description: txDesc.trim(),
      amount: amountNum,
      type: txType,
      accountId: txAccountId,
      category: txCategory || 'Lainnya',
      tags: tagsArray,
      date: txDate ? new Date(txDate).toISOString() : new Date().toISOString()
    });

    // Reset Form
    setTxDesc('');
    setTxAmount('');
    setTxType('expense');
    setTxCategory(categories[0]?.name || '');
    setTxTags('');
    setShowAddModal(false);
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans relative overflow-hidden">
      {/* Premium Animated Mesh Gradient Background */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/20 blur-[120px] mix-blend-multiply pointer-events-none animate-blob"></div>
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-400/20 blur-[120px] mix-blend-multiply pointer-events-none animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-[-20%] left-[20%] w-[60%] h-[60%] rounded-full bg-purple-400/20 blur-[120px] mix-blend-multiply pointer-events-none animate-blob animation-delay-4000"></div>
      
      {/* 1. Sidebar Panel */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        userName={user.name}
        userEmail={user.email}
        logout={logout}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Header 
          userName={user.name} 
        />
        
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 pt-6 pb-28 md:pb-8 relative">
          <div className="max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'dashboard' && (
                  <OverviewTab 
                    onAddTransactionClick={handleOpenAddModal} 
                    setActiveTab={setActiveTab}
                  />
                )}
                {activeTab === 'transactions' && (
                  <TransactionsTab 
                    onAddTransactionClick={handleOpenAddModal} 
                  />
                )}
                {activeTab === 'budget' && <BudgetTab />}
                {activeTab === 'income-sources' && <IncomeSourcesTab />}
                {activeTab === 'goals' && <GoalsTab />}
                {activeTab === 'bills' && <BillsTab />}
                {activeTab === 'debts' && <DebtsTab />}
                {activeTab === 'categories' && <CategoriesTab />}
                {activeTab === 'accounts' && <AccountsTab />}
                {activeTab === 'reports' && <ReportsTab />}
                {activeTab === 'settings' && <SettingsTab />}
                {activeTab === 'profile' && <ProfileTab />}
                {activeTab === 'chat' && <ChatTab onClose={() => setActiveTab('dashboard')} />}
              </motion.div>
            </AnimatePresence>
          </div>
          
          {/* Dynamic Footer */}
          <div className="print:hidden">
            <Footer />
          </div>
        </main>
      </div>

      <BottomNav 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onAddTransactionClick={handleOpenAddModal}
        onAiChatClick={() => setActiveTab('chat')}
        userName={user.name}
        userEmail={user.email}
        logout={logout}
      />

      {/* 3. Reusable Manual Transaction Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Tambah Transaksi Manual">
        <form onSubmit={handleManualSubmit} className="space-y-4">
          {formError && (
            <div className="p-3.5 rounded-xl bg-danger/10 border border-danger/20 text-xs font-semibold text-danger">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="Keterangan / Nama Transaksi"
              placeholder="e.g. Beli kopi Arabica, Gaji bulanan"
              value={txDesc}
              onChange={(e) => setTxDesc(e.target.value)}
            />
            <Input 
              label="Tanggal Transaksi"
              type="date"
              value={txDate}
              onChange={(e) => setTxDate(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <CurrencyInput 
              label="Nominal (Rp)"
              placeholder="e.g. 50000"
              value={txAmount}
              onChange={(e) => setTxAmount(e.target.value)}
            />
            <Select 
              label="Jenis Transaksi"
              value={txType}
              onChange={(e) => {
                const newType = e.target.value as 'income' | 'expense';
                setTxType(newType);
                const firstMatch = categories.find(c => c.type === newType);
                if (firstMatch) setTxCategory(firstMatch.name);
              }}
              options={[
                { value: 'expense', label: 'Pengeluaran (-)' },
                { value: 'income', label: 'Pemasukan (+)' },
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select 
              label={txType === 'income' ? "Rekening Tujuan" : "Rekening Sumber"}
              value={txAccountId}
              onChange={(e) => setTxAccountId(e.target.value)}
              options={accounts.map(a => ({ value: a.id, label: `${a.name} (Rp${a.balance.toLocaleString('id-ID')})` }))}
            />
            <Select 
              label={txType === 'income' ? "Sumber Dana" : "Kategori Pengeluaran"}
              value={txCategory}
              onChange={(e) => setTxCategory(e.target.value)}
              options={categories
                .filter(c => c.type === txType)
                .map(c => ({ value: c.name, label: c.name }))}
            />
          </div>

          <Input 
            label="Tag (Pisahkan dengan koma)"
            placeholder="e.g. kerja, liburan, kopi"
            value={txTags}
            onChange={(e) => setTxTags(e.target.value)}
          />

          <Button type="submit" variant="primary" className="w-full py-2.5">
            Simpan Transaksi
          </Button>
        </form>
      </Modal>

      {/* 4. Global Floating AI Assistant Widget */}
      <div className="print:hidden">
        <FloatingAIAssistant />
      </div>

    </div>
  );
}
