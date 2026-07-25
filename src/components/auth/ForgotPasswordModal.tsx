'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, X, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
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
                  <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-500 mb-4 shadow-sm border border-blue-50">
                    <KeyRound size={24} />
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-800">
                    Lupa Password?
                  </h3>
                  <p className="text-sm text-slate-500 mt-2">
                    Masukkan email Anda dan kami akan mengirimkan link untuk mereset password.
                  </p>
                </div>

                <div className="space-y-4 relative z-10">
                  <Input
                    label="Email Anda"
                    type="email"
                    placeholder="nama@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    icon={<Mail size={18} />}
                    disabled={isSending}
                  />

                  <div className="pt-2">
                    <Button 
                      variant="primary" 
                      className="w-full py-3"
                      onClick={handleSend}
                      isLoading={isSending}
                      disabled={!email}
                    >
                      Kirim Link Reset
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center text-center py-4 relative z-10">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-500 mb-4">
                  <Mail size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Cek Email Anda</h3>
                <p className="text-sm text-slate-500">
                  Link reset password telah dikirim ke {email || 'email Anda'}.
                </p>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
