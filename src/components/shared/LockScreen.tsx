'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Lock, AlertCircle } from 'lucide-react';

export function LockScreen({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isLocked, setIsLocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [error, setError] = useState(false);
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // 5 minutes idle time (300,000 ms). Set to 5000ms for quick testing if needed.
  const IDLE_TIMEOUT = 5 * 60 * 1000; 

  const resetTimer = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    // Only set lock timer if user is logged in AND has a PIN set
    if (user && user.pin && !isLocked) {
      timeoutRef.current = setTimeout(() => {
        setIsLocked(true);
      }, IDLE_TIMEOUT);
    }
  };

  useEffect(() => {
    // Attach event listeners
    const events = ['mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    
    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });
    
    resetTimer(); // Initialize on mount
    
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [user, isLocked]);

  // Handle PIN input
  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    if (val.length <= 6) {
      setPinInput(val);
      setError(false);
      
      if (val.length === 6) {
        if (val === user?.pin) {
          // Unlock
          setIsLocked(false);
          setPinInput('');
          resetTimer();
        } else {
          // Error
          setError(true);
          setTimeout(() => setPinInput(''), 500);
        }
      }
    }
  };

  return (
    <>
      {/* Background Content */}
      <div className={isLocked ? 'blur-sm pointer-events-none select-none h-screen overflow-hidden' : ''}>
        {children}
      </div>

      {/* Lock Overlay */}
      {isLocked && (
        <div className="fixed inset-0 z-[999] bg-slate-900/40 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-sm flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-blue-100 text-primary rounded-full flex items-center justify-center mb-6">
              <Lock size={32} />
            </div>
            <h2 className="text-xl font-extrabold text-slate-800 mb-2">Layar Terkunci</h2>
            <p className="text-sm text-slate-500 mb-8">
              Masukkan 6 digit PIN keamanan Anda untuk membuka DIAMOND Finance.
            </p>
            
            <div className={`flex gap-3 justify-center mb-4 ${error ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}>
              {[...Array(6)].map((_, i) => (
                <div 
                  key={i}
                  className={`w-4 h-4 rounded-full transition-all duration-300 ${
                    i < pinInput.length ? 'bg-primary scale-110' : 'bg-slate-200'
                  } ${error ? 'bg-danger' : ''}`}
                />
              ))}
            </div>
            
            {/* Hidden input for keyboard capture */}
            <input
              type="password"
              inputMode="numeric"
              autoFocus
              value={pinInput}
              onChange={handlePinChange}
              className="opacity-0 absolute top-0 -z-10"
            />

            {error && (
              <p className="text-xs font-semibold text-danger flex items-center gap-1 mt-2 animate-pulse">
                <AlertCircle size={14} /> PIN salah, coba lagi.
              </p>
            )}

            {/* NumPad UI for Mobile/Mouse users */}
            <div className="grid grid-cols-3 gap-4 mt-8 w-full max-w-[240px]">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button
                  key={num}
                  onClick={() => handlePinChange({ target: { value: pinInput + num.toString() } } as any)}
                  className="w-16 h-16 rounded-full bg-slate-50 hover:bg-slate-100 text-xl font-bold text-slate-700 mx-auto transition-colors active:bg-slate-200 cursor-pointer"
                >
                  {num}
                </button>
              ))}
              <div /> {/* Empty slot for 0 alignment */}
              <button
                onClick={() => handlePinChange({ target: { value: pinInput + '0' } } as any)}
                className="w-16 h-16 rounded-full bg-slate-50 hover:bg-slate-100 text-xl font-bold text-slate-700 mx-auto transition-colors active:bg-slate-200 cursor-pointer"
              >
                0
              </button>
              <button
                onClick={() => setPinInput(prev => prev.slice(0, -1))}
                className="w-16 h-16 rounded-full text-sm font-bold text-slate-400 hover:text-slate-600 mx-auto transition-colors cursor-pointer"
              >
                DEL
              </button>
            </div>
          </div>
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-5px); }
          40%, 80% { transform: translateX(5px); }
        }
      `}} />
    </>
  );
}
