'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function RootPage() {
 const { user, isLoading } = useAuth();
 const router = useRouter();

 useEffect(() => {
 if (!isLoading) {
 if (user) {
 router.replace('/dashboard');
 } else {
 router.replace('/auth/login');
 }
 }
 }, [user, isLoading, router]);

 return (
 <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-slate-50 ">
 <Loader2 className="animate-spin text-primary" size={32} />
 </div>
 );
}
