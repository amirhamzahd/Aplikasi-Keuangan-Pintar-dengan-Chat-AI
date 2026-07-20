'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ShieldAlert, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function PinSetupModal() {
  const { user, updateProfile } = useAuth();
  
  // Show modal only if user exists and hasn't set a pin
  const [isOpen, setIsOpen] = useState(true);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // If they are not logged in or already have a PIN, don't show anything
  if (!user || user.pin || !isOpen) {
    return null;
  }

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    if (val.length <= 6) {
      setError('');
      if (step === 1) {
        setPin(val);
        if (val.length === 6) setTimeout(() => setStep(2), 300);
      } else {
        setConfirmPin(val);
        if (val.length === 6) {
          if (val === pin) {
            // Success! Save PIN
            updateProfile({ pin: val });
            setSuccess(true);
            setTimeout(() => setIsOpen(false), 2000);
          } else {
            setError('PIN tidak sama. Silakan coba lagi.');
            setConfirmPin('');
            setStep(1);
            setPin('');
          }
        }
      }
    }
  };

  const currentPin = step === 1 ? pin : confirmPin;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-sm flex flex-col items-center text-center relative overflow-hidden"
        >
          {success ? (
            <motion.div 
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              className="flex flex-col items-center py-6"
            >
              <CheckCircle2 size={64} className="text-success mb-4" />
              <h2 className="text-xl font-extrabold text-slate-800">PIN Disetel!</h2>
              <p className="text-sm text-slate-500 mt-2">Aplikasi kini terlindungi Privacy Lock.</p>
            </motion.div>
          ) : (
            <>
              <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-6">
                <ShieldAlert size={28} />
              </div>
              
              <h2 className="text-xl font-extrabold text-slate-800 mb-2">Keamanan Ekstra</h2>
              <p className="text-sm text-slate-500 mb-8">
                {step === 1 
                  ? "Buat 6 digit PIN untuk mengunci layar saat aplikasi sedang tidak digunakan." 
                  : "Ketik ulang PIN Anda untuk konfirmasi."}
              </p>
              
              <div className="flex gap-3 justify-center mb-6">
                {[...Array(6)].map((_, i) => (
                  <div 
                    key={i}
                    className={`w-4 h-4 rounded-full transition-all duration-300 ${
                      i < currentPin.length ? 'bg-primary scale-110' : 'bg-slate-200'
                    }`}
                  />
                ))}
              </div>

              {error && (
                <p className="text-xs text-danger font-semibold mb-4 bg-danger/10 px-3 py-1.5 rounded-lg">
                  {error}
                </p>
              )}
              
              {/* Hidden Input for Keyboard Typing */}
              <input
                type="password"
                inputMode="numeric"
                autoFocus
                value={currentPin}
                onChange={handleInput}
                className="opacity-0 absolute top-0 -z-10"
              />

              <div className="grid grid-cols-3 gap-4 mt-4 w-full max-w-[240px]">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                  <button
                    key={num}
                    onClick={() => handleInput({ target: { value: currentPin + num.toString() } } as any)}
                    className="w-14 h-14 rounded-full bg-slate-50 hover:bg-slate-100 text-lg font-bold text-slate-700 mx-auto transition-colors active:bg-slate-200 cursor-pointer"
                  >
                    {num}
                  </button>
                ))}
                <div />
                <button
                  onClick={() => handleInput({ target: { value: currentPin + '0' } } as any)}
                  className="w-14 h-14 rounded-full bg-slate-50 hover:bg-slate-100 text-lg font-bold text-slate-700 mx-auto transition-colors active:bg-slate-200 cursor-pointer"
                >
                  0
                </button>
                <button
                  onClick={() => step === 1 ? setPin(prev => prev.slice(0, -1)) : setConfirmPin(prev => prev.slice(0, -1))}
                  className="w-14 h-14 rounded-full text-xs font-bold text-slate-400 hover:text-slate-600 mx-auto transition-colors cursor-pointer"
                >
                  DEL
                </button>
              </div>
              
              <button 
                onClick={() => setIsOpen(false)}
                className="mt-8 text-xs text-slate-400 hover:text-slate-600 font-medium cursor-pointer"
              >
                Lewati untuk saat ini
              </button>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
