import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
 label?: string;
 icon?: React.ReactNode;
 error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
 ({ className = '', label, icon, error, type = 'text', ...props }, ref) => {
 return (
 <div className="flex flex-col space-y-1.5 w-full">
 {label && (
 <label className="text-xs font-semibold tracking-wider uppercase text-slate-500 ">
 {label}
 </label>
 )}
 <div className="relative flex items-center">
 {icon && (
 <div className="absolute left-3.5 text-slate-400 pointer-events-none">
 {icon}
 </div>
 )}
 <input
 ref={ref}
 type={type}
 className={`w-full text-[16px] md:text-sm py-2.5 rounded-xl border border-slate-200 bg-slate-50 px-4 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/45 focus:border-primary transition-all ${
 icon ? 'pl-11' : ''
 } ${
 error ? 'border-danger focus:ring-danger/45 focus:border-danger' : ''
 } ${className}`}
 {...props}
 />
 </div>
 {error && (
 <p className="text-xs font-medium text-danger mt-0.5">{error}</p>
 )}
 </div>
 );
 }
);

Input.displayName = 'Input';
