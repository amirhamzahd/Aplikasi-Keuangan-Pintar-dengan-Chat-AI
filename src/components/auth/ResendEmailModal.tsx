'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface ResendEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ResendEmailModal({ isOpen, onClose }: ResendEmailModalProps) {
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSend = () => {
    if (!email) return;
    setIsSending(true);
    // Simulate API call
    setTimeout(() => {
      setIsSending(false);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setEmail('');
        onClose();
      }, 3000);
    }, 1500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 md:p-8 border border-slate-100 relative overflow-hidden"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors z-50"
            >
              <X size={20} />
            </button>

            {!isSuccess ? (
              <>
                <div className="flex flex-col items-center text-center mb-6 relative z-10">
                  <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-500 mb-4 shadow-sm border border-amber-50">
                    <Mail size={24} />
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-800">
                    Kirim Ulang Verifikasi
                  </h3>
                  <p className="text-sm text-slate-500 mt-2">
                    Masukkan email Anda untuk menerima link verifikasi kembali.
                  </p>
                </div>

                <div className="space-y-4 relative z-10">
                  <div className="p-3 bg-amber-50 border border-amber-200/50 rounded-xl flex gap-3 items-start">
                    <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700 leading-relaxed font-medium">
                      Cek folder <span className="font-bold">Spam</span> atau <span className="font-bold">Promosi</span> di email Anda jika tidak menemukannya. Laporkan email sebagai "Bukan Spam" agar email berikutnya masuk ke kotak masuk utama.
                    </p>
                  </div>

                  <Input
                    label="Email Terdaftar"
                    type="email"
                    placeholder="nama@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    icon={<Mail size={18} />}
                    disabled={isSending}
                  />

                  <div className="pt-2 flex flex-col gap-2">
                    <Button 
                      variant="primary" 
                      className="w-full py-3 bg-amber-500 hover:bg-amber-600"
                      onClick={handleSend}
                      isLoading={isSending}
                      disabled={!email}
                    >
                      Kirim Ulang
                    </Button>
                    <Button 
                      variant="secondary" 
                      className="w-full py-3 bg-white border border-slate-200"
                      onClick={onClose}
                      disabled={isSending}
                    >
                      Kembali ke Login
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center text-center py-4 relative z-10">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-500 mb-4">
                  <Mail size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Email Terkirim!</h3>
                <p className="text-sm text-slate-500">
                  Silakan periksa kotak masuk (atau folder Spam) Anda sekarang.
                </p>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
