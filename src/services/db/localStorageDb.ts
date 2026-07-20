// LocalStorage multi-user mock database service

export interface DbTransaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  date: string;
  accountId: string;
  category: string;
  tags: string[];
  toAccountId?: string; // only for transfers
}

export interface DbAccount {
  id: string;
  name: string;
  type: string;
  balance: number;
}

export interface DbBudget {
  id: string;
  category: string;
  amount: number;
  spent: number;
}

export interface DbGoal {
  id: string;
  name: string;
  target: number;
  current: number;
  targetDate: string;
}

export interface DbSubscription {
  id: string;
  name: string;
  amount: number;
  billingCycle: 'weekly' | 'monthly' | 'yearly' | 'date';
  nextBilling: string;
  category: string;
}

export interface DbDebt {
  id: string;
  person: string;
  amount: number;
  type: 'debt' | 'receivable'; // debt = hutang, receivable = piutang
  dueDate: string;
  status: 'pending' | 'paid';
  accountId?: string; // Link to the real account used for the transaction
}

export interface DbNotification {
  id: string;
  title: string;
  message: string;
  type: 'system' | 'budget_warning' | 'goal_achieved' | 'reminder';
  read: boolean;
  createdAt: string;
}

export interface DbInsight {
  id: string;
  content: string;
  type: 'info' | 'alert' | 'success';
  createdAt: string;
}

export interface DbCategory {
  id: string;
  name: string;
  icon: string; // Lucide icon string
  color: string; // HEX color code
  type: 'income' | 'expense';
  isBuiltIn: boolean;
}

// Default initial data for new users (Empty/Zero State)
const DEFAULT_ACCOUNTS: DbAccount[] = [
  { id: 'acc-cash', name: 'Cash', type: 'CASH', balance: 0 },
  { id: 'acc-bca', name: 'Bank BCA', type: 'BANK', balance: 0 },
  { id: 'acc-gopay', name: 'GoPay', type: 'E_WALLET', balance: 0 },
];

const DEFAULT_BUDGETS: DbBudget[] = [];
const DEFAULT_GOALS: DbGoal[] = [];
const DEFAULT_SUBSCRIPTIONS: DbSubscription[] = [];
const DEFAULT_DEBTS: DbDebt[] = [];

export const DEFAULT_CATEGORIES: DbCategory[] = [
  { id: 'cat-makanan', name: 'Makanan & Minuman', icon: 'Coffee', color: '#F59E0B', type: 'expense', isBuiltIn: true },
  { id: 'cat-transportasi', name: 'Transportasi', icon: 'Car', color: '#2563EB', type: 'expense', isBuiltIn: true },
  { id: 'cat-belanja', name: 'Belanja', icon: 'ShoppingBag', color: '#EC4899', type: 'expense', isBuiltIn: true },
  { id: 'cat-tagihan', name: 'Tagihan & Utilitas', icon: 'Zap', color: '#6366F1', type: 'expense', isBuiltIn: true },
  { id: 'cat-hiburan', name: 'Hiburan', icon: 'Activity', color: '#14B8A6', type: 'expense', isBuiltIn: true },
  { id: 'cat-pekerjaan', name: 'Pekerjaan', icon: 'Briefcase', color: '#64748B', type: 'expense', isBuiltIn: true },
  { id: 'cat-kesehatan', name: 'Kesehatan', icon: 'Heart', color: '#EF4444', type: 'expense', isBuiltIn: true },
  { id: 'cat-pendidikan', name: 'Pendidikan', icon: 'GraduationCap', color: '#8B5CF6', type: 'expense', isBuiltIn: true },
  { id: 'cat-hutang', name: 'Hutang', icon: 'ArrowDownRight', color: '#6366F1', type: 'expense', isBuiltIn: true },
  { id: 'cat-piutang', name: 'Piutang', icon: 'ArrowUpRight', color: '#10B981', type: 'expense', isBuiltIn: true },
  { id: 'cat-pendapatan', name: 'Pendapatan', icon: 'DollarSign', color: '#10B981', type: 'income', isBuiltIn: true },
  { id: 'cat-lainnya', name: 'Lainnya', icon: 'Receipt', color: '#64748B', type: 'expense', isBuiltIn: true }
];

