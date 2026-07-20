'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Footer } from '@/components/shared/Footer';

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Sedang memverifikasi email Anda...');

  useEffect(() => {
    if (!token || !email) {
      setStatus('error');
      setMessage('Tautan verifikasi tidak valid atau tidak lengkap.');
      return;
    }

    const verifyEmail = async () => {
      try {
        const res = await fetch(`/api/auth/verify?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`);
        const data = await res.json();

        if (res.ok && data.success) {
          setStatus('success');
          setMessage(data.message || 'Email Anda berhasil diverifikasi!');
        } else if (res.ok && data.message && data.message.includes('sudah diverifikasi')) {
           setStatus('success');
           setMessage('Akun Anda sudah terverifikasi sebelumnya.');
        } else {
          setStatus('error');
          setMessage(data.error || 'Verifikasi gagal. Tautan tidak valid atau sudah kadaluarsa.');
        }
      } catch (error) {
        setStatus('error');
        setMessage('Terjadi kesalahan jaringan. Silakan coba lagi nanti.');
      }
    };

    verifyEmail();
  }, [token, email]);

  return (
    <Card glass={false} className="border border-slate-200/80 shadow-2xl bg-white text-center p-6">
      <CardHeader>
        <div className="flex justify-center mb-4">
          {status === 'loading' && <Loader2 size={64} className="text-primary animate-spin" />}
          {status === 'success' && <CheckCircle size={64} className="text-emerald-500 animate-bounce" />}
          {status === 'error' && <XCircle size={64} className="text-danger animate-shake" />}
        </div>
        <CardTitle className="text-2xl">
          {status === 'loading' ? 'Memverifikasi...' : status === 'success' ? '' : 'Verifikasi Gagal'}
        </CardTitle>
        <CardDescription className="text-base mt-2">
          {message}
        </CardDescription>
      </CardHeader>
      <CardFooter className="justify-center mt-6 flex-col">
        <Button 
          variant="primary" 
          className="w-full py-3 shadow-lg shadow-primary/20 text-sm font-bold" 
          onClick={() => router.push('/auth/login')}
          disabled={status === 'loading'}
        >
          {status === 'success' ? 'Gunakan DIAMOND Finance Sekarang' : 'Lanjut ke Halaman Login'}
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function VerifyPage() {
  return (
    <div className="flex-1 flex flex-col justify-between min-h-screen px-4 bg-gradient-to-tr from-slate-100 via-slate-50 to-blue-50/20 relative overflow-hidden">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

      <div className="flex-1 flex items-center justify-center w-full relative z-10 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-md relative z-10"
        >
          <Suspense fallback={<div className="text-center p-8">Loading...</div>}>
            <VerifyContent />
          </Suspense>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}
