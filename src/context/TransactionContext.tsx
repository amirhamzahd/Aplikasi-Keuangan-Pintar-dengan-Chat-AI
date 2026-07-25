'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { DbTransaction, DbAccount, DbBudget, DbGoal, DbSubscription, DbDebt, DbNotification, DbInsight, DbCategory } from '@/services/db/localStorageDb';
import { motion, AnimatePresence } from 'framer-motion';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'danger' | 'warning';
  actionLabel?: string;
  onAction?: () => void;
}

interface TransactionContextType {
  transactions: DbTransaction[];
  accounts: DbAccount[];
  budgets: DbBudget[];
  goals: DbGoal[];
  subscriptions: DbSubscription[];
  debts: DbDebt[];
  categories: DbCategory[];
  notifications: DbNotification[];
  insights: DbInsight[];
  
  monthlyCutoffDate: number;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  updateCutoffDate: (date: number) => void;
  updatePeriodRange: (start: string | null, end: string | null) => void;
  isDateInCurrentPeriod: (dateString: string | Date) => boolean;
  resetData: () => Promise<void>;
  
  // CRUD Actions
  addTransaction: (tx: Omit<DbTransaction, 'id'> & { date?: string | Date }) => void;
  editTransaction: (id: string, tx: Partial<DbTransaction>) => void;
  deleteTransaction: (id: string) => void;
  undoDeleteTransaction: () => void;
  
  addAccount: (name: string, type: string, initialBalance: number) => Promise<any>;
  editAccount: (id: string, name: string, type: string, balance: number) => void;
  deleteAccount: (id: string) => void;
  
  setBudget: (category: string, amount: number) => void;
  editBudget: (id: string, amount: number) => void;
  deleteBudget: (id: string) => void;
  
  addGoal: (name: string, target: number, targetDate: string) => void;
  editGoal: (id: string, name: string, target: number, targetDate: string, current: number) => void;
  deleteGoal: (id: string) => void;
  saveToGoal: (goalId: string, amount: number, accountId: string) => void;
  
  addSubscription: (sub: Omit<DbSubscription, 'id'>) => void;
  editSubscription: (id: string, sub: Partial<DbSubscription>) => void;
  deleteSubscription: (id: string) => void;
  toggleSubscriptionPayment: (id: string, accountId: string) => void;
  
  addDebt: (debt: Omit<DbDebt, 'id' | 'status'>) => void;
  editDebt: (id: string, debt: Partial<DbDebt>) => void;
  deleteDebt: (id: string) => void;
  payDebt: (id: string, targetAccountId?: string) => void;
  payDebtPartial: (id: string, amount: number, accountId: string) => void;
  toggleDebtStatus: (id: string) => void;

  addCategory: (cat: Omit<DbCategory, 'id' | 'isBuiltIn'>) => void;
  editCategory: (id: string, cat: Partial<DbCategory>) => void;
  deleteCategory: (id: string) => void;
  
  markNotificationsAsRead: () => void;
  refreshData: () => void;
  showToast: (message: string, type?: 'success' | 'danger' | 'warning', actionLabel?: string, onAction?: () => void) => void;
  requestConfirm: (message: string, onConfirm: () => void) => void;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export function TransactionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  const [monthlyCutoffDate, setMonthlyCutoffDate] = useState<number>(1);
  const [currentPeriodStart, setCurrentPeriodStart] = useState<string | null>(null);
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<DbTransaction[]>([]);
  const [accounts, setAccounts] = useState<DbAccount[]>([]);
  const [budgets, setBudgets] = useState<DbBudget[]>([]);
  const [goals, setGoals] = useState<DbGoal[]>([]);
  const [subscriptions, setSubscriptions] = useState<DbSubscription[]>([]);
  const [debts, setDebts] = useState<DbDebt[]>([]);
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [notifications, setNotifications] = useState<DbNotification[]>([]);
  const [insights, setInsights] = useState<DbInsight[]>([]);

  const [toasts, setToasts] = useState<Toast[]>([]);
  const [lastDeletedTx, setLastDeletedTx] = useState<(Omit<DbTransaction, 'id'> & { date?: string | Date }) | null>(null);

