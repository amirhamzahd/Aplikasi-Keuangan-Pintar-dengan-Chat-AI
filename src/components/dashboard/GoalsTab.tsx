import React, { useState, useMemo } from 'react';
import { useTransactions } from '@/context/TransactionContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { CurrencyInput } from '../ui/CurrencyInput';
import { Select } from '../ui/Select';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { Sparkles, Calendar, TrendingUp, PiggyBank, ArrowRight, ShieldCheck, Edit2, Trash2 } from 'lucide-react';

export function GoalsTab() {
  const { goals, addGoal, editGoal, deleteGoal, saveToGoal, accounts, transactions, requestConfirm } = useTransactions();
  
  // Goal Form State
  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Quick Deposit Form State
  const [selectedGoal, setSelectedGoal] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [depositError, setDepositError] = useState('');

  // Edit Goal Modal States
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<{ id: string; name: string; target: number; targetDate: string; current: number } | null>(null);
  const [editName, setEditName] = useState('');
  const [editTarget, setEditTarget] = useState('');
  const [editTargetDate, setEditTargetDate] = useState('');
  const [editCurrent, setEditCurrent] = useState('');

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  // Estimate monthly savings speed
  const monthlySavingsSpeed = useMemo(() => {
    let inc = 0;
    let exp = 0;
    transactions.forEach(t => {
      if (t.type === 'income') inc += t.amount;
      if (t.type === 'expense') exp += t.amount;
    });
    const net = inc - exp;
    return net > 0 ? net : 1000000; // fallback to 1jt/month speed if negative or empty
  }, [transactions]);

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');

    const target = parseFloat(targetAmount);
    if (!goalName || isNaN(target) || target <= 0 || !targetDate) return;

    addGoal(goalName, target, targetDate);
    setGoalName('');
    setTargetAmount('');
    setTargetDate('');
    setSuccessMsg(`Target Tabungan "${goalName}" berhasil didaftarkan!`);

    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleQuickDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    setDepositError('');

    const amount = parseFloat(depositAmount);
    if (!selectedGoal || isNaN(amount) || amount <= 0 || !selectedAccount) {
      setDepositError('Harap lengkapi semua field deposit.');
      return;
    }

    const acc = accounts.find(a => a.id === selectedAccount);
    if (!acc || acc.balance < amount) {
      setDepositError('Saldo rekening terpilih tidak mencukupi.');
      return;
    }

    saveToGoal(selectedGoal, amount, selectedAccount);
    setDepositAmount('');
    setSelectedGoal('');
    setSelectedAccount('');
  };

  const handleOpenEdit = (g: any) => {
    setEditingGoal(g);
    setEditName(g.name);
    setEditTarget(g.target.toString());
    setEditTargetDate(g.targetDate.split('T')[0]);
    setEditCurrent(g.current.toString());
    setShowEditModal(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetVal = parseFloat(editTarget);
    const currentVal = parseFloat(editCurrent);
    if (!editName || isNaN(targetVal) || targetVal <= 0 || isNaN(currentVal) || currentVal < 0 || !editTargetDate || !editingGoal) return;

    editGoal(editingGoal.id, editName, targetVal, editTargetDate, currentVal);
    setShowEditModal(false);
    setEditingGoal(null);
  };

  const handleDeleteGoal = (id: string, name: string) => {
    requestConfirm(`Apakah Anda yakin ingin menghapus target tabungan "${name}"?`, () => {
      deleteGoal(id);
    });
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Configuration & Deposit Forms */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Create Target */}
        <Card>
          <CardHeader>
            <CardTitle>Buat Target Tabungan Baru</CardTitle>
            <CardDescription>Definisikan impian finansial Anda</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddGoal} className="space-y-4">
              {successMsg && (
                <div className="p-3 rounded-xl bg-success/10 border border-success/20 text-xs font-semibold text-success">
                  {successMsg}
                </div>
              )}

              <Input 
                label="Nama Impian / Barang"
                placeholder="e.g. Liburan Jepang, MacBook Pro"
                value={goalName}
                onChange={(e) => setGoalName(e.target.value)}
              />

              <div className="grid grid-cols-2 gap-4">
                <CurrencyInput 
                  label="Target Dana (Rp)"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  placeholder="e.g. 20000000"
                />
                <Input 
                  label="Tenggat Waktu"
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                />
              </div>

              <Button type="submit" variant="primary" className="w-full py-2.5">
                Tambahkan Target
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Quick Deposit Allocation */}
        <Card>
          <CardHeader>
            <CardTitle>Tabung Sekarang (Alokasi Saldo)</CardTitle>
            <CardDescription>Pindahkan saldo rekening aktif Anda ke dalam tabungan impian</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleQuickDeposit} className="space-y-4">
              {depositError && (
                <div className="p-3 rounded-xl bg-danger/10 border border-danger/20 text-xs font-semibold text-danger">
                  {depositError}
                </div>
              )}

              <Select 
                label="Pilih Target Tabungan"
                value={selectedGoal}
                onChange={(e) => setSelectedGoal(e.target.value)}
                options={[
                  { value: '', label: 'Pilih Target' },
                  ...goals.map(g => ({ value: g.id, label: `${g.name} (Kekurangan: ${formatIDR(g.target - g.current)})` }))
                ]}
              />

              <div className="grid grid-cols-2 gap-4">
                <Select 
                  label="Sumber Rekening"
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  options={[
                    { value: '', label: 'Pilih Sumber' },
                    ...accounts.map(a => ({ value: a.id, label: `${a.name} (Rp${a.balance.toLocaleString('id-ID')})` }))
                  ]}
                />
                <CurrencyInput 
                  label="Nominal Tabung (Rp)"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                />
              </div>

              <Button type="submit" variant="success" className="w-full py-2.5">
                Alokasikan Tabungan
              </Button>
            </form>
          </CardContent>
        </Card>

      </div>

      {/* 2. Target Savings List with Time Projection */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Monitoring Progress & Proyeksi AI</h3>
        
        {goals.length === 0 ? (
          <Card className="p-8 text-center text-slate-400">
            <PiggyBank size={36} className="mx-auto mb-2 opacity-20" />
            <p className="text-xs font-semibold">Tidak ada target tabungan aktif.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {goals.map((goal) => {
              const percent = Math.min(Math.round((goal.current / goal.target) * 100), 100);
              const remaining = Math.max(0, goal.target - goal.current);
              
              // Projected time remaining in months
              const monthsProjected = remaining / monthlySavingsSpeed;
              const dateProjected = new Date();
              dateProjected.setMonth(dateProjected.getMonth() + Math.ceil(monthsProjected));

              return (
                <Card key={goal.id} className="relative overflow-hidden hover:border-primary/20 transition-all duration-300">
                  <div className="p-5 sm:p-6 space-y-4">
                    
                    {/* Header Details */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
                      <div>
                        <h4 className="text-sm sm:text-base font-extrabold text-slate-900 line-clamp-1">{goal.name}</h4>
                        <p className="text-[10px] sm:text-xs text-slate-400 font-semibold mt-0.5">
                          Tenggat: {new Date(goal.targetDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                        <Badge variant={percent === 100 ? 'success' : 'primary'} className="text-[9px] px-1.5 py-0.5">
                          {percent === 100 ? 'Selesai' : `${percent}%`}
                        </Badge>
                        <div className="flex gap-1">
                          <button 
                            onClick={() => handleOpenEdit(goal)}
                            className="p-1 text-slate-400 hover:text-primary transition hover:bg-slate-100 rounded-lg cursor-pointer"
                            title="Edit Target"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button 
                            onClick={() => handleDeleteGoal(goal.id, goal.name)}
                            className="p-1 text-slate-400 hover:text-danger transition hover:bg-danger/10 rounded-lg cursor-pointer"
                            title="Hapus Target"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Progress Slider */}
                    <div className="space-y-1.5">
                      <div className="w-full bg-slate-200/50 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className="bg-primary h-2.5 rounded-full transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] sm:text-xs font-bold text-slate-700">
                        <span>{formatIDR(goal.current)}</span>
                        <span className="text-slate-500">Target: {formatIDR(goal.target)}</span>
                      </div>
                    </div>

                    {/* Proyeksi AI Panel */}
                    {percent < 100 && (
                      <div className="p-3.5 rounded-xl bg-gradient-to-br from-primary/5 to-indigo-500/5 border border-primary/10 text-xs leading-relaxed space-y-1.5">
                        <div className="flex items-center gap-1.5 font-bold text-primary">
                          <Sparkles size={14} className="animate-pulse" />
                          Proyeksi AI & Rekomendasi
                        </div>
                        <p className="text-slate-600">
                          Berdasarkan kecepatan menabung bersih saat ini ({formatIDR(monthlySavingsSpeed)}/bulan), target ini diperkirakan tercapai dalam <strong className="text-slate-800">{Math.ceil(monthsProjected)} bulan</strong> ({dateProjected.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}).
                        </p>
                      </div>
                    )}

                    {percent === 100 && (
                      <div className="p-3.5 rounded-xl bg-success/5 border border-success/10 text-xs flex items-center gap-2 text-success font-bold">
                        <ShieldCheck size={16} />
                        Selamat! Target tabungan Anda telah tercapai penuh.
                      </div>
                    )}

                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* EDIT GOAL MODAL */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Target Tabungan">
        {editingGoal && (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <Input 
              label="Nama Target"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-4">
              <CurrencyInput 
                label="Target Dana (Rp)"
                value={editTarget}
                onChange={(e) => setEditTarget(e.target.value)}
              />
              <CurrencyInput 
                label="Terkumpul (Rp)"
                value={editCurrent}
                onChange={(e) => setEditCurrent(e.target.value)}
              />
            </div>
            <Input 
              label="Tenggat Waktu"
              type="date"
              value={editTargetDate}
              onChange={(e) => setEditTargetDate(e.target.value)}
            />
            <Button type="submit" variant="primary" className="w-full py-2.5">
              Simpan Perubahan
            </Button>
          </form>
        )}
      </Modal>

    </div>
  );
}
