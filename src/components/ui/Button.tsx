'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

type ButtonVariant = 'primary' | 'success' | 'danger' | 'warning' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
 variant?: ButtonVariant;
 size?: ButtonSize;
 children?: React.ReactNode;
 isLoading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
 primary: 'bg-primary text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20 active:bg-blue-800',
 success: 'bg-success text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 active:bg-emerald-700',
 danger: 'bg-danger text-white hover:bg-rose-600 shadow-lg shadow-rose-500/20 active:bg-rose-700',
 warning: 'bg-warning text-white hover:bg-amber-600 shadow-lg shadow-amber-500/20 active:bg-amber-700',
 secondary: 'bg-slate-200 text-slate-800 hover:bg-slate-300 ',
 ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 ',
};

const sizeStyles: Record<ButtonSize, string> = {
 sm: 'px-3 py-1.5 text-xs font-medium rounded-lg',
 md: 'px-4 py-2 text-sm font-semibold rounded-xl',
 lg: 'px-5 py-2.5 text-base font-semibold rounded-2xl',
 icon: 'p-2 rounded-xl flex items-center justify-center',
};

export function Button({
 variant = 'primary',
 size = 'md',
 className = '',
 isLoading = false,
 children,
 disabled,
 ...props
}: ButtonProps) {
 return (
 <motion.button
 whileHover={{ scale: disabled || isLoading ? 1 : 1.015 }}
 whileTap={{ scale: disabled || isLoading ? 1 : 0.985 }}
 className={`inline-flex items-center justify-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/45 disabled:opacity-50 disabled:pointer-events-none cursor-pointer ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
 disabled={disabled || isLoading}
 {...props}
 >
 {isLoading ? (
 <span className="flex items-center gap-2">
 <svg className="animate-spin h-4 w-4 text-current" viewBox="0 0 24 24" fill="none">
 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
 </svg>
 Loading...
 </span>
 ) : (
 children
 )}
 </motion.button>
 );
}
