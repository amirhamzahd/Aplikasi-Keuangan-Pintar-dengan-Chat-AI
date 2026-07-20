'use client';

import React, { useState } from 'react';
import { useTransactions } from '@/context/TransactionContext';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { CurrencyInput } from '../ui/CurrencyInput';
import { Select } from '../ui/Select';
import { Modal } from '../ui/Modal';
import { Plus, Edit2, Trash2, ArrowRightLeft } from 'lucide-react';

// Map keywords to local SVG filenames in /bank-icons/
const BANK_ICON_MAP: Record<string, string> = {
  bca: 'bca',
  mandiri: 'mandiri',
  bni: 'bni',
  bri: 'bri',
  bsi: 'bsi',
  seabank: 'seabank',
  jago: 'jago',
  jenius: 'jenius',
  gopay: 'gopay',
  ovo: 'ovo',
  dana: 'dana',
  shopeepay: 'shopeepay',
  shopee: 'shopeepay',
  linkaja: 'linkaja',
  blu: 'blu',
  danamon: 'danamon',
  permata: 'permata',
  cimb: 'cimb',
  mega: 'mega',
  panin: 'panin',
  btn: 'btn',
  ocbc: 'ocbc',
  bukopin: 'bukopin',
  maybank: 'maybank',
  cash: 'cash',
  tunai: 'cash',
};

// Fallback icons per account type
const TYPE_FALLBACK_ICON: Record<string, string> = {
  BANK: 'bank',
  E_WALLET: 'ewallet',
  CASH: 'cash',
  CREDIT: 'credit',
};

const getBankIconPath = (name: string, type: string): string => {
  const n = name.toLowerCase();
  for (const [keyword, iconFile] of Object.entries(BANK_ICON_MAP)) {
    if (n.includes(keyword)) return `/bank-icons/${iconFile}.svg`;
  }
  // Fallback to type-based icon
  return `/bank-icons/${TYPE_FALLBACK_ICON[type] || 'bank'}.svg`;
};

function BankIcon({ name, type }: { name: string, type: string }) {
  const iconPath = getBankIconPath(name, type);

  return (
    <img 
      src={iconPath} 
      alt={name} 
      className="w-8 h-8 object-contain rounded-lg"
    />
  );
}

