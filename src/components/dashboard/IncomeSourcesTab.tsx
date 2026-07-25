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
  Briefcase, DollarSign, Gift, Layers, Plus, Edit2, Trash2,
  Wallet, Banknote, Coins, Landmark, Building, PiggyBank, TrendingUp, CreditCard, Activity, Smartphone
} from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Wallet,
  Banknote,
  Coins,
  Landmark,
  Briefcase,
  Building,
  Gift,
  DollarSign,
  PiggyBank,
  TrendingUp,
  CreditCard,
  Activity,
  Smartphone,
  Layers
};

const PRESET_COLORS = [
  '#2563EB', // Blue
  '#10B981', // Green
  '#EF4444', // Red
  '#F59E0B', // Orange/Yellow
  '#6366F1', // Indigo
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#8B5CF6', // Purple
  '#64748B'  // Slate
];

const ICONS_LIST = Object.keys(ICON_MAP);

export function IncomeSourcesTab() {
  const { categories, addCategory, editCategory, deleteCategory, requestConfirm, accounts, addTransaction } = useTransactions();

  // Add Category States
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState(ICONS_LIST[0]);
  const [color, setColor] = useState(PRESET_COLORS[0]);

  // Edit Category States
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [editColor, setEditColor] = useState('');

  // Record Income State
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [selectedSource, setSelectedSource] = useState<any | null>(null);
  const [incomeAmount, setIncomeAmount] = useState('');
  const [incomeAccountId, setIncomeAccountId] = useState('');
  const [incomeDesc, setIncomeDesc] = useState('');
  const [incomeDate, setIncomeDate] = useState(new Date().toISOString().split('T')[0]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addCategory({
      name: name.trim(),
      icon,
      color,
      type: 'income'
    });

    setName('');
    setIcon(ICONS_LIST[0]);
    setColor(PRESET_COLORS[0]);
    setShowAddModal(false);
  };

  const handleOpenEdit = (cat: any) => {
    setEditingCategory(cat);
    setEditName(cat.name);
    setEditIcon(cat.icon);
    setEditColor(cat.color);
    setShowEditModal(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !editingCategory) return;

    editCategory(editingCategory.id, {
      name: editName.trim(),
      icon: editIcon,
      color: editColor,
      type: 'income'
    });

    setShowEditModal(false);
    setEditingCategory(null);
  };

  const handleDelete = (id: string, name: string) => {
    requestConfirm(`Apakah Anda yakin ingin menghapus sumber dana "${name}"?\n\nSemua transaksi dengan sumber dana ini akan otomatis dialihkan ke "Lainnya".`, () => {
      deleteCategory(id);
    });
  };

  const handleOpenRecord = (cat: any) => {
    setSelectedSource(cat);
    setIncomeAmount('');
    setIncomeDesc('');
    setIncomeDate(new Date().toISOString().split('T')[0]);
    if (accounts.length > 0) {
      setIncomeAccountId(accounts[0].id);
    }
    setShowRecordModal(true);
  };

  const handleRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const bal = parseFloat(incomeAmount);
    if (isNaN(bal) || bal <= 0 || !incomeAccountId || !selectedSource) return;

    await addTransaction({
      description: incomeDesc.trim() || `Pemasukan dari ${selectedSource.name}`,
      amount: bal,
      type: 'income',
      category: selectedSource.name,
      accountId: incomeAccountId,
      tags: [],
      date: incomeDate ? new Date(incomeDate).toISOString() : new Date().toISOString()
    });

    setShowRecordModal(false);
    setSelectedSource(null);
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Kelola Sumber Dana</h2>
          <p className="text-xs text-slate-500 mt-0.5">Tambah dan kustomisasi sumber pemasukan Anda (Gaji, Freelance, dll)</p>
        </div>
        <Button variant="primary" onClick={() => setShowAddModal(true)} className="text-xs font-semibold py-2.5 px-4 w-full sm:w-auto justify-center">
          <Plus size={16} /> Sumber Baru
        </Button>
      </div>

      {/* 2. Grid List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.filter(c => c.type === 'income').map((cat) => {
          const IconComponent = ICON_MAP[cat.icon] || Layers;

          return (
            <Card key={cat.id} className="hover:border-primary/50 transition-all duration-300 overflow-hidden group">
              <div className="flex items-stretch justify-between h-full relative">
                {/* Clickable Area for Recording Income */}
                <div 
                  onClick={() => handleOpenRecord(cat)}
                  className="p-4 sm:p-5 flex-1 flex items-center gap-3 sm:gap-4 cursor-pointer hover:bg-slate-50/80 transition-colors"
                >
                  <div 
                    className="w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105"
                    style={{ backgroundColor: cat.color }}
                  >
                    <IconComponent size={22} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">{cat.name}</h4>
                    <p className="text-[10px] text-slate-500 font-semibold mt-1">Klik untuk catat duit masuk 💰</p>
                  </div>
                </div>

                {/* Right side Actions */}
                <div className="flex flex-col justify-center gap-1.5 p-3 sm:p-4 border-l border-slate-100 bg-white z-10">
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleOpenEdit(cat); }}
                    className="p-1.5 text-slate-400 hover:text-primary hover:bg-slate-100 rounded-lg transition cursor-pointer"
                    title="Edit Sumber Dana"
                  >
                    <Edit2 size={14} />
                  </button>
                  {!cat.isBuiltIn && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(cat.id, cat.name); }}
                      className="p-1.5 text-slate-400 hover:text-danger hover:bg-danger/10 rounded-lg transition cursor-pointer"
                      title="Hapus Sumber Dana"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* MODAL 1: ADD CATEGORY */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Tambah Sumber Dana Baru">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <Input 
            label="Nama Sumber Dana"
            placeholder="Misal: Gaji, Freelance, Bonus"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <div className="space-y-2">
            <label className="text-xs font-semibold tracking-wider uppercase text-slate-500">Pilih Ikon Visual</label>
            <div className="grid grid-cols-5 sm:grid-cols-7 gap-2 p-3 border border-slate-200 rounded-xl bg-slate-50">
              {ICONS_LIST.map(ic => {
                const IconComp = ICON_MAP[ic];
                const isActive = icon === ic;
                return (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => setIcon(ic)}
                    className={`flex items-center justify-center p-2.5 rounded-lg transition-all duration-200 ${
                      isActive 
                        ? 'bg-primary text-white shadow-md scale-110' 
                        : 'bg-white text-slate-500 hover:bg-slate-200 border border-slate-100'
                    }`}
                    title={ic}
                  >
                    <IconComp size={18} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Color Picker */}
          <div className="space-y-2">
            <label className="text-xs font-semibold tracking-wider uppercase text-slate-500">Pilih Warna (Hex)</label>
            <div className="flex items-center gap-3">
              <input 
                type="color" 
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-12 h-12 rounded cursor-pointer border border-slate-200 bg-white p-1"
              />
              <div className="flex-1">
                <Input 
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="#000000"
                  label=""
                />
              </div>
            </div>
          </div>

          <Button type="submit" variant="primary" className="w-full py-2.5">
            Simpan Sumber Dana
          </Button>
        </form>
      </Modal>

      {/* MODAL 2: EDIT CATEGORY */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Sumber Dana">
        {editingCategory && (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <Input 
              label="Nama Sumber Dana"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />

            <div className="space-y-2">
              <label className="text-xs font-semibold tracking-wider uppercase text-slate-500">Pilih Ikon Visual</label>
              <div className="grid grid-cols-5 sm:grid-cols-7 gap-2 p-3 border border-slate-200 rounded-xl bg-slate-50">
                {ICONS_LIST.map(ic => {
                  const IconComp = ICON_MAP[ic];
                  const isActive = editIcon === ic;
                  return (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setEditIcon(ic)}
                      className={`flex items-center justify-center p-2.5 rounded-lg transition-all duration-200 ${
                        isActive 
                          ? 'bg-primary text-white shadow-md scale-110' 
                          : 'bg-white text-slate-500 hover:bg-slate-200 border border-slate-100'
                      }`}
                      title={ic}
                    >
                      <IconComp size={18} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Color Picker */}
            <div className="space-y-2">
              <label className="text-xs font-semibold tracking-wider uppercase text-slate-500">Pilih Warna (Hex)</label>
              <div className="flex items-center gap-3">
                <input 
                  type="color" 
                  value={editColor}
                  onChange={(e) => setEditColor(e.target.value)}
                  className="w-12 h-12 rounded cursor-pointer border border-slate-200 bg-white p-1"
                />
                <div className="flex-1">
                  <Input 
                    value={editColor}
                    onChange={(e) => setEditColor(e.target.value)}
                    placeholder="#000000"
                    label=""
                  />
                </div>
              </div>
            </div>

            <Button type="submit" variant="primary" className="w-full py-2.5">
              Simpan Perubahan
            </Button>
          </form>
        )}
      </Modal>

      {/* MODAL 3: RECORD INCOME */}
      <Modal isOpen={showRecordModal} onClose={() => setShowRecordModal(false)} title={`Catat Pemasukan - ${selectedSource?.name}`}>
        {selectedSource && (
          <form onSubmit={handleRecordSubmit} className="space-y-4">
            
            <div>
              <label className="text-xs font-semibold text-slate-700">Nominal (Rp)</label>
              <CurrencyInput 
                value={incomeAmount}
                onChange={(e) => setIncomeAmount(e.target.value)}
                placeholder="e.g. 5000000"
                required
                min="1"
              />
            </div>

            <Select 
              label="Simpan ke Rekening Tujuan"
              value={incomeAccountId}
              onChange={(e) => setIncomeAccountId(e.target.value)}
              required
              options={[
                { value: '', label: 'Pilih Rekening Tujuan...' },
                ...accounts.map(a => ({ value: a.id, label: `${a.name} (Rp${a.balance.toLocaleString('id-ID')})` }))
              ]}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input 
                label="Keterangan (Opsional)"
                value={incomeDesc}
                onChange={(e) => setIncomeDesc(e.target.value)}
                placeholder="e.g. Gaji Bulan Juni"
              />
              <Input 
                label="Tanggal"
                type="date"
                value={incomeDate}
                onChange={(e) => setIncomeDate(e.target.value)}
                required
              />
            </div>

            <Button type="submit" variant="primary" className="w-full py-2.5">
              Simpan Pemasukan
            </Button>
          </form>
        )}
      </Modal>
    </div>
  );
}
