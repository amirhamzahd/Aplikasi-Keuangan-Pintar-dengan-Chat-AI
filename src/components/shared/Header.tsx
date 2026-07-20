'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Menu, Bell, ShieldAlert, Sparkles, CheckCheck, Camera } from 'lucide-react';
import { useTransactions } from '@/context/TransactionContext';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '../ui/Badge';
import { motion, AnimatePresence } from 'framer-motion';


interface HeaderProps {
  onMenuToggle: () => void;
  userName: string;
}

export function Header({ onMenuToggle, userName }: HeaderProps) {
  const { notifications, markNotificationsAsRead } = useTransactions();
  const { user, updateProfile } = useAuth();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  
  // Profile Edit State
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editGender, setEditGender] = useState('Laki-laki');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setEditName(user.name);
      setEditGender(user.gender || 'Laki-laki');
    }
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = () => {
    markNotificationsAsRead();
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;
    
    updateProfile({
      name: editName,
      gender: editGender
    });
    setIsProfileMenuOpen(false);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 200;
        let width = img.width;
        let height = img.height;

        // Resize proportionally
        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round(height * (MAX_SIZE / width));
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round(width * (MAX_SIZE / height));
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        // Compress tightly as WebP to fit in localStorage safely
        const compressedBase64 = canvas.toDataURL('image/webp', 0.6);
        updateProfile({ photo: compressedBase64 });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const displayName = user?.name || userName;

  return (
    <header className="sticky top-0 z-20 px-6 py-4 flex items-center justify-between border-b border-border bg-white">
      
      {/* Left side: Hamburger and Greeting */}
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuToggle}
          className="md:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition cursor-pointer"
        >
          <Menu size={20} />
        </button>
        <div>
          <h1 className="text-base md:text-lg font-bold text-slate-900 flex items-center gap-1.5">
            Halo, {displayName} 👋
          </h1>
          <p className="text-[10px] md:text-xs text-slate-500 line-clamp-1">
            Selamat datang kembali. Keuanganmu aman.
          </p>
        </div>
      </div>
      
      {/* Right side: Actions */}
      <div className="flex items-center gap-3 relative">
        
        {/* Notifications Center */}
        <div className="relative">
          <button 
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            title="Notifikasi"
            className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-500 transition relative cursor-pointer"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-danger text-[9px] font-bold text-white rounded-full flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          <AnimatePresence>
            {isNotifOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setIsNotifOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-80 glass rounded-2xl shadow-xl border border-border/30 overflow-hidden z-40"
                >
                  <div className="p-4 border-b border-border/20 flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-800">Notifikasi</span>
                    {unreadCount > 0 && (
                      <button 
                        onClick={handleMarkAllRead}
                        className="text-xs text-primary font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCheck size={14} />
                        Tandai dibaca
                      </button>
                    )}
                  </div>
                  
                  <div className="max-h-72 overflow-y-auto divide-y divide-border/10">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400">
                        Tidak ada notifikasi baru
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className={`p-4 hover:bg-slate-50 transition-colors ${!n.read ? 'bg-primary/5' : ''}`}>
                          <div className="flex gap-3">
                            <div className="mt-0.5 shrink-0">
                              {n.type === 'budget_warning' ? (
                                <ShieldAlert size={16} className="text-warning" />
                              ) : n.type === 'goal_achieved' ? (
                                <Sparkles size={16} className="text-success" />
                              ) : (
                                <Bell size={16} className="text-primary" />
                              )}
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs font-bold text-slate-900">{n.title}</p>
                              <p className="text-[11px] leading-relaxed text-slate-500">{n.message}</p>
                              <p className="text-[9px] text-slate-400">{new Date(n.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Profile Avatar Dropdown wrapper */}
        <div className="relative">
          <button 
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-emerald-400 text-white font-bold flex items-center justify-center shadow-inner ml-2 shrink-0 border border-white/20 cursor-pointer hover:ring-2 ring-primary/30 ring-offset-2 transition-all relative overflow-hidden"
            title="Profil"
          >
            {user?.photo ? (
              <img src={user.photo} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              displayName.charAt(0).toUpperCase()
            )}
          </button>

          <AnimatePresence>
            {isProfileMenuOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setIsProfileMenuOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-72 glass rounded-2xl shadow-xl border border-border/30 overflow-hidden z-40"
                >
                  <div className="p-4 border-b border-border/20 flex items-center justify-between bg-slate-50/50">
                    <span className="font-bold text-sm text-slate-800">Pengaturan Profil</span>
                  </div>
                  
                  <form onSubmit={handleSaveProfile} className="p-4 space-y-3">
                    <div className="flex flex-col items-center justify-center pb-2">
                      <div 
                        className="relative group cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-primary to-emerald-400 text-white font-bold text-2xl flex items-center justify-center shadow-inner border-2 border-white overflow-hidden">
                          {user?.photo ? (
                            <img src={user.photo} alt={displayName} className="w-full h-full object-cover" />
                          ) : (
                            displayName.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <Camera size={16} />
                        </div>
                      </div>
                      <input 
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handlePhotoUpload}
                      />
                      {user?.photo && (
                        <button
                          type="button"
                          onClick={() => updateProfile({ photo: undefined })}
                          className="mt-2 text-[10px] text-danger font-bold hover:underline transition-all"
                        >
                          Hapus Foto
                        </button>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nama Lengkap</label>
                      <input 
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Nama"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email</label>
                      <input 
                        type="email"
                        className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-500 cursor-not-allowed"
                        value={user?.email || ''}
                        disabled
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Jenis Kelamin</label>
                      <select
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                        value={editGender}
                        onChange={(e) => setEditGender(e.target.value)}
                      >
                        <option value="Laki-laki">Laki-laki</option>
                        <option value="Perempuan">Perempuan</option>
                      </select>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        className="w-full py-2 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary/90 transition shadow-lg shadow-primary/30"
                      >
                        Simpan Perubahan
                      </button>
                    </div>
                  </form>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

      </div>
    </header>
  );
}
