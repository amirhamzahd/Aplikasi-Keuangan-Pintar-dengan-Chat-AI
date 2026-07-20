'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useTransactions } from '@/context/TransactionContext';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Download, FileJson, FileText, Printer, ArrowUpRight, ArrowDownRight, Wallet, Calendar, CheckCircle2 } from 'lucide-react';

export function ReportsTab() {
  const { transactions, accounts, debts, subscriptions, currentPeriodStart, currentPeriodEnd } = useTransactions();

  // DEFAULT REPORT STATE
  const totalIncome = useMemo(() => transactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0), [transactions]);
  const totalExpense = useMemo(() => transactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0), [transactions]);
  const totalBalance = useMemo(() => accounts.reduce((acc, curr) => acc + curr.balance, 0), [accounts]);

  // CUSTOM REPORT STATE
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [tempStartDate, setTempStartDate] = useState<string>('');
  const [tempEndDate, setTempEndDate] = useState<string>('');
  const [printMode, setPrintMode] = useState<'default'|'custom'>('default');
  const [showReadyModal, setShowReadyModal] = useState(false);
  const [showReadyMessage, setShowReadyMessage] = useState(false);

  useEffect(() => {
    if (currentPeriodStart && !startDate) {
      const s = new Date(currentPeriodStart).toISOString().split('T')[0];
      setStartDate(s);
      setTempStartDate(s);
    }
    if (currentPeriodEnd && !endDate) {
      const e = new Date(currentPeriodEnd).toISOString().split('T')[0];
      setEndDate(e);
      setTempEndDate(e);
    }
  }, [currentPeriodStart, currentPeriodEnd]);

  const handleApplyFilter = () => {
    setStartDate(tempStartDate);
    setEndDate(tempEndDate);
    setShowReadyModal(true);
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const tDate = new Date(t.date).getTime();
      const sDate = startDate ? new Date(startDate).setHours(0,0,0,0) : 0;
      const eDate = endDate ? new Date(endDate).setHours(23,59,59,999) : Infinity;
      return tDate >= sDate && tDate <= eDate;
    });
  }, [transactions, startDate, endDate]);

  const customTotalIncome = useMemo(() => filteredTransactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0), [filteredTransactions]);
  const customTotalExpense = useMemo(() => filteredTransactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0), [filteredTransactions]);

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  const createExportJSON = (data: any[], filename: string) => {
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', url);
    linkElement.setAttribute('download', filename);
    document.body.appendChild(linkElement);
    linkElement.click();
    document.body.removeChild(linkElement);
    URL.revokeObjectURL(url);
  };

  const createExportCSV = (data: any[], filename: string) => {
    const headers = ['id', 'date', 'description', 'amount', 'type', 'category', 'tags', 'accountId'];
    const rows = data.map(t => {
      return headers.map(header => {
        let val = (t as any)[header];
        if (header === 'date' && val) {
          try { val = new Date(val).toISOString(); } catch (e) { val = String(val); }
        } else if (Array.isArray(val)) {
          val = val.join(';');
        }
        if (typeof val === 'string') val = val.replace(/"/g, '""');
        return `"${val !== undefined && val !== null ? val : ''}"`;
      }).join(',');
    }).join('\n');
    
    const csvContent = headers.join(',') + '\n' + rows;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', url);
    linkElement.setAttribute('download', filename);
    document.body.appendChild(linkElement);
    linkElement.click();
    document.body.removeChild(linkElement);
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => createExportJSON(transactions, 'rekap_transaksi_default.json');
  const handleExportCSV = () => createExportCSV(transactions, 'rekap_transaksi_default.csv');
  const handleExportJSONCustom = () => createExportJSON(filteredTransactions, 'rekap_transaksi_kustom.json');
  const handleExportCSVCustom = () => createExportCSV(filteredTransactions, 'rekap_transaksi_kustom.csv');

  const handlePrintPDF = (mode: 'default'|'custom') => {
    setPrintMode(mode);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const printTx = printMode === 'custom' ? filteredTransactions : transactions;
  const printIncome = printMode === 'custom' ? customTotalIncome : totalIncome;
  const printExpense = printMode === 'custom' ? customTotalExpense : totalExpense;

  return (
    <div className="space-y-12">
      <div className="mb-6 print:hidden">
        <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">Rekap Laporan</h2>
        <p className="text-sm text-slate-500 mt-1">Export data keuangan Anda ke berbagai format.</p>
      </div>

      {/* Summary Statistics Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 print:hidden">
        {/* Total Pemasukan */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4 hover:-translate-y-1 hover:shadow-md transition-all duration-200 cursor-pointer">
          <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center text-success">
            <ArrowUpRight size={24} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Total Pemasukan</p>
            <p className="text-xl font-extrabold text-slate-800">{formatIDR(totalIncome)}</p>
          </div>
        </div>

        {/* Total Pengeluaran */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4 hover:-translate-y-1 hover:shadow-md transition-all duration-200 cursor-pointer">
          <div className="w-12 h-12 rounded-xl bg-danger/10 flex items-center justify-center text-danger">
            <ArrowDownRight size={24} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Total Pengeluaran</p>
            <p className="text-xl font-extrabold text-slate-800">{formatIDR(totalExpense)}</p>
          </div>
        </div>

        {/* Saldo Saat Ini */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4 hover:-translate-y-1 hover:shadow-md transition-all duration-200 cursor-pointer">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Wallet size={24} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Saldo Saat Ini</p>
            <p className="text-xl font-extrabold text-slate-800">{formatIDR(totalBalance)}</p>
          </div>
        </div>
      </section>



      {/* Custom Date Range Report */}
      <section className="print:hidden">
        <div className="mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">Rekap Berdasarkan Tanggal</h2>
            <p className="text-sm text-slate-500 mt-1">Export atau cetak data transaksi berdasarkan rentang tanggal spesifik pilihan Anda.</p>
          </div>
          
          {/* Responsive date filter bar with Apply button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
            <div className="flex flex-col sm:flex-row items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-sm w-full">
              <div className="flex items-center gap-2 w-full">
                <Calendar size={18} className="text-slate-400 ml-2 shrink-0" />
                <Input 
                  type="date"
                  value={tempStartDate}
                  onChange={(e) => setTempStartDate(e.target.value)}
                  className="border-none shadow-none focus-visible:ring-0 text-sm h-9 w-full min-w-[110px]"
                />
              </div>
              <span className="hidden sm:inline text-slate-300">-</span>
              <div className="flex items-center gap-2 w-full border-t border-slate-100 sm:border-t-0 pt-2 sm:pt-0">
                <Calendar size={18} className="text-slate-400 ml-2 shrink-0 sm:hidden" />
                <Input 
                  type="date"
                  value={tempEndDate}
                  onChange={(e) => setTempEndDate(e.target.value)}
                  className="border-none shadow-none focus-visible:ring-0 text-sm h-9 w-full min-w-[110px]"
                />
              </div>
            </div>
            <Button 
              onClick={handleApplyFilter} 
              className="bg-primary text-white text-sm font-bold h-11 px-6 rounded-xl flex items-center justify-center gap-2 shadow-sm shrink-0 active:scale-95 transition-transform"
            >
              Terapkan
            </Button>
          </div>
        </div>

        {showReadyMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-sm font-medium flex items-center gap-2 mb-6">
            <CheckCircle2 className="text-emerald-500 shrink-0" size={18} />
            <span>
              Laporan keuangan di setup rentang tanggal{" "}
              <strong>{startDate ? new Date(startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}</strong>{" "}
              s/d{" "}
              <strong>{endDate ? new Date(endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}</strong>{" "}
              dan siap dicetak / print.
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Export CSV Custom */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col hover:-translate-y-1 hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center text-success">
                <FileText size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Export CSV</h3>
                <p className="text-xs text-slate-500">Rentang Tanggal</p>
              </div>
            </div>
            <button onClick={handleExportCSVCustom} className="w-full mt-auto py-2.5 bg-primary/10 text-primary hover:bg-primary/20 text-sm font-bold tracking-wide rounded-xl flex items-center justify-center gap-2 transition-colors">
              <Download size={16} /> Unduh
            </button>
          </div>

          {/* Print PDF Custom */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col hover:-translate-y-1 hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-danger/10 flex items-center justify-center text-danger">
                <Printer size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Print / PDF</h3>
                <p className="text-xs text-slate-500">Rentang Tanggal</p>
              </div>
            </div>
            <button onClick={() => handlePrintPDF('custom')} className="w-full mt-auto py-2.5 bg-danger text-white text-sm font-bold tracking-wide rounded-xl flex items-center justify-center gap-2 hover:bg-danger/90 shadow-md shadow-danger/25 transition-all active:scale-95">
              <Printer size={16} /> Cetak
            </button>
          </div>
        </div>
      </section>

      {/* Print View Only (Hidden on screen) */}
      <div className="hidden print:block space-y-8 text-black bg-white p-8 font-sans">
        <div className="border-b-2 border-black pb-4 mb-6 text-center">
          <h1 className="text-3xl font-black uppercase tracking-widest">Laporan Keuangan DIAMOND</h1>
          {printMode === 'custom' ? (
            <p className="text-gray-600 text-lg mt-2">Periode: {startDate ? new Date(startDate).toLocaleDateString('id-ID') : '-'} s/d {endDate ? new Date(endDate).toLocaleDateString('id-ID') : '-'}</p>
          ) : (
            <p className="text-gray-600 text-lg mt-2">Dicetak pada: {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          )}
        </div>
        
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="border border-gray-300 p-4 rounded-lg bg-gray-50/50">
            <p className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-1">Total Pemasukan</p>
            <h3 className="text-2xl font-black text-green-700">{formatIDR(printIncome)}</h3>
          </div>
          <div className="border border-gray-300 p-4 rounded-lg bg-gray-50/50">
            <p className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-1">Total Pengeluaran</p>
            <h3 className="text-2xl font-black text-red-700">{formatIDR(printExpense)}</h3>
          </div>
          <div className="border border-gray-300 p-4 rounded-lg bg-gray-100">
            <p className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-1">Sisa Saldo Tersedia</p>
            <h3 className="text-2xl font-black text-slate-900">{formatIDR(totalBalance)}</h3>
          </div>
        </div>

        <div className="mb-8 page-break-inside-avoid">
          <h3 className="text-xl font-bold mb-4 border-b-2 border-gray-200 pb-2 uppercase">Daftar Rekening & Saldo</h3>
          <table className="w-full text-left border-collapse border border-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-2 px-3 border border-gray-200 font-bold uppercase text-sm">Nama Rekening</th>
                <th className="py-2 px-3 border border-gray-200 font-bold uppercase text-sm text-right">Saldo Saat Ini</th>
              </tr>
            </thead>
            <tbody>
              {accounts.length > 0 ? accounts.map((acc) => (
                <tr key={acc.id} className="border-b border-gray-200">
                  <td className="py-2 px-3 text-sm">{acc.name}</td>
                  <td className="py-2 px-3 text-sm font-bold text-right">{formatIDR(acc.balance)}</td>
                </tr>
              )) : (
                <tr><td colSpan={2} className="py-4 text-center text-gray-500 text-sm">Tidak ada rekening</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-8 page-break-inside-avoid">
          <div>
            <h3 className="text-xl font-bold mb-4 border-b-2 border-gray-200 pb-2 uppercase">Hutang & Piutang Aktif</h3>
            <table className="w-full text-left border-collapse border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-2 px-3 border border-gray-200 font-bold uppercase text-xs">Pihak</th>
                  <th className="py-2 px-3 border border-gray-200 font-bold uppercase text-xs">Sisa Nominal</th>
                </tr>
              </thead>
              <tbody>
                {debts.filter(d => d.status === 'pending').length > 0 ? debts.filter(d => d.status === 'pending').map((d) => (
                  <tr key={d.id} className="border-b border-gray-200">
                    <td className="py-2 px-3 text-sm">{d.person} <span className="text-[10px] text-gray-400 block">{d.type === 'debt' ? 'Anda berhutang' : 'Berhutang ke Anda'}</span></td>
                    <td className={`py-2 px-3 text-sm font-bold text-right ${d.type === 'debt' ? 'text-red-600' : 'text-green-600'}`}>{formatIDR(d.amount)}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={2} className="py-4 text-center text-gray-500 text-sm">Tidak ada hutang/piutang aktif</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-4 border-b-2 border-gray-200 pb-2 uppercase">Langganan Aktif</h3>
            <table className="w-full text-left border-collapse border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-2 px-3 border border-gray-200 font-bold uppercase text-xs">Layanan</th>
                  <th className="py-2 px-3 border border-gray-200 font-bold uppercase text-xs text-right">Biaya Langganan</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.length > 0 ? subscriptions.map((s) => (
                  <tr key={s.id} className="border-b border-gray-200">
                    <td className="py-2 px-3 text-sm">{s.name} <span className="text-[10px] text-gray-400 block uppercase">{s.billingCycle}</span></td>
                    <td className="py-2 px-3 text-sm font-bold text-right text-gray-600">{formatIDR(s.amount)}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={2} className="py-4 text-center text-gray-500 text-sm">Tidak ada langganan aktif</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-4 border-b-2 border-gray-200 pb-2 uppercase">Daftar Seluruh Transaksi</h3>
          <table className="w-full text-left border-collapse border border-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-2 px-3 border border-gray-200 font-bold uppercase text-sm">Tanggal</th>
                <th className="py-2 px-3 border border-gray-200 font-bold uppercase text-sm">Deskripsi</th>
                <th className="py-2 px-3 border border-gray-200 font-bold uppercase text-sm">Kategori</th>
                <th className="py-2 px-3 border border-gray-200 font-bold uppercase text-sm text-right">Nominal</th>
              </tr>
            </thead>
            <tbody>
              {printTx.length > 0 ? printTx.map((t) => (
                <tr key={t.id} className="border-b border-gray-200">
                  <td className="py-2 px-3 text-sm">{new Date(t.date).toLocaleDateString('id-ID')}</td>
                  <td className="py-2 px-3 text-sm font-medium">{t.description}</td>
                  <td className="py-2 px-3 text-sm text-gray-600">{t.category}</td>
                  <td className={`py-2 px-3 text-sm font-bold text-right ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {t.type === 'income' ? '+' : '-'}{formatIDR(t.amount)}
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={4} className="py-8 text-center text-gray-500">Belum ada transaksi pada periode ini</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ready Modal Confirmation */}
      {showReadyModal && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-3xl shadow-2xl w-full max-w-sm flex flex-col items-center text-center">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 size={28} />
            </div>
            <h2 className="text-xl font-extrabold text-slate-800 mb-2">Laporan Siap Dicetak</h2>
            <p className="text-sm text-slate-500 mb-6">
              Laporan keuangan telah berhasil disiapkan berdasarkan rentang tanggal yang Anda pilih.
            </p>
            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={() => {
                  setShowReadyModal(false);
                  setShowReadyMessage(true);
                  handlePrintPDF('custom');
                }}
                className="w-full py-3 bg-danger text-white text-sm font-bold rounded-2xl hover:bg-danger/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-danger/25 active:scale-95 cursor-pointer"
              >
                <Printer size={16} /> Cetak PDF
              </button>
              <button
                onClick={() => {
                  setShowReadyModal(false);
                  setShowReadyMessage(true);
                }}
                className="w-full py-3 bg-slate-100 text-slate-700 text-sm font-bold rounded-2xl hover:bg-slate-200 transition-all active:scale-95 cursor-pointer"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