  const [confirmOptions, setConfirmOptions] = useState<{message: string, onConfirm: () => void} | null>(null);

  const requestConfirm = useCallback((message: string, onConfirm: () => void) => {
    setConfirmOptions({ message, onConfirm });
  }, []);

  const calculateNotifications = useCallback(() => {
    if (!user) return [];
    
    const autoNotifs: DbNotification[] = [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    // 1. Subscription Reminders (H-3)
    subscriptions.forEach((sub: any) => {
      const nextBillingDate = sub.nextBilling || sub.nextPayment;
      if (nextBillingDate) {
        const nextDate = new Date(nextBillingDate);
        nextDate.setHours(0, 0, 0, 0);
        const diffTime = nextDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays >= 0 && diffDays <= 3) {
          autoNotifs.push({
            id: `sub-notif-${sub.id}`,
            title: 'Pengingat Tagihan',
            message: `Tagihan "${sub.name}" (Rp${sub.amount.toLocaleString('id-ID')}) akan jatuh tempo dalam ${diffDays === 0 ? 'hari ini' : diffDays + ' hari'} (${nextDate.toLocaleDateString('id-ID')}).`,
            type: 'reminder',
            read: false,
            createdAt: sub.createdAt || new Date().toISOString()
          });
        }
      }
    });

    // 2. Budget Warnings
    budgets.forEach((b: any) => {
      const spent = transactions
        .filter((t: any) => 
          t.type === 'expense' && 
          t.category.toLowerCase() === b.category.toLowerCase() &&
          new Date(t.date).getMonth() === now.getMonth() &&
          new Date(t.date).getFullYear() === now.getFullYear()
        )
        .reduce((sum: number, t: any) => sum + t.amount, 0);

      if (spent >= b.amount * 0.9) {
        autoNotifs.push({
          id: `budget-notif-${b.id}-${Math.floor(spent / (b.amount * 0.1))}`,
          title: 'Peringatan Anggaran!',
          message: `Pengeluaran untuk kategori "${b.category}" telah mencapai Rp${spent.toLocaleString('id-ID')} (${Math.round(spent/b.amount * 100)}% dari anggaran Rp${b.amount.toLocaleString('id-ID')}).`,
          type: 'budget_warning',
          read: false,
          createdAt: new Date().toISOString()
        });
      }
    });

    // 3. Goal Achieved Alerts
    goals.forEach((g: any) => {
      if (g.current >= g.target) {
        autoNotifs.push({
          id: `goal-notif-${g.id}`,
          title: 'Target Tercapai! 🎉',
          message: `Selamat! Target menabung untuk "${g.name}" sebesar Rp${g.target.toLocaleString('id-ID')} telah tercapai!`,
          type: 'goal_achieved',
          read: false,
          createdAt: g.createdAt || new Date().toISOString()
        });
      }
    });

    // 4. Debt/Receivable Due Reminders
    debts.forEach((d: any) => {
      if (d.status === 'pending' && d.dueDate) {
        const nextDate = new Date(d.dueDate);
        nextDate.setHours(0, 0, 0, 0);
        const diffTime = nextDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        const isHutang = d.type === 'debt';
        
        if (diffDays === 0) {
          autoNotifs.push({
            id: `debt-notif-${d.id}-${diffDays}`,
            title: isHutang ? 'Jatuh Tempo Hutang' : 'Jatuh Tempo Piutang',
            message: isHutang 
              ? `Hutang Anda kepada "${d.person}" sebesar Rp${d.amount.toLocaleString('id-ID')} jatuh tempo HARI INI.`
              : `Piutang Anda dari "${d.person}" sebesar Rp${d.amount.toLocaleString('id-ID')} jatuh tempo HARI INI.`,
            type: 'budget_warning',
            read: false,
            createdAt: d.createdAt || new Date().toISOString()
          });
        } else if (diffDays > 0 && diffDays <= 3) {
          autoNotifs.push({
            id: `debt-notif-${d.id}-${diffDays}`,
            title: isHutang ? 'Jatuh Tempo Hutang' : 'Jatuh Tempo Piutang',
            message: isHutang
              ? `Hutang Anda kepada "${d.person}" sebesar Rp${d.amount.toLocaleString('id-ID')} akan jatuh tempo dalam ${diffDays} hari.`
              : `Piutang Anda dari "${d.person}" sebesar Rp${d.amount.toLocaleString('id-ID')} akan jatuh tempo dalam ${diffDays} hari.`,
            type: 'reminder',
            read: false,
            createdAt: d.createdAt || new Date().toISOString()
          });
        } else if (diffDays < 0) {
          autoNotifs.push({
            id: `debt-notif-${d.id}-${diffDays}`,
            title: isHutang ? 'Hutang Menunggak!' : 'Piutang Menunggak!',
            message: isHutang
              ? `Hutang Anda kepada "${d.person}" sebesar Rp${d.amount.toLocaleString('id-ID')} telah jatuh tempo ${Math.abs(diffDays)} hari yang lalu!`
              : `Piutang Anda dari "${d.person}" sebesar Rp${d.amount.toLocaleString('id-ID')} telah jatuh tempo ${Math.abs(diffDays)} hari yang lalu!`,
            type: 'budget_warning',
            read: false,
            createdAt: d.createdAt || new Date().toISOString()
          });
        }
      }
    });

    // Load read status from localStorage
    if (typeof window !== 'undefined') {
      const readIdsStr = localStorage.getItem(`read_notifs_${user.email}`);
      const readIds = readIdsStr ? JSON.parse(readIdsStr) : [];
      const readIdsSet = new Set(readIds);
      return autoNotifs.map(n => ({
        ...n,
        read: readIdsSet.has(n.id)
      }));
    }
    return autoNotifs;
  }, [user, transactions, budgets, goals, subscriptions, debts]);

