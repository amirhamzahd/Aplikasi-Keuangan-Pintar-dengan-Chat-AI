'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Sparkles, Mail, Lock, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Footer } from '@/components/shared/Footer';
import { ForgotPasswordModal } from '@/components/auth/ForgotPasswordModal';
import { ResendEmailModal } from '@/components/auth/ResendEmailModal';
import { useGoogleLogin } from '@react-oauth/google';

export default function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // States for modals
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showResendModal, setShowResendModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Harap isi semua field.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await login(email, password);
      if (!res.success) {
        setError(res.error || 'Terjadi kesalahan saat login.');
      }
    } catch (err) {
      setError('Koneksi bermasalah. Coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSSO = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsGoogleLoading(true);
      setError('');
      try {
        const res = await loginWithGoogle(tokenResponse.access_token);
        if (!res.success) {
          setError(res.error || 'Terjadi kesalahan saat login dengan Google.');
        }
      } catch (err) {
        setError('Koneksi bermasalah. Coba lagi.');
      } finally {
        setIsGoogleLoading(false);
      }
    },
    onError: () => {
      setError('Login Google dibatalkan atau gagal.');
    },
  });

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
            <div className="w-14 h-14 rounded-2xl overflow-hidden flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/20 shrink-0 bg-white">
              <img src="/logo.png" alt="DIAMOND Logo" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display='none'; e.currentTarget.parentElement!.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary animate-pulse"><path d="M6 3h12l4 6-10 13L2 9Z"/></svg>'; }} />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
              DIAMOND Finance AI
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Asisten Keuangan Cerdas berbasis AI
            </p>
          </div>

          {/* Login Card */}
          <Card glass={false} className="border border-slate-200/80 shadow-2xl bg-white ">
            <CardHeader>
              <CardTitle>Selamat Datang Kembali</CardTitle>
              <CardDescription>
                Masukkan email dan password Anda untuk masuk ke dashboard
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
                  label="Email"
                  type="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  icon={<Mail size={18} />}
                  disabled={isLoading}
                />

                <div className="relative">
                  <div className="absolute right-0 top-0">
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="text-xs font-bold text-primary hover:underline"
                    >
                      Lupa?
                    </button>
                  </div>
                  <Input
                    label="Password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    icon={<Lock size={18} />}
                    disabled={isLoading}
                  />
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full py-3"
                    isLoading={isLoading}
                    disabled={isGoogleLoading}
                  >
                    Masuk
                  </Button>
                </div>
                
                <div className="text-center mt-3">
                  <p className="text-xs text-slate-500">
                    Belum Verifikasi Email?{' '}
                    <button
                      type="button"
                      onClick={() => setShowResendModal(true)}
                      className="font-bold text-primary hover:underline"
                    >
                      Kirim Ulang
                    </button>
                  </p>
                </div>

                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink-0 mx-4 text-slate-400 text-xs uppercase tracking-wider font-semibold">Atau masuk dengan</span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                <Button
                  type="button"
                  variant="secondary"
                  className="w-full py-3 flex items-center justify-center gap-2 bg-white hover:bg-slate-50 font-bold border border-slate-200 shadow-sm"
                  onClick={() => handleGoogleSSO()}
                  isLoading={isGoogleLoading}
                  disabled={isLoading}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  </svg>
                  Masuk dengan Google
                </Button>
              </form>
            </CardContent>

            <CardFooter className="justify-center">
              <p className="text-sm text-slate-500 ">
                Belum punya akun?{' '}
                <Link href="/auth/signup" className="text-primary hover:underline font-semibold transition-colors">
                  Daftar Sekarang
                </Link>
              </p>
            </CardFooter>
          </Card>
        </motion.div>
      </div>

      <Footer />

      <ForgotPasswordModal isOpen={showForgotModal} onClose={() => setShowForgotModal(false)} />
      <ResendEmailModal isOpen={showResendModal} onClose={() => setShowResendModal(false)} />
    </div>
  );
}
