import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
 glass?: boolean;
}

export function Card({ className = '', glass = true, children, ...props }: CardProps) {
 return (
 <div
 className={`rounded-2xl border transition-all duration-300 ${
 glass 
 ? 'glass shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] [0_4px_20px_-4px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] [0_8px_30px_-4px_rgba(0,0,0,0.4)]' 
 : 'bg-card text-card-foreground border-border shadow-sm'
 } ${className}`}
 {...props}
 >
 {children}
 </div>
 );
}

export function CardHeader({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
 return (
 <div className={`p-5 pb-3 flex flex-col space-y-1.5 ${className}`} {...props}>
 {children}
 </div>
 );
}

export function CardTitle({ className = '', children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
 return (
 <h3 className={`font-semibold text-lg leading-none tracking-tight text-slate-900 ${className}`} {...props}>
 {children}
 </h3>
 );
}

export function CardDescription({ className = '', children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
 return (
 <p className={`text-sm text-slate-500 ${className}`} {...props}>
 {children}
 </p>
 );
}

export function CardContent({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
 return (
 <div className={`p-5 pt-0 ${className}`} {...props}>
 {children}
 </div>
 );
}

export function CardFooter({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
 return (
 <div className={`p-5 pt-0 flex items-center justify-between border-t border-border/20 pt-4 mt-2 ${className}`} {...props}>
 {children}
 </div>
 );
}
