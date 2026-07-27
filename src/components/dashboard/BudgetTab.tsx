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
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Zap, ShieldAlert, Sparkles, Edit2, Trash2 } from 'lucide-react';

export function BudgetTab() {
  const { budgets, transactions, setBudget, editBudget, deleteBudget, categories, requestConfirm, isDateInCurrentPeriod, isBalanceHidden } = useTransactions();
  
  const expenseCategories = categories.filter(c => c.type === 'expense');

  // Create Budget Form States
  const [category, setCategory] = useState('');
  const [limitAmount, setLimitAmount] = useState('');
  
  // Edit Budget Modal States
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<{ id: string; category: string; amount: number } | null>(null);
  const [editAmount, setEditAmount] = useState('');

  const formatIDR = (num: number, forceShow: boolean = false) => {
    if (isBalanceHidden && !forceShow) return 'Rp ••••••••';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  const handleSetBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(limitAmount);
    if (isNaN(amt) || amt <= 0) return;

    const targetCategory = category || expenseCategories[0]?.name || '';
    if (!targetCategory) return;

    setBudget(targetCategory, amt);
    setLimitAmount('');
  };

  const handleOpenEdit = (b: any) => {
    setEditingBudget(b);
    setEditAmount(b.amount.toString());
    setShowEditModal(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(editAmount);
    if (isNaN(amt) || amt <= 0 || !editingBudget) return;

    editBudget(editingBudget.id, amt);
    setShowEditModal(false);
    setEditingBudget(null);
  };

  const handleDeleteBudget = (id: string, cat: string) => {
    requestConfirm(`Apakah Anda yakin ingin menghapus budget untuk Kategori "${cat}"?`, () => {
      deleteBudget(id);
    });
  };

  // Recharts data
  const chartData = budgets.map((b) => {
    const catObj = categories.find(c => c.name.toLowerCase() === b.category.toLowerCase());
    return {
      name: b.category,
      value: b.amount,
      color: catObj ? catObj.color : '#64748B'
    };
  });

  return (
    <div className="flex flex-col gap-10 pb-10">
      
      {/* 1. Configuration Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Set Budget Card */}
        <Card>
          <CardHeader>
            <CardTitle>Atur Limit Budget</CardTitle>
            <CardDescription>Buat batas pengeluaran bulanan per kategori</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSetBudget} className="space-y-4">
              <Select 
                label="Kategori"
                value={category || (expenseCategories[0]?.name || '')}
                onChange={(e) => setCategory(e.target.value)}
                options={expenseCategories.map(c => ({ value: c.name, label: c.name }))}
              />

              <CurrencyInput 
                label="Limit Nominal (Rp)"
                placeholder="e.g. 2000000"
                value={limitAmount}
                onChange={(e) => setLimitAmount(e.target.value)}
              />

              <Button type="submit" variant="primary" className="w-full py-2.5">
                Simpan Budget
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Charts Summary */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Alokasi Limit Budget</CardTitle>
            <CardDescription>Visualisasi pembagian dana bulanan Anda</CardDescription>
          </CardHeader>
          <CardContent className="min-h-[14rem] py-6 flex items-center justify-center">
            {budgets.length === 0 ? (
              <div className="text-center text-slate-400">
                <ShieldAlert size={32} className="mx-auto opacity-20 mb-2" />
                <p className="text-xs font-semibold">Belum ada budget yang diatur</p>
                <p className="text-[10px] mt-0.5">Tentukan limit di sebelah kiri untuk melihat pembagian dana.</p>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col md:flex-row items-center gap-6">
                <div className="w-full md:w-1/2 h-[180px] relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="none"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: any) => formatIDR(Number(value))} 
                        contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#0f172a', fontSize: '12px', borderRadius: '8px' }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full md:w-1/2 flex flex-col gap-3">
                  {chartData.slice(0, 4).map((entry, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }}></span>
                        <span className="text-slate-600 font-semibold truncate max-w-[120px]">{entry.name}</span>
                      </div>
                      <span className="font-bold shrink-0">{formatIDR(entry.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* 2. Budgets Tracking List with CRUD */}
      <div className="w-full">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-8">Monitoring Limit</h3>
        {budgets.length === 0 ? (
          <Card className="p-8 text-center text-slate-400">
            <ShieldAlert size={36} className="mx-auto mb-2 opacity-20" />
            <p className="text-xs font-semibold">Tidak ada data budget aktif.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {budgets.map((b) => {
              // Calculate spent amount based on cutoff period logic, excluding debts!
              const spent = transactions
                .filter(t => 
                  t.type === 'expense' && 
                  (t.category || '').toLowerCase() === (b.category || '').toLowerCase() &&
                  isDateInCurrentPeriod(t.date) &&
                  !(t.category.toLowerCase().includes('hutang') || t.category.toLowerCase().includes('piutang') || t.description.toLowerCase().includes('pinjam') || t.description.toLowerCase().includes('hutang'))
                )
                .reduce((sum, t) => sum + t.amount, 0);

              const percent = Math.min(Math.round((spent / b.amount) * 100), 100);
              const isOver = spent > b.amount;
              const isWarning = spent > b.amount * 0.9 && spent <= b.amount;

              return (
                <Card 
                  key={b.id} 
                  className={`border-l-4 overflow-hidden ${
                    isOver ? 'border-l-danger' : isWarning ? 'border-l-warning' : 'border-l-success'
                  }`}
                >
                  <div className="p-5 space-y-3.5 relative h-full">
                    
                    {/* Header info & CRUD Controls */}
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{b.category}</h4>
                        <p className="text-[10px] text-slate-400 font-semibold">
                          {isOver ? 'Melebihi limit!' : isWarning ? 'Mendekati limit!' : 'Pengeluaran aman'}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={isOver ? 'danger' : isWarning ? 'warning' : 'success'}>
                          {percent}%
                        </Badge>
                        <div className="flex gap-1">
                          <button 
                            onClick={() => handleOpenEdit(b)}
                            className="p-1 text-slate-400 hover:text-primary transition hover:bg-slate-100 rounded-lg cursor-pointer"
                            title="Edit Limit"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button 
                            onClick={() => handleDeleteBudget(b.id, b.category)}
                            className="p-1 text-slate-400 hover:text-danger transition hover:bg-danger/10 rounded-lg cursor-pointer"
                            title="Hapus Budget"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200/50 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          isOver ? 'bg-danger' : isWarning ? 'bg-warning' : 'bg-success'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    {/* Totals */}
                    <div className="flex justify-between text-xs">
                      <div>
                        <span className="text-slate-400">Terpakai:</span>{' '}
                        <span className="font-extrabold text-slate-800">{formatIDR(spent)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Batas:</span>{' '}
                        <span className="font-extrabold text-slate-800">{formatIDR(b.amount)}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* EDIT BUDGET MODAL */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Limit Budget">
        {editingBudget && (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <Input 
              label="Kategori"
              value={editingBudget.category}
              disabled
            />
            <CurrencyInput 
              label="Batas Nominal Baru (Rp)"
              value={editAmount}
              onChange={(e) => setEditAmount(e.target.value)}
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
