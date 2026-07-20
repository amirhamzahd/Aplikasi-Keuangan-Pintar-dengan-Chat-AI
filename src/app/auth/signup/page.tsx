'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Sparkles, User, Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Footer } from '@/components/shared/Footer';

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // State untuk modal pop-up elegan
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password) {
      setError('Harap isi semua field.');
      return;
    }

    if (password.length < 6) {
      setError('Password minimal terdiri dari 6 karakter.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await signup(name, email, password);
      if (!res.success) {
        setError(res.error || 'Terjadi kesalahan saat mendaftar.');
      } else {
        // Tampilkan modal cantik ketimbang alert browser
        setShowSuccessModal(true);
      }
    } catch (err) {
      setError('Koneksi bermasalah. Coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between min-h-screen px-4 bg-gradient-to-tr from-slate-100 via-slate-50 to-blue-50/20 relative overflow-hidden">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

      <div className="flex-1 flex items-center justify-center w-full relative z-10 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-md relative z-10"
        >
          {/* Brand Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl overflow-hidden flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/20 shrink-0">
              <img src="/logo.png" alt="DIAMOND Logo" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display='none'; e.currentTarget.parentElement!.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary animate-pulse"><path d="M6 3h12l4 6-10 13L2 9Z"/></svg>'; }} />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
              DIAMOND Finance AI
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Mulai kelola keuangan Anda secara cerdas
            </p>
          </div>

          {/* Signup Card */}
          <Card glass={false} className="border border-slate-200/80 shadow-2xl bg-white ">
            <CardHeader>
              <CardTitle>Buat Akun Baru</CardTitle>
              <CardDescription>
                Isi data di bawah untuk mendaftarkan akun DIAMOND Anda
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3.5 rounded-xl bg-danger/10 border border-danger/20 flex items-center gap-2.5 text-sm text-danger animate-shake">
                    <AlertCircle size={18} className="shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <Input
                  label="Nama Lengkap"
                  type="text"
                  placeholder="Amir Yusuf"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  icon={<User size={18} />}
                  disabled={isLoading}
                />

                <Input
                  label="Email"
                  type="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  icon={<Mail size={18} />}
                  disabled={isLoading}
                />

                <Input
                  label="Password"
                  type="password"
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  icon={<Lock size={18} />}
                  disabled={isLoading}
                />

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full py-3 mt-2"
                  isLoading={isLoading}
                >
                  Daftar Akun
                </Button>
              </form>
            </CardContent>

            <CardFooter className="justify-center">
              <p className="text-sm text-slate-500 ">
                Sudah memiliki akun?{' '}
                <Link href="/auth/login" className="text-primary hover:underline font-semibold transition-colors">
                  Masuk di sini
                </Link>
              </p>
            </CardFooter>
          </Card>
        </motion.div>
      </div>

      <Footer />

      {/* Pop-up Elegan (Modal) */}
      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center border border-slate-100 relative overflow-hidden"
            >
              {/* Ornamen latar belakang modal */}
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-50 rounded-full blur-2xl" />
              <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-blue-50 rounded-full blur-2xl" />

              <div className="relative z-10">
                <div className="mx-auto w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6 shadow-sm border border-emerald-50">
                  <CheckCircle className="w-10 h-10 text-emerald-500" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-3 tracking-tight">Registrasi Berhasil!</h3>
                <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                  Registrasi berhasil. Silakan Verifikasi pada email Anda untuk mengaktifkan akun ini.
                </p>
                <Button 
                  variant="primary" 
                  className="w-full py-3 shadow-lg shadow-primary/20 text-sm font-bold"
                  onClick={() => router.push('/auth/login')}
                >
                  OK
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
