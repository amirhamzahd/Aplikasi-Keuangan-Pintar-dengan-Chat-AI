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
    requestConfirm
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

  const formatIDR = (num: number) => {
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
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Pembayaran Berulang & Langganan</h3>
            <p className="text-xs text-slate-500">Tagihan bulanan yang terdeteksi otomatis</p>
          </div>
          <Button variant="secondary" size="sm" className="font-semibold text-xs py-1.5 px-3" onClick={() => setShowSubModal(true)}>
            <Plus size={14} /> Langganan
          </Button>
        </div>

        {subscriptions.length === 0 ? (
          <Card className="p-8 text-center text-slate-400">
            <Receipt size={36} className="mx-auto mb-2 opacity-20" />
            <p className="text-xs font-semibold">Tidak ada tagihan langganan aktif.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subscriptions.map((sub) => (
              <Card key={sub.id} className="hover:border-primary/20 transition-all duration-300">
                <CardContent className="p-4 !pt-4 flex flex-col gap-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
                        <BellRing size={16} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 line-clamp-1">{sub.name}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                          Tempo: {new Date(sub.nextBilling).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} - {sub.billingCycle === 'weekly' ? 'MINGGUAN' : sub.billingCycle === 'monthly' ? 'BULANAN' : sub.billingCycle === 'yearly' ? 'TAHUNAN' : 'TANGGAL MANUAL'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-sm font-bold text-slate-900">{formatIDR(sub.amount)}</span>
                      <span className="block text-[9px] uppercase font-bold text-slate-400">{sub.category}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2 pt-2.5 border-t border-slate-100">
                    <button 
                      onClick={() => {
                        setPaySubId(sub.id);
                        setPaySubAccountId(accounts[0]?.id || '');
                        setShowPaySubModal(true);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold text-slate-500 hover:text-success hover:bg-success/10 rounded-md transition cursor-pointer"
                      title="Bayar Bulan Ini"
                    >
                      <Check size={12} /> Bayar
                    </button>
                    <button 
                      onClick={() => handleOpenEditSub(sub)}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold text-slate-500 hover:text-primary hover:bg-slate-100 rounded-md transition cursor-pointer"
                      title="Edit Langganan"
                    >
                      <Edit2 size={12} /> Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteSub(sub.id, sub.name)}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold text-slate-500 hover:text-danger hover:bg-danger/10 rounded-md transition cursor-pointer"
                      title="Hapus Langganan"
                    >
                      <Trash2 size={12} /> Hapus
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
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
