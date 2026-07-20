'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export interface User {
  id: string;
  name: string;
  email: string;
  gender?: string;
  photo?: string;
  pin?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Load user session on start
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('aura_current_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        const devicePin = localStorage.getItem(`device_pin_${parsed.id}`);
        if (devicePin) parsed.pin = devicePin;
        setUser(parsed);
      }
      setIsLoading(false);
    }
  }, []);

  // Authentication routing guard
  useEffect(() => {
    if (isLoading) return;

    const publicPaths = ['/auth/login', '/auth/signup', '/verify'];
    const isPublicPath = publicPaths.includes(pathname);

    if (!user && !isPublicPath) {
      router.push('/auth/login');
    } else if (user && isPublicPath) {
      router.push('/dashboard');
    }
  }, [user, isLoading, pathname, router]);

  // Login handler
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setIsLoading(false);
        return { success: false, error: data.error || 'Terjadi kesalahan.' };
      }

      const sessionUser: User = { id: data.user.id, name: data.user.name, email: data.user.email };
      const devicePin = localStorage.getItem(`device_pin_${sessionUser.id}`);
      if (devicePin) sessionUser.pin = devicePin;
      
      localStorage.setItem('aura_current_user', JSON.stringify(sessionUser));
      setUser(sessionUser);
      setIsLoading(false);
      
      router.push('/dashboard');
      return { success: true };
    } catch (err) {
      setIsLoading(false);
      return { success: false, error: 'Gagal menghubungi server.' };
    }
  };

  // Sign up handler
  const signup = async (name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setIsLoading(false);
        return { success: false, error: data.error || 'Terjadi kesalahan saat registrasi.' };
      }

      setIsLoading(false);
      // Pendaftaran berhasil, kembalikan response sukses agar UI menampilkan instruksi cek email.
      // Kita tidak otomatis login, karena mereka harus verifikasi email dulu.
      return { success: true };
    } catch (err) {
      setIsLoading(false);
      return { success: false, error: 'Gagal menghubungi server.' };
    }
  };

  // Logout handler
  const logout = () => {
    localStorage.removeItem('aura_current_user');
    setUser(null);
    router.push('/auth/login');
  };

  // Update Profile
  const updateProfile = (data: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...data };
    
    if (data.pin !== undefined) {
      if (data.pin) {
        localStorage.setItem(`device_pin_${user.id}`, data.pin);
      } else {
        localStorage.removeItem(`device_pin_${user.id}`);
      }
    }
    
    setUser(updatedUser);
    localStorage.setItem('aura_current_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, signup, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
