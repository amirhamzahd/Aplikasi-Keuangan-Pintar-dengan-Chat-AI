'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Menu, Bell, ShieldAlert, Sparkles, CheckCheck, Camera } from 'lucide-react';
import { useTransactions } from '@/context/TransactionContext';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '../ui/Badge';
import { motion, AnimatePresence } from 'framer-motion';


interface HeaderProps {
  userName: string;
}

export function Header({ userName }: HeaderProps) {
  const { notifications, markNotificationsAsRead } = useTransactions();
  const { user, updateProfile } = useAuth();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = () => {
    markNotificationsAsRead();
  };

  const displayName = user?.name || userName;

  return (
    <header className="sticky top-0 z-20 px-6 py-4 flex items-center justify-between border-b border-border bg-white">
      
      {/* Left side: Greeting */}
      <div className="flex items-center gap-4">
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
        <div>
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
                  className="absolute right-0 mt-2 w-[calc(100vw-48px)] sm:w-80 max-w-[360px] glass rounded-2xl shadow-xl border border-border/30 overflow-hidden z-40 origin-top-right"
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

        {/* Profile Avatar View Only */}
        <div className="relative">
          <div 
            className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-emerald-400 text-white font-bold flex items-center justify-center shadow-inner ml-2 shrink-0 border border-white/20 relative overflow-hidden"
            title="Profil"
          >
            {user?.photo ? (
              <img src={user.photo} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              displayName.charAt(0).toUpperCase()
            )}
          </div>
        </div>

      </div>
    </header>
  );
}