// Helper to get user-specific data store
function getUserStore(email: string): {
  transactions: DbTransaction[];
  accounts: DbAccount[];
  budgets: DbBudget[];
  goals: DbGoal[];
  subscriptions: DbSubscription[];
  debts: DbDebt[];
  categories: DbCategory[];
  notifications: DbNotification[];
  insights: DbInsight[];
} {
  const storeKey = `aura_data_${email.toLowerCase()}`;
  if (typeof window === 'undefined') {
    return { transactions: [], accounts: [], budgets: [], goals: [], subscriptions: [], debts: [], categories: [], notifications: [], insights: [] };
  }
  
  const raw = localStorage.getItem(storeKey);
  if (!raw) {
    const initial = {
      transactions: [],
      accounts: DEFAULT_ACCOUNTS,
      budgets: DEFAULT_BUDGETS,
      goals: DEFAULT_GOALS,
      subscriptions: DEFAULT_SUBSCRIPTIONS,
      debts: DEFAULT_DEBTS,
      categories: DEFAULT_CATEGORIES,
      notifications: [
        {
          id: 'notif-welcome',
          title: 'Selamat datang di DIAMOND!',
          message: 'Mulai catat transaksi Anda secara mudah menggunakan manual form atau Floating AI Assistant.',
          type: 'system' as const,
          read: false,
          createdAt: new Date().toISOString()
        }
      ],
      insights: [
        {
          id: 'ins-1',
          content: 'Halo! Saya DIAMOND. Silakan catat transaksi pertama Anda untuk melihat analisis performa finansial.',
          type: 'info' as const,
          createdAt: new Date().toISOString()
        }
      ],
    };
    localStorage.setItem(storeKey, JSON.stringify(initial));
    return initial;
  }
  
  const parsed = JSON.parse(raw);
  
  // Auto-reset residual dummy balances if there are no transactions recorded
  if ((!parsed.transactions || parsed.transactions.length === 0) && parsed.accounts) {
    let hasDummyBalance = false;
    parsed.accounts.forEach((acc: any) => {
      if (acc.balance > 0) {
        hasDummyBalance = true;
        acc.balance = 0;
      }
    });
    if (hasDummyBalance) {
      saveUserStore(email, parsed);
    }
  }

  // Ensure categories exist
  if (!parsed.categories || parsed.categories.length === 0) {
    parsed.categories = DEFAULT_CATEGORIES;
    saveUserStore(email, parsed);
  }
  
  return parsed;
}

function saveUserStore(email: string, data: any) {
  const storeKey = `aura_data_${email.toLowerCase()}`;
  if (typeof window !== 'undefined') {
    localStorage.setItem(storeKey, JSON.stringify(data));
  }
}

