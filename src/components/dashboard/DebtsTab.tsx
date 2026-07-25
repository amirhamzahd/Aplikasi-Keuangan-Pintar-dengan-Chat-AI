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

export function DebtsTab() {
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

  // Debt Form States (Add)
  const [debtPerson, setDebtPerson] = useState('');
  const [debtAmount, setDebtAmount] = useState('');
  const [debtType, setDebtType] = useState<'debt' | 'receivable'>('debt');
  const [debtDueDate, setDebtDueDate] = useState('');
  const [debtAccountId, setDebtAccountId] = useState('');
  const [showDebtModal, setShowDebtModal] = useState(false);

  // Edit Debt States
  const [showEditDebtModal, setShowEditDebtModal] = useState(false);
  const [editingDebt, setEditingDebt] = useState<any>(null);
  const [editDebtPerson, setEditDebtPerson] = useState('');
  const [editDebtAmount, setEditDebtAmount] = useState('');
  const [editDebtType, setEditDebtType] = useState<'debt' | 'receivable'>('debt');
  const [editDebtStatus, setEditDebtStatus] = useState<'pending' | 'paid'>('pending');
  const [editDebtDueDate, setEditDebtDueDate] = useState('');
  const [editDebtAccountId, setEditDebtAccountId] = useState('');

  // Lunas Debt form states
  const [showPayDebtModal, setShowPayDebtModal] = useState(false);
  const [payDebtSelected, setPayDebtSelected] = useState<any>(null);
  const [payDebtAccountId, setPayDebtAccountId] = useState('');

  // Installment (Cicilan) States
  const [showInstallmentModal, setShowInstallmentModal] = useState(false);
  const [installmentDebt, setInstallmentDebt] = useState<any | null>(null);
  const [installmentAmount, setInstallmentAmount] = useState('');
  const [installmentAccountId, setInstallmentAccountId] = useState('');

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  const handleAddDebt = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(debtAmount);
    if (!debtPerson || isNaN(amount) || amount <= 0 || !debtAccountId) return;

    addDebt({
      person: debtPerson,
      amount,
      type: debtType,
      dueDate: debtDueDate || "",
      accountId: debtAccountId
    });

    setDebtPerson('');
    setDebtAmount('');
    setDebtDueDate('');
    setDebtAccountId('');
    setShowDebtModal(false);
  };

  const handleOpenEditDebt = (d: any) => {
    setEditingDebt(d);
    setEditDebtPerson(d.person);
    setEditDebtAmount(d.amount.toString());
    setEditDebtType(d.type);
    setEditDebtDueDate(d.dueDate ? new Date(d.dueDate).toISOString().split('T')[0] : '');
    setEditDebtAccountId(d.accountId || '');
    setShowEditDebtModal(true);
  };

  const handleOpenPayDebt = (d: any) => {
    setPayDebtSelected(d);
    setPayDebtAccountId(accounts.length > 0 ? accounts[0].id : '');
    setShowPayDebtModal(true);
  };

  const handlePayDebtSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payDebtSelected || !payDebtAccountId) return;
    payDebt(payDebtSelected.id, payDebtAccountId);
    setShowPayDebtModal(false);
    setPayDebtSelected(null);
  };

  const handleEditDebtSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(editDebtAmount);
    if (!editDebtPerson || isNaN(amt) || amt <= 0 || !editingDebt) return;

    editDebt(editingDebt.id, {
      person: editDebtPerson,
      amount: amt,
      type: editDebtType,
      dueDate: editDebtDueDate ? new Date(editDebtDueDate).toISOString() : "",
      status: editDebtStatus,
      accountId: editDebtAccountId
    });

    setShowEditDebtModal(false);
    setEditingDebt(null);
  };

  const handleDeleteDebt = (id: string, person: string) => {
    requestConfirm(`Apakah Anda yakin ingin menghapus catatan hutang/piutang untuk "${person}"?`, () => {
      deleteDebt(id);
    });
  };

  const handleOpenInstallment = (d: any) => {
    setInstallmentDebt(d);
    setInstallmentAmount('');
    if (accounts.length > 0) {
      setInstallmentAccountId(accounts[0].id);
    }
    setShowInstallmentModal(true);
  };

  const handleInstallmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(installmentAmount);
    if (!installmentDebt || isNaN(amt) || amt <= 0 || !installmentAccountId) return;
    
    payDebtPartial(installmentDebt.id, amt, installmentAccountId);
    setShowInstallmentModal(false);
    setInstallmentDebt(null);
  };

  return (
    <div className="space-y-6">
      

      {/* 2. Debts and Receivables (Hutang Piutang) */}
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <ArrowRightLeft size={24} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-800">Hutang & Piutang</h3>
              <p className="text-xs font-medium text-slate-500 mt-0.5">Kelola pinjaman dan penagihan dana Anda</p>
            </div>
          </div>
          <Button variant="primary" size="sm" className="font-bold whitespace-nowrap shadow-md shadow-primary/20 hover:shadow-primary/30" onClick={() => setShowDebtModal(true)}>
            <Plus size={16} className="mr-1.5" /> Catat Hutang
          </Button>
        </div>

        {debts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white rounded-3xl border border-dashed border-slate-200">
            <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-4">
              <Receipt size={32} className="text-slate-300" />
            </div>
            <h4 className="text-sm font-extrabold text-slate-700 mb-1">Belum ada catatan hutang/piutang</h4>
            <p className="text-xs text-slate-500 max-w-xs">Catat hutang atau piutang agar arus kas Anda tetap termonitor dengan baik.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {debts.map((d) => (
              <div key={d.id} className={`bg-white rounded-3xl border ${d.status === 'paid' ? 'border-slate-200 opacity-70' : d.type === 'debt' ? 'border-rose-100 shadow-sm hover:shadow-md hover:shadow-rose-900/5' : 'border-emerald-100 shadow-sm hover:shadow-md hover:shadow-emerald-900/5'} transition-all duration-300 p-5 flex flex-col`}>
                <div className="flex justify-between items-start gap-4 mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-black shrink-0 ${d.status === 'paid' ? 'bg-slate-100 text-slate-400' : d.type === 'debt' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                      {d.person.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-800 line-clamp-1">{d.person}</h4>
                      <p className="text-[10px] font-bold mt-0.5 tracking-wider uppercase">
                        <span className={d.status === 'paid' ? 'text-slate-400' : d.type === 'debt' ? 'text-rose-500' : 'text-emerald-500'}>
                          {d.type === 'debt' ? 'Anda Berhutang' : 'Berhutang ke Anda'}
                        </span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right shrink-0">
                    <Badge variant={d.status === 'paid' ? 'secondary' : d.type === 'debt' ? 'danger' : 'success'} className="px-2 py-0.5 text-[9px]">
                      {d.status === 'paid' ? 'LUNAS' : d.type === 'debt' ? 'SISA HUTANG' : 'SISA PIUTANG'}
                    </Badge>
                  </div>
                </div>
                
                <div className="mb-5 flex-1">
                  <div className="text-[10px] font-semibold text-slate-400 mb-0.5">Nominal</div>
                  <div className={`text-xl font-black tracking-tight ${d.status === 'paid' ? 'text-slate-400' : 'text-slate-800'}`}>
                    {formatIDR(d.amount)}
                  </div>
                  
                  {d.dueDate && (
                    <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                      <Calendar size={12} className="text-slate-400" />
                      Tenggat: <span className="text-slate-700">{new Date(d.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100">
                  {d.status === 'pending' && (
                    <>
                      <button 
                        onClick={() => handleOpenPayDebt(d)}
                        className="flex-1 min-w-[80px] flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 active:scale-95 transition-all shadow-sm"
                      >
                        <Check size={14} /> Lunas
                      </button>
                      <button 
                        onClick={() => handleOpenInstallment(d)}
                        className="flex-1 min-w-[80px] flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-200 active:scale-95 transition-all"
                      >
                        <DollarSign size={14} /> Cicil
                      </button>
                    </>
                  )}
                  {d.status === 'paid' && (
                    <button 
                      onClick={() => toggleDebtStatus(d.id)}
                      className="flex-1 min-w-[100px] flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-50 text-amber-700 text-xs font-bold rounded-xl hover:bg-amber-100 active:scale-95 transition-all"
                    >
                      <ArrowRightLeft size={14} /> Batal Lunas
                    </button>
                  )}
                  <button 
                    onClick={() => handleOpenEditDebt(d)}
                    className="w-10 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-xl active:scale-95 transition-all"
                    title="Edit"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button 
                    onClick={() => handleDeleteDebt(d.id, d.person)}
                    className="w-10 flex items-center justify-center text-slate-400 hover:text-danger hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl active:scale-95 transition-all"
                    title="Hapus"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>



      {/* MODAL 3: ADD DEBT */}
      <Modal isOpen={showDebtModal} onClose={() => setShowDebtModal(false)} title="Catat Hutang / Piutang Baru">
        <form onSubmit={handleAddDebt} className="space-y-4">
          <Input 
            label="Nama Orang / Pihak"
            placeholder="e.g. Budi, Bank Mandiri"
            value={debtPerson}
            onChange={(e) => setDebtPerson(e.target.value)}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CurrencyInput 
              label="Nominal (Rp)"
              placeholder="e.g. 500000"
              value={debtAmount}
              onChange={(e) => setDebtAmount(e.target.value)}
            />
            <Select 
              label="Jenis Catatan"
              value={debtType}
              onChange={(e) => setDebtType(e.target.value as any)}
              options={[
                { value: 'debt', label: 'Saya Berhutang (Hutang)' },
                { value: 'receivable', label: 'Orang Lain Berhutang (Piutang)' }
              ]}
            />
          </div>

          <Select 
            label={debtType === 'debt' ? "Masuk ke Rekening (Pemasukan)" : "Keluar dari Rekening (Pengeluaran)"}
            value={debtAccountId}
            onChange={(e) => setDebtAccountId(e.target.value)}
            options={[
              { value: '', label: 'Pilih Rekening' },
              ...accounts.map(a => ({ value: a.id, label: `${a.name} (Saldo: ${formatIDR(a.balance)})` }))
            ]}
          />

          <Input 
            label="Tanggal Jatuh Tempo (Opsional)"
            type="date"
            value={debtDueDate}
            onChange={(e) => setDebtDueDate(e.target.value)}
          />

          <Button type="submit" variant="primary" className="w-full py-2.5">
            Simpan Catatan
          </Button>
        </form>
      </Modal>

      {/* MODAL 4: EDIT DEBT */}
      <Modal isOpen={showEditDebtModal} onClose={() => setShowEditDebtModal(false)} title="Edit Catatan Hutang / Piutang">
        {editingDebt && (
          <form onSubmit={handleEditDebtSubmit} className="space-y-4">
            <Input 
              label="Nama Orang / Pihak"
              value={editDebtPerson}
              onChange={(e) => setEditDebtPerson(e.target.value)}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CurrencyInput 
                label="Nominal (Rp)"
                value={editDebtAmount}
                onChange={(e) => setEditDebtAmount(e.target.value)}
              />
              <Select 
                label="Jenis Catatan"
                value={editDebtType}
                onChange={(e) => setEditDebtType(e.target.value as any)}
                options={[
                  { value: 'debt', label: 'Saya Berhutang (Hutang)' },
                  { value: 'receivable', label: 'Orang Lain Berhutang (Piutang)' }
                ]}
              />
            </div>

            <Select 
              label={editDebtType === 'debt' ? "Masuk ke Rekening (Pemasukan)" : "Keluar dari Rekening (Pengeluaran)"}
              value={editDebtAccountId}
              onChange={(e) => setEditDebtAccountId(e.target.value)}
              options={[
                { value: '', label: 'Pilih Rekening' },
                ...accounts.map(a => ({ value: a.id, label: `${a.name} (Saldo: ${formatIDR(a.balance)})` }))
              ]}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input 
                label="Tanggal Jatuh Tempo"
                type="date"
                value={editDebtDueDate}
                onChange={(e) => setEditDebtDueDate(e.target.value)}
              />
              <Select 
                label="Status Pembayaran"
                value={editDebtStatus}
                onChange={(e) => setEditDebtStatus(e.target.value as any)}
                options={[
                  { value: 'pending', label: 'Belum Lunas' },
                  { value: 'paid', label: 'Sudah Lunas' }
                ]}
              />
            </div>

            <Button type="submit" variant="primary" className="w-full py-2.5">
              Simpan Perubahan
            </Button>
          </form>
        )}
      </Modal>

      {/* MODAL 5: INSTALLMENT (CICILAN) */}
      <Modal isOpen={showInstallmentModal} onClose={() => setShowInstallmentModal(false)} title="Bayar Cicilan / Parsial">
        {installmentDebt && (
          <form onSubmit={handleInstallmentSubmit} className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Total {installmentDebt.type === 'debt' ? 'Hutang ke' : 'Piutang dari'} {installmentDebt.person}</p>
                <p className="text-lg font-extrabold text-slate-900 mt-0.5">{formatIDR(installmentDebt.amount)}</p>
              </div>
            </div>
            
            <CurrencyInput 
              label="Nominal Cicilan / Pembayaran (Rp)"
              value={installmentAmount}
              onChange={(e) => setInstallmentAmount(e.target.value)}
              placeholder="e.g. 100000"
            /><Select 
              label={installmentDebt.type === 'debt' ? 'Bayar Menggunakan (Sumber Dana)' : 'Masuk ke (Tujuan Dana)'}
              value={installmentAccountId}
              onChange={(e) => setInstallmentAccountId(e.target.value)}
              options={accounts.map(a => ({ value: a.id, label: `${a.name} (Rp${a.balance.toLocaleString('id-ID')})` }))}
            />

            <Button type="submit" variant="primary" className="w-full py-2.5">
              Konfirmasi Cicilan
            </Button>
          </form>
        )}
      </Modal>

      {/* MODAL 6: LUNAS DEBT */}
      <Modal isOpen={showPayDebtModal} onClose={() => setShowPayDebtModal(false)} title="Lunas Catatan Hutang / Piutang">
        {payDebtSelected && (
          <form onSubmit={handlePayDebtSubmit} className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Total {payDebtSelected.type === 'debt' ? 'Hutang ke' : 'Piutang dari'} {payDebtSelected.person}</p>
                <p className="text-lg font-extrabold text-slate-900 mt-0.5">{formatIDR(payDebtSelected.amount)}</p>
              </div>
            </div>
            
            <Select 
              label={payDebtSelected.type === 'debt' ? 'Bayar Menggunakan (Sumber Dana)' : 'Masuk ke (Tujuan Dana)'}
              value={payDebtAccountId}
              onChange={(e) => setPayDebtAccountId(e.target.value)}
              options={accounts.map(a => ({ value: a.id, label: `${a.name} (Rp${a.balance.toLocaleString('id-ID')})` }))}
            />

            <Button type="submit" variant="primary" className="w-full py-2.5">
              Konfirmasi Pelunasan
            </Button>
          </form>
        )}
      </Modal>

    </div>
  );
}