export function AccountsTab() {
  const { accounts, addAccount, editAccount, deleteAccount, transactions, requestConfirm, addTransaction, debts } = useTransactions();

  // Add State
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('BANK');
  const [balance, setBalance] = useState('');
  
  // Funding Source Logic
  const [sourceAccountId, setSourceAccountId] = useState('');
  

  // Edit State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState('BANK');
  const [editBalance, setEditBalance] = useState('');

  // Transfer State
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferSource, setTransferSource] = useState('');
  const [transferDest, setTransferDest] = useState('');
  const [transferDesc, setTransferDesc] = useState('Tarik / Pindah Tunai');
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split('T')[0]);

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  const totalPiutang = (debts || []).filter(d => d.type === 'receivable' && d.status === 'pending').reduce((sum, d) => sum + d.amount, 0);



  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let bal = parseFloat(balance);
    if (isNaN(bal)) bal = 0;
    
    // Safety check: First account MUST be 0
    if (accounts.length === 0) {
      bal = 0;
    }

    if (!name.trim()) return;
    if (bal > 0 && !sourceAccountId) {
      alert('Pilih Rekening asal untuk transfer');
      return;
    }

    // 1. Create account with ZERO balance
    const newAcc = await addAccount(name.trim(), type, 0);

    // 2. Inject initial funding via internal transfer if > 0
    if (bal > 0 && newAcc?.data?.id && sourceAccountId) {
      const targetAccId = newAcc.data.id;
      await addTransaction({
        description: `Pindahan saldo awal ke ${name}`,
        amount: bal,
        type: 'transfer',
        category: 'Transfer',
        accountId: sourceAccountId, // From source
        toAccountId: targetAccId,   // To new account
        tags: ['transfer_awal'],
        date: new Date().toISOString()
      });
    }

    setName('');
    setType('BANK');
    setBalance('');
    setSourceAccountId('');
    setShowAddModal(false);
  };

  const handleOpenEdit = (acc: any) => {
    setEditingAccount(acc);
    setEditName(acc.name);
    setEditType(acc.type);
    setEditBalance(acc.balance.toString());
    setShowEditModal(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !editingAccount) return;

    let newBal = parseFloat(editBalance);
    if (isNaN(newBal)) newBal = editingAccount.balance;

    requestConfirm(`Yakin ingin menyimpan perubahan pada rekening "${editingAccount.name}"?`, () => {
      editAccount(editingAccount.id, editName.trim(), editType, newBal);
      setShowEditModal(false);
      setEditingAccount(null);
    });
  };

  const handleDelete = (id: string, accountName: string) => {
    requestConfirm(`Peringatan: Yakin ingin menghapus rekening "${accountName}" beserta seluruh isinya?`, () => {
      deleteAccount(id);
    });
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(transferAmount);
    if (isNaN(amt) || amt <= 0 || !transferSource || !transferDest) return;

    if (transferSource === transferDest) {
      alert("Rekening asal dan tujuan tidak boleh sama.");
      return;
    }

    const sourceAcc = accounts.find(a => a.id === transferSource);
    if (!sourceAcc || sourceAcc.balance < amt) {
      alert("Saldo rekening asal tidak mencukupi untuk transfer ini.");
      return;
    }

    await addTransaction({
      description: transferDesc.trim() || 'Tarik / Pindah Tunai',
      amount: amt,
      type: 'transfer',
      category: 'Transfer',
      accountId: transferSource,
      toAccountId: transferDest,
      tags: [],
      date: transferDate ? new Date(transferDate).toISOString() : new Date().toISOString()
    });

    setTransferAmount('');
    setTransferSource('');
    setTransferDest('');
    setShowTransferModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Kelola Rekening</h2>
          <p className="text-xs text-slate-500 mt-0.5">Tambah dan kelola rekening bank, e-wallet, dan kas tunai Anda</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => setShowTransferModal(true)} className="text-xs font-bold py-2 px-4 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white shadow-md border-0 rounded-full transition-all">
            <ArrowRightLeft size={14} className="mr-1.5" /> Transfer Saldo
          </Button>
          <Button variant="primary" onClick={() => setShowAddModal(true)} className="text-xs font-semibold py-2 px-4 rounded-full shadow-md bg-[#2563EB] hover:bg-[#1D4ED8]">
            <Plus size={16} className="mr-1" /> Tambah Rekening
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-md text-white">
          <p className="text-xs font-semibold opacity-90 uppercase tracking-wider mb-1">Total Saldo Tersedia (Fisik)</p>
          <h3 className="text-2xl font-black">{formatIDR(totalBalance)}</h3>
        </div>

        <div className="p-4 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl shadow-md text-white">
          <p className="text-xs font-semibold opacity-90 uppercase tracking-wider mb-1">Uang Di Orang Lain (Piutang)</p>
          <h3 className="text-2xl font-black">{formatIDR(totalPiutang)}</h3>
        </div>
        
        <div className="p-4 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl shadow-md text-white">
          <p className="text-xs font-semibold opacity-90 uppercase tracking-wider mb-1">Kekayaan Bersih (Net Worth)</p>
          <h3 className="text-2xl font-black">{formatIDR(totalBalance + totalPiutang)}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((acc) => (
          <Card key={acc.id} className="hover:border-blue-500/30 hover:shadow-lg transition-all duration-300 relative group bg-white border border-slate-100 rounded-3xl">
            <CardContent className="!p-6 flex items-center gap-4 min-h-[96px]">
              <div className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-xl bg-[#F4F7FE] flex items-center justify-center shrink-0 overflow-hidden shadow-inner border border-slate-100/50">
                <BankIcon name={acc.name} type={acc.type} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[15px] font-bold text-slate-900 leading-tight truncate">{acc.name}</h4>
                <p className="text-[13px] font-semibold text-slate-500 mt-1 truncate">{formatIDR(acc.balance)}</p>
                <div className="mt-2">
                  <span className="inline-block text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border border-slate-100 bg-slate-50 text-slate-400 tracking-wider">
                    {acc.type}
                  </span>
                </div>
              </div>
            </CardContent>
            
            {/* Edit Button Bottom Right */}
            <button 
              onClick={() => handleOpenEdit(acc)}
              className="absolute bottom-5 right-5 p-1.5 text-slate-300 hover:text-primary transition cursor-pointer"
              title="Edit Rekening"
            >
              <Edit2 size={15} strokeWidth={2.5} />
            </button>
            
            {/* Delete button (Top Right) if balance 0 */}
            {acc.balance === 0 && (
              <button 
                onClick={() => handleDelete(acc.id, acc.name)}
                className="absolute top-5 right-5 p-1.5 text-slate-300 hover:text-danger opacity-0 group-hover:opacity-100 transition cursor-pointer"
                title="Hapus Rekening"
              >
                <Trash2 size={15} />
              </button>
            )}
          </Card>
        ))}
      </div>

      {/* MODAL ADD */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Tambah Rekening Baru">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <Input 
            label="Nama Rekening"
            placeholder="e.g. Bank Mandiri, GoPay"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div>
            <label className="text-xs font-semibold text-slate-700">Saldo Awal</label>
            <CurrencyInput 
              value={accounts.length === 0 ? '0' : balance} 
              onChange={(e) => setBalance(e.target.value)} 
              placeholder="0 (Boleh Dikosongkan)" 
              min="0"
              disabled={accounts.length === 0}
            />
            {accounts.length === 0 && (
              <p className="text-[10px] text-slate-500 mt-1">
                *Rekening pertama otomatis bersaldo Rp0. Anda bisa mengisi saldonya melalui menu Pemasukan nanti.
              </p>
            )}
          </div>

          {accounts.length > 0 && parseFloat(balance) > 0 && (
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-3">
              <label className="text-xs font-semibold text-slate-700">Asal Usul Saldo (Transfer Internal)</label>
              
              <div>
                <Select 
                  value={sourceAccountId} 
                  onChange={(e) => setSourceAccountId(e.target.value)} 
                  required
                  options={[
                    { value: '', label: 'Pilih Rekening Asal...' },
                    ...accounts.map(acc => ({ value: acc.id, label: `${acc.name} - ${formatIDR(acc.balance)}` }))
                  ]}
                />
                <p className="text-[10px] text-slate-500 mt-1">*Uang akan dipindahkan secara otomatis dan memotong saldo Rekening Asal yang dipilih.</p>
              </div>
            </div>
          )}

          <div className="pt-2">
            <Select 
              label="Jenis Rekening"
              value={type}
              onChange={(e) => setType(e.target.value)}
              options={[
                { value: 'BANK', label: 'Bank' },
                { value: 'E_WALLET', label: 'E-Wallet' },
                { value: 'CASH', label: 'Tunai' },
                { value: 'CREDIT', label: 'Kartu Kredit' }
              ]}
            />
          </div>
          <Button type="submit" variant="primary" className="w-full py-2.5">
            Simpan Rekening
          </Button>
        </form>
      </Modal>

      {/* MODAL EDIT */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Rekening">
        {editingAccount && (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <Input 
              label="Nama Rekening"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
            <CurrencyInput 
              label="Saldo (Rp)"
              min="0"
              value={editBalance}
              onChange={(e) => setEditBalance(e.target.value)}
            />
            <div className="pt-2">
              <Select 
                label="Jenis Rekening"
                value={editType}
                onChange={(e) => setEditType(e.target.value)}
                options={[
                  { value: 'BANK', label: 'Bank' },
                  { value: 'E_WALLET', label: 'E-Wallet' },
                  { value: 'CASH', label: 'Tunai' },
                  { value: 'CREDIT', label: 'Kartu Kredit' }
                ]}
              />
            </div>
            <Button type="submit" variant="primary" className="w-full py-2.5">
              Simpan Perubahan
            </Button>
          </form>
        )}
      </Modal>

      {/* MODAL TRANSFER */}
      <Modal isOpen={showTransferModal} onClose={() => setShowTransferModal(false)} title="Transfer Saldo / Tarik Tunai">
        <form onSubmit={handleTransferSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select 
              label="Ambil dari (Rekening Asal)"
              value={transferSource}
              onChange={(e) => setTransferSource(e.target.value)}
              required
              options={[
                { value: '', label: 'Pilih Rekening...' },
                ...accounts.map(a => ({ value: a.id, label: `${a.name} (Rp${a.balance.toLocaleString('id-ID')})` }))
              ]}
            />
            <Select 
              label="Pindahkan ke (Rekening Tujuan)"
              value={transferDest}
              onChange={(e) => setTransferDest(e.target.value)}
              required
              options={[
                { value: '', label: 'Pilih Rekening...' },
                ...accounts.map(a => ({ value: a.id, label: `${a.name} (Rp${a.balance.toLocaleString('id-ID')})` }))
              ]}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700">Nominal Transfer (Rp)</label>
            <CurrencyInput 
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              placeholder="e.g. 1000000"
              required
              min="1"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Keterangan"
              value={transferDesc}
              onChange={(e) => setTransferDesc(e.target.value)}
              placeholder="e.g. Tarik tunai, pindah bank"
            />
            <Input 
              label="Tanggal"
              type="date"
              value={transferDate}
              onChange={(e) => setTransferDate(e.target.value)}
              required
            />
          </div>
          <Button type="submit" variant="primary" className="w-full py-2.5">
            Proses Transfer
          </Button>
        </form>
      </Modal>

    </div>
  );
}
