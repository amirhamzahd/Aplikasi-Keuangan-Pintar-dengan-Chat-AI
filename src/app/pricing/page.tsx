'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Check, Lock, ShieldCheck, ChevronDown, CreditCard, RefreshCcw,
  LogOut, Camera, Mic, PieChart, Wallet, MessageSquare, LineChart, Target, Coins, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import Script from 'next/script';

// --- Countdown Component ---
const CountdownTimer = () => {
  const [timeLeft, setTimeLeft] = useState(600);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="inline-flex items-center gap-3 bg-rose-50 border border-rose-200 text-rose-600 px-4 py-2 rounded-full font-bold shadow-sm mb-4 animate-pulse">
      <span className="text-sm">Promo Berakhir Dalam:</span>
      <div className="flex items-center gap-1">
        <span className="bg-rose-600 text-white px-2 py-1 rounded-md min-w-[32px] text-center">{minutes.toString().padStart(2, '0')}</span>
        <span>:</span>
        <span className="bg-rose-600 text-white px-2 py-1 rounded-md min-w-[32px] text-center">{seconds.toString().padStart(2, '0')}</span>
      </div>
    </div>
  );
};

// --- Fake Sales Notification ---
const fakeBuyers = [
  { name: "Budi S.", email: "budis***@gmail.com", plan: "Pro" },
  { name: "Andi M.", email: "andim***@gmail.com", plan: "Plus" },
  { name: "Siti F.", email: "sitif***@gmail.com", plan: "Pro" },
  { name: "Rizky D.", email: "rizkyd***@gmail.com", plan: "Pro" },
  { name: "Dewi A.", email: "dewia***@gmail.com", plan: "Basic" },
  { name: "Reza P.", email: "rezap***@gmail.com", plan: "Plus" },
  { name: "Dina K.", email: "dinak***@gmail.com", plan: "Pro" },
  { name: "Hendra W.", email: "hendraw***@gmail.com", plan: "Pro" },
  { name: "Putri L.", email: "putril***@gmail.com", plan: "Plus" },
  { name: "Fajar N.", email: "fajarn***@gmail.com", plan: "Pro" },
  { name: "Lina P.", email: "linap***@gmail.com", plan: "Basic" },
  { name: "Agus R.", email: "agusr***@gmail.com", plan: "Pro" },
  { name: "Nanda H.", email: "nandah***@gmail.com", plan: "Plus" },
  { name: "Yoga K.", email: "yogak***@gmail.com", plan: "Pro" },
  { name: "Sarah M.", email: "sarahm***@gmail.com", plan: "Pro" },
  { name: "Bagus T.", email: "bagust***@gmail.com", plan: "Basic" },
  { name: "Novi A.", email: "novia***@gmail.com", plan: "Plus" },
  { name: "Ilham F.", email: "ilhamf***@gmail.com", plan: "Pro" },
  { name: "Rina C.", email: "rinac***@gmail.com", plan: "Pro" },
  { name: "Dimas J.", email: "dimasj***@gmail.com", plan: "Plus" },
  { name: "Aulia R.", email: "auliar***@gmail.com", plan: "Pro" },
  { name: "Taufik H.", email: "taufikh***@gmail.com", plan: "Basic" },
  { name: "Maya D.", email: "mayad***@gmail.com", plan: "Pro" },
  { name: "Farhan I.", email: "farhani***@gmail.com", plan: "Plus" },
  { name: "Citra V.", email: "citrav***@gmail.com", plan: "Pro" },
];

