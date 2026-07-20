'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTransactions } from '@/context/TransactionContext';
import { Sidebar } from '@/components/shared/Sidebar';
import { Header } from '@/components/shared/Header';
import { OverviewTab } from '@/components/dashboard/OverviewTab';
import { TransactionsTab } from '@/components/dashboard/TransactionsTab';
import { BudgetTab } from '@/components/dashboard/BudgetTab';
import { GoalsTab } from '@/components/dashboard/GoalsTab';
import { BillsTab } from '@/components/dashboard/BillsTab';
import { IncomeSourcesTab } from '@/components/dashboard/IncomeSourcesTab';
import { AccountsTab } from '@/components/dashboard/AccountsTab';
import { CategoriesTab } from '@/components/dashboard/CategoriesTab';
import { SettingsTab } from '@/components/dashboard/SettingsTab';
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


export default function DashboardPage() {
  const { user, isLoading, logout } = useAuth();
  const { addTransaction, accounts, categories } = useTransactions();
  
  // Navigation
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
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
    <div className="flex h-screen bg-[#F8FAFC] font-sans">
      
      {/* 1. Sidebar Panel */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
        userName={user.name}
        userEmail={user.email}
        logout={logout}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Header 
          userName={user.name} 
          onMenuToggle={() => setIsMobileSidebarOpen(true)} 
        />
        
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 pt-6 pb-24 md:pb-8 relative">
          <div className="max-w-7xl mx-auto">
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
          </div>
          
          {/* Dynamic Footer */}
          <div className="print:hidden">
            <Footer />
          </div>
        </main>

      </div>

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
