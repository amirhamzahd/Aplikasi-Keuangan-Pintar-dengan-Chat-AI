'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useTransactions } from '@/context/TransactionContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { CurrencyInput } from '../ui/CurrencyInput';
import { Select } from '../ui/Select';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { 
  Search, Filter, Plus, FileUp, FileDown, Trash2, Edit2,
  ArrowRightLeft, TrendingUp, TrendingDown, Coffee,
  Car, ShoppingBag, Zap, DollarSign, Activity, Receipt,
  Gift, Compass, Umbrella, Smartphone, Layers, Briefcase, Heart, GraduationCap
} from 'lucide-react';

const safeDate = (dateStr: any, options?: any) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('id-ID', options);
};

const COLORS = {
  primary: '#2563EB',
  success: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
  indigo: '#6366F1',
  pink: '#EC4899',
  slate: '#64748B'
};

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Coffee,
  Car,
  ShoppingBag,
  Zap,
  Activity,
  Briefcase,
  Heart,
  GraduationCap,
  DollarSign,
  Receipt,
  Gift,
  Compass,
  Umbrella,
  Smartphone,
  Layers
};

export function TransactionsTab({ 
  onAddTransactionClick 
}: { 
  onAddTransactionClick: () => void 
}) {
  const { transactions, deleteTransaction, editTransaction, addTransaction, accounts, categories, requestConfirm } = useTransactions();
  
  // States
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense' | 'transfer'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [accountFilter, setAccountFilter] = useState('all');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  
  // Edit Transaction states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTx, setEditingTx] = useState<any | null>(null);
  const [editDesc, setEditDesc] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editType, setEditType] = useState<'income' | 'expense' | 'transfer'>('expense');
  const [editCategory, setEditCategory] = useState('');
  const [editAccountId, setEditAccountId] = useState('');
  const [editDate, setEditDate] = useState('');

  const { categoryColors, categoryIcons } = useMemo(() => {
    const colors: Record<string, string> = {};
    const icons: Record<string, React.ReactNode> = {};
    
    categories.forEach(cat => {
      colors[cat.name] = cat.color;
      const IconComponent = ICON_MAP[cat.icon] || Layers;
      icons[cat.name] = <IconComponent size={16} />;
    });
    
    return { categoryColors: colors, categoryIcons: icons };
  }, [categories]);

  const CATEGORY_COLORS = categoryColors;
  const CATEGORY_ICONS = categoryIcons;
  const [editToAccountId, setEditToAccountId] = useState('');
  const [editTagsString, setEditTagsString] = useState('');

  // Transfer Form States
  const [transferAmount, setTransferAmount] = useState('');
  const [fromAccount, setFromAccount] = useState('');
  const [toAccount, setToAccount] = useState('');
  const [transferDesc, setTransferDesc] = useState('');
  const [transferError, setTransferError] = useState('');

  const [csvFileContent, setCsvFileContent] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  // Extract all categories dynamically
  const categoriesList = useMemo(() => {
    const cats = new Set(transactions.map(t => t.category));
    return ['all', ...Array.from(cats)];
  }, [transactions]);

  // Filtering Logic
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const desc = (t.description || '').toLowerCase();
      const cat = (t.category || '').toLowerCase();
      const searchLower = search.toLowerCase();
      const tags = t.tags || [];

      const matchSearch = desc.includes(searchLower) || 
                          cat.includes(searchLower) ||
                          tags.some(tag => (tag || '').toLowerCase().includes(searchLower));
      
      const matchType = typeFilter === 'all' ? true : t.type === typeFilter;
      const matchCategory = categoryFilter === 'all' ? true : t.category === categoryFilter;
      const matchAccount = accountFilter === 'all' ? true : t.accountId === accountFilter;

      const txDate = new Date(t.date).getTime();
      const matchStartDate = startDateFilter ? txDate >= new Date(startDateFilter).setHours(0,0,0,0) : true;
      const matchEndDate = endDateFilter ? txDate <= new Date(endDateFilter).setHours(23,59,59,999) : true;

      return matchSearch && matchType && matchCategory && matchAccount && matchStartDate && matchEndDate;
    });
  }, [transactions, search, typeFilter, categoryFilter, accountFilter, startDateFilter, endDateFilter]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, typeFilter, categoryFilter, accountFilter, startDateFilter, endDateFilter]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const paginatedTransactions = useMemo(() => {
    return filteredTransactions.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    );
  }, [filteredTransactions, currentPage]);

  // Chart Data Preparation (Top 5 Expenses)
  const expenseData = useMemo(() => {
    const expenses = filteredTransactions.filter(t => t.type === 'expense');
    const categoryTotals: Record<string, number> = {};
    expenses.forEach(t => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });
    return Object.entries(categoryTotals)
      .map(([name, amount]) => ({ name, amount, color: CATEGORY_COLORS[name] || COLORS.primary }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5); // top 5
  }, [filteredTransactions, CATEGORY_COLORS]);

  // EXPORT HANDLER
  const handleExport = async (format: 'csv' | 'json' | 'pdf') => {
    if (format === 'pdf') {
      window.print();
      setShowExportModal(false);
      return;
    }
    let content = '';
    let mimeType = 'text/csv';
    let filename = `diamond_report_${Date.now()}.csv`;

    if (format === 'csv') {
      const headers = ['ID', 'Description', 'Amount', 'Type', 'Category', 'Date', 'Account', 'Tags'];
      const rows = filteredTransactions.map(t => [
        t.id,
        `"${t.description.replace(/"/g, '""')}"`,
        t.amount,
        t.type,
        t.category,
        t.date,
        t.accountId,
        (t.tags || []).join(';')
      ]);
      content = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    } else {
      content = JSON.stringify(filteredTransactions, null, 2);
      mimeType = 'application/json';
      filename = `diamond_report_${Date.now()}.json`;
    }

    const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
    
    if (navigator.canShare && /Mobi|Android/i.test(navigator.userAgent)) {
      const file = new File([blob], filename, { type: mimeType });
      if (navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: 'Export Data Keuangan',
            files: [file]
          });
          setShowExportModal(false);
          return;
        } catch (e) {
          console.error("Gagal share file", e);
        }
      }
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 250);
    
    setShowExportModal(false);
  };

  // IMPORT CSV HANDLER
  const handleImportCSVSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFileContent) return;

    try {
      const lines = csvFileContent.split('\n');
      let importCount = 0;

      lines.forEach((line, index) => {
        if (index === 0 || !line.trim()) return; // skip header/empty lines
        const columns = line.split(',');
        if (columns.length < 5) return;

        const description = columns[1]?.replace(/"/g, '').trim() || 'Imported Transaction';
        const amount = parseFloat(columns[2]) || 0;
        const type = (columns[3]?.trim().toLowerCase() as 'income' | 'expense' | 'transfer') || 'expense';
        const category = columns[4]?.trim() || 'Lainnya';
        const accountId = columns[6]?.trim() || (accounts[0]?.id || 'acc-cash');
        const tags = columns[7] ? columns[7].split(';').map(t => t.trim()) : [];

        if (amount > 0) {
          addTransaction({
            description,
            amount,
            type,
            category,
            accountId,
            tags,
            date: new Date().toISOString()
          });
          importCount++;
        }
      });

      alert(`Berhasil mengimpor ${importCount} transaksi!`);
      setShowImportModal(false);
      setCsvFileContent('');
    } catch (err) {
      alert('Terjadi kesalahan format CSV.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setCsvFileContent(event.target?.result as string);
    };
    reader.readAsText(file);
  };

  // TRANSFER SUBMIT HANDLER
  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError('');

    const amountNum = parseFloat(transferAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setTransferError('Masukkan nominal transfer yang valid.');
      return;
    }

    if (!fromAccount || !toAccount) {
      setTransferError('Pilih rekening asal dan tujuan.');
      return;
    }

    if (fromAccount === toAccount) {
      setTransferError('Rekening asal dan tujuan tidak boleh sama.');
      return;
    }

    const sourceAcc = accounts.find(a => a.id === fromAccount);
    if (!sourceAcc || sourceAcc.balance < amountNum) {
      setTransferError('Saldo rekening asal tidak mencukupi.');
      return;
    }

    const desc = transferDesc.trim() || `Transfer dari ${sourceAcc.name} ke ${accounts.find(a => a.id === toAccount)?.name}`;

    addTransaction({
      description: desc,
      amount: amountNum,
      type: 'transfer',
      accountId: fromAccount,
      category: 'Lainnya',
      tags: ['transfer'],
      toAccountId: toAccount,
      date: new Date().toISOString()
    });

    setTransferAmount('');
    setTransferDesc('');
    setTransferError('');
    setShowTransferModal(false);
  };

  // EDIT TRANSACTION HANDLERS
  const handleOpenEdit = (tx: any) => {
    setEditingTx(tx);
    setEditDesc(tx.description);
    setEditAmount(tx.amount.toString());
    setEditType(tx.type);
    setEditCategory(tx.category);
    setEditAccountId(tx.accountId);
    setEditToAccountId(tx.toAccountId || '');
    setEditTagsString(tx.tags ? tx.tags.join(', ') : '');
    setEditDate(new Date(tx.date).toISOString().split('T')[0]);
    setShowEditModal(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(editAmount);
    if (!editDesc || isNaN(amountVal) || amountVal <= 0 || !editCategory || !editAccountId || !editingTx) return;

    if (editType === 'transfer' && (!editToAccountId || editAccountId === editToAccountId)) {
      alert('Pilih rekening asal dan tujuan transfer yang berbeda.');
      return;
    }

    const tagsArray = editTagsString
      ? editTagsString.split(',').map(t => t.trim()).filter(t => t.length > 0)
      : [];

    editTransaction(editingTx.id, {
      description: editDesc,
      amount: amountVal,
      type: editType,
      category: editCategory,
      accountId: editAccountId,
      toAccountId: editType === 'transfer' ? editToAccountId : undefined,
      tags: tagsArray,
      date: new Date(editDate).toISOString()
    });

    setShowEditModal(false);
    setEditingTx(null);
  };

  const handleDeleteTransaction = (id: string, description: string) => {
    requestConfirm(`Apakah Anda yakin ingin menghapus transaksi "${description}"?`, () => {
      deleteTransaction(id);
    });
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header & Actions Panel */}
      <div className="flex flex-col gap-3 mb-2">
        {/* Top: Search */}
        <div className="w-full">
          <Input 
            placeholder="Cari transaksi (nama, kategori, tag)..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search size={18} />}
          />
        </div>

        {/* Bottom: Filters & Actions */}
        <div className="flex flex-col md:flex-row gap-3 justify-between items-start md:items-center bg-slate-50/70 p-3 rounded-2xl border border-slate-100">
          <div className="flex flex-col md:flex-row gap-3 items-start md:items-center w-full md:w-auto">
            <div className="flex items-center gap-2 w-full md:w-auto bg-white border border-slate-200 rounded-xl px-3 py-2 shrink-0 h-[42px]">
              <span className="text-[13px] text-slate-500 font-semibold hidden md:block">Rentang:</span>
              <input 
                type="date"
                className="text-[13px] border-none bg-transparent outline-none text-slate-700 w-full flex-1 md:w-auto cursor-pointer"
                value={startDateFilter}
                onChange={(e) => setStartDateFilter(e.target.value)}
              />
              <span className="text-slate-300 text-sm">-</span>
              <input 
                type="date"
                className="text-[13px] border-none bg-transparent outline-none text-slate-700 w-full flex-1 md:w-auto cursor-pointer"
                value={endDateFilter}
                onChange={(e) => setEndDateFilter(e.target.value)}
              />
            </div>
            <div className="w-full md:w-48 shrink-0">
              <Select 
                value={typeFilter} 
                onChange={(e) => setTypeFilter(e.target.value as any)}
                options={[
                  { value: 'all', label: 'Semua Jenis' },
                  { value: 'income', label: 'Pemasukan' },
                  { value: 'expense', label: 'Pengeluaran' },
                  { value: 'transfer', label: 'Transfer' },
                ]}
              />
            </div>
            <div className="w-full md:w-48 shrink-0">
              <Select 
                value={categoryFilter} 
                onChange={(e) => setCategoryFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'Semua Kategori' },
                  ...categoriesList.filter(c => c !== 'all').map(c => ({ value: c, label: c })),
                ]}
              />
            </div>
          </div>

          {/* Action Button */}
          <div className="shrink-0 w-full md:w-auto pt-1 md:pt-0 border-t border-slate-200 md:border-none mt-1 md:mt-0">
            <Button variant="primary" onClick={onAddTransactionClick} className="font-semibold text-xs py-2 px-3 w-full md:w-auto h-[42px]">
              <Plus size={16} />
              Transaksi
            </Button>
          </div>
        </div>
      </div>

      {/* Visual Chart untuk Ekspor/Analisis (Top 5 Pengeluaran) */}
      {expenseData.length > 0 && typeFilter !== 'income' && (
        <Card className="mb-4 mt-8">
          <CardContent className="p-4 sm:p-6">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <TrendingDown className="text-danger" size={16} /> 5 Pengeluaran Terbesar
            </h3>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={expenseData} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: 30 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} width={80} />
                  <Tooltip 
                    cursor={{fill: '#F8FAFC'}}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 14px rgba(0,0,0,0.1)' }}
                    formatter={(value: any) => [formatIDR(Number(value) || 0), 'Pengeluaran']}
                  />
                  <Bar dataKey="amount" radius={[0, 4, 4, 0]} barSize={24}>
                    {expenseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 2. Main List Card */}
      <Card>
        <CardContent className="p-0">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <Search size={44} className="mx-auto mb-3 opacity-20 animate-pulse" />
              <p className="font-bold text-sm">Tidak ada transaksi ditemukan</p>
              <p className="text-xs mt-1 text-slate-500">Coba ubah kata kunci atau bersihkan filter pencarian Anda</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {paginatedTransactions.map((tx) => (
                <div 
                  key={tx.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 hover:bg-slate-50/50 transition-colors duration-200"
                >
                  <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                    <div 
                      className="p-3 rounded-xl flex items-center justify-center" 
                      style={{ 
                        color: CATEGORY_COLORS[tx.category] || COLORS.primary,
                        backgroundColor: `${CATEGORY_COLORS[tx.category]}12` || `${COLORS.primary}12`
                      }}
                    >
                      {tx.type === 'transfer' ? (
                        <ArrowRightLeft size={18} />
                      ) : (
                        CATEGORY_ICONS[tx.category] || <Receipt size={18} />
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{tx.description}</h4>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
                        <span className="bg-slate-100 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider text-slate-500 text-[10px]">
                          {accounts.find(a => a.id === tx.accountId)?.name || tx.accountId}
                        </span>
                        {tx.type === 'transfer' && tx.toAccountId && (
                          <>
                            <span>→</span>
                            <span className="bg-slate-100 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider text-slate-500 text-[10px]">
                              {accounts.find(a => a.id === tx.toAccountId)?.name || tx.toAccountId}
                            </span>
                          </>
                        )}
                        <span>•</span>
                        <span className="font-semibold text-slate-500">{tx.category}</span>
                        <span>•</span>
                        <span>{safeDate(tx.date, { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        
                        {tx.tags?.map(t => (
                          <span key={t} className="text-primary font-bold">#{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto mt-2 sm:mt-0 pl-14 sm:pl-0">
                    <div className={`font-extrabold text-xs md:text-sm ${
                      tx.type === 'income' 
                        ? 'text-success' 
                        : tx.type === 'expense' 
                        ? 'text-danger' 
                        : 'text-primary'
                    }`}>
                      {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : '⇄'}
                      {formatIDR(tx.amount)}
                    </div>
                    <div className="flex gap-1 border-l border-slate-100 pl-2">
                      <button 
                        onClick={() => handleOpenEdit(tx)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-slate-100 transition cursor-pointer"
                        title="Edit Transaksi"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => handleDeleteTransaction(tx.id, tx.description)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-danger hover:bg-danger/10 transition cursor-pointer"
                        title="Hapus"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-b-3xl">
              <span className="text-xs font-semibold text-slate-500">
                Halaman {currentPage} dari {totalPages} ({filteredTransactions.length} transaksi)
              </span>
              <div className="flex gap-2">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="text-xs py-1.5 h-auto cursor-pointer"
                >
                  Sebelumnya
                </Button>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="text-xs py-1.5 h-auto cursor-pointer"
                >
                  Selanjutnya
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* MODAL 1: TRANSFER ANTAR AKUN */}
      <Modal isOpen={showTransferModal} onClose={() => setShowTransferModal(false)} title="Transfer Saldo Antar Rekening">
        <form onSubmit={handleTransferSubmit} className="space-y-4">
          {transferError && (
            <div className="p-3.5 rounded-xl bg-danger/10 border border-danger/20 text-xs font-semibold text-danger">
              {transferError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Select 
              label="Rekening Asal"
              value={fromAccount}
              onChange={(e) => setFromAccount(e.target.value)}
              options={[
                { value: '', label: 'Pilih Rekening' },
                ...accounts.map(a => ({ value: a.id, label: `${a.name} (Rp${a.balance.toLocaleString('id-ID')})` }))
              ]}
            />
            <Select 
              label="Rekening Tujuan"
              value={toAccount}
              onChange={(e) => setToAccount(e.target.value)}
              options={[
                { value: '', label: 'Pilih Rekening' },
                ...accounts.map(a => ({ value: a.id, label: `${a.name} (Rp${a.balance.toLocaleString('id-ID')})` }))
              ]}
            />
          </div>

          <CurrencyInput 
            label="Nominal Transfer"
            placeholder="e.g. 50000"
            value={transferAmount}
            onChange={(e) => setTransferAmount(e.target.value)}
          />

          <Input 
            label="Keterangan (Opsional)"
            placeholder="e.g. Isi Saldo GoPay"
            value={transferDesc}
            onChange={(e) => setTransferDesc(e.target.value)}
          />

          <Button type="submit" variant="primary" className="w-full py-2.5">
            Kirim Transfer
          </Button>
        </form>
      </Modal>

      {/* MODAL 2: IMPORT MODAL */}
      <Modal isOpen={showImportModal} onClose={() => setShowImportModal(false)} title="Import Transaksi">
        <form onSubmit={handleImportCSVSubmit} className="space-y-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            Format file harus berupa CSV dengan kolom: <br />
            <code className="bg-slate-100 p-1 rounded block mt-1">
              ID, Description, Amount, Type, Category, Date, AccountId, Tags
            </code>
          </p>
          <div className="border-2 border-dashed border-slate-200 hover:border-primary/50 transition rounded-xl p-6 text-center cursor-pointer relative bg-slate-50/50">
            <input 
              type="file" 
              accept=".csv"
              onChange={handleFileUpload}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <FileUp size={28} className="mx-auto text-slate-400 mb-2" />
            <p className="text-xs text-slate-600 font-semibold">Pilih atau Seret File CSV di sini</p>
          </div>
          {csvFileContent && (
            <div className="text-xs bg-slate-100 p-2.5 rounded-lg max-h-32 overflow-y-auto no-scrollbar font-mono border border-slate-200">
              {csvFileContent.slice(0, 500)}...
            </div>
          )}
          <Button type="submit" variant="primary" className="w-full py-2.5" disabled={!csvFileContent}>
            Mulai Impor
          </Button>
        </form>
      </Modal>

      {/* MODAL 3: EXPORT MODAL */}
      <Modal isOpen={showExportModal} onClose={() => setShowExportModal(false)} title="Export Transaksi">
        <div className="space-y-4 p-1">
          <p className="text-xs text-slate-500">Pilih format unduhan data laporan transaksi Anda:</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <button 
              onClick={() => handleExport('pdf')}
              className="p-4 rounded-2xl border border-slate-200 hover:border-primary bg-slate-50/50 text-center flex flex-col items-center justify-center gap-2 cursor-pointer transition"
            >
              <TrendingDown size={24} className="text-primary" />
              <div className="flex flex-col">
                <span className="text-xs font-bold">Cetak PDF</span>
                <span className="text-[9px] text-slate-400">dengan Grafik</span>
              </div>
            </button>
            <button 
              onClick={() => handleExport('csv')}
              className="p-4 rounded-2xl border border-slate-200 hover:border-primary bg-slate-50/50 text-center flex flex-col items-center justify-center gap-2 cursor-pointer transition"
            >
              <FileDown size={24} className="text-primary" />
              <div className="flex flex-col">
                <span className="text-xs font-bold">Unduh CSV</span>
                <span className="text-[9px] text-slate-400">untuk Excel</span>
              </div>
            </button>
            <button 
              onClick={() => handleExport('json')}
              className="p-4 rounded-2xl border border-slate-200 hover:border-primary bg-slate-50/50 text-center flex flex-col items-center justify-center gap-2 cursor-pointer transition"
            >
              <FileDown size={24} className="text-success" />
              <div className="flex flex-col">
                <span className="text-xs font-bold">Unduh JSON</span>
                <span className="text-[9px] text-slate-400">untuk Backup</span>
              </div>
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL 4: EDIT TRANSAKSI */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Transaksi">
        {editingTx && (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input 
                label="Deskripsi Transaksi"
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                placeholder="e.g. Beli Kopi, Gaji Bulanan"
              />
              <Input 
                label="Tanggal Transaksi"
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <CurrencyInput 
                label="Nominal (Rp)"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
              />
              <Select 
                label="Tipe"
                value={editType}
                onChange={(e) => setEditType(e.target.value as any)}
                options={[
                  { value: 'expense', label: 'Pengeluaran' },
                  { value: 'income', label: 'Pemasukan' },
                  { value: 'transfer', label: 'Transfer' },
                ]}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Select 
                label="Kategori"
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                options={categories.map(c => ({ value: c.name, label: c.name }))}
              />
              <Select 
                label="Rekening"
                value={editAccountId}
                onChange={(e) => setEditAccountId(e.target.value)}
                options={accounts.map(a => ({ value: a.id, label: a.name }))}
              />
            </div>

            {editType === 'transfer' && (
              <Select 
                label="Rekening Tujuan Transfer"
                value={editToAccountId}
                onChange={(e) => setEditToAccountId(e.target.value)}
                options={[
                  { value: '', label: 'Pilih Rekening Tujuan' },
                  ...accounts.map(a => ({ value: a.id, label: a.name }))
                ]}
              />
            )}

            <Input 
              label="Tag (pisahkan dengan koma)"
              value={editTagsString}
              onChange={(e) => setEditTagsString(e.target.value)}
              placeholder="e.g. kopi, bulanan, hemat"
            />

            <Button type="submit" variant="primary" className="w-full py-2.5">
              Simpan Perubahan
            </Button>
          </form>
        )}
      </Modal>

    </div>
  );
}