  useEffect(() => {
    setNotifications(calculateNotifications());
  }, [calculateNotifications]);

  const showToast = useCallback((message: string, type: 'success' | 'danger' | 'warning' = 'success', actionLabel?: string, onAction?: () => void) => {
    const id = `toast-${Date.now()}`;
    const newToast: Toast = { id, message, type, actionLabel, onAction };
    setToasts(prev => [...prev, newToast]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const isDateInCurrentPeriod = useCallback((dateString: string | Date) => {
    if (!dateString) return false;
    const d = new Date(dateString).getTime();
    
    if (currentPeriodStart && currentPeriodEnd) {
      const start = new Date(currentPeriodStart).getTime();
      const end = new Date(currentPeriodEnd);
      end.setHours(23, 59, 59, 999);
      return d >= start && d <= end.getTime();
    }

    const now = new Date();
    let startMonth = now.getMonth();
    let startYear = now.getFullYear();
    
    if (now.getDate() < monthlyCutoffDate) {
      startMonth -= 1;
      if (startMonth < 0) {
        startMonth = 11;
        startYear -= 1;
      }
    }
    
    const startPeriod = new Date(startYear, startMonth, monthlyCutoffDate, 0, 0, 0, 0);
    const maxDaysEnd = new Date(startYear, startMonth + 2, 0).getDate();
    const endCutoff = Math.min(monthlyCutoffDate, maxDaysEnd);
    const endPeriod = new Date(startYear, startMonth + 1, endCutoff, 23, 59, 59, 999);
    endPeriod.setDate(endPeriod.getDate() - 1);
    
    return d >= startPeriod.getTime() && d <= endPeriod.getTime();
  }, [monthlyCutoffDate, currentPeriodStart, currentPeriodEnd]);

  const refreshData = useCallback(async () => {
    if (!user) {
      setTransactions([]); setAccounts([]); setBudgets([]); setGoals([]);
      setSubscriptions([]); setDebts([]); setCategories([]); setNotifications([]); setInsights([]);
      return;
    }
    try {
      const res = await fetch(`/api/sync?email=${encodeURIComponent(user.email)}`);
      const data = await res.json();
      if (data && data.user) {
        setMonthlyCutoffDate(data.user.monthlyCutoffDate || 1);
        setCurrentPeriodStart(data.user.currentPeriodStart || null);
        setCurrentPeriodEnd(data.user.currentPeriodEnd || null);
        setTransactions((data.transactions || []).map((t: any) => ({
          ...t,
          tags: Array.isArray(t.tags) ? t.tags : (typeof t.tags === 'string' && t.tags ? t.tags.split(',').map((s: string) => s.trim()) : [])
        })));
        setAccounts(data.accounts || []);
        setBudgets(data.budgets || []);
        setGoals(data.goals || []);
        
        const subs = data.subscriptions || [];
        setSubscriptions(subs);
        setDebts(data.debts || []);
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error("Gagal refresh data dari server:", error);
    }
  }, [user]);

  useEffect(() => {
    refreshData();
  }, [user, refreshData]);

  // Universal database mutator helper
  const mutateDb = async (entity: string, action: string, data: any = {}, id?: string) => {
    if (!user) return null;

    // Check Read-Only Mode
    const isExpired = user.planExpiredAt ? new Date(user.planExpiredAt) < new Date() : false;
    if (user.planType === 'NONE' || isExpired) {
      showToast('Akun Anda dalam mode Read-Only. Silakan perpanjang paket untuk mengubah data.', 'danger');
      throw new Error('READ_ONLY');
    }

    try {
      const res = await fetch('/api/mutate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, entity, action, data, id })
      });
      return await res.json();
    } catch(e) {
      console.error(e);
      return null;
    }
  };

  const updatePeriodRange = async (start: string | null, end: string | null) => {
    if (!user) return;
    setCurrentPeriodStart(start);
    setCurrentPeriodEnd(end);
    await mutateDb('user', 'UPDATE', { currentPeriodStart: start, currentPeriodEnd: end }, user.id);
    showToast('Rentang Tanggal Periode berhasil diupdate!', 'success');
  };

  const resetData = async () => {
    if (!user) return;
    try {
      await mutateDb('user', 'RESET_DATA', {});
      showToast('Semua data keuangan Anda telah direset.', 'warning');
      refreshData();
    } catch(e) {
      console.error(e);
      showToast('Gagal mereset data.', 'danger');
    }
  };

  // --- TRANSACTION CRUD ---
  const addTransaction = async (tx: Omit<DbTransaction, 'id'> & { date?: string | Date }) => {
    // Double Transaction Detection (Anti-Spam)
    const now = new Date().getTime();
    const isDuplicate = transactions.some(t => {
      const txTime = new Date(t.date).getTime();
      return (
        t.amount === tx.amount && 
        t.category === tx.category && 
        t.type === tx.type && 
        (now - txTime) < 10000 // 10 seconds
      );
    });

    const executeAdd = async () => {
      if (tx.type === 'expense' || tx.type === 'transfer') {
        const sourceAccount = accounts.find(a => a.id === tx.accountId);
        if (sourceAccount && sourceAccount.balance < tx.amount) {
          showToast(`Transaksi Gagal! Saldo di ${sourceAccount.name} tidak mencukupi. (Sisa: Rp${sourceAccount.balance.toLocaleString('id-ID')})`, 'danger');
          return;
        }
      }

      await mutateDb('transaction', 'CREATE', tx);
      showToast(`Transaksi "${tx.description}" berhasil ditambahkan!`, 'success');
      refreshData();
    };

    if (isDuplicate) {
      requestConfirm(
        `PERINGATAN GANDA!\n\nTransaksi senilai Rp${tx.amount.toLocaleString('id-ID')} untuk kategori "${tx.category}" baru saja ditambahkan beberapa detik yang lalu.\n\nYakin ingin menyimpan transaksi ini lagi?`, 
        () => executeAdd()
      );
    } else {
      executeAdd();
    }
  };

  const editTransaction = async (id: string, tx: Partial<DbTransaction>) => {
    await mutateDb('transaction', 'UPDATE', tx, id);
    showToast(`Transaksi "${tx.description || 'Pilihan'}" berhasil diubah!`, 'success');
    refreshData();
  };

  const deleteTransaction = async (id: string) => {
    const txToDelete = transactions.find(t => t.id === id);
    if (!txToDelete) return;
    setLastDeletedTx({
      description: txToDelete.description,
      amount: txToDelete.amount,
      type: txToDelete.type,
      accountId: txToDelete.accountId,
      category: txToDelete.category,
      tags: txToDelete.tags,
      toAccountId: txToDelete.toAccountId,
      date: txToDelete.date
    });
    await mutateDb('transaction', 'DELETE', {}, id);
    showToast(`Transaksi "${txToDelete.description}" berhasil dihapus.`, 'warning', 'Batal Hapus', () => {
      undoDeleteTransaction();
    });
    refreshData();
  };

  const undoDeleteTransaction = async () => {
    if (!lastDeletedTx) return;
    await mutateDb('transaction', 'CREATE', lastDeletedTx);
    setLastDeletedTx(null);
    showToast(`Penghapusan transaksi dibatalkan!`, 'success');
    refreshData();
  };

  // --- ACCOUNT CRUD ---
  const addAccount = async (name: string, type: string, initialBalance: number) => {
    const newAccount = await mutateDb('account', 'CREATE', { name, type, balance: initialBalance });
    showToast(`Rekening "${name}" berhasil ditambahkan!`, 'success');
    refreshData();
    return newAccount;
  };

  const editAccount = async (id: string, name: string, type: string, balance: number) => {
    await mutateDb('account', 'UPDATE', { name, type, balance }, id);
    showToast(`Rekening "${name}" berhasil diperbarui!`, 'success');
    refreshData();
  };

  const deleteAccount = async (id: string) => {
    const account = accounts.find(a => a.id === id);
    if (!account) return;
    await mutateDb('account', 'DELETE', {}, id);
    showToast(`Rekening "${account.name}" berhasil dihapus.`, 'warning');
    refreshData();
  };

  // --- BUDGET CRUD ---
  const setBudget = async (category: string, amount: number) => {
    await mutateDb('budget', 'CREATE', { category, amount });
    showToast(`Budget Kategori "${category}" berhasil diatur!`, 'success');
    refreshData();
  };

  const editBudget = async (id: string, amount: number) => {
    const b = budgets.find(x => x.id === id);
    if (!b) return;
    await mutateDb('budget', 'UPDATE', { amount }, id);
    showToast(`Budget Kategori "${b.category}" berhasil diubah!`, 'success');
    refreshData();
  };

  const deleteBudget = async (id: string) => {
    const b = budgets.find(x => x.id === id);
    if (!b) return;
    await mutateDb('budget', 'DELETE', {}, id);
    showToast(`Budget Kategori "${b.category}" berhasil dihapus!`, 'warning');
    refreshData();
  };

  // --- GOAL CRUD ---
  const addGoal = async (name: string, target: number, targetDate: string) => {
    await mutateDb('goal', 'CREATE', { name, target, targetDate: new Date(targetDate) });
    showToast(`Target Tabungan "${name}" berhasil ditambahkan!`, 'success');
    refreshData();
  };

  const editGoal = async (id: string, name: string, target: number, targetDate: string, current: number) => {
    await mutateDb('goal', 'UPDATE', { name, target, targetDate: new Date(targetDate), current }, id);
    showToast(`Target Tabungan "${name}" berhasil diubah!`, 'success');
    refreshData();
  };

  const deleteGoal = async (id: string) => {
    const g = goals.find(x => x.id === id);
    if (!g) return;
    await mutateDb('goal', 'DELETE', {}, id);
    showToast(`Target Tabungan "${g.name}" berhasil dihapus!`, 'warning');
    refreshData();
  };

  const saveToGoal = async (goalId: string, amount: number, accountId: string) => {
    const acc = accounts.find(a => a.id === accountId);
    if (!acc || acc.balance < amount) {
      showToast(`Saldo Rekening "${acc?.name || 'Sumber'}" tidak mencukupi.`, 'danger');
      return;
    }
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    // Mutate expense transaction
    await mutateDb('transaction', 'CREATE', {
      description: `Tabungan Goal: ${goal.name}`,
      amount,
      type: 'expense',
      accountId,
      category: 'Lainnya',
      tags: 'goal'
    });
    // Mutate goal
    await mutateDb('goal', 'UPDATE', { current: goal.current + amount }, goalId);
    
    showToast(`Berhasil menabung Rp${amount.toLocaleString('id-ID')} untuk "${goal.name}"!`, 'success');
    refreshData();
  };

  // --- SUBSCRIPTIONS CRUD ---
  const addSubscription = async (sub: Omit<DbSubscription, 'id'>) => {
    await mutateDb('subscription', 'CREATE', sub);
    showToast(`Langganan "${sub.name}" berhasil ditambahkan!`, 'success');
    refreshData();
  };

  const editSubscription = async (id: string, sub: Partial<DbSubscription>) => {
    await mutateDb('subscription', 'UPDATE', sub, id);
    showToast(`Langganan "${sub.name || 'Pilihan'}" berhasil diubah!`, 'success');
    refreshData();
  };

  const deleteSubscription = async (id: string) => {
    const s = subscriptions.find(x => x.id === id);
    if (!s) return;
    await mutateDb('subscription', 'DELETE', {}, id);
    showToast(`Langganan "${s.name}" berhasil dihapus!`, 'warning');
    refreshData();
  };

  const toggleSubscriptionPayment = async (id: string, accountId: string) => {
    const s = subscriptions.find(x => x.id === id);
    if (!s) return;

    const sourceAcc = accounts.find(a => a.id === accountId);
    if (sourceAcc && sourceAcc.balance < s.amount) {
      showToast(`Transaksi Gagal! Saldo di ${sourceAcc.name} tidak mencukupi. (Sisa: Rp${sourceAcc.balance.toLocaleString('id-ID')})`, 'danger');
      return;
    }

    await mutateDb('transaction', 'CREATE', {
      description: `Pembayaran Langganan: ${s.name}`,
      amount: s.amount,
      type: 'expense',
      accountId: accountId,
      category: s.category,
      tags: 'langganan'
    });

    const nextDate = new Date(s.nextBilling);
    if (s.billingCycle === 'weekly') {
      nextDate.setDate(nextDate.getDate() + 7);
    } else if (s.billingCycle === 'monthly') {
      nextDate.setMonth(nextDate.getMonth() + 1);
    } else if (s.billingCycle === 'yearly') {
      nextDate.setFullYear(nextDate.getFullYear() + 1);
    } else if (s.billingCycle === 'date') {
      nextDate.setMonth(nextDate.getMonth() + 1);
    }
    await mutateDb('subscription', 'UPDATE', { nextBilling: nextDate }, id);

    showToast(`Pembayaran langganan "${s.name}" berhasil dibukukan!`, 'success');
    refreshData();
  };

  const addDebt = async (debt: Omit<DbDebt, 'id' | 'status'>) => {
    // 1. Create debt record
    await mutateDb('debt', 'CREATE', { ...debt, dueDate: debt.dueDate ? new Date(debt.dueDate).toISOString() : "", status: 'pending' });
    
    // 2. Adjust balance for initial loan
    if (debt.accountId) {
      const isHutang = debt.type === 'debt';
      await mutateDb('transaction', 'CREATE', {
        description: isHutang ? `Pinjaman dari ${debt.person}` : `Memberi pinjaman ke ${debt.person}`,
        amount: debt.amount,
        type: isHutang ? 'income' : 'expense',
        accountId: debt.accountId,
        category: 'Hutang/Piutang',
        tags: isHutang ? 'hutang, masuk' : 'piutang, keluar'
      });
    }

    showToast(`Catatan hutang-piutang untuk "${debt.person}" berhasil ditambahkan!`, 'success');
    refreshData();
  };

  const editDebt = async (id: string, debt: Partial<DbDebt>) => {
    await mutateDb('debt', 'UPDATE', debt, id);
    showToast(`Catatan hutang-piutang berhasil diubah!`, 'success');
    refreshData();
  };

  const deleteDebt = async (id: string) => {
    const d = debts.find(x => x.id === id);
    if (!d) return;

    await mutateDb('debt', 'DELETE', {}, id);
    showToast(`Catatan hutang-piutang untuk "${d.person}" berhasil dihapus!`, 'warning');
    refreshData();
  };

  const payDebt = async (id: string, targetAccountId?: string) => {
    const d = debts.find(x => x.id === id);
    if (!d) return;
    
    const accId = targetAccountId || d.accountId;
    if (accId) {
      const sourceAcc = accounts.find(a => a.id === accId);
      if (d.type === 'debt' && sourceAcc && sourceAcc.balance < d.amount) {
        showToast(`Pelunasan Gagal! Saldo di ${sourceAcc.name} tidak mencukupi.`, 'danger');
        return;
      }
      
      await mutateDb('transaction', 'CREATE', {
        description: `Pelunasan ${d.type === 'debt' ? 'Hutang ke' : 'Piutang dari'} ${d.person}`,
        amount: d.amount,
        type: d.type === 'debt' ? 'expense' : 'income',
        accountId: accId,
        category: 'Hutang/Piutang',
        tags: 'pelunasan, hutang'
      });
    }

    await mutateDb('debt', 'UPDATE', { status: 'paid', accountId: accId }, id);
    showToast(`Status Hutang-piutang "${d.person}" berhasil diselesaikan!`, 'success');
    refreshData();
  };

  const payDebtPartial = async (id: string, amount: number, accountId: string) => {
    const debt = debts.find(d => d.id === id);
    if (!debt) return;
    
    const sourceAcc = accounts.find(a => a.id === accountId);
    if (debt.type === 'debt' && sourceAcc && sourceAcc.balance < amount) {
      showToast(`Cicilan Gagal! Saldo di ${sourceAcc.name} tidak mencukupi.`, 'danger');
      return;
    }
    
    await mutateDb('transaction', 'CREATE', {
      description: `Cicilan ${debt.type === 'debt' ? 'Hutang ke' : 'Piutang dari'} ${debt.person}`,
      amount: amount,
      type: debt.type === 'debt' ? 'expense' : 'income',
      accountId: accountId,
      category: 'Hutang/Piutang',
      tags: 'cicilan, hutang'
    });

    const newAmount = debt.amount - amount;
    const newStatus = newAmount <= 0 ? 'paid' : 'pending';
    
    await mutateDb('debt', 'UPDATE', { amount: newAmount, status: newStatus }, id);
    showToast(`Cicilan sebesar Rp${amount.toLocaleString('id-ID')} untuk "${debt.person}" berhasil dibukukan!`, 'success');
    refreshData();
  };

  const toggleDebtStatus = async (id: string) => {
    const d = debts.find(x => x.id === id);
    if (!d) return;

    const newStatus = d.status === 'pending' ? 'paid' : 'pending';
    const isHutang = d.type === 'debt';
    const accId = d.accountId || accounts[0]?.id;

    if (accId) {
      if (newStatus === 'paid') {
        // Tandai Lunas manual -> Create payment transaction
        await mutateDb('transaction', 'CREATE', {
          description: `Pelunasan Manual ${isHutang ? 'Hutang ke' : 'Piutang dari'} ${d.person}`,
          amount: d.amount,
          type: isHutang ? 'expense' : 'income',
          accountId: accId,
          category: 'Hutang/Piutang',
          tags: 'pelunasan, hutang'
        });
      } else {
        // Batal Lunas -> Create reverse transaction
        await mutateDb('transaction', 'CREATE', {
          description: `Batal Lunas ${isHutang ? 'Hutang ke' : 'Piutang dari'} ${d.person}`,
          amount: d.amount,
          type: isHutang ? 'income' : 'expense',
          accountId: accId,
          category: 'Hutang/Piutang',
          tags: 'batal lunas, hutang'
        });
      }
    }

    await mutateDb('debt', 'UPDATE', { status: newStatus }, id);
    showToast(`Status hutang "${d.person}" diubah menjadi ${newStatus === 'paid' ? 'Lunas' : 'Belum Lunas'}!`, 'success');
    refreshData();
  };

  // --- CATEGORIES CRUD ---
  const addCategory = async (cat: Omit<DbCategory, 'id' | 'isBuiltIn'>) => {
    await mutateDb('category', 'CREATE', cat);
    showToast(`Kategori "${cat.name}" berhasil ditambahkan!`, 'success');
    refreshData();
  };

  const editCategory = async (id: string, cat: Partial<DbCategory>) => {
    await mutateDb('category', 'UPDATE', cat, id);
    showToast(`Kategori "${cat.name || 'Pilihan'}" berhasil diubah!`, 'success');
    refreshData();
  };

  const deleteCategory = async (id: string) => {
    const cat = categories.find(c => c.id === id);
    if (!cat) return;
    await mutateDb('category', 'DELETE', {}, id);
    showToast(`Kategori "${cat.name}" berhasil dihapus!`, 'warning');
    refreshData();
  };

  const markNotificationsAsRead = () => {
    if (!user) return;
    const currentNotifs = calculateNotifications();
    const readIds = currentNotifs.map(n => n.id);
    localStorage.setItem(`read_notifs_${user.email}`, JSON.stringify(readIds));
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const updateCutoffDate = async (date: number) => {
    if (!user) return;
    await mutateDb('user', 'UPDATE', { monthlyCutoffDate: date }, user.id);
    setMonthlyCutoffDate(date);
    showToast(`Tanggal cutoff bulanan berhasil diubah menjadi tanggal ${date}.`, 'success');
    refreshData();
  };

  return (
    <TransactionContext.Provider
      value={{
        transactions, accounts, budgets, goals, subscriptions, debts, categories,
        notifications,
        insights,
        monthlyCutoffDate,
        currentPeriodStart,
        currentPeriodEnd,
        updateCutoffDate,
        updatePeriodRange,
        isDateInCurrentPeriod,
        resetData,
        addTransaction, editTransaction, deleteTransaction, undoDeleteTransaction,
        addAccount, editAccount, deleteAccount,
        setBudget, editBudget, deleteBudget,
        addGoal, editGoal, deleteGoal, saveToGoal,
        addSubscription, editSubscription, deleteSubscription, toggleSubscriptionPayment,
        addDebt, editDebt, deleteDebt, payDebt, payDebtPartial, toggleDebtStatus,
        addCategory, editCategory, deleteCategory,
        markNotificationsAsRead, refreshData, showToast, requestConfirm
      }}
    >
      {children}

      {/* GLOBAL CONFIRM MODAL */}
      <AnimatePresence>
        {confirmOptions && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 10 }}
              className="bg-white rounded-3xl shadow-2xl overflow-hidden w-full max-w-sm border border-border/50"
            >
              <div className="p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-rose-600"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                </div>
                <h3 className="text-xl font-extrabold text-slate-800 mb-2">Konfirmasi Aksi</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-6 font-medium px-2 whitespace-pre-line">
                  {confirmOptions.message}
                </p>
                <div className="flex gap-3 w-full">
                  <button 
                    onClick={() => setConfirmOptions(null)}
                    className="flex-1 py-3 rounded-2xl font-bold text-sm bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800 transition-all active:scale-95"
                  >
                    Batalkan
                  </button>
                  <button 
                    onClick={() => { confirmOptions.onConfirm(); setConfirmOptions(null); }}
                    className="flex-1 py-3 rounded-2xl font-bold text-sm bg-rose-500 text-white hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/25 active:scale-95"
                  >
                    Ya, Lanjutkan
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-2.5 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className={`pointer-events-auto flex items-center justify-between gap-3.5 px-4 py-3 rounded-xl shadow-lg border text-xs font-bold ${
                toast.type === 'success' 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                  : toast.type === 'danger' 
                  ? 'bg-rose-50 border-rose-200 text-rose-800' 
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}
            >
              <span>{toast.message}</span>
              {toast.onAction && (
                <button 
                  onClick={toast.onAction}
                  className="text-[10px] uppercase font-extrabold text-primary hover:underline cursor-pointer select-none border-l border-slate-200/50 pl-2.5 ml-1"
                >
                  {toast.actionLabel || 'Aksi'}
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </TransactionContext.Provider>
  );
}

export function useTransactions() {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
}
