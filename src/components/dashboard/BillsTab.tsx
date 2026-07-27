'use client';

import React, { useState } from 'react';
import { useTransactions } from '@/context/TransactionContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { CurrencyInput } from '../ui/CurrencyInput';
import { Select } from '../ui/Select';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { 
  Plus, Edit2, Trash2, Check, X, Bell, BellRing, Receipt, ArrowRightLeft,
  Calendar, FileText, Repeat, ArrowUpRight, ArrowDownRight, DollarSign
} from 'lucide-react';

export function BillsTab() {
  const { 
    subscriptions, 
    debts, 
    addSubscription, 
    editSubscription,
    deleteSubscription,
    toggleSubscriptionPayment,
    addDebt, 
    editDebt,
    deleteDebt,
    payDebt, 
    payDebtPartial,
    toggleDebtStatus,
    accounts,
    transactions,
    requestConfirm,
    isBalanceHidden
  } = useTransactions();

  // Subscription Form States (Add)
  const [subName, setSubName] = useState('');
  const [subAmount, setSubAmount] = useState('');
  const [subCycle, setSubCycle] = useState<'weekly' | 'monthly' | 'yearly' | 'date'>('monthly');
  const [subDay, setSubDay] = useState('1'); // Senin
  const [subDateNum, setSubDateNum] = useState('1'); // Tanggal 1
  const [subYearlyDate, setSubYearlyDate] = useState(new Date().toISOString().split('T')[0]);
  const [subManualDate, setSubManualDate] = useState(new Date().toISOString().split('T')[0]);
  const [subCategory, setSubCategory] = useState('Hiburan');
  const [showSubModal, setShowSubModal] = useState(false);
  const [notifAdd, setNotifAdd] = useState(true);

  // Edit Subscription States
  const [showEditSubModal, setShowEditSubModal] = useState(false);
  const [editingSub, setEditingSub] = useState<any | null>(null);
  const [editSubName, setEditSubName] = useState('');
  const [editSubAmount, setEditSubAmount] = useState('');
  const [editSubCycle, setEditSubCycle] = useState<'weekly' | 'monthly' | 'yearly' | 'date'>('monthly');
  const [editSubDay, setEditSubDay] = useState('1');
  const [editSubDateNum, setEditSubDateNum] = useState('1');
  const [editSubYearlyDate, setEditSubYearlyDate] = useState('');
  const [editSubManualDate, setEditSubManualDate] = useState('');
  const [editSubCategory, setEditSubCategory] = useState('Hiburan');
  const [notifEdit, setNotifEdit] = useState(true);

  // Pay Subscription States
  const [showPaySubModal, setShowPaySubModal] = useState(false);
  const [paySubId, setPaySubId] = useState('');
  const [paySubAccountId, setPaySubAccountId] = useState('');

  const formatIDR = (num: number, forceShow: boolean = false) => {
    if (isBalanceHidden && !forceShow) return 'Rp ••••••••';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  const calculateNextBilling = (cycle: 'weekly' | 'monthly' | 'yearly' | 'date', dDay: string, dDate: string, dYearly: string) => {
    let nextBill = new Date();
    nextBill.setHours(0,0,0,0);
    
    if (cycle === 'weekly') {
      const targetDay = parseInt(dDay);
      let daysToAdd = targetDay - nextBill.getDay();
      if (daysToAdd < 0) daysToAdd += 7;
      nextBill.setDate(nextBill.getDate() + daysToAdd);
    } else if (cycle === 'monthly') {
      const targetDate = parseInt(dDate);
      const currentMonth = nextBill.getMonth();
      const currentYear = nextBill.getFullYear();
      let maxDays = new Date(currentYear, currentMonth + 1, 0).getDate();
      let actualDate = Math.min(targetDate, maxDays);
      let candidate = new Date(currentYear, currentMonth, actualDate);
      
      if (candidate < nextBill) {
        let nextMonth = currentMonth + 1;
        let nextYear = currentYear;
        if (nextMonth > 11) {
          nextMonth = 0;
          nextYear++;
        }
        maxDays = new Date(nextYear, nextMonth + 1, 0).getDate();
        actualDate = Math.min(targetDate, maxDays);
        candidate = new Date(nextYear, nextMonth, actualDate);
      }
      nextBill = candidate;
    } else if (cycle === 'yearly') {
      if (dYearly) {
        nextBill = new Date(dYearly);
        nextBill.setHours(0,0,0,0);
        const today = new Date();
        today.setHours(0,0,0,0);
        if (nextBill < today) {
          nextBill.setFullYear(today.getFullYear() + 1);
        }
      }
    } else if (cycle === 'date') {
      if (dYearly) {
        nextBill = new Date(dYearly);
        nextBill.setHours(0,0,0,0);
      }
    }
    return nextBill.toISOString();
  };

  const handlePaySubSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paySubAccountId || !paySubId) return;
    toggleSubscriptionPayment(paySubId, paySubAccountId);
    setShowPaySubModal(false);
  };

  const handleAddSub = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(subAmount);
    if (!subName || isNaN(amount) || amount <= 0) return;

    addSubscription({
      name: subName,
      amount,
      billingCycle: subCycle,
      nextBilling: calculateNextBilling(subCycle, subDay, subDateNum, subCycle === 'date' ? subManualDate : subYearlyDate),
      category: subCategory
    });

    setSubName('');
    setSubAmount('');
    setSubCycle('monthly');
    setSubDateNum('1');
    setSubDay('1');
    setShowSubModal(false);
  };

  const handleOpenEditSub = (sub: any) => {
    setEditingSub(sub);
    setEditSubName(sub.name);
    setEditSubAmount(sub.amount.toString());
    setEditSubCycle(sub.billingCycle);
    
    const d = new Date(sub.nextBilling);
    setEditSubDay(d.getDay().toString());
    setEditSubDateNum(d.getDate().toString());
    setEditSubYearlyDate(sub.nextBilling.split('T')[0]);
    setEditSubManualDate(sub.nextBilling.split('T')[0]);
    
    setEditSubCategory(sub.category);
    setShowEditSubModal(true);
  };

  const handleEditSubSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(editSubAmount);
    if (!editSubName || isNaN(amount) || amount <= 0 || !editingSub) return;

    editSubscription(editingSub.id, {
      name: editSubName,
      amount,
      billingCycle: editSubCycle,
      nextBilling: calculateNextBilling(editSubCycle, editSubDay, editSubDateNum, editSubCycle === 'date' ? editSubManualDate : editSubYearlyDate),
      category: editSubCategory
    });

    setShowEditSubModal(false);
    setEditingSub(null);
  };

  const handleDeleteSub = (id: string, name: string) => {
    requestConfirm(`Apakah Anda yakin ingin menghapus langganan "${name}"?`, () => {
      deleteSubscription(id);
    });
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Subscriptions & Bills */}
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Receipt size={24} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-800">Tagihan & Langganan</h3>
              <p className="text-xs font-medium text-slate-500 mt-0.5">Kelola pembayaran rutin Anda secara otomatis</p>
            </div>
          </div>
          <Button variant="primary" size="sm" className="font-bold whitespace-nowrap shadow-md shadow-primary/20 hover:shadow-primary/30" onClick={() => setShowSubModal(true)}>
            <Plus size={16} className="mr-1.5" /> Tambah Langganan
          </Button>
        </div>

        {subscriptions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white rounded-3xl border border-dashed border-slate-200">
            <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-4">
              <Receipt size={32} className="text-slate-300" />
            </div>
            <h4 className="text-sm font-extrabold text-slate-700 mb-1">Belum ada tagihan rutin</h4>
            <p className="text-xs text-slate-500 max-w-xs">Tambahkan tagihan seperti internet, listrik, atau Netflix agar tidak lupa bayar.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {subscriptions.map((sub) => {
              const cycleLabel = sub.billingCycle === 'weekly' ? 'Mingguan' : sub.billingCycle === 'monthly' ? 'Bulanan' : sub.billingCycle === 'yearly' ? 'Tahunan' : 'Manual';
              const nextBillDate = new Date(sub.nextBilling);
              const daysLeft = Math.ceil((nextBillDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24));
              const isDueSoon = daysLeft <= 3 && daysLeft >= 0;
              const isOverdue = daysLeft < 0;

              return (
                <div key={sub.id} className="group relative bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-blue-900/5 hover:-translate-y-1 transition-all duration-300 flex flex-col">
                  {/* Status Badge */}
                  {(isDueSoon || isOverdue) && (
                    <div className={`absolute -top-2.5 -right-2.5 px-3 py-1 rounded-full text-[10px] font-extrabold shadow-sm border ${
                      isOverdue ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-amber-100 text-amber-700 border-amber-200'
                    }`}>
                      {isOverdue ? 'Terlewat' : 'Segera'}
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200/60 flex items-center justify-center text-slate-600 shrink-0 group-hover:scale-110 transition-transform">
                        <BellRing size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 line-clamp-1">{sub.name}</h4>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">{sub.category}</span>
                          <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md">{cycleLabel}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-5 flex-1">
                    <div className="text-[10px] font-semibold text-slate-400 mb-0.5">Nominal Tagihan</div>
                    <div className="text-xl font-black text-slate-800 tracking-tight">{formatIDR(sub.amount)}</div>
                    
                    <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[10px] font-bold text-slate-500">Jatuh Tempo</span>
                        <span className={`text-[10px] font-extrabold ${isOverdue ? 'text-rose-600' : isDueSoon ? 'text-amber-600' : 'text-slate-700'}`}>
                          {daysLeft === 0 ? 'Hari Ini' : daysLeft > 0 ? `${daysLeft} hari lagi` : `Lewat ${Math.abs(daysLeft)} hari`}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-slate-700">
                        {nextBillDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-4 border-t border-slate-100/80">
                    <button 
                      onClick={() => {
                        setPaySubId(sub.id);
                        setPaySubAccountId(accounts[0]?.id || '');
                        setShowPaySubModal(true);
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-success text-white text-xs font-bold rounded-xl hover:bg-emerald-600 active:scale-95 transition-all shadow-sm shadow-success/20"
                    >
                      <Check size={14} /> Bayar
                    </button>
                    <button 
                      onClick={() => handleOpenEditSub(sub)}
                      className="w-10 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-xl active:scale-95 transition-all"
                      title="Edit"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={() => handleDeleteSub(sub.id, sub.name)}
                      className="w-10 flex items-center justify-center text-slate-400 hover:text-danger hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl active:scale-95 transition-all"
                      title="Hapus"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL 1: ADD SUBSCRIPTION */}
      <Modal isOpen={showSubModal} onClose={() => setShowSubModal(false)} title="Tambah Langganan Baru">
        <form onSubmit={handleAddSub} className="space-y-4">
          <Input 
            label="Nama Layanan"
            placeholder="e.g. Netflix, Spotify, Canva"
            value={subName}
            onChange={(e) => setSubName(e.target.value)}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CurrencyInput 
              label="Biaya Langganan (Rp)"
              placeholder="e.g. 186000"
              value={subAmount}
              onChange={(e) => setSubAmount(e.target.value)}
            />
            <Select 
              label="Siklus Tagihan"
              value={subCycle}
              onChange={(e) => setSubCycle(e.target.value as any)}
              options={[
                { value: 'weekly', label: 'Mingguan' },
                { value: 'monthly', label: 'Bulanan' },
                { value: 'yearly', label: 'Tahunan' },
                { value: 'date', label: 'Pilih Tanggal Manual' }
              ]}
            />
          </div>

          <div className="flex items-center gap-2 p-3 bg-blue-50/50 border border-blue-100 rounded-xl">
            <input 
              type="checkbox" 
              id="notifAdd" 
              checked={notifAdd}
              onChange={(e) => setNotifAdd(e.target.checked)}
              className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary" 
            />
            <label htmlFor="notifAdd" className="text-xs font-semibold text-slate-700 cursor-pointer">
              Aktifkan Notifikasi Pengingat (H-3)
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subCycle === 'weekly' && (
              <Select 
                label="Pilih Hari"
                value={subDay}
                onChange={(e) => setSubDay(e.target.value)}
                options={[
                  { value: '1', label: 'Senin' },
                  { value: '2', label: 'Selasa' },
                  { value: '3', label: 'Rabu' },
                  { value: '4', label: 'Kamis' },
                  { value: '5', label: 'Jumat' },
                  { value: '6', label: 'Sabtu' },
                  { value: '0', label: 'Minggu' }
                ]}
              />
            )}
            {subCycle === 'monthly' && (
              <Select 
                label="Pilih Tanggal"
                value={subDateNum}
                onChange={(e) => setSubDateNum(e.target.value)}
                options={Array.from({length: 31}, (_, i) => ({ value: String(i + 1), label: String(i + 1) }))}
              />
            )}
            {subCycle === 'yearly' && (
              <Input 
                label="Tanggal & Bulan"
                type="date"
                value={subYearlyDate}
                onChange={(e) => setSubYearlyDate(e.target.value)}
              />
            )}
            {subCycle === 'date' && (
              <Input 
                label="Tanggal Langganan Manual"
                type="date"
                value={subManualDate}
                onChange={(e) => setSubManualDate(e.target.value)}
              />
            )}
            <Select 
              label="Kategori"
              value={subCategory}
              onChange={(e) => setSubCategory(e.target.value)}
              options={[
                { value: 'Hiburan', label: 'Hiburan' },
                { value: 'Tagihan & Utilitas', label: 'Tagihan & Utilitas' },
                { value: 'Makanan & Minuman', label: 'Makanan & Minuman' },
                { value: 'Lainnya', label: 'Lainnya' }
              ]}
            />
          </div>

          <Button type="submit" variant="primary" className="w-full py-2.5">
            Simpan Langganan
          </Button>
        </form>
      </Modal>

      {/* MODAL 2: EDIT SUBSCRIPTION */}
      <Modal isOpen={showEditSubModal} onClose={() => setShowEditSubModal(false)} title="Edit Tagihan Langganan">
        {editingSub && (
          <form onSubmit={handleEditSubSubmit} className="space-y-4">
            <Input 
              label="Nama Layanan"
              value={editSubName}
              onChange={(e) => setEditSubName(e.target.value)}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CurrencyInput 
                label="Biaya Langganan (Rp)"
                value={editSubAmount}
                onChange={(e) => setEditSubAmount(e.target.value)}
              />
              <Select 
                label="Siklus Tagihan"
                value={editSubCycle}
                onChange={(e) => setEditSubCycle(e.target.value as any)}
                options={[
                  { value: 'weekly', label: 'Mingguan' },
                  { value: 'monthly', label: 'Bulanan' },
                  { value: 'yearly', label: 'Tahunan' },
                  { value: 'date', label: 'Pilih Tanggal Manual' }
                ]}
              />
            </div>

            <div className="flex items-center gap-2 p-3 bg-blue-50/50 border border-blue-100 rounded-xl">
              <input 
                type="checkbox" 
                id="notifEdit" 
                checked={notifEdit}
                onChange={(e) => setNotifEdit(e.target.checked)}
                className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary" 
              />
              <label htmlFor="notifEdit" className="text-xs font-semibold text-slate-700 cursor-pointer">
                Aktifkan Notifikasi Pengingat (H-3)
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {editSubCycle === 'weekly' && (
                <Select 
                  label="Pilih Hari"
                  value={editSubDay}
                  onChange={(e) => setEditSubDay(e.target.value)}
                  options={[
                    { value: '1', label: 'Senin' },
                    { value: '2', label: 'Selasa' },
                    { value: '3', label: 'Rabu' },
                    { value: '4', label: 'Kamis' },
                    { value: '5', label: 'Jumat' },
                    { value: '6', label: 'Sabtu' },
                    { value: '0', label: 'Minggu' }
                  ]}
                />
              )}
              {editSubCycle === 'monthly' && (
                <Select 
                  label="Pilih Tanggal"
                  value={editSubDateNum}
                  onChange={(e) => setEditSubDateNum(e.target.value)}
                  options={Array.from({length: 31}, (_, i) => ({ value: String(i + 1), label: String(i + 1) }))}
                />
              )}
              {editSubCycle === 'yearly' && (
                <Input 
                  label="Tanggal & Bulan"
                  type="date"
                  value={editSubYearlyDate}
                  onChange={(e) => setEditSubYearlyDate(e.target.value)}
                />
              )}
              {editSubCycle === 'date' && (
                <Input 
                  label="Tanggal Langganan Manual"
                  type="date"
                  value={editSubManualDate}
                  onChange={(e) => setEditSubManualDate(e.target.value)}
                />
              )}
              <Select 
                label="Kategori"
                value={editSubCategory}
                onChange={(e) => setEditSubCategory(e.target.value)}
                options={[
                  { value: 'Hiburan', label: 'Hiburan' },
                  { value: 'Tagihan & Utilitas', label: 'Tagihan & Utilitas' },
                  { value: 'Makanan & Minuman', label: 'Makanan & Minuman' },
                  { value: 'Lainnya', label: 'Lainnya' }
                ]}
              />
            </div>

            <Button type="submit" variant="primary" className="w-full py-2.5">
              Simpan Perubahan
            </Button>
          </form>
        )}
      </Modal>

      {/* MODAL PAY SUBSCRIPTION */}
      <Modal isOpen={showPaySubModal} onClose={() => setShowPaySubModal(false)} title="Pilih Rekening Pembayaran">
        <form onSubmit={handlePaySubSubmit} className="space-y-4 min-h-[150px]">
          <Select 
            label="Bayar Dari Rekening"
            value={paySubAccountId}
            onChange={(e) => setPaySubAccountId(e.target.value)}
            options={accounts.map(a => ({ value: a.id, label: `${a.name} (Sisa: ${formatIDR(a.balance)})` }))}
          />
          <Button type="submit" variant="primary" className="w-full py-2.5">
            Konfirmasi Pembayaran
          </Button>
        </form>
      </Modal>

    </div>
  );
}
