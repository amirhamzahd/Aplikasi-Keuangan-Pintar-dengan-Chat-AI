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
      <div className="space-y-4 pt-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Hutang & Piutang</h3>
            <p className="text-xs text-slate-500">Kelola pinjaman dan penagihan dana</p>
          </div>
          <Button variant="secondary" size="sm" className="font-semibold text-xs py-1.5 px-3" onClick={() => setShowDebtModal(true)}>
            <Plus size={14} /> Catat Hutang
          </Button>
        </div>

        {debts.length === 0 ? (
          <Card className="p-8 text-center text-slate-400">
            <Receipt size={36} className="mx-auto mb-2 opacity-20" />
            <p className="text-xs font-semibold">Tidak ada catatan hutang/piutang aktif.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {debts.map((d) => (
              <Card key={d.id} className={`border-l-4 ${d.status === 'paid' ? 'border-l-slate-300 opacity-60' : d.type === 'debt' ? 'border-l-danger' : 'border-l-success'}`}>
                <CardContent className="p-4 !pt-4 flex flex-col gap-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl shrink-0 ${d.type === 'debt' ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'}`}>
                        <DollarSign size={16} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 line-clamp-1">{d.person}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                          {d.type === 'debt' ? 'Anda berhutang' : 'Berhutang pada Anda'} • Tenggat: {d.dueDate ? new Date(d.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-sm font-bold text-slate-900">{formatIDR(d.amount)}</span>
                      <Badge variant={d.status === 'paid' ? 'secondary' : d.type === 'debt' ? 'danger' : 'success'} className="block mt-0.5 text-[9px] py-0">
                        {d.status === 'paid' ? 'Lunas' : d.type === 'debt' ? 'Sisa Hutang' : 'Sisa Piutang'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2 pt-2.5 border-t border-slate-100 flex-wrap">
                    {d.status === 'pending' && (
                      <>
                        <button 
                          onClick={() => handleOpenPayDebt(d)}
                          title="Lunas Sekaligus"
                          className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold text-slate-500 hover:text-success hover:bg-success/10 rounded-md transition cursor-pointer"
                        >
                          <Check size={12} /> Lunas
                        </button>
                        <button 
                          onClick={() => handleOpenInstallment(d)}
                          title="Bayar Cicilan / Parsial"
                          className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold text-slate-500 hover:text-primary hover:bg-primary/10 rounded-md transition cursor-pointer"
                        >
                          <DollarSign size={12} /> Cicil
                        </button>
                      </>
                    )}
                    {d.status === 'paid' && (
                      <button 
                        onClick={() => toggleDebtStatus(d.id)}
                        title="Tandai Belum Lunas"
                        className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold text-slate-400 hover:text-warning hover:bg-warning/10 rounded-md transition cursor-pointer"
                      >
                        <ArrowRightLeft size={12} /> Batal Lunas
                      </button>
                    )}
                    <button 
                      onClick={() => handleOpenEditDebt(d)}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold text-slate-400 hover:text-primary hover:bg-slate-100 rounded-md transition cursor-pointer"
                      title="Edit Catatan"
                    >
                      <Edit2 size={12} /> Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteDebt(d.id, d.person)}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold text-slate-400 hover:text-danger hover:bg-danger/10 rounded-md transition cursor-pointer"
                      title="Hapus Catatan"
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
