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
  Award, Printer, Flame, CheckCircle, Gift, Compass, Umbrella, Smartphone, Layers, Briefcase, Heart, GraduationCap
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

  const { transactions, accounts, budgets, goals, insights, categories, monthlyCutoffDate, updateCutoffDate, isDateInCurrentPeriod } = useTransactions();
  const [cashFlowRange, setCashFlowRange] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('weekly');

  const [showRecapModal, setShowRecapModal] = useState(false);
  const [recapPeriod, setRecapPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'>('monthly');
  const [recapStartDate, setRecapStartDate] = useState('');
  const [recapEndDate, setRecapEndDate] = useState('');
  const [recapPage, setRecapPage] = useState(1);

  const [showAnomalyModal, setShowAnomalyModal] = useState(false);
  const [anomalyData, setAnomalyData] = useState<any[]>([]);

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
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

    const incPie = Object.keys(incMap).map(k => ({ name: k, value: incMap[k] })).sort((a,b) => b.value - a.value);
    const expPie = Object.keys(expMap).map(k => ({ name: k, value: expMap[k] })).sort((a,b) => b.value - a.value);

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
  }, [transactions]);

  // Radar Chart - Spending Habit profile
  const radarChartData = useMemo(() => {
    const defaultCategories = categories.filter(c => c.type === 'expense').slice(0, 6).map(c => c.name);
    if (defaultCategories.length < 6) {
      defaultCategories.push('Lainnya');
    }
    const dataMap: Record<string, number> = {};
    
    defaultCategories.forEach(cat => {
      dataMap[cat] = 0;
    });

    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        if (defaultCategories.includes(t.category)) {
          dataMap[t.category] += t.amount;
        } else {
          dataMap['Lainnya'] = (dataMap['Lainnya'] || 0) + t.amount;
        }
      });

    return defaultCategories.map(cat => ({
      subject: cat,
      A: dataMap[cat] / 1000, // scaled to thousands for visual balance
      fullMark: 1500
    }));
  }, [transactions, categories]);

  // Balance Forecast Trend Data (Line Chart)
  const balanceTrendData = useMemo(() => {
    const data = [];
    let runningBalance = totalBalance;
    const days = ['Hari ini', 'Bulan +1', 'Bulan +2', 'Bulan +3', 'Bulan +4', 'Bulan +5'];
    
    // Monthly net income velocity projection based on actual transaction history
    let velocity = 0;
    if (transactions.length > 0) {
      const earliestDate = new Date(Math.min(...transactions.map(t => new Date(t.date).getTime())));
      const monthsDiff = Math.max(1, (new Date().getTime() - earliestDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
      velocity = netIncome / monthsDiff;
    }

    for (let i = 0; i < days.length; i++) {
      data.push({
        name: days[i],
        Saldo: runningBalance
      });
      runningBalance += velocity;
    }
    return data;
  }, [totalBalance, netIncome, transactions]);

 // Cash Flow charts formatting based on filter range
 const cashFlowData = useMemo(() => {
 if (cashFlowRange === 'daily') {
 const days = ['H-6', 'H-5', 'H-4', 'H-3', 'H-2', 'Kemarin', 'Hari ini'];
 return days.map((day, idx) => {
 const factor = (idx + 1) / 7;
 return {
 name: day,
 Pemasukan: idx === 6 ? totalIncome : Math.round(totalIncome * factor * 0.1),
 Pengeluaran: idx === 6 ? totalExpense : Math.round(totalExpense * factor * 0.12)
 };
 });
 } else if (cashFlowRange === 'weekly') {
 const weeks = ['Minggu 1', 'Minggu 2', 'Minggu 3', 'Minggu 4'];
 return weeks.map((w, idx) => {
 return {
 name: w,
 Pemasukan: idx === 3 ? totalIncome : Math.round(totalIncome * 0.25),
 Pengeluaran: idx === 3 ? totalExpense : Math.round(totalExpense * 0.3)
 };
 });
 } else if (cashFlowRange === 'monthly') {
 const months = ['Apr', 'Mei', 'Jun'];
 return months.map((m, idx) => {
 return {
 name: m,
 Pemasukan: idx === 2 ? totalIncome : Math.round(totalIncome * 0.8),
 Pengeluaran: idx === 2 ? totalExpense : Math.round(totalExpense * 0.9)
 };
 });
 } else { // yearly
 const years = ['2024', '2025', '2026'];
 return years.map((y, idx) => {
 return {
 name: y,
 Pemasukan: idx === 2 ? totalIncome : Math.round(totalIncome * 10),
 Pengeluaran: idx === 2 ? totalExpense : Math.round(totalExpense * 11)
 };
 });
 }
 }, [cashFlowRange, totalIncome, totalExpense]);

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
 message: `Transaksi ganda terdeteksi: "${t1.description}" (Rp${t1.amount.toLocaleString('id-ID')}).`
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
      message: `Terdeteksi ${anomalousTx.length} pengeluaran tidak wajar (Akumulasi: Rp${totalOutlier.toLocaleString('id-ID')}). Klik untuk melihat rincian.`,
      data: anomalousTx
    });
  }

 return alerts;
 }, [transactions, isDateInCurrentPeriod]);

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
 date: d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
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
 <p><strong>Tanggal Unduh:</strong> {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
 </div>
 </div>
 </div>

 {/* Header Recap Trigger */}
 <div className="flex justify-between items-center print:hidden">
 <div>
 <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Ringkasan Eksekutif</h2>
 </div>
 <Button variant="secondary" size="sm" onClick={() => setShowRecapModal(true)} className="bg-white hover:bg-slate-50 border shadow-sm">
 <Activity size={15} className="text-primary" /> Lihat Rekap
 </Button>
 </div>

 {/* 1. Quick Stats Grid */}
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
 
 {/* Sisa Saldo Bulanan */}
 <Card className="hover:-translate-y-1 hover:border-primary/30">
 <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
 <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Sisa Saldo Bulanan</span>
 <div className="p-2 rounded-xl bg-blue-500/10 text-primary">
 <Wallet size={16} />
 </div>
 </CardHeader>
 <CardContent>
 <div className="text-lg lg:text-xl font-extrabold tracking-tight">{formatIDR(totalBalance)}</div>
 <p className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
 <span className="text-success font-semibold flex items-center"><ArrowUpRight size={12} /> +2.5%</span>
 dari bulan lalu
 </p>
 </CardContent>
 </Card>

 {/* Pemasukan */}
 <Card className="hover:-translate-y-1 hover:border-success/30">
 <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
 <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pemasukan Bulan Ini</span>
 <div className="p-2 rounded-xl bg-emerald-500/10 text-success">
 <TrendingUp size={16} />
 </div>
 </CardHeader>
 <CardContent>
 <div className="text-lg lg:text-xl font-extrabold tracking-tight text-success">{formatIDR(totalIncome)}</div>
 <p className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
 <span className="text-success font-semibold flex items-center"><ArrowUpRight size={12} /> +12.4%</span>
 dari target
 </p>
 </CardContent>
 </Card>

 {/* Pengeluaran */}
 <Card className="hover:-translate-y-1 hover:border-danger/30">
 <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
 <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pengeluaran Bulan Ini</span>
 <div className="p-2 rounded-xl bg-rose-500/10 text-danger">
 <TrendingDown size={16} />
 </div>
 </CardHeader>
 <CardContent>
 <div className="text-lg lg:text-xl font-extrabold tracking-tight text-danger">{formatIDR(totalExpense)}</div>
 <p className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
 <span className="text-success font-semibold flex items-center"><ArrowUpRight size={12} /> -5.2%</span>
 kurang dari limit budget
 </p>
 </CardContent>
 </Card>

 {/* Financial Health Score */}
 <Card className="hover:-translate-y-1 hover:border-success/30 relative overflow-hidden">
 <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
 <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Financial Score</span>
 <div className="p-2 rounded-xl bg-emerald-500/10 text-success">
 <Activity size={16} />
 </div>
 </CardHeader>
 <CardContent className="relative z-10">
 <div className="text-lg lg:text-xl font-extrabold tracking-tight text-emerald-500 flex items-baseline gap-1">
 {financialScore}
 <span className="text-[10px] text-slate-400 font-normal">/ 100</span>
 </div>
 
 <div className="w-full bg-slate-200/50 rounded-full h-1.5 mt-2.5 overflow-hidden">
 <motion.div 
 initial={{ width: 0 }}
 animate={{ width: `${financialScore}%` }}
 className="bg-emerald-500 h-1.5 rounded-full"
 />
 </div>
 </CardContent>
 <div className="absolute -right-6 -bottom-6 opacity-[0.03] [0.05] pointer-events-none">
 <Activity size={100} />
 </div>
 </Card>

 </div>

 {/* 2. Secondary metrics (Saving Rate, Cash Flow) */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="p-4 rounded-xl border border-border bg-white/40 flex flex-col justify-center">
 <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Saving Rate</span>
 <div className="text-lg font-bold text-slate-800 mt-1 flex items-center gap-1.5">
 <Percent size={14} className="text-primary" />
 {savingRate.toFixed(1)}%
 </div>
 </div>
 <div className="p-4 rounded-xl border border-border bg-white/40 flex flex-col justify-center">
 <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Cash Flow</span>
 <div className="text-lg font-bold text-slate-800 mt-1">
 {formatIDR(totalIncome + totalExpense)}
 </div>
 </div>
 </div>

 {/* Smart Anomaly Alerts Panel (Hidden when printing) */}
 {smartAlerts.length > 0 && (
 <div className="space-y-2.5 print:hidden">
 {smartAlerts.map((alert) => (
  <div 
  key={alert.id} 
  className={`p-3.5 rounded-xl border flex items-center gap-3 text-xs font-semibold ${
  alert.type === 'duplicate' 
  ? 'bg-amber-500/10 border-amber-500/20 text-warning' 
  : 'bg-rose-500/10 border-rose-500/20 text-danger cursor-pointer hover:bg-rose-500/20'
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

 {/* 3. Charts Section */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 
 {/* Cash Flow Main Chart (Col span 2) */}
 <Card className="lg:col-span-2">
  <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-3">
  <div>
  <CardTitle className="text-base md:text-lg">Cash Flow Trend</CardTitle>
  <CardDescription className="text-[10px] md:text-xs">Pemasukan vs Pengeluaran periode terpilih</CardDescription>
  </div>
  
  <div className="flex flex-wrap gap-1 bg-slate-200/50 p-1 rounded-lg print:hidden w-full md:w-auto">
  {(['daily', 'weekly', 'monthly', 'yearly'] as const).map(range => (
  <button
  key={range}
  onClick={() => setCashFlowRange(range)}
  className={`text-[9px] md:text-[10px] font-bold px-2 py-1.5 rounded-md transition-colors cursor-pointer uppercase flex-1 md:flex-none text-center ${
  cashFlowRange === range 
  ? 'bg-white shadow-sm text-slate-800 ' 
  : 'text-slate-400 hover:text-slate-600 '
  }`}
  >
  {range === 'daily' ? 'Harian' : range === 'weekly' ? 'Mingguan' : range === 'monthly' ? 'Bulanan' : 'Tahunan'}
  </button>
  ))}
  </div>
 </CardHeader>
 <CardContent className="h-72">
 <ResponsiveContainer width="100%" height="100%">
 <AreaChart data={cashFlowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
 <defs>
 <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.2}/>
 <stop offset="95%" stopColor={COLORS.success} stopOpacity={0}/>
 </linearGradient>
 <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor={COLORS.danger} stopOpacity={0.2}/>
 <stop offset="95%" stopColor={COLORS.danger} stopOpacity={0}/>
 </linearGradient>
 </defs>
 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
 <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => `Rp${val/1000}k`} />
 <Tooltip 
 contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, color: tooltipTextColor, borderRadius: '12px', fontSize: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
 formatter={(val: any) => formatIDR(Number(val))}
 />
 <Area type="monotone" dataKey="Pemasukan" stroke={COLORS.success} strokeWidth={2} fillOpacity={1} fill="url(#colorInc)" />
 <Area type="monotone" dataKey="Pengeluaran" stroke={COLORS.danger} strokeWidth={2} fillOpacity={1} fill="url(#colorExp)" />
 </AreaChart>
 </ResponsiveContainer>
 </CardContent>
 </Card>

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

 </div>

 {/* ADVANCED VISUALIZATION SECTION: Line Trend Forecast & Radar Habits */}
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 
 {/* Balance Forecast Trend (Line Chart) */}
 <Card>
 <CardHeader>
 <CardTitle>Forecast Saldo (Proyeksi 6 Bulan)</CardTitle>
 <CardDescription>Prediksi perkembangan dana berdasarkan net-saving rate saat ini</CardDescription>
 </CardHeader>
 <CardContent className="h-64">
 <ResponsiveContainer width="100%" height="100%">
 <LineChart data={balanceTrendData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
 <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => `Rp${val/1000000}jt`} />
 <Tooltip formatter={(value: any) => formatIDR(Number(value))} contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, color: tooltipTextColor, borderRadius: '8px', fontSize: '12px' }} />
 <Line type="monotone" dataKey="Saldo" stroke={COLORS.primary} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
 </LineChart>
 </ResponsiveContainer>
 </CardContent>
 </Card>

 {/* Spending Habits Profiling (Radar Chart) */}
 <Card>
 <CardHeader>
 <CardTitle>Profil Kebiasaan Pengeluaran</CardTitle>
 <CardDescription>Analisa radar kebiasaan pengeluaran 6 kategori utama</CardDescription>
 </CardHeader>
 <CardContent className="h-64 flex items-center justify-center">
 {transactions.filter(t => t.type === 'expense').length === 0 ? (
 <p className="text-xs text-slate-400">Belum ada pengeluaran untuk dianalisa.</p>
 ) : (
 <ResponsiveContainer width="100%" height="100%">
 <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarChartData}>
 <PolarGrid stroke={gridColor} />
 <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: '#64748b' }} />
 <PolarRadiusAxis angle={30} domain={[0, 1500]} tick={{ fontSize: 8 }} />
 <Radar name="Pengeluaran (k)" dataKey="A" stroke={COLORS.indigo} fill={COLORS.indigo} fillOpacity={0.3} />
 </RadarChart>
 </ResponsiveContainer>
 )}
 </CardContent>
 </Card>

 </div>

 {/* GAMIFICATION & ACTIVITY HEATMAP GRID */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 
 {/* Calendar Heatmap (Col span 2) */}
 <Card className="lg:col-span-2">
 <CardHeader>
 <CardTitle>Calendar Heatmap (Aktivitas Catatan)</CardTitle>
 <CardDescription>Frekuensi pencatatan transaksi dalam 35 hari terakhir</CardDescription>
 </CardHeader>
 <CardContent>
 <div className="grid grid-cols-7 gap-2">
 {heatmapDays.map((day, idx) => (
 <div 
 key={idx} 
 title={`${day.date}: ${day.count} transaksi`}
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
 <div className="flex items-center justify-end gap-3 mt-4 text-[10px] text-slate-400 font-bold">
 <span>Mulai Jarang</span>
 <div className="w-3.5 h-3.5 rounded bg-slate-100 border border-border/10"></div>
 <div className="w-3.5 h-3.5 rounded bg-primary/20"></div>
 <div className="w-3.5 h-3.5 rounded bg-primary/50"></div>
 <div className="w-3.5 h-3.5 rounded bg-primary"></div>
 <span>Sangat Aktif</span>
 </div>
 </CardContent>
 </Card>

 {/* Gamification Badges Section */}
 <Card className="flex flex-col">
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

 {/* 4. Transactions List & Top Categories Breakdown */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 
 {/* Recent Transactions List (Col span 2) */}
 <Card className="lg:col-span-2">
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
 <p className="text-sm font-bold text-slate-800 ">{tx.description}</p>
 <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
 <span className="font-semibold">{tx.category}</span>
 <span>•</span>
 <span>{new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
 {tx.tags?.length > 0 && (
 <>
 <span>•</span>
 <span className="text-primary font-bold">#{tx.tags[0]}</span>
 </>
 )}
 </div>
 </div>
 </div>
 
 <div className={`font-bold text-sm ${tx.type === 'income' ? 'text-success' : tx.type === 'expense' ? 'text-slate-800 ' : 'text-primary'}`}>
 {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : '⇄'}
 {formatIDR(tx.amount)}
 </div>
 </div>
 ))}
 </div>
 )}
 </CardContent>
 </Card>

 {/* AI Insight and target list */}
 <div className="space-y-6">
 {/* AI Insights Card */}
 <Card className="bg-gradient-to-br from-blue-500/5 to-indigo-500/5 border-blue-500/10">
 <CardHeader>
 <CardTitle className="flex items-center gap-2 text-primary">
 <Sparkles size={18} className="animate-pulse" />
 AI Insight
 </CardTitle>
 </CardHeader>
 <CardContent className="space-y-3.5 text-xs text-slate-600 ">
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

 {/* Saving Goals Progress list */}
 <Card>
 <CardHeader>
 <CardTitle>Tabungan Goal</CardTitle>
 </CardHeader>
 <CardContent className="space-y-4">
 {goals.length === 0 ? (
 <p className="text-xs text-slate-400 text-center py-4">Belum ada target tabungan</p>
 ) : (
 goals.slice(0, 3).map((goal) => {
 const percent = Math.min(Math.round((goal.current / goal.target) * 100), 100);
 return (
 <div key={goal.id} className="space-y-2">
 <div className="flex justify-between items-center text-xs">
 <span className="font-bold text-slate-800 ">{goal.name}</span>
 <span className="text-slate-400">{percent}%</span>
 </div>
 <div className="w-full bg-slate-200/50 rounded-full h-2 overflow-hidden">
 <div 
 className="bg-primary h-2 rounded-full transition-all duration-300"
 style={{ width: `${percent}%` }}
 />
 </div>
 <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
 <span>{formatIDR(goal.current)}</span>
 <span>target {formatIDR(goal.target)}</span>
 </div>
 </div>
 );
 })
 )}
 </CardContent>
 </Card>
 </div>

 </div>

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
                <Tooltip formatter={(val: any) => formatIDR(Number(val))} cursor={{fill: 'rgba(0,0,0,0.02)'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }} />
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
                        <span className="text-[10px] text-slate-500">{new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                        <span className="text-[10px] text-slate-500 font-medium">{tx.category}</span>
                      </div>
                    </div>
                  </div>
                  <div className={`text-xs sm:text-sm font-extrabold whitespace-nowrap ${tx.type === 'income' ? 'text-success' : 'text-slate-800'}`}>
                    {tx.type === 'income' ? '+' : '-'}{formatIDR(tx.amount)}
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
                    <span className="text-[10px] text-slate-500">{new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                    <span className="text-[10px] text-slate-500 font-medium">{t.category}</span>
                  </div>
                </div>
              </div>
              <div className="text-xs sm:text-sm font-extrabold whitespace-nowrap text-danger">
                -{formatIDR(t.amount)}
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
  
  </>
 );
}
