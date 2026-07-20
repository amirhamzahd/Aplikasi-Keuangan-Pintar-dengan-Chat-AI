'use client';

import React, { useState } from 'react';
import { useTransactions } from '@/context/TransactionContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { 
  Coffee, Car, ShoppingBag, Zap, Activity, Briefcase, 
  Heart, GraduationCap, DollarSign, Receipt, Gift, Compass, 
  Umbrella, Smartphone, Layers, Plus, Edit2, Trash2, ShieldAlert
} from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Coffee,
  Car,
  ShoppingBag,
  Zap,
  Activity,
  Briefcase,
  Heart,
  GraduationCap,
  DollarSign,
  Receipt,
  Gift,
  Compass,
  Umbrella,
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

export function CategoriesTab() {
  const { categories, addCategory, editCategory, deleteCategory, requestConfirm } = useTransactions();

  // Add Category States
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [icon, setIcon] = useState(ICONS_LIST[0]);
  const [color, setColor] = useState(PRESET_COLORS[0]);

  // Edit Category States
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [editColor, setEditColor] = useState('');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addCategory({
      name: name.trim(),
      icon,
      color,
      type: 'expense'
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
      type: 'expense'
    });

    setShowEditModal(false);
    setEditingCategory(null);
  };

  const handleDelete = (id: string, name: string) => {
    requestConfirm(`Apakah Anda yakin ingin menghapus kategori "${name}"?\n\nSemua transaksi dengan kategori ini akan otomatis dialihkan ke kategori "Lainnya", dan anggaran (budget) terkait kategori ini akan dihapus.`, () => {
      deleteCategory(id);
    });
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Kelola Kategori Pengeluaran</h2>
          <p className="text-xs text-slate-500 mt-0.5">Tambah dan kustomisasi kategori pengeluaran Anda</p>
        </div>
        <Button variant="primary" onClick={() => setShowAddModal(true)} className="text-xs font-semibold py-2.5 px-4 w-full sm:w-auto justify-center">
          <Plus size={16} /> Kategori Baru
        </Button>
      </div>

      {/* 2. Grid List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.filter(c => c.type === 'expense').map((cat) => {
          const IconComponent = ICON_MAP[cat.icon] || Layers;

          return (
            <Card key={cat.id} className="hover:border-slate-300 transition-all duration-300 overflow-hidden">
              <div className="p-4 sm:p-5 flex items-center justify-between gap-2 h-full">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div 
                    className="w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center text-white shadow-sm"
                    style={{ backgroundColor: cat.color }}
                  >
                    <IconComponent size={22} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{cat.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                        {cat.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                      <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md ${
                        cat.isBuiltIn 
                          ? 'bg-slate-100 text-slate-500' 
                          : 'bg-indigo-50 text-indigo-600'
                      }`}>
                        {cat.isBuiltIn ? 'Bawaan' : 'Kustom'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center self-center gap-1.5">
                  <button 
                    onClick={() => handleOpenEdit(cat)}
                    className="p-2 text-slate-400 hover:text-primary hover:bg-slate-100 rounded-lg transition cursor-pointer"
                    title="Edit Kategori"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button 
                    onClick={() => handleDelete(cat.id, cat.name)}
                    className="p-2 text-slate-400 hover:text-danger hover:bg-danger/10 rounded-lg transition cursor-pointer"
                    title="Hapus Kategori"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* MODAL 1: ADD CATEGORY */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Tambah Kategori Baru">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <Input 
            label="Nama Kategori"
            placeholder="e.g. Sedekah, Investasi Saham, Hobi"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <div className="space-y-2">
            <label className="text-xs font-semibold tracking-wider uppercase text-slate-500">Pilih Ikon Visual</label>
            <div className="grid grid-cols-5 sm:grid-cols-7 gap-2 p-3 border border-slate-200 rounded-xl bg-slate-50 max-h-[150px] overflow-y-auto">
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
            Simpan Kategori
          </Button>
        </form>
      </Modal>

      {/* MODAL 2: EDIT CATEGORY */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Kategori">
        {editingCategory && (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <Input 
              label="Nama Kategori"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />

            <div className="space-y-2">
              <label className="text-xs font-semibold tracking-wider uppercase text-slate-500">Pilih Ikon Visual</label>
              <div className="grid grid-cols-5 sm:grid-cols-7 gap-2 p-3 border border-slate-200 rounded-xl bg-slate-50 max-h-[150px] overflow-y-auto">
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

    </div>
  );
}
