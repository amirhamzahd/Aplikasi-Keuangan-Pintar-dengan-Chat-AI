'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, Clock, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function BillingPage() {
  const { user } = useAuth();
  const router = useRouter();

  if (!user) return null;

  // Strict guard: don't render if plan is NONE
  if (!user.planType || user.planType === 'NONE') {
    return null;
  }

  const planNames = {
    NONE: 'Belum Berlangganan',
    BASIC: 'DIAMOND Basic (Manual)',
    PLUS: 'DIAMOND Plus (AI Terbatas)',
    PRO: 'DIAMOND Pro (AI Penuh)',
  };

  const getStatusColor = (plan: string, isExpired: boolean) => {
    if (plan === 'NONE' || isExpired) return 'bg-rose-100 text-rose-700 border-rose-200';
    if (plan === 'PRO') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (plan === 'PLUS') return 'bg-blue-100 text-blue-700 border-blue-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const isExpired = user.planExpiredAt ? new Date(user.planExpiredAt) < new Date() : false;
  const statusColor = getStatusColor(user.planType || 'NONE', isExpired);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 relative">
        <div className="p-8">
          <button 
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-8"
          >
            <ArrowLeft size={16} />
            Kembali ke Dashboard
          </button>

          <h1 className="text-2xl font-black text-slate-800 mb-1">Informasi Langganan</h1>
          <p className="text-sm text-slate-500 mb-8">Kelola paket langganan DIAMOND Finance Anda.</p>

          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-6">
            
            {/* Status Paket */}
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Paket Saat Ini</p>
              <div className="flex items-center gap-3">
                <span className="text-lg font-black text-slate-800">
                  {planNames[(user.planType as keyof typeof planNames) || 'NONE']}
                </span>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${statusColor}`}>
                  {user.planType === 'NONE' ? 'Tidak Aktif' : (isExpired ? 'Kedaluwarsa' : 'Aktif')}
                </span>
              </div>
            </div>

            {/* Masa Berlaku */}
            {user.planExpiredAt && (
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Masa Berlaku Hingga</p>
                <div className="flex items-center gap-2">
                  <Clock size={16} className={isExpired ? "text-rose-500" : "text-slate-500"} />
                  <span className={`text-sm font-bold ${isExpired ? 'text-rose-600' : 'text-slate-700'}`}>
                    {new Date(user.planExpiredAt).toLocaleDateString('id-ID', {
                      day: 'numeric', month: 'long', year: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            )}

            {/* Warning kedaluwarsa atau NONE */}
            {(isExpired || user.planType === 'NONE') && (
              <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 flex gap-3">
                <ShieldAlert className="text-rose-600 shrink-0 mt-0.5" size={18} />
                <p className="text-xs text-rose-800 font-medium leading-relaxed">
                  Akun Anda saat ini dalam mode <strong>Read-Only</strong>. Anda tidak dapat menambahkan transaksi baru. Segera perpanjang paket Anda untuk kembali menikmati fitur penuh.
                </p>
              </div>
            )}
            
            {/* Success aktif */}
            {!isExpired && user.planType !== 'NONE' && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex gap-3">
                <CheckCircle className="text-emerald-600 shrink-0 mt-0.5" size={18} />
                <p className="text-xs text-emerald-800 font-medium leading-relaxed">
                  Paket Anda aktif. Anda bisa menikmati semua fitur sesuai dengan paket yang dipilih.
                </p>
              </div>
            )}
          </div>

          <div className="mt-8">
            <Button 
              variant="primary" 
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-rose-500 hover:from-blue-700 hover:to-rose-600 text-white shadow-xl rounded-2xl"
              onClick={() => router.push('/pricing')}
            >
              {user.planType === 'NONE' || isExpired ? 'Pilih Paket / Perpanjang' : 'Upgrade Paket'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
