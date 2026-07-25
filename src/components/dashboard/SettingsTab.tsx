'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Button } from '../ui/Button';
import { useTransactions } from '@/context/TransactionContext';
import { useAuth } from '@/context/AuthContext';
import { CalendarDays, Save, Settings, AlertTriangle, Trash2, Info, Repeat, BookOpen, Download, Gem, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function SettingsTab() {
  const { currentPeriodStart, currentPeriodEnd, updatePeriodRange, resetData } = useTransactions();
  const { user } = useAuth();
  
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showResetModal, setShowResetModal] = useState(false);
  
  const isExpired = user?.planExpiredAt ? new Date(user.planExpiredAt) < new Date() : false;

  useEffect(() => {
    if (currentPeriodStart) {
      setStartDate(new Date(currentPeriodStart).toISOString().split('T')[0]);
    }
    if (currentPeriodEnd) {
      setEndDate(new Date(currentPeriodEnd).toISOString().split('T')[0]);
    }
  }, [currentPeriodStart, currentPeriodEnd]);

  const handleSaveDates = () => {
    updatePeriodRange(
      startDate ? new Date(startDate).toISOString() : null,
      endDate ? new Date(endDate).toISOString() : null
    );
  };

  const handleReset = async () => {
    await resetData();
    setShowResetModal(false);
  };

  return (
    <div className="space-y-6 max-w-4xl pb-24">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
          <Settings className="text-primary" size={28} />
          Pengaturan Aplikasi
        </h2>
        <p className="text-sm text-slate-500 mt-1">Sesuaikan pengalaman penggunaan aplikasi</p>
      </div>

      {/* BERLANGGANAN & BILLING */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gem size={18} className="text-primary" />
            Langganan & Tagihan
          </CardTitle>
          <CardDescription>
            Kelola paket langganan Anda, lihat masa aktif, atau perpanjang paket.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div>
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                Informasi Langganan
                {user?.planType && user.planType !== 'NONE' && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isExpired 
                      ? 'bg-rose-100 text-rose-700' 
                      : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {user.planType} {isExpired ? '(Kedaluwarsa)' : '(Aktif)'}
                  </span>
                )}
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-md">
                {user?.planType === 'NONE' || !user?.planType ? (
                  'Periksa status langganan DIAMOND Finance Anda.'
                ) : (
                  <>
                    Masa aktif paket {user.planType} Anda s/d{' '}
                    <span className="font-semibold text-slate-700">
                      {new Date(user.planExpiredAt || '').toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'long', year: 'numeric'
                      })}
                    </span>
                  </>
                )}
              </p>
            </div>
            <a 
              href="/dashboard/billing" 
              className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 transition shadow-sm"
            >
              Kelola Langganan <ArrowRight size={16} />
            </a>
          </div>
        </CardContent>
      </Card>

      {/* RENTANG TANGGAL MANUAL */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays size={18} className="text-primary" />
            Rentang Tanggal Periode Keuangan
          </CardTitle>
          <CardDescription>
            Pilih rentang tanggal spesifik untuk memfilter laporan Dashboard dan Budget.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Tanggal Mulai</label>
              <input 
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-800"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Tanggal Akhir</label>
              <input 
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-800"
              />
            </div>
          </div>
          
          <Button onClick={handleSaveDates} className="flex items-center gap-2 w-full md:w-auto py-2.5">
            <Save size={16} /> Simpan Tanggal
          </Button>

          {/* INFORMASI CUT-OFF */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mt-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 p-1.5 rounded-lg bg-blue-100">
                <Info size={16} className="text-blue-600" />
              </div>
              <div className="space-y-1 text-sm text-slate-600">
                <p className="font-semibold text-blue-800">Informasi Setting Cut-Off</p>
                <p>
                  User melakukan Setting Cutoff Tanggal. Saat ini, <strong>Tanggal Periode Keuangan disetting pada tanggal:</strong>
                </p>
                {currentPeriodStart && currentPeriodEnd ? (
                  <p className="font-bold text-blue-700 bg-white inline-block px-3 py-1.5 rounded-lg border border-blue-200 mt-2 shadow-sm">
                    {new Date(currentPeriodStart).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} 
                    {' '} - {' '}
                    {new Date(currentPeriodEnd).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                ) : (
                  <p className="text-slate-500 italic mt-1">Belum ada rentang tanggal spesifik yang disetting (menggunakan periode bulanan default).</p>
                )}
                <p className="text-xs text-slate-500 mt-2">
                  Seluruh kalkulasi pada Dashboard, Budget, dan Laporan akan dibatasi hanya pada rentang tanggal tersebut.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MANUAL BOOK */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen size={18} className="text-primary" />
            Panduan Penggunaan Aplikasi
          </CardTitle>
          <CardDescription>
            Unduh buku panduan lengkap (Manual Book) untuk memahami seluruh fitur DIAMOND Finance AI.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div>
              <h4 className="font-bold text-slate-800 text-sm">Manual Book (PDF)</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-md">Berisi panduan mulai dari setup awal, penggunaan AI, hingga manajemen transaksi dan laporan.</p>
            </div>
            <a 
              href="/Manual_Book_DIAMOND_Finance.pdf" 
              download="Manual_Book_DIAMOND_Finance.pdf"
              className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition shadow-sm"
            >
              <Download size={16} /> Unduh Panduan
            </a>
          </div>
        </CardContent>
      </Card>

      {/* DANGER ZONE */}
      <Card className="border-rose-200 bg-rose-50/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-rose-600">
            <AlertTriangle size={18} />
            Zona Berbahaya
          </CardTitle>
          <CardDescription className="text-rose-600/80">
            Tindakan di bawah ini tidak dapat dibatalkan dan akan berdampak permanen pada akun Anda.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-rose-100">
            <div>
              <h4 className="font-bold text-slate-800 text-sm">Reset Seluruh Data Keuangan</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-md">Menghapus semua riwayat transaksi, rekening, anggaran, dan hutang-piutang. Data login Anda akan tetap aman.</p>
            </div>
            <Button 
              onClick={() => setShowResetModal(true)} 
              variant="danger" 
              className="shrink-0 flex items-center gap-2"
            >
              <Trash2 size={16} /> Reset Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modal Konfirmasi Reset */}
      <AnimatePresence>
        {showResetModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-100"
            >
              <div className="bg-rose-500 p-6 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
                  <AlertTriangle size={32} className="text-white" />
                </div>
                <h3 className="text-2xl font-black text-white">Peringatan!</h3>
                <p className="text-rose-100 mt-2 text-sm">Tindakan ini tidak dapat dibatalkan.</p>
              </div>
              
              <div className="p-6">
                <p className="text-slate-600 text-center mb-6 text-sm">
                  Anda yakin ingin menghapus <strong>SELURUH</strong> data keuangan (Transaksi, Rekening, Anggaran, dll)? Akun Anda akan kembali seperti baru pertama kali mendaftar.
                </p>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowResetModal(false)}
                    className="flex-1 py-3 rounded-2xl font-bold text-sm bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleReset}
                    className="flex-1 py-3 rounded-2xl font-bold text-sm bg-rose-500 text-white hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/25 active:scale-95"
                  >
                    Ya, Reset Data
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
