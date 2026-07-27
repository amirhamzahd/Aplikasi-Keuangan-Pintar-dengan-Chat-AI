'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useTransactions } from '@/context/TransactionContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Select } from '../ui/Select';
import { Input } from '../ui/Input';
import {
  Wallet, TrendingUp, TrendingDown, Percent, Activity,
  Sparkles, Coffee, Car, ShoppingBag, Zap, DollarSign, Receipt,
  Plus, Calendar, ArrowUpRight, ChevronRight, AlertTriangle, ShieldCheck,
  Award, Printer, Flame, CheckCircle, Gift, Compass, Umbrella, Smartphone, Layers, Briefcase, Heart, GraduationCap, PiggyBank, Eye, EyeOff
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar, BarChart, Bar, Legend
} from 'recharts';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';

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

export function OverviewTab({
  onAddTransactionClick,
  setActiveTab
}: {
  onAddTransactionClick: () => void;
  setActiveTab: (tab: string) => void;
}) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const tooltipBg = isDark ? 'rgba(30, 41, 59, 0.95)' : '#ffffff';
  const tooltipBorder = isDark ? 'rgba(51, 65, 85, 0.4)' : '#e2e8f0';
  const tooltipTextColor = isDark ? '#f8fafc' : '#0f172a';
  const gridColor = isDark ? 'rgba(51, 65, 85, 0.15)' : 'rgba(226, 232, 240, 0.8)';

  const { transactions, accounts, budgets, goals, insights, categories, monthlyCutoffDate, updateCutoffDate, isDateInCurrentPeriod, subscriptions, debts, isBalanceHidden, toggleBalanceVisibility } = useTransactions();
  const [cashFlowRange, setCashFlowRange] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('weekly');

  const [showRecapModal, setShowRecapModal] = useState(false);
  const [recapPeriod, setRecapPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'>('monthly');
  const [recapStartDate, setRecapStartDate] = useState('');
  const [recapEndDate, setRecapEndDate] = useState('');
  const [recapPage, setRecapPage] = useState(1);

  const [showAnomalyModal, setShowAnomalyModal] = useState(false);
  const [anomalyData, setAnomalyData] = useState<any[]>([]);

  // Heatmap detail modal
  const [showHeatmapModal, setShowHeatmapModal] = useState(false);
  const [heatmapSelectedDate, setHeatmapSelectedDate] = useState<string | null>(null);
  const [heatmapTransactions, setHeatmapTransactions] = useState<any[]>([]);

  const formatIDR = (num: number, forceShow: boolean = false) => {
    if (isBalanceHidden && !forceShow) return 'Rp ••••••••';
    if (typeof num !== 'number' || isNaN(num)) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  const formatShort = (num: number, forceShow: boolean = false) => {
    if (isBalanceHidden && !forceShow) return 'Rp ••••';
    if (num >= 1000000) return `Rp${(num / 1000000).toFixed(1)}jt`;
    if (num >= 1000) return `Rp${(num / 1000).toFixed(0)}k`;
    return `Rp${num}`;
  };

  const safeDate = (dateStr: any, options?: any) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString('id-ID', options);
  };


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

  const handleCutoffChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateCutoffDate(parseInt(e.target.value, 10));
  };

  // 1. Calculations
  const { totalIncome, totalExpense, netCashFlow } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    let cashIn = 0;
    let cashOut = 0;
    transactions.forEach(t => {
      if (isDateInCurrentPeriod(t.date)) {
        const descLower = (t.description || '').toLowerCase();
        const catLower = (t.category || '').toLowerCase();
        const isDebt = catLower.includes('hutang') || catLower.includes('piutang') || descLower.includes('pinjam') || descLower.includes('hutang');

        if (t.type === 'income') {
          cashIn += t.amount;
          if (!isDebt) inc += t.amount;
        }
        if (t.type === 'expense') {
          cashOut += t.amount;
          if (!isDebt) exp += t.amount;
        }
      }
    });
    return { totalIncome: inc, totalExpense: exp, netCashFlow: cashIn - cashOut };
  }, [transactions, isDateInCurrentPeriod]);

  // Total Balance keseluruhan (Sisa Saldo Bulanan) harus memperhitungkan Piutang (uang keluar)
  const totalBalance = netCashFlow;

  const netIncome = netCashFlow;
  const savingRate = totalIncome > 0 ? (netIncome / totalIncome) * 100 : 0;

  // Financial Health Score
  const financialScore = useMemo(() => {
    if (transactions.length === 0) return 0;

    let score = 50;
    if (savingRate > 20) score += 20;
    else if (savingRate > 10) score += 10;
    else if (savingRate < 0) score -= 15;

    if (totalBalance > 5000000) score += 15;
    if (totalExpense < totalIncome * 0.5) score += 15;

    const budgetOverspent = budgets.some(b => b.spent > b.amount);
    if (budgets.length > 0 && !budgetOverspent) score += 10;
    if (goals.some(g => g.current > 0)) score += 10;

    return Math.min(Math.max(score, 0), 100);
  }, [transactions, savingRate, totalBalance, totalExpense, totalIncome, budgets, goals]);

  // Expenses by Category formatting
  const expenseByCategory = useMemo(() => {
    const data: Record<string, number> = {};
    transactions
      .filter(t => {
        const descLower = (t.description || '').toLowerCase();
        const catLower = (t.category || '').toLowerCase();
        const isDebt = catLower.includes('hutang') || catLower.includes('piutang') || descLower.includes('pinjam') || descLower.includes('hutang');
        return t.type === 'expense' && !isDebt && isDateInCurrentPeriod(t.date);
      })
      .forEach(t => {
        data[t.category] = (data[t.category] || 0) + t.amount;
      });

    return Object.keys(data)
      .map(key => ({ name: key, value: data[key] }))
      .sort((a, b) => b.value - a.value);
  }, [transactions, isDateInCurrentPeriod]);

  // --- SMART RECAP LOGIC ---
  const recapData = useMemo(() => {
    const now = new Date();
    const filtered = transactions.filter(t => {
      const txDate = new Date(t.date);
      if (recapPeriod === 'daily') {
        return txDate.toDateString() === now.toDateString();
      } else if (recapPeriod === 'weekly') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return txDate >= weekAgo;
      } else if (recapPeriod === 'monthly') {
        return isDateInCurrentPeriod(t.date);
      } else if (recapPeriod === 'yearly') {
        return txDate.getFullYear() === now.getFullYear();
      } else if (recapPeriod === 'custom') {
        if (!recapStartDate && !recapEndDate) return true;
        let inRange = true;
        if (recapStartDate) inRange = inRange && txDate >= new Date(recapStartDate);
        if (recapEndDate) {
          const end = new Date(recapEndDate);
          end.setHours(23, 59, 59, 999);
          inRange = inRange && txDate <= end;
        }
        return inRange;
      } else {
        return txDate.getFullYear() === now.getFullYear();
      }
    });

    let inc = 0;
    let exp = 0;
    const incMap: Record<string, number> = {};
    const expMap: Record<string, number> = {};

    filtered.forEach(t => {
      if (t.type === 'income') {
        inc += t.amount;
        incMap[t.category] = (incMap[t.category] || 0) + t.amount;
      } else if (t.type === 'expense') {
        exp += t.amount;
        expMap[t.category] = (expMap[t.category] || 0) + t.amount;
      }
    });

    const incPie = Object.keys(incMap).map(k => ({ name: k, value: incMap[k] })).sort((a, b) => b.value - a.value);
    const expPie = Object.keys(expMap).map(k => ({ name: k, value: expMap[k] })).sort((a, b) => b.value - a.value);

    const barData = [
      { name: 'Total', Pemasukan: inc, Pengeluaran: exp }
    ];

    return { inc, exp, incPie, expPie, barData, transactions: filtered };
  }, [transactions, recapPeriod, recapStartDate, recapEndDate, isDateInCurrentPeriod]);

  // Generate dynamic daily insight
  const dailyInsight = useMemo(() => {
    const today = new Date();
    const todaysTx = transactions.filter(t => new Date(t.date).toDateString() === today.toDateString());
    const todayExpenses = todaysTx.filter(t => t.type === 'expense');

    if (todayExpenses.length === 0) {
      return "Belum ada pengeluaran yang tercatat hari ini. Jika Anda memang tidak jajan hari ini, pertahankan! 🌟";
    }

    const totalExpense = todayExpenses.reduce((sum, t) => sum + t.amount, 0);

    const catMap: Record<string, number> = {};
    todayExpenses.forEach(t => {
      catMap[t.category] = (catMap[t.category] || 0) + t.amount;
    });
    const topCategory = Object.keys(catMap).sort((a, b) => catMap[b] - catMap[a])[0];

    let message = `Hari ini Anda telah mengeluarkan ${formatIDR(totalExpense)}. Pengeluaran terbesar dialokasikan untuk kategori "${topCategory}". `;
    if (totalExpense > 500000) {
      message += "Angka yang cukup besar untuk harian, pastikan sesuai dengan anggaran Anda ya!";
    } else {
      message += "Luar biasa, pengeluaran Anda hari ini masih terpantau sangat terkendali!";
    }
    return message;
  }, [transactions, isBalanceHidden]);

  // 2. Anomaly & Duplicate Detection
  const smartAlerts = useMemo(() => {
    const alerts = [];

    // Hanya proses transaksi di bulan ini untuk alert
    const currentMonthTx = transactions.filter(t => isDateInCurrentPeriod(t.date));

    // Duplicate Detection (Same description and amount within 10 minutes)
    for (let i = 0; i < currentMonthTx.length; i++) {
      for (let j = i + 1; j < currentMonthTx.length; j++) {
        const t1 = currentMonthTx[i];
        const t2 = currentMonthTx[j];
        if (
          t1.description === t2.description &&
          t1.amount === t2.amount &&
          Math.abs(new Date(t1.date).getTime() - new Date(t2.date).getTime()) < 600000
        ) {
            alerts.push({
              id: `dup-${t1.id}-${t2.id}`,
              type: 'duplicate' as const,
              message: `Transaksi ganda terdeteksi: "${t1.description}" (${formatIDR(t1.amount)}).`
            });
        }
      }
    }

    // Anomaly Detection (Expense is > 3x average of category)
    const categoryTotals: Record<string, number[]> = {};
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        if (!categoryTotals[t.category]) categoryTotals[t.category] = [];
        categoryTotals[t.category].push(t.amount);
      });

    const anomalousTx: any[] = [];
    currentMonthTx
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const amounts = categoryTotals[t.category];
        if (amounts.length > 2) {
          const sum = amounts.reduce((s, a) => s + a, 0) - t.amount;
          const avg = sum / (amounts.length - 1);

          // Threshold: > 3x average AND absolute amount > Rp50.000 to avoid micro-transaction noise
          if (t.amount > avg * 3 && t.amount >= 50000) {
            anomalousTx.push(t);
          }
        }
      });

    if (anomalousTx.length > 0) {
      const totalOutlier = anomalousTx.reduce((s, t) => s + t.amount, 0);
      alerts.push({
        id: `anom-group`,
        type: 'anomaly' as const,
        message: `Terdeteksi ${anomalousTx.length} pengeluaran tidak wajar (Akumulasi: ${formatIDR(totalOutlier)}). Klik untuk melihat rincian.`,
        data: anomalousTx
      });
    }

    return alerts;
  }, [transactions, isDateInCurrentPeriod, isBalanceHidden]);

  // 3. Gamification Badges Calculator
  const badges = useMemo(() => {
    const list = [];

    // Badge 1: Saving Hero (Saving rate > 30%)
    if (savingRate >= 30) {
      list.push({
        title: 'Saving Hero',
        desc: 'Saving rate bulanan Anda melebihi 30%.',
        color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
      });
    }

    // Badge 2: Hemat Minggu Ini (Weekly spending < 50% income)
    if (totalExpense < totalIncome * 0.5 && transactions.length > 0) {
      list.push({
        title: 'Hemat Minggu Ini',
        desc: 'Mampu menahan pengeluaran di bawah 50% pemasukan.',
        color: 'bg-blue-500/10 text-primary border-primary/20'
      });
    }

    // Badge 3: No Coffee Challenge (No "kopi" in descriptions)
    const hasCoffee = transactions.some(t => t.description.toLowerCase().includes('kopi'));
    if (!hasCoffee && transactions.length > 0) {
      list.push({
        title: 'No Coffee Challenge',
        desc: 'Berhasil menghemat tanpa jajan kopi bulan ini!',
        color: 'bg-amber-500/10 text-warning border-warning/20'
      });
    }

    // Badge 4: 30 Hari Tanpa Jajan (No "belanja" categories)
    const hasShopping = transactions.some(t => t.category === 'Belanja');
    if (!hasShopping && transactions.length > 0) {
      list.push({
        title: 'Bebas Jajan',
        desc: '0 pengeluaran di kategori jajan/belanja pakaian.',
        color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'
      });
    }

    return list;
  }, [savingRate, totalExpense, totalIncome, transactions]);

  // 4. Calendar Heatmap Simulator (7x5 Grid representing last 35 days)
  const heatmapDays = useMemo(() => {
    const cells = [];
    const now = new Date();

    // Group transactions count by date
    const dateCounts: Record<string, number> = {};
    transactions.forEach(t => {
      const dStr = new Date(t.date).toDateString();
      dateCounts[dStr] = (dateCounts[dStr] || 0) + 1;
    });

    for (let i = 34; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dStr = d.toDateString();
      const count = dateCounts[dStr] || 0;

      let color = 'bg-slate-100 '; // 0
      if (count > 0 && count <= 2) color = 'bg-primary/20 text-primary'; // 1-2 tx
      else if (count > 2 && count <= 4) color = 'bg-primary/50 text-white'; // 3-4 tx
      else if (count > 4) color = 'bg-primary text-white'; // 5+ tx

      cells.push({
        date: safeDate(d, { day: 'numeric', month: 'short' }),
        fullDate: dStr,
        count,
        color
      });
    }
    return cells;
  }, [transactions]);

  return (
    <>
      <div className="space-y-6 print:p-8 print:bg-white print:text-black">

        {/* Print PDF Cover Layout (Visible only when printing) */}
        <div className="hidden print:flex flex-col mb-8 border-b pb-6">
          <h1 className="text-3xl font-extrabold text-blue-600">DIAMOND Finance AI</h1>
          <p className="text-sm text-slate-500">Laporan Keuangan Personal Premium</p>
          <div className="grid grid-cols-2 gap-4 mt-6 text-xs text-slate-600">
            <div>
              <p><strong>Sisa Saldo Bulanan:</strong> {formatIDR(totalBalance)}</p>
              <p><strong>Pemasukan:</strong> {formatIDR(totalIncome)}</p>
              <p><strong>Pengeluaran:</strong> {formatIDR(totalExpense)}</p>
            </div>
            <div>
              <p><strong>Saving Rate:</strong> {savingRate.toFixed(1)}%</p>
              <p><strong>Financial Health Score:</strong> {financialScore}/100</p>
              <p><strong>Tanggal Unduh:</strong> {safeDate(new Date(), { dateStyle: 'long' })}</p>
            </div>
          </div>
        </div>

        {/* Header Recap Trigger */}
        <div className="flex justify-between items-center print:hidden">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Ringkasan Eksekutif</h2>
          </div>
        </div>

        {/* 1. Hero Stats Card */}
        <Card glass={false} className="w-full relative overflow-hidden group bg-gradient-to-br from-[#0f172a] via-[#1e3a8a] to-[#0f172a] text-white border-0 shadow-2xl">
          <div className="absolute top-[-50%] right-[-10%] w-64 h-64 bg-blue-500/20 rounded-full blur-3xl group-hover:bg-blue-400/30 transition-colors"></div>
          <CardContent className="p-6 pt-6 relative z-10 flex flex-col justify-center h-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">

              {/* Sisa Saldo (Besar) */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-xl bg-blue-500/20 text-blue-300">
                    <Wallet size={18} />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-200">Sisa Saldo Bulanan</span>
                  <button 
                    onClick={toggleBalanceVisibility} 
                    className="text-blue-200 hover:text-white transition-colors p-1"
                    title={isBalanceHidden ? "Tampilkan Saldo" : "Sembunyikan Saldo"}
                  >
                    {isBalanceHidden ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <div className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-2 drop-shadow-lg">
                  {formatIDR(totalBalance)}
                </div>
                <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <ArrowUpRight size={12} className="text-emerald-400" />
                  <span className="text-[10px] font-semibold text-emerald-400">+2.5% dari bulan lalu</span>
                </div>
              </div>

              {/* Pemasukan & Pengeluaran */}
              <div className="flex gap-4 md:gap-8 w-full md:w-auto p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm mt-4 md:mt-0">
                <div className="flex-1 md:flex-none">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                      <TrendingUp size={14} />
                    </div>
                    <span className="text-[10px] uppercase font-bold text-slate-300">Pemasukan</span>
                  </div>
                  <div className="text-lg md:text-xl font-bold text-white">{formatIDR(totalIncome)}</div>
                </div>

                <div className="w-px bg-white/10"></div>
                <div className="flex-1 md:flex-none">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400">
                      <TrendingDown size={14} />
                    </div>
                    <span className="text-[10px] uppercase font-bold text-slate-300">Pengeluaran</span>
                  </div>
                  <div className="text-lg md:text-xl font-bold text-white">{formatIDR(totalExpense)}</div>
                </div>
              </div>

            </div>
          </CardContent>
        </Card>

        {/* 2. Mini Badges / Chips */}
        {(() => {
          const totalBudgetAmount = budgets.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
          const totalBudgetSpent = budgets.reduce((acc, curr) => {
            const spent = transactions
              .filter(t => t.type === 'expense' && t.category === curr.category && isDateInCurrentPeriod(t.date))
              .reduce((sum, t) => sum + t.amount, 0);
            return acc + spent;
          }, 0);
          const budgetLeftPercent = totalBudgetAmount > 0 ? Math.max(0, 100 - (totalBudgetSpent / totalBudgetAmount * 100)) : 100;

          // 1. Streak
          let streak = 0;
          const today = new Date();
          for (let i = 0; i < 30; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const dayTx = transactions.filter(t => t.type === 'expense' && new Date(t.date).toDateString() === d.toDateString());
            if (dayTx.length === 0) streak++;
            else break;
          }

          // 2. Top Kategori
          const expensesByCat: Record<string, number> = {};
          transactions.filter(t => t.type === 'expense' && isDateInCurrentPeriod(t.date)).forEach(t => {
            expensesByCat[t.category] = (expensesByCat[t.category] || 0) + t.amount;
          });
          let topCat = '-';
          let topCatVal = 0;
          for (const c in expensesByCat) {
            if (expensesByCat[c] > topCatVal) {
              topCat = c;
              topCatVal = expensesByCat[c];
            }
          }
          const topCatName = topCat.length > 8 ? topCat.substring(0, 8) + '...' : topCat;

          // 3. Net Worth
          const netWorth = accounts.reduce((acc, curr) => acc + (Number(curr.balance) || 0), 0);

          // 4. Potensi Hemat (Income - Expense)
          const potensiHemat = Math.max(0, totalIncome - totalExpense);

          // 5. Prediksi Saldo
          const currentDays = Math.max(1, new Date().getDate());
          const dailyAvg = totalExpense / currentDays;
          const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
          const prediksiSaldo = totalBalance - (dailyAvg * (daysInMonth - currentDays));

          // 8. Upcoming bills
          const activeBills = (subscriptions || []).filter(s => s.nextBilling && isDateInCurrentPeriod(new Date(s.nextBilling))).length +
            (debts || []).filter(d => d.type === 'debt' && d.status !== 'paid' && d.dueDate && isDateInCurrentPeriod(new Date(d.dueDate))).length;

          return (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-5 mt-4 mb-6">
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-y-5 gap-x-2 divide-x divide-slate-100">
                {/* Item 1: Fin Score */}
                <div className="flex flex-col items-center justify-center cursor-default group px-1">
                  <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 mb-1.5 group-hover:scale-110 transition-transform">
                    <TrendingUp size={16} />
                  </div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 truncate w-full text-center">Fin Score</div>
                  <div className="text-[11px] font-black text-slate-800 tracking-tight">{financialScore}</div>
                </div>

                {/* Item 2: Sisa Budget */}
                <div className="flex flex-col items-center justify-center cursor-default group px-1">
                  <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600 mb-1.5 group-hover:scale-110 transition-transform">
                    <Percent size={16} />
                  </div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 truncate w-full text-center">Sisa Budget</div>
                  <div className="text-[11px] font-black text-slate-800 tracking-tight">{budgetLeftPercent.toFixed(0)}%</div>
                </div>

                {/* Item 3: No Spend */}
                <div className="flex flex-col items-center justify-center cursor-default group px-1">
                  <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-600 mb-1.5 group-hover:scale-110 transition-transform">
                    <Flame size={16} />
                  </div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 truncate w-full text-center">No Spend</div>
                  <div className="text-[11px] font-black text-slate-800 tracking-tight">{streak} Hari</div>
                </div>

                {/* Item 4: Top Pengeluaran */}
                <div className="flex flex-col items-center justify-center cursor-default group px-1">
                  <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 mb-1.5 group-hover:scale-110 transition-transform">
                    <Award size={16} />
                  </div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 truncate w-full text-center">Top Pengeluaran</div>
                  <div className="text-[11px] font-black text-slate-800 tracking-tight">{topCatName}</div>
                </div>

                {/* Item 5: Prediksi Saldo */}
                <div className="flex flex-col items-center justify-center cursor-default group px-1">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 mb-1.5 group-hover:scale-110 transition-transform">
                    <Sparkles size={16} />
                  </div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 truncate w-full text-center">Prediksi Saldo</div>
                  <div className="text-[11px] font-black text-slate-800 tracking-tight">{formatShort(prediksiSaldo)}</div>
                </div>

                {/* Item 6: Potensi Hemat */}
                <div className="flex flex-col items-center justify-center cursor-default group px-1">
                  <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-600 mb-1.5 group-hover:scale-110 transition-transform">
                    <PiggyBank size={16} />
                  </div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 truncate w-full text-center">Potensi Hemat</div>
                  <div className="text-[11px] font-black text-slate-800 tracking-tight">{formatShort(potensiHemat)}</div>
                </div>

                {/* Item 7: Net Worth */}
                <div className="flex flex-col items-center justify-center cursor-default group px-1">
                  <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 mb-1.5 group-hover:scale-110 transition-transform">
                    <Wallet size={16} />
                  </div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 truncate w-full text-center">Net Worth</div>
                  <div className="text-[11px] font-black text-slate-800 tracking-tight">{formatShort(netWorth)}</div>
                </div>

                {/* Item 8: Upcoming Bills */}
                <div className="flex flex-col items-center justify-center cursor-default group px-1">
                  <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 mb-1.5 group-hover:scale-110 transition-transform">
                    <Calendar size={16} />
                  </div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 truncate w-full text-center">Upcoming Bills</div>
                  <div className="text-[11px] font-black text-slate-800 tracking-tight">{activeBills} Tagihan</div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* AI Insights Card (Full Width before Transaksi) */}
        <Card className="w-full mb-6 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 border-blue-500/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Sparkles size={18} className="animate-pulse" />
              AI Insight
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3.5 text-xs text-slate-600">
            {!dailyInsight ? (
              <p className="text-slate-400">Belum ada analisa finansial.</p>
            ) : (
              <div className="flex gap-2.5 p-3 rounded-lg bg-white/50 border border-primary/10">
                <span className="text-primary shrink-0 mt-0.5">✦</span>
                <p className="leading-relaxed">{dailyInsight}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Smart Anomaly Alerts Panel (Hidden when printing) */}
        {smartAlerts.length > 0 && (
          <div className="space-y-2.5 print:hidden mb-6">
            {smartAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3.5 rounded-xl border flex items-center gap-3 text-xs font-semibold ${alert.type === 'duplicate'
                    ? 'bg-amber-50 border-amber-300 text-amber-800'
                    : 'bg-rose-50 border-rose-300 text-rose-800 cursor-pointer hover:bg-rose-100'
                  }`}
                onClick={() => {
                  if (alert.type === 'anomaly' && alert.data) {
                    setAnomalyData(alert.data);
                    setShowAnomalyModal(true);
                  }
                }}
              >
                <AlertTriangle size={16} className="shrink-0 animate-bounce" />
                <span>{alert.message}</span>
              </div>
            ))}
          </div>
        )}

        {/* 3. Transaksi Terakhir (Full Width) */}
        <Card className="w-full mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Transaksi Terakhir</CardTitle>
              <CardDescription>Daftar transaksi manual dan AI terbaru</CardDescription>
            </div>
            <button
              onClick={() => setActiveTab('transactions')}
              className="text-xs text-primary font-bold hover:underline flex items-center gap-1 cursor-pointer print:hidden"
            >
              Lihat Semua
              <ChevronRight size={14} />
            </button>
          </CardHeader>
          <CardContent>
            {transactions.slice(0, 5).length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <Receipt size={36} className="mx-auto mb-2 opacity-25" />
                <p className="text-xs font-semibold">Belum ada transaksi</p>
                <button
                  onClick={onAddTransactionClick}
                  className="text-xs text-primary hover:underline mt-2 font-bold cursor-pointer"
                >
                  Catat transaksi pertama
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.slice(0, 5).map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-border/20 bg-slate-50/50 hover:bg-slate-100 transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="p-2.5 rounded-xl flex items-center justify-center animate-scaleIn"
                        style={{
                          color: CATEGORY_COLORS[tx.category] || COLORS.primary,
                          backgroundColor: `${CATEGORY_COLORS[tx.category]}12` || `${COLORS.primary}12`
                        }}
                      >
                        {CATEGORY_ICONS[tx.category] || <Receipt size={16} />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 line-clamp-1">{tx.description}</p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                          <span className="font-semibold">{tx.category}</span>
                          <span>•</span>
                          <span>{safeDate(tx.date, { day: 'numeric', month: 'short' })}</span>
                          {tx.tags?.length > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-primary font-bold">#{tx.tags[0]}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className={`font-bold text-xs whitespace-nowrap ${tx.type === 'income' ? 'text-success' : tx.type === 'expense' ? 'text-danger' : 'text-primary'}`}>
                      {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : '⇄'}
                      {formatIDR(tx.amount, true)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 4. Grid for the Rest: Pie Chart, AI Insight, Gamification Badges */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

          {/* Expenses Pie Chart */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Distribusi Pengeluaran</CardTitle>
              <CardDescription>Pengeluaran berdasarkan kategori</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-center">
              {expenseByCategory.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-8 text-slate-400">
                  <Percent size={32} className="opacity-20 mb-2" />
                  <span className="text-xs">Belum ada data pengeluaran</span>
                </div>
              ) : (
                <>
                  <div className="h-44 w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={expenseByCategory}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={70}
                          paddingAngle={4}
                          dataKey="value"
                          stroke="none"
                        >
                          {expenseByCategory.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || COLORS.primary} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any) => formatIDR(Number(value))} contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, color: tooltipTextColor, fontSize: '12px', borderRadius: '8px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Total Exp</span>
                      <span className="text-sm font-extrabold">{formatIDR(totalExpense).replace(',00', '')}</span>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    {expenseByCategory.slice(0, 3).map((cat, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[cat.name] || COLORS.primary }}></span>
                          <span className="text-slate-600 font-semibold">{cat.name}</span>
                        </div>
                        <span className="font-bold">{formatIDR(cat.value)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Gamification Badges Section */}
          <Card className="flex flex-col lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award size={18} className="text-warning" />
                Badge Finansial
              </CardTitle>
              <CardDescription>Pencapaian tantangan hemat Anda</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-3">
              {badges.length === 0 ? (
                <div className="text-center py-8 text-slate-400 space-y-1.5">
                  <Flame size={24} className="mx-auto opacity-20" />
                  <p className="text-xs">Belum ada badge terbuka. Mulai menabung dan kurangi jajan kopi!</p>
                </div>
              ) : (
                badges.map((badge, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl border flex items-start gap-3 transition-transform duration-200 hover:scale-[1.01] ${badge.color}`}
                  >
                    <Award size={18} className="shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold">{badge.title}</h4>
                      <p className="text-[10px] leading-relaxed mt-0.5 opacity-80">{badge.desc}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Calendar Heatmap (Full Width) */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Calendar Heatmap (Aktivitas Catatan)</CardTitle>
            <CardDescription>Frekuensi pencatatan transaksi dalam 35 hari terakhir</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2 lg:gap-4 max-w-2xl">
              {heatmapDays.map((day, idx) => (
                <div
                  key={idx}
                  title={`${day.date}: ${day.count} transaksi`}
                  onClick={() => {
                    setHeatmapSelectedDate(day.date);
                    setHeatmapTransactions(transactions.filter(t => new Date(t.date).toDateString() === day.fullDate));
                    setShowHeatmapModal(true);
                  }}
                  className={`aspect-square rounded-lg ${day.color} flex flex-col items-center justify-center p-1 border border-border/10 cursor-pointer hover:scale-105 transition-all duration-200`}
                >
                  <span className="text-[9px] font-bold opacity-60">{day.date.split(' ')[0]}</span>
                  {day.count > 0 && (
                    <span className="text-[10px] font-extrabold">{day.count}</span>
                  )}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-start gap-3 mt-4 text-[10px] text-slate-400 font-bold max-w-2xl">
              <span>Mulai Jarang</span>
              <div className="w-3.5 h-3.5 rounded bg-slate-100 border border-border/10"></div>
              <div className="w-3.5 h-3.5 rounded bg-primary/20"></div>
              <div className="w-3.5 h-3.5 rounded bg-primary/50"></div>
              <div className="w-3.5 h-3.5 rounded bg-primary"></div>
              <span>Sangat Aktif</span>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* RECAP MODAL */}
      <Modal isOpen={showRecapModal} onClose={() => setShowRecapModal(false)} title="Rekap Keuangan Pintar" size="xl">
        <div className="flex flex-col space-y-6 max-h-[80vh] overflow-y-auto px-1 scrollbar-hide">

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <div className="w-full sm:w-48 shrink-0">
              <Select
                value={recapPeriod}
                onChange={(e) => setRecapPeriod(e.target.value as any)}
                options={[
                  { value: 'daily', label: 'Hari Ini' },
                  { value: 'weekly', label: 'Minggu Ini' },
                  { value: 'monthly', label: 'Bulan Ini' },
                  { value: 'yearly', label: 'Tahun Ini' },
                  { value: 'custom', label: 'Pilih Tanggal' }
                ]}
              />
            </div>
            {recapPeriod === 'custom' && (
              <div className="flex items-center gap-2 w-full">
                <Input type="date" value={recapStartDate} onChange={e => setRecapStartDate(e.target.value)} label="" placeholder="Mulai" />
                <span className="text-slate-400 font-bold">-</span>
                <Input type="date" value={recapEndDate} onChange={e => setRecapEndDate(e.target.value)} label="" placeholder="Akhir" />
              </div>
            )}
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl border border-slate-200 bg-emerald-500/5 flex flex-col justify-center items-center text-center shadow-sm">
              <span className="text-[10px] sm:text-xs uppercase font-bold text-success mb-1 tracking-wider">Total Pemasukan</span>
              <span className="text-lg sm:text-xl font-black text-success">{formatIDR(recapData.inc)}</span>
            </div>
            <div className="p-4 rounded-2xl border border-slate-200 bg-rose-500/5 flex flex-col justify-center items-center text-center shadow-sm">
              <span className="text-[10px] sm:text-xs uppercase font-bold text-danger mb-1 tracking-wider">Total Pengeluaran</span>
              <span className="text-lg sm:text-xl font-black text-danger">{formatIDR(recapData.exp)}</span>
            </div>
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col justify-center items-center text-center shadow-sm">
              <span className="text-[10px] sm:text-xs uppercase font-bold text-slate-500 mb-1 tracking-wider">Sisa Bersih</span>
              <span className={`text-lg sm:text-xl font-black ${recapData.inc - recapData.exp >= 0 ? 'text-primary' : 'text-danger'}`}>
                {formatIDR(recapData.inc - recapData.exp)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Bar Chart Komparasi */}
            <div className="border border-slate-200 rounded-2xl p-5 bg-white shadow-sm">
              <h3 className="text-sm font-bold text-slate-700 mb-6 text-center">Perbandingan Total</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={recapData.barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis hide />
                    <Tooltip formatter={(val: any) => formatIDR(Number(val))} cursor={{ fill: 'rgba(0,0,0,0.02)' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Bar dataKey="Pemasukan" fill={COLORS.success} radius={[6, 6, 0, 0]} barSize={50} />
                    <Bar dataKey="Pengeluaran" fill={COLORS.danger} radius={[6, 6, 0, 0]} barSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Expenses Pie Chart */}
            <div className="border border-slate-200 rounded-2xl p-5 bg-white shadow-sm w-full">
              <h3 className="text-sm font-bold text-slate-700 mb-4 text-center">Distribusi Pengeluaran</h3>
              <div className="h-[300px] w-full">
                {recapData.expPie.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-slate-400 font-medium">Belum ada pengeluaran</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={recapData.expPie} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value" stroke="none">
                        {recapData.expPie.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || COLORS.danger} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val: any) => formatIDR(Number(val))} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Income Pie Chart (Full Width) */}
            <div className="border border-slate-200 rounded-2xl p-5 bg-white shadow-sm md:col-span-2 w-full">
              <h3 className="text-sm font-bold text-slate-700 mb-4 text-center">Distribusi Pemasukan</h3>
              <div className="h-[300px] w-full">
                {recapData.incPie.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-slate-400 font-medium">Belum ada pemasukan</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={recapData.incPie} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value" stroke="none">
                        {recapData.incPie.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || COLORS.success} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val: any) => formatIDR(Number(val))} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

          </div>

          {/* Filtered Transactions List */}
          <div className="mt-8">
            <h3 className="text-sm font-bold text-slate-700 mb-4 border-b border-slate-100 pb-2">Rincian Transaksi ({recapData.transactions.length})</h3>
            {recapData.transactions.length === 0 ? (
              <div className="text-center py-8 text-sm text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                Tidak ada transaksi pada rentang waktu ini.
              </div>
            ) : (
              <div className="space-y-3">
                {recapData.transactions.slice((recapPage - 1) * 10, recapPage * 10).map(tx => {
                  const IconComponent = ICON_MAP[categories.find(c => c.name === tx.category)?.icon || 'Layers'] || Layers;
                  const catColor = CATEGORY_COLORS[tx.category] || COLORS.slate;

                  return (
                    <div key={tx.id} className="flex items-center justify-between p-3.5 bg-white border border-slate-100 rounded-2xl hover:border-slate-200 transition-all shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: catColor }}>
                          <IconComponent size={18} />
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-slate-800 line-clamp-1">{tx.description}</h4>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-slate-500">{safeDate(tx.date, { day: 'numeric', month: 'short' })}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                            <span className="text-[10px] text-slate-500 font-medium">{tx.category}</span>
                          </div>
                        </div>
                      </div>
                      <div className={`text-xs sm:text-sm font-extrabold whitespace-nowrap ${tx.type === 'income' ? 'text-success' : 'text-slate-800'}`}>
                        {tx.type === 'income' ? '+' : '-'}{formatIDR(tx.amount, true)}
                      </div>
                    </div>
                  );
                })}

                {recapData.transactions.length > 10 && (
                  <div className="flex justify-between items-center mt-4 border-t pt-4">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setRecapPage(p => Math.max(1, p - 1))}
                      disabled={recapPage === 1}
                    >
                      Sebelumnya
                    </Button>
                    <span className="text-xs text-slate-500">Hal {recapPage} dari {Math.ceil(recapData.transactions.length / 10)}</span>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setRecapPage(p => Math.min(Math.ceil(recapData.transactions.length / 10), p + 1))}
                      disabled={recapPage === Math.ceil(recapData.transactions.length / 10)}
                    >
                      Berikutnya
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </Modal>

      {/* Anomaly Detection Modal */}
      <Modal isOpen={showAnomalyModal} onClose={() => setShowAnomalyModal(false)} title="Rincian Deteksi Anomali">
        <div className="space-y-4">
          <p className="text-sm text-slate-600 mb-4">
            Kami mendeteksi beberapa pengeluaran bulan ini yang lebih besar dari rata-rata historis Anda:
          </p>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {anomalyData.map((t, idx) => {
              const IconComponent = ICON_MAP[categories.find(c => c.name === t.category)?.icon || 'Layers'] || Layers;
              const catColor = CATEGORY_COLORS[t.category] || COLORS.danger;
              return (
                <div key={idx} className="flex justify-between items-center p-3 border border-rose-100 rounded-xl bg-rose-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: catColor }}>
                      <IconComponent size={18} />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-slate-800 line-clamp-1">{t.description}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-slate-500">{safeDate(t.date, { day: 'numeric', month: 'short' })}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                        <span className="text-[10px] text-slate-500 font-medium">{t.category}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs sm:text-sm font-extrabold whitespace-nowrap text-danger">
                    -{formatIDR(t.amount, true)}
                  </div>
                </div>
              );
            })}
          </div>
          <Button onClick={() => setShowAnomalyModal(false)} variant="secondary" className="w-full mt-4">
            Tutup
          </Button>
        </div>
      </Modal>

      {/* HEATMAP MODAL */}
      <Modal isOpen={showHeatmapModal} onClose={() => setShowHeatmapModal(false)} title={`Transaksi pada ${heatmapSelectedDate}`}>
        <div className="flex flex-col space-y-4 max-h-[60vh] overflow-y-auto pr-2 scrollbar-hide">
          {heatmapTransactions.length === 0 ? (
            <div className="text-center py-8 text-sm text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              Tidak ada aktivitas pada tanggal ini.
            </div>
          ) : (
            heatmapTransactions.map((tx, idx) => (
              <div key={tx.id || idx} className="flex justify-between items-center p-3 sm:p-4 rounded-xl border border-slate-100 hover:shadow-sm bg-white transition-all">
                <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
                  <div className={`p-2 sm:p-3 rounded-full shrink-0 ${tx.type === 'income' ? 'bg-success/10 text-success' : tx.type === 'expense' ? 'bg-danger/10 text-danger' : 'bg-primary/10 text-primary'}`}>
                    {tx.type === 'income' ? <TrendingUp size={16} /> : tx.type === 'expense' ? <TrendingDown size={16} /> : <ArrowUpRight size={16} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-xs sm:text-sm text-slate-800 truncate">{tx.description}</p>
                    <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-slate-500">
                      <span className="font-semibold text-slate-600 truncate">{tx.category}</span>
                    </div>
                  </div>
                </div>
                <div className={`text-xs sm:text-sm font-extrabold whitespace-nowrap pl-3 ${tx.type === 'income' ? 'text-success' : tx.type === 'expense' ? 'text-danger' : 'text-slate-800'}`}>
                  {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : '⇄'}{formatIDR(tx.amount, true)}
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>
    </>
  );
}
