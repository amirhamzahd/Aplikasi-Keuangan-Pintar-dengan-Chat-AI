import React from 'react';

type BadgeVariant = 'primary' | 'success' | 'danger' | 'warning' | 'secondary' | 'outline';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
 variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
 primary: 'bg-primary/10 text-primary border border-primary/20',
 success: 'bg-success/10 text-success border border-success/20',
 danger: 'bg-danger/10 text-danger border border-danger/20',
 warning: 'bg-warning/10 text-warning border border-warning/20',
 secondary: 'bg-slate-100 text-slate-700 border border-slate-200/50 ',
 outline: 'bg-transparent text-slate-600 border border-border',
};

export function Badge({ variant = 'secondary', className = '', children, ...props }: BadgeProps) {
 return (
 <span
 className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold select-none ${variantStyles[variant]} ${className}`}
 {...props}
 >
 {children}
 </span>
 );
}