const FakeSalesNotification = () => {
  const [currentBuyerIndex, setCurrentBuyerIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const showNotification = () => {
      // Pick random buyer
      const randomIndex = Math.floor(Math.random() * fakeBuyers.length);
      setCurrentBuyerIndex(randomIndex);
      setIsVisible(true);

      // Hide after 4 seconds
      setTimeout(() => {
        setIsVisible(false);
      }, 4000);
    };

    // Initial delay before first show (2 seconds)
    const initialTimer = setTimeout(showNotification, 2000);

    // Then show a new one every 10 seconds
    const interval = setInterval(showNotification, 10000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, []);

  const buyer = fakeBuyers[currentBuyerIndex];

  return (
    <div className="fixed bottom-4 left-4 md:bottom-6 md:left-6 z-[100] pointer-events-none">
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="bg-white border border-slate-200 shadow-2xl rounded-2xl p-3 md:p-4 flex items-center gap-3 w-[280px] md:w-[320px]"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 shadow-inner">
              <Check size={20} className="text-emerald-600" />
            </div>
            <div className="flex flex-col">
              <span className="text-[12px] md:text-[13px] text-slate-500 leading-tight">
                <span className="font-bold text-slate-800">{buyer.name}</span> ({buyer.email})
              </span>
              <span className="text-[12px] md:text-[13px] font-medium text-slate-600 mt-0.5">
                Baru saja berlangganan <span className="font-bold text-blue-600">Paket {buyer.plan}</span>
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">Beberapa detik yang lalu</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Scarcity Progress Bar ---
const ScarcityProgressBar = ({ remaining, percentage }: { remaining: number, percentage: number }) => (
  <div className="mb-5 mt-2">
    <div className="flex justify-between items-end mb-1.5">
      <span className="text-[11px] font-extrabold text-rose-600 flex items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
        </span>
        Hanya sisa {remaining} slot promo!
      </span>
      <span className="text-[10px] text-slate-400 font-bold tracking-wider">{percentage}% Terjual</span>
    </div>
    <div className="w-full bg-slate-100 rounded-full h-2 shadow-inner">
      <div className="bg-gradient-to-r from-rose-400 to-rose-600 h-2 rounded-full" style={{ width: `${percentage}%` }}></div>
    </div>
  </div>
);

// --- FAQ Component ---
const FAQItem = ({ question, answer, isOpen, onClick }: { question: string, answer: React.ReactNode, isOpen: boolean, onClick: () => void }) => {
  return (
    <div className="border border-slate-200 rounded-xl bg-white overflow-hidden shadow-sm transition-all hover:border-slate-300 hover:shadow-md">
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between p-4 text-left cursor-pointer focus:outline-none"
      >
        <span className="font-bold text-slate-800 text-sm">{question}</span>
        <ChevronDown
          size={18}
          className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-blue-500' : ''}`}
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-4 pt-0 text-sm text-slate-600 border-t border-slate-100 leading-relaxed">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Reusable list item components
const FeatureCheck = ({ text }: { text: React.ReactNode }) => (
  <div className="flex items-start gap-2.5">
    <Check size={14} className="text-emerald-500 shrink-0 mt-[3px]" strokeWidth={3} />
    <span className="text-[13px] text-slate-600 font-medium leading-snug">{text}</span>
  </div>
);

const FeatureAI = ({ text, icon: Icon }: { text: React.ReactNode, icon: any }) => (
  <div className="flex items-start gap-2.5">
    <Icon size={14} className="text-blue-500 shrink-0 mt-[3px]" strokeWidth={2.5} />
    <span className="text-[13px] text-slate-700 font-medium leading-snug">{text}</span>
  </div>
);

const FeatureLock = ({ text, title }: { text: React.ReactNode, title: string }) => (
  <div className="flex items-start gap-2.5 opacity-60 grayscale">
    <Lock size={14} className="text-slate-400 shrink-0 mt-[3px]" strokeWidth={2.5} />
    <div className="flex flex-col">
      <span className="text-[13px] font-bold text-slate-700 leading-snug">{title}</span>
      <span className="text-[12px] text-slate-500 leading-snug">{text}</span>
    </div>
  </div>
);

export default function PricingPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const isPro = user?.planType === 'PRO';
  const isPlus = user?.planType === 'PLUS';
  const isBasic = user?.planType === 'BASIC';
  const isExpired = user?.planExpiredAt ? new Date(user.planExpiredAt) < new Date() : true;

  const showBasicCard = !isPro && !isPlus; // Hide for PRO and PLUS
  const showPlusCard = !isPro; // Hide for PRO
  
  // Grid columns
  let gridCols = "md:grid-cols-3 max-w-5xl";
  if (isPro) gridCols = "md:grid-cols-1 max-w-md";
  else if (isPlus) gridCols = "md:grid-cols-2 max-w-3xl";

  // Calculate prices
  let plusPrice = 59000;
  let proPrice = 69000;
  let plusLabel = "Pilih Plus";
  let proLabel = "Dapatkan Pro";

  if (!isExpired) {
    if (isBasic) {
      plusPrice = 10000;
      proPrice = 20000;
      plusLabel = "Upgrade ke Plus";
      proLabel = "Upgrade ke Pro";
    } else if (isPlus) {
      proPrice = 10000;
      proLabel = "Upgrade ke Pro";
    }
  }

  // User allowed to view pricing page to upgrade/renew

  const handlePayment = async (plan: 'BASIC' | 'PLUS' | 'PRO') => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/payments/create', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Gagal memproses pembayaran');

      if (typeof window !== 'undefined' && (window as any).snap) {
        (window as any).snap.pay(data.token, {
          onSuccess: function () { window.location.href = '/dashboard'; },
          onPending: function () { alert('Menunggu pembayaran diselesaikan...'); },
          onError: function () { alert('Pembayaran gagal atau dibatalkan.'); },
          onClose: function () { setIsLoading(false); }
        });
      } else {
        alert('Sistem pembayaran belum siap. Silakan refresh halaman.');
        setIsLoading(false);
      }
    } catch (error: any) {
      alert(error.message);
      setIsLoading(false);
    }
  };

  const appFeatures = [
    'Catat pemasukan & pengeluaran tak terbatas',
    'Dashboard analitik, budget & target bulanan',
    'Manajemen Multi akun (bank, e-wallet, cash)',
    'Pencatatan utang, piutang & cicilan',
    'Kategori kustom tak terbatas'
  ];

  const faqs = [
    {
      question: "Apa bedanya Basic dengan paket Plus / Pro?",
      answer: (
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Paket Basic:</strong> Murni pencatatan manual tanpa asisten AI.</li>
          <li><strong>Paket Plus:</strong> Menambahkan fitur Chat AI pintar (bisa catat lewat chat, tanya-tanya keuangan via teks & suara, dan laporan dari AI).</li>
          <li><strong>Paket Pro:</strong> Paket paling lengkap dengan semua fitur di atas, ditambah kemampuan pemindaian <strong>Foto Struk (OCR)</strong> otomatis.</li>
        </ul>
      )
    },
    {
      question: "Apakah ini langganan otomatis tiap bulan?",
      answer: (
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Tidak ada tagihan bulanan.</strong> Ini adalah langganan per TAHUN (Annual).</li>
          <li>Kami <strong>tidak akan menarik dana secara otomatis</strong> (auto-renew) dari kartu atau e-wallet Anda tanpa persetujuan.</li>
          <li>Setelah 1 tahun berakhir, Anda bebas memilih untuk perpanjang atau tidak secara manual.</li>
        </ul>
      )
    },
    {
      question: "Kategori kustom itu apa? Basic dapat tidak?",
      answer: (
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Kategori kustom adalah kategori pendapatan/pengeluaran buatan Anda sendiri di luar bawaan aplikasi.</li>
          <li><strong>Semua paket (termasuk Basic)</strong> mendapatkan akses membuat kategori kustom tanpa batas kuota.</li>
        </ul>
      )
    },
    {
      question: "Kalau masa aktif 1 tahun habis bagaimana?",
      answer: (
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Anda <strong>tidak akan kehilangan data</strong> sedikit pun.</li>
          <li>Akun Anda akan otomatis terkunci menjadi mode <strong>Read-Only</strong> (Hanya Baca).</li>
          <li>Anda tetap bisa melihat dashboard dan riwayat transaksi lama, tapi tidak bisa menambah transaksi baru sampai Anda memperpanjang paket.</li>
        </ul>
      )
    },
    {
      question: "Apakah sistem pembayaran aman?",
      answer: (
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Sangat aman.</strong> Kami menggunakan Midtrans sebagai payment gateway resmi yang diawasi oleh OJK.</li>
          <li>Semua koneksi dienkripsi dan kami tidak pernah menyimpan data sensitif perbankan Anda.</li>
        </ul>
      )
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans pb-20">
      <Script
        src={
          process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true'
            ? "https://app.midtrans.com/snap/snap.js"
            : "https://app.sandbox.midtrans.com/snap/snap.js"
        }
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
        strategy="lazyOnload"
      />

      <FakeSalesNotification />

      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white shadow-lg">
            <Sparkles size={16} />
          </div>
          <span className="font-bold text-lg text-slate-800 tracking-tight">DIAMOND</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold text-slate-600 hidden md:block">
            Hi, {user?.name}
          </span>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-rose-500 transition-colors bg-slate-100 hover:bg-rose-50 px-3 py-1.5 rounded-lg"
          >
            <LogOut size={14} />
            <span className="hidden sm:block">Keluar</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-blue-100/50 to-transparent rounded-full blur-3xl -z-10 opacity-70 pointer-events-none" />

        <div className="max-w-6xl w-full mx-auto">

          <div className="text-center mb-10 mt-2 flex flex-col items-center">
            <CountdownTimer />
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-3 tracking-tight">
              Investasi Cerdas Untuk Keuanganmu
            </h1>
            {/* Scarcity Prolog - Elegant Clean Redesign */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-8 mb-4 p-2 md:p-4 max-w-3xl mx-auto text-center"
            >
              <div className="flex flex-col space-y-4">
                <span className="text-slate-400 font-bold tracking-widest text-xs uppercase mb-1">
                  Kalkulasi Cerdas
                </span>
                <p className="text-slate-800 text-[15px] md:text-[17px] font-medium leading-relaxed">
                  Coba hitung dulu... Paket Pro hanya <span className="font-bold text-emerald-600">Rp69.000/tahun</span>.
                </p>
                <p className="text-slate-600 text-[14px] md:text-[16px] leading-relaxed">
                  Itu artinya hanya sekitar <span className="font-bold text-emerald-600">Rp5.750/bulan</span>, atau cuma <span className="text-xl md:text-2xl font-black text-emerald-600 inline-block mx-1 transform hover:scale-110 transition-transform">Rp189/hari</span>.
                </p>
                <p className="text-slate-500 text-[13px] md:text-[14px] italic">
                  "Bahkan lebih murah dari biaya parkir motor, segelas es teh, atau sebungkus gorengan."
                </p>
                <p className="text-slate-700 text-[14px] md:text-[15px] font-medium mt-2">
                  Dengan kurang dari Rp200 per hari, Anda mendapatkan AI yang siap mencatat, mengelompokkan, dan merapikan keuangan Anda selama <strong className="text-slate-900">365 hari penuh</strong>.
                </p>
                <div className="pt-4 mt-2 border-t border-slate-200">
                  <p className="text-slate-500 text-[12px] md:text-[13px] leading-relaxed">
                    Sulit menemukan investasi sekecil ini dengan manfaat yang bisa dipakai setiap hari.
                    <br />
                    <strong className="text-rose-600 animate-pulse mt-1.5 inline-block text-[13px] md:text-[14px]">Promo terbatas. Amankan harga terbaik sebelum periode diskon berakhir.</strong>
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Pricing Cards Grid (Dynamic Order/Layout) */}
          <div className={`grid grid-cols-1 ${gridCols} gap-5 md:gap-6 mb-16 mx-auto items-stretch`}>

            {/* 1. PRO TIER (Left, Highlighted) */}
            <div className="bg-white rounded-2xl p-5 md:p-7 border-[2px] border-transparent shadow-xl relative order-1 transform flex flex-col"
              style={{
                backgroundClip: 'padding-box',
                backgroundImage: 'linear-gradient(white, white), linear-gradient(45deg, #ef4444, #3b82f6, #ef4444)',
                backgroundOrigin: 'border-box',
                animation: 'borderBlink 3s ease-in-out infinite'
              }}>
              <style>{`
                @keyframes borderBlink {
                  0% { border-color: rgba(239, 68, 68, 0.5); box-shadow: 0 0 15px rgba(239, 68, 68, 0.15); }
                  50% { border-color: rgba(239, 68, 68, 1); box-shadow: 0 0 25px rgba(239, 68, 68, 0.3); }
                  100% { border-color: rgba(239, 68, 68, 0.5); box-shadow: 0 0 15px rgba(239, 68, 68, 0.15); }
                }
              `}</style>

              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-rose-500 to-rose-600 text-white px-4 py-1 rounded-full text-[10px] font-bold tracking-widest shadow-md whitespace-nowrap">
                BEST VALUE BUNDLE
              </div>

              <div className="flex items-center gap-2 mb-2 mt-2">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Pro</h3>
                <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide">FULL ACCESS</span>
              </div>

              <div className="mb-0 flex items-center gap-2">
                <span className="text-sm font-bold text-slate-400 line-through">Rp 149.000</span>
              </div>
              <div className="mb-1">
                <span className="text-4xl font-black text-slate-900 tracking-tighter">Rp {proPrice.toLocaleString('id-ID')}</span>
              </div>
              <p className="text-[12px] text-slate-600 mb-6 font-medium">
                <span className="font-bold text-emerald-600">App 1 Tahun</span> + <span className="font-bold text-blue-600">AI 1 Tahun</span>
              </p>

              <div className="bg-slate-50 rounded-xl p-3 mb-6 text-center border border-slate-100">
                <span className="text-[12px] font-bold text-slate-700">App + Semua Fitur AI Terbuka Penuh</span>
              </div>

              <div className="flex-1">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">AI & AUTOMATION - 1 TAHUN</div>
                <div className="space-y-3 mb-6">
                  <FeatureAI icon={Camera} text="Foto struk / nota otomatis tercatat (OCR)" />
                  <FeatureAI icon={MessageSquare} text="Chat AI cerdas: catat & tanya soal keuanganmu" />
                  <FeatureAI icon={Mic} text="Input cepat transaksi melalui Suara (Voice)" />
                  <FeatureAI icon={PieChart} text="Laporan, insight, & analisis otomatis dari AI" />
                </div>

                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">APP - 1 TAHUN</div>
                <div className="space-y-3 mb-6">
                  {appFeatures.map((ft, i) => <FeatureCheck key={i} text={ft} />)}
                </div>
              </div>

              <div className="mt-4">
                <ScarcityProgressBar remaining={3} percentage={94} />
                {isPro && !isExpired ? (
                  <div className="w-full py-5 text-sm font-bold bg-emerald-100 text-emerald-700 text-center rounded-xl border-2 border-emerald-500 shadow-sm">
                    Paket PRO Tertinggi Aktif
                  </div>
                ) : (
                  <motion.div animate={{ scale: [1, 1.02, 1] }} transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}>
                    <Button
                      variant="primary"
                      className="w-full py-5 text-sm font-bold bg-gradient-to-r from-blue-600 to-rose-500 hover:from-blue-700 hover:to-rose-600 text-white shadow-lg transition-all border-none rounded-xl"
                      onClick={() => handlePayment('PRO')}
                      isLoading={isLoading}
                    >
                      {proLabel}
                    </Button>
                  </motion.div>
                )}
              </div>
            </div>

            {/* 2. PLUS TIER (Middle) */}
            {showPlusCard && (
            <div className="bg-white rounded-2xl p-5 md:p-7 border border-slate-200 shadow-md flex flex-col h-full relative order-2 mt-4 md:mt-0">

              <div className="flex items-center gap-2 mb-2 mt-2">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Plus</h3>
                <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide">SMART CHAT</span>
              </div>

              <div className="mb-0 flex items-center gap-2">
                <span className="text-sm font-bold text-slate-400 line-through">Rp 99.000</span>
              </div>
              <div className="mb-1">
                <span className="text-4xl font-black text-slate-900 tracking-tighter">Rp {plusPrice.toLocaleString('id-ID')}</span>
              </div>
              <p className="text-[12px] text-slate-600 mb-6 font-medium">
                <span className="font-bold text-emerald-600">App 1 Tahun</span> + <span className="font-bold text-blue-600">AI 1 Tahun</span>
              </p>

              <div className="bg-slate-50 rounded-xl p-3 mb-6 text-center border border-slate-100">
                <span className="text-[12px] font-bold text-slate-700">App + Chat AI Pintar (Tanpa Scan)</span>
              </div>

              <div className="flex-1">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">AI & AUTOMATION - 1 TAHUN</div>
                <div className="space-y-3 mb-6">
                  <FeatureAI icon={MessageSquare} text="Chat AI cerdas: catat & tanya soal keuanganmu" />
                  <FeatureAI icon={Mic} text="Input cepat transaksi melalui Suara (Voice)" />
                  <FeatureAI icon={PieChart} text="Laporan, insight, & analisis otomatis dari AI" />
                </div>

                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">BUTUH PRO DI APP</div>
                <div className="space-y-3 mb-6">
                  <FeatureLock title="Scanner Struk (OCR)" text="Tidak bisa memindai foto struk otomatis. Harus catat via chat/manual." />
                </div>

                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">APP - 1 TAHUN</div>
                <div className="space-y-3 mb-6">
                  {appFeatures.map((ft, i) => <FeatureCheck key={i} text={ft} />)}
                </div>
              </div>

              <div className="mt-4">
                <ScarcityProgressBar remaining={7} percentage={87} />
                {isPlus && !isExpired ? (
                  <div className="w-full py-5 text-sm font-bold bg-blue-100 text-blue-700 text-center rounded-xl border border-blue-400 shadow-sm">
                    Paket PLUS Aktif
                  </div>
                ) : (
                  <motion.div animate={{ scale: [1, 1.015, 1] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}>
                    <Button
                      variant="primary"
                      className="w-full py-5 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all border-none rounded-xl"
                      onClick={() => handlePayment('PLUS')}
                      isLoading={isLoading}
                    >
                      {plusLabel}
                    </Button>
                  </motion.div>
                )}
              </div>
            </div>
            )}

            {/* 3. BASIC TIER (Right) */}
            {showBasicCard && (
            <div className="bg-white rounded-2xl p-5 md:p-7 border border-slate-200 shadow-sm flex flex-col h-full relative order-3 mt-4 md:mt-0">

              <div className="flex items-center gap-2 mb-2 mt-2">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Basic</h3>
                <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide">MANUAL</span>
              </div>

              <div className="mb-0 flex items-center gap-2">
                <span className="text-sm font-bold text-slate-400 line-through">Rp 79.000</span>
              </div>
              <div className="mb-1">
                <span className="text-4xl font-black text-slate-900 tracking-tighter">Rp 49.000</span>
              </div>
              <p className="text-[12px] text-slate-600 mb-6 font-medium">
                <span className="font-bold text-emerald-600">App 1 Tahun</span> (Tanpa AI)
              </p>

              <div className="bg-slate-50 rounded-xl p-3 mb-6 text-center border border-slate-100">
                <span className="text-[12px] font-bold text-slate-700">Khusus pencatatan manual standar</span>
              </div>

              <div className="flex-1">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">APP - 1 TAHUN</div>
                <div className="space-y-3 mb-6">
                  {appFeatures.map((ft, i) => <FeatureCheck key={i} text={ft} />)}
                </div>

                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">BUTUH AI DI APP</div>
                <div className="space-y-3 mb-6">
                  <FeatureLock title="Chat AI & Voice Input" text="Tidak bisa catat & tanya via chat pintar atau suara." />
                  <FeatureLock title="Scanner Struk (OCR)" text="Tidak bisa scan otomatis." />
                  <FeatureLock title="Laporan Cerdas AI" text="Hanya bisa lihat laporan grafik standar." />
                </div>
              </div>

              <div className="mt-4">
                <ScarcityProgressBar remaining={11} percentage={81} />
                {isBasic && !isExpired ? (
                  <div className="w-full py-5 text-sm font-bold bg-slate-100 text-slate-700 text-center rounded-xl border border-slate-300 shadow-sm">
                    Paket BASIC Aktif
                  </div>
                ) : (
                  <Button
                    variant="secondary"
                    className="w-full py-5 text-sm font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors rounded-xl"
                    onClick={() => handlePayment('BASIC')}
                    isLoading={isLoading}
                  >
                    Mulai Basic
                  </Button>
                )}
              </div>
            </div>
            )}

          </div>

          {/* FAQ Section */}
          <div className="max-w-3xl mx-auto mb-16">
            <h2 className="text-xl md:text-2xl font-black text-center text-slate-800 mb-8">Pertanyaan Umum (FAQ)</h2>
            <div className="space-y-3">
              {faqs.map((faq, index) => (
                <FAQItem 
                  key={index} 
                  question={faq.question} 
                  answer={faq.answer}
                  isOpen={openFaqIndex === index}
                  onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                />
              ))}
            </div>
          </div>

          {/* Trust Badges */}
          <div className="max-w-2xl mx-auto pt-8 border-t border-slate-200">
            <div className="flex flex-wrap justify-center gap-4 text-[11px] text-slate-600 font-bold mb-6">
              <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
                <ShieldCheck size={14} className="text-emerald-500" />
                <span>Pembayaran aman via Midtrans</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
                <CreditCard size={14} className="text-blue-500" />
                <span>Kartu, E-Wallet, QRIS</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
                <RefreshCcw size={14} className="text-slate-400" />
                <span>Tanpa auto-renew paksa</span>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