export const localStorageDb = {
  // TRANSACTIONS
  getTransactions(email: string): DbTransaction[] {
    return getUserStore(email).transactions;
  },

  addTransaction(email: string, tx: Omit<DbTransaction, 'id'>): DbTransaction {
    const store = getUserStore(email);
    const newTx = { ...tx, id: `tx-${Date.now()}` };
    store.transactions.unshift(newTx);
    
    // Adjust account balances
    const account = store.accounts.find(a => a.id === tx.accountId);
    if (account) {
      if (tx.type === 'income') {
        account.balance += tx.amount;
      } else if (tx.type === 'expense') {
        account.balance -= tx.amount;
        
        // Update budget spent amount
        const budget = store.budgets.find(b => b.category.toLowerCase() === tx.category.toLowerCase());
        if (budget) {
          budget.spent += tx.amount;
          
          // Send warning notification if budget exceeds 90%
          if (budget.spent > budget.amount * 0.9 && budget.spent - tx.amount <= budget.amount * 0.9) {
            store.notifications.unshift({
              id: `notif-bd-${Date.now()}`,
              title: `Limit Budget Hampir Habis!`,
              message: `Pengeluaran Kategori ${budget.category} telah mencapai ${Math.round((budget.spent / budget.amount) * 100)}% dari limit Rp${budget.amount.toLocaleString('id-ID')}.`,
              type: 'budget_warning',
              read: false,
              createdAt: new Date().toISOString()
            });
          }
        }
      } else if (tx.type === 'transfer' && tx.toAccountId) {
        account.balance -= tx.amount;
        const destAccount = store.accounts.find(a => a.id === tx.toAccountId);
        if (destAccount) {
          destAccount.balance += tx.amount;
        }
      }
    }

    saveUserStore(email, store);
    return newTx;
  },

  editTransaction(email: string, id: string, updatedData: Partial<DbTransaction>): DbTransaction | null {
    const store = getUserStore(email);
    const index = store.transactions.findIndex(t => t.id === id);
    if (index === -1) return null;

    const oldTx = store.transactions[index];
    
    // Reverse old transaction impact
    const oldAccount = store.accounts.find(a => a.id === oldTx.accountId);
    if (oldAccount) {
      if (oldTx.type === 'income') {
        oldAccount.balance -= oldTx.amount;
      } else if (oldTx.type === 'expense') {
        oldAccount.balance += oldTx.amount;
        const oldBudget = store.budgets.find(b => b.category.toLowerCase() === oldTx.category.toLowerCase());
        if (oldBudget) {
          oldBudget.spent = Math.max(0, oldBudget.spent - oldTx.amount);
        }
      } else if (oldTx.type === 'transfer' && oldTx.toAccountId) {
        oldAccount.balance += oldTx.amount;
        const destAccount = store.accounts.find(a => a.id === oldTx.toAccountId);
        if (destAccount) {
          destAccount.balance -= oldTx.amount;
        }
      }
    }

    // Apply new transaction impact
    const newTx = { ...oldTx, ...updatedData };
    store.transactions[index] = newTx;

    const newAccount = store.accounts.find(a => a.id === newTx.accountId);
    if (newAccount) {
      if (newTx.type === 'income') {
        newAccount.balance += newTx.amount;
      } else if (newTx.type === 'expense') {
        newAccount.balance -= newTx.amount;
        const newBudget = store.budgets.find(b => b.category.toLowerCase() === newTx.category.toLowerCase());
        if (newBudget) {
          newBudget.spent += newTx.amount;
        }
      } else if (newTx.type === 'transfer' && newTx.toAccountId) {
        newAccount.balance -= newTx.amount;
        const destAccount = store.accounts.find(a => a.id === newTx.toAccountId);
        if (destAccount) {
          destAccount.balance += newTx.amount;
        }
      }
    }

    saveUserStore(email, store);
    return newTx;
  },

  deleteTransaction(email: string, id: string): boolean {
    const store = getUserStore(email);
    const index = store.transactions.findIndex(t => t.id === id);
    if (index === -1) return false;
    
    const tx = store.transactions[index];
    
    // Reverse account balances
    const account = store.accounts.find(a => a.id === tx.accountId);
    if (account) {
      if (tx.type === 'income') {
        account.balance -= tx.amount;
      } else if (tx.type === 'expense') {
        account.balance += tx.amount;
        
        const budget = store.budgets.find(b => b.category.toLowerCase() === tx.category.toLowerCase());
        if (budget) {
          budget.spent = Math.max(0, budget.spent - tx.amount);
        }
      } else if (tx.type === 'transfer' && tx.toAccountId) {
        account.balance += tx.amount;
        const destAccount = store.accounts.find(a => a.id === tx.toAccountId);
        if (destAccount) {
          destAccount.balance -= tx.amount;
        }
      }
    }

    store.transactions.splice(index, 1);
    saveUserStore(email, store);
    return true;
  },

  // ACCOUNTS
  getAccounts(email: string): DbAccount[] {
    return getUserStore(email).accounts;
  },

  addAccount(email: string, name: string, type: string, initialBalance: number): DbAccount {
    const store = getUserStore(email);
    const newAcc = { id: `acc-${Date.now()}`, name, type, balance: initialBalance };
    store.accounts.push(newAcc);
    saveUserStore(email, store);
    return newAcc;
  },

  editAccount(email: string, id: string, name: string, type: string, balance: number): DbAccount | null {
    const store = getUserStore(email);
    const account = store.accounts.find(a => a.id === id);
    if (!account) return null;
    account.name = name;
    account.type = type;
    account.balance = balance;
    saveUserStore(email, store);
    return account;
  },

  deleteAccount(email: string, id: string): boolean {
    const store = getUserStore(email);
    const index = store.accounts.findIndex(a => a.id === id);
    if (index === -1) return false;
    store.accounts.splice(index, 1);
    saveUserStore(email, store);
    return true;
  },

  // BUDGETS
  getBudgets(email: string): DbBudget[] {
    return getUserStore(email).budgets;
  },

  setBudget(email: string, category: string, amount: number): DbBudget {
    const store = getUserStore(email);
    const existing = store.budgets.find(b => b.category === category);
    
    // Calculate current spending for this category
    const spent = store.transactions
      .filter(t => t.type === 'expense' && t.category.toLowerCase() === category.toLowerCase())
      .reduce((sum, t) => sum + t.amount, 0);

    if (existing) {
      existing.amount = amount;
      existing.spent = spent;
      saveUserStore(email, store);
      return existing;
    } else {
      const newBudget = { id: `bd-${Date.now()}`, category, amount, spent };
      store.budgets.push(newBudget);
      saveUserStore(email, store);
      return newBudget;
    }
  },

  editBudget(email: string, id: string, amount: number): DbBudget | null {
    const store = getUserStore(email);
    const budget = store.budgets.find(b => b.id === id);
    if (!budget) return null;
    budget.amount = amount;
    saveUserStore(email, store);
    return budget;
  },

  deleteBudget(email: string, id: string): boolean {
    const store = getUserStore(email);
    const index = store.budgets.findIndex(b => b.id === id);
    if (index === -1) return false;
    store.budgets.splice(index, 1);
    saveUserStore(email, store);
    return true;
  },

  // GOALS
  getGoals(email: string): DbGoal[] {
    return getUserStore(email).goals;
  },

  addGoal(email: string, name: string, target: number, targetDate: string): DbGoal {
    const store = getUserStore(email);
    const newGoal = { id: `gl-${Date.now()}`, name, target, current: 0, targetDate };
    store.goals.push(newGoal);
    saveUserStore(email, store);
    return newGoal;
  },

  updateGoalSavings(email: string, goalId: string, amount: number): DbGoal | null {
    const store = getUserStore(email);
    const goal = store.goals.find(g => g.id === goalId);
    if (!goal) return null;
    
    goal.current += amount;
    
    if (goal.current >= goal.target && goal.current - amount < goal.target) {
      store.notifications.unshift({
        id: `notif-gl-${Date.now()}`,
        title: 'Target Tabungan Tercapai! 🎉',
        message: `Selamat! Tabungan untuk "${goal.name}" telah mencapai target Rp${goal.target.toLocaleString('id-ID')}.`,
        type: 'goal_achieved',
        read: false,
        createdAt: new Date().toISOString()
      });
    }

    saveUserStore(email, store);
    return goal;
  },

  editGoal(email: string, id: string, name: string, target: number, targetDate: string, current: number): DbGoal | null {
    const store = getUserStore(email);
    const goal = store.goals.find(g => g.id === id);
    if (!goal) return null;
    goal.name = name;
    goal.target = target;
    goal.targetDate = targetDate;
    goal.current = current;
    saveUserStore(email, store);
    return goal;
  },

  deleteGoal(email: string, id: string): boolean {
    const store = getUserStore(email);
    const index = store.goals.findIndex(g => g.id === id);
    if (index === -1) return false;
    store.goals.splice(index, 1);
    saveUserStore(email, store);
    return true;
  },

  // SUBSCRIPTIONS
  getSubscriptions(email: string): DbSubscription[] {
    return getUserStore(email).subscriptions;
  },

  addSubscription(email: string, sub: Omit<DbSubscription, 'id'>): DbSubscription {
    const store = getUserStore(email);
    const newSub = { ...sub, id: `sb-${Date.now()}` };
    store.subscriptions.push(newSub);
    saveUserStore(email, store);
    return newSub;
  },

  editSubscription(email: string, id: string, sub: Partial<DbSubscription>): DbSubscription | null {
    const store = getUserStore(email);
    const subscription = store.subscriptions.find(s => s.id === id);
    if (!subscription) return null;
    Object.assign(subscription, sub);
    saveUserStore(email, store);
    return subscription;
  },

  deleteSubscription(email: string, id: string): boolean {
    const store = getUserStore(email);
    const index = store.subscriptions.findIndex(s => s.id === id);
    if (index === -1) return false;
    store.subscriptions.splice(index, 1);
    saveUserStore(email, store);
    return true;
  },

  // DEBTS
  getDebts(email: string): DbDebt[] {
    return getUserStore(email).debts;
  },

  addDebt(email: string, debt: Omit<DbDebt, 'id'>): DbDebt {
    const store = getUserStore(email);
    const newDebt = { ...debt, id: `dt-${Date.now()}` };
    store.debts.push(newDebt);
    saveUserStore(email, store);
    return newDebt;
  },

  editDebt(email: string, id: string, debt: Partial<DbDebt>): DbDebt | null {
    const store = getUserStore(email);
    const existing = store.debts.find(d => d.id === id);
    if (!existing) return null;
    Object.assign(existing, debt);
    saveUserStore(email, store);
    return existing;
  },

  deleteDebt(email: string, id: string): boolean {
    const store = getUserStore(email);
    const index = store.debts.findIndex(d => d.id === id);
    if (index === -1) return false;
    store.debts.splice(index, 1);
    saveUserStore(email, store);
    return true;
  },

  updateDebtStatus(email: string, id: string, status: 'pending' | 'paid'): DbDebt | null {
    const store = getUserStore(email);
    const debt = store.debts.find(d => d.id === id);
    if (!debt) return null;
    
    debt.status = status;
    saveUserStore(email, store);
    return debt;
  },

  // NOTIFICATIONS
  getNotifications(email: string): DbNotification[] {
    return getUserStore(email).notifications;
  },

  markNotificationsRead(email: string): void {
    const store = getUserStore(email);
    store.notifications.forEach(n => n.read = true);
    saveUserStore(email, store);
  },

  // INSIGHTS
  getInsights(email: string): DbInsight[] {
    return getUserStore(email).insights;
  },

  addInsight(email: string, content: string, type: 'info' | 'alert' | 'success'): DbInsight {
    const store = getUserStore(email);
    const newInsight = { id: `ins-${Date.now()}`, content, type, createdAt: new Date().toISOString() };
    store.insights.unshift(newInsight);
    saveUserStore(email, store);
    return newInsight;
  },

  // CATEGORIES CRUD
  getCategories(email: string): DbCategory[] {
    return getUserStore(email).categories || DEFAULT_CATEGORIES;
  },

  addCategory(email: string, cat: Omit<DbCategory, 'id' | 'isBuiltIn'>): DbCategory {
    const store = getUserStore(email);
    const newCat: DbCategory = {
      ...cat,
      id: `cat-${Date.now()}`,
      isBuiltIn: false
    };
    if (!store.categories) store.categories = [...DEFAULT_CATEGORIES];
    store.categories.push(newCat);
    saveUserStore(email, store);
    return newCat;
  },

  editCategory(email: string, id: string, updated: Partial<DbCategory>): DbCategory | null {
    const store = getUserStore(email);
    if (!store.categories) store.categories = [...DEFAULT_CATEGORIES];
    const category = store.categories.find(c => c.id === id);
    if (!category) return null;

    const oldName = category.name;
    Object.assign(category, updated);

    // If name is edited, update references in transactions, budgets, subscriptions
    if (updated.name && updated.name !== oldName) {
      if (store.transactions) {
        store.transactions.forEach(t => {
          if (t.category.toLowerCase() === oldName.toLowerCase()) {
            t.category = updated.name!;
          }
        });
      }
      if (store.budgets) {
        store.budgets.forEach(b => {
          if (b.category.toLowerCase() === oldName.toLowerCase()) {
            b.category = updated.name!;
          }
        });
      }
      if (store.subscriptions) {
        store.subscriptions.forEach(s => {
          if (s.category.toLowerCase() === oldName.toLowerCase()) {
            s.category = updated.name!;
          }
        });
      }
    }

    saveUserStore(email, store);
    return category;
  },

  deleteCategory(email: string, id: string): boolean {
    const store = getUserStore(email);
    if (!store.categories) store.categories = [...DEFAULT_CATEGORIES];
    const index = store.categories.findIndex(c => c.id === id);
    if (index === -1) return false;

    const category = store.categories[index];

    const catName = category.name;
    store.categories.splice(index, 1);

    // Fallback transactions & subscriptions to "Lainnya"
    if (store.transactions) {
      store.transactions.forEach(t => {
        if (t.category.toLowerCase() === catName.toLowerCase()) {
          t.category = 'Lainnya';
        }
      });
    }

    // Delete associated budgets to prevent orphan records
    if (store.budgets) {
      store.budgets = store.budgets.filter(b => b.category.toLowerCase() !== catName.toLowerCase());
    }

    if (store.subscriptions) {
      store.subscriptions.forEach(s => {
        if (s.category.toLowerCase() === catName.toLowerCase()) {
          s.category = 'Lainnya';
        }
      });
    }

    saveUserStore(email, store);
    return true;
  }
};
