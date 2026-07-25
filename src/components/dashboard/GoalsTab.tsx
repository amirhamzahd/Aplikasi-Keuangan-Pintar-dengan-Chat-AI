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
                <div key={goal.id} className="relative overflow-hidden bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300">
                  <div className="p-6 space-y-5">
                    
                    {/* Header Details */}
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/50 flex items-center justify-center text-primary shrink-0 border border-blue-100/50">
                          <PiggyBank size={22} />
                        </div>
                        <div>
                          <h4 className="text-base font-extrabold text-slate-800 line-clamp-1">{goal.name}</h4>
                          <div className="flex items-center gap-1.5 mt-1">
                            <Calendar size={12} className="text-slate-400" />
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                              Tenggat: {new Date(goal.targetDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <div className="flex gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-100">
                          <button 
                            onClick={() => handleOpenEdit(goal)}
                            className="p-1.5 text-slate-400 hover:text-primary transition hover:bg-white rounded-lg shadow-sm"
                            title="Edit Target"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button 
                            onClick={() => handleDeleteGoal(goal.id, goal.name)}
                            className="p-1.5 text-slate-400 hover:text-danger transition hover:bg-white rounded-lg shadow-sm"
                            title="Hapus Target"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Progress Information */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-end mb-1">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Terkumpul</span>
                          <span className="text-lg font-black text-slate-800 tracking-tight">{formatIDR(goal.current)}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Target</span>
                          <span className="text-sm font-bold text-slate-600">{formatIDR(goal.target)}</span>
                        </div>
                      </div>
                      
                      <div className="relative">
                        <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden shadow-inner">
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 relative overflow-hidden ${
                              percent === 100 ? 'bg-success' : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                            }`}
                            style={{ width: `${percent}%` }}
                          >
                            {/* Shiny overlay effect */}
                            <div className="absolute top-0 left-0 right-0 bottom-0 bg-white/20" style={{ transform: 'skewX(-20deg) translateX(-150%)', animation: 'shimmer 2s infinite' }}></div>
                          </div>
                        </div>
                        <div className={`absolute -top-3 left-1/2 -translate-x-1/2 -translate-y-full px-2 py-0.5 rounded-md text-[10px] font-extrabold text-white opacity-0 transition-opacity ${percent > 10 ? 'opacity-100' : ''}`}
                             style={{ left: `${percent}%`, backgroundColor: percent === 100 ? '#10b981' : '#3b82f6', transform: 'translate(-50%, -10px)' }}>
                          {percent}%
                          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-l-[4px] border-r-[4px] border-t-[4px] border-transparent border-t-current" style={{ color: percent === 100 ? '#10b981' : '#3b82f6' }}></div>
                        </div>
                      </div>
                    </div>

                    {/* Proyeksi AI Panel */}
                    <div className="pt-2">
                      {percent < 100 ? (
                        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-50/80 to-indigo-50/50 border border-blue-100/50 text-xs flex items-start gap-3">
                          <div className="mt-0.5 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                            <Sparkles size={12} className="animate-pulse" />
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-800 block mb-0.5">Prediksi AI</span>
                            <span className="text-slate-500 font-medium leading-relaxed">
                              Berdasarkan sisa bulanan Anda, target akan tercapai dalam <strong className="text-indigo-600">{Math.ceil(monthsProjected)} bulan</strong> ({dateProjected.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}).
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100 text-xs flex items-start gap-3">
                          <div className="mt-0.5 w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                            <ShieldCheck size={12} />
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-800 block mb-0.5">Misi Selesai! 🎉</span>
                            <span className="text-slate-500 font-medium">Selamat! Anda telah mencapai impian Anda.</span>
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
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
