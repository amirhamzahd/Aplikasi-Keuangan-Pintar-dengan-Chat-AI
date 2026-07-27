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
    <div className="flex-1 min-h-screen bg-[#F8FAFC]" />
  );
}
