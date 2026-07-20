'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
 isOpen: boolean;
 onClose: () => void;
 title?: string;
 children: React.ReactNode;
 size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
 sm: 'max-w-md',
 md: 'max-w-lg',
 lg: 'max-w-2xl',
 xl: 'max-w-4xl',
};

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
 useEffect(() => {
 if (isOpen) {
 document.body.style.overflow = 'hidden';
 } else {
 document.body.style.overflow = 'unset';
 }
 return () => {
 document.body.style.overflow = 'unset';
 };
 }, [isOpen]);

 return (
 <AnimatePresence>
 {isOpen && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-x-hidden overflow-y-auto">
 {/* Backdrop Overlay */}
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 onClick={onClose}
 className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm cursor-pointer"
 />

 {/* Modal Container */}
 <motion.div
 initial={{ opacity: 0, scale: 0.95, y: 15 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.95, y: 15 }}
 transition={{ type: 'spring', duration: 0.35 }}
 className={`relative w-full ${sizeClasses[size]} glass rounded-2xl shadow-2xl p-6 overflow-hidden z-10 flex flex-col`}
 >
 {/* Header */}
 <div className="flex items-center justify-between border-b border-border/20 pb-4 mb-4">
 {title && (
 <h3 className="text-lg font-bold text-slate-900 ">
 {title}
 </h3>
 )}
 <button
 onClick={onClose}
 className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition cursor-pointer"
 >
 <X size={18} />
 </button>
 </div>

 {/* Content */}
 <div className="flex-1 min-h-0 overflow-y-auto max-h-[75vh]">
 {children}
 </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>
 );
}
