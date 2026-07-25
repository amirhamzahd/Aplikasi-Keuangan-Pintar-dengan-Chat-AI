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
  isPremium?: boolean;
  planType?: string;
  planExpiredAt?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: (access_token: string) => Promise<{ success: boolean; error?: string }>;
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

  // Load user session on start via API
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            setUser(data.user);
          } else {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  // Authentication routing guard
  useEffect(() => {
    if (isLoading) return;

    const publicPaths = ['/auth/login', '/auth/signup', '/verify'];
    const isPublicPath = publicPaths.includes(pathname);

    if (!user && !isPublicPath && pathname !== '/pricing') {
      router.push('/auth/login');
    } else if (user) {
      const isNonePlan = !user.planType || user.planType === 'NONE';
      
      if (isPublicPath) {
        router.push(isNonePlan ? '/pricing' : '/dashboard');
      } else if (pathname.startsWith('/dashboard') && isNonePlan) {
        router.push('/pricing');
      }
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

      setUser(data.user);
      setIsLoading(false);
      
      if (data.user?.planType === 'NONE') {
        router.push('/pricing');
      } else {
        router.push('/dashboard');
      }
      return { success: true };
    } catch (err) {
      setIsLoading(false);
      return { success: false, error: 'Gagal menghubungi server.' };
    }
  };

  // Google Login handler
  const loginWithGoogle = async (access_token: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setIsLoading(false);
        return { success: false, error: data.error || 'Terjadi kesalahan.' };
      }

      setUser(data.user);
      setIsLoading(false);
      
      if (data.user?.planType === 'NONE') {
        router.push('/pricing');
      } else {
        router.push('/dashboard');
      }
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
      return { success: true };
    } catch (err) {
      setIsLoading(false);
      return { success: false, error: 'Gagal menghubungi server.' };
    }
  };

  // Logout handler
  const logout = async () => {
    try {
      // In a real app we would call /api/auth/logout to clear HttpOnly cookie
      // For now we can just redirect and clear state, but we should clear cookie.
      // Easiest is to just set user to null for now and force re-login. 
      // If we implement /api/auth/logout it would be better.
      setUser(null);
      // Wait, deleting cookie from client is not possible if it's HttpOnly. 
      // I should add a quick api route for logout or clear cookie on server side.
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch(e) {}
    
    router.push('/auth/login');
  };

  // Update Profile
  const updateProfile = async (data: Partial<User>) => {
    if (!user) return;
    
    // Optimistic UI update
    const updatedUser = { ...user, ...data };
    setUser(updatedUser);

    try {
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        console.error('Failed to save profile to database');
      }
    } catch (err) {
      console.error('Network error saving profile', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, loginWithGoogle, signup, logout, updateProfile }}>
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
