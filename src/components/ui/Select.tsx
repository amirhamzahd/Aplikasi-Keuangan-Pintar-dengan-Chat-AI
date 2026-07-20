'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', label, error, options, value, onChange, disabled, ...props }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find((opt) => opt.value === value) || options[0];

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (optionValue: string) => {
      if (onChange) {
        onChange({
          target: { value: optionValue, name: props.name },
          currentTarget: { value: optionValue, name: props.name }
        } as React.ChangeEvent<HTMLSelectElement>);
      }
      setIsOpen(false);
    };

    return (
      <div className="flex flex-col space-y-1.5 w-full relative" ref={containerRef}>
        {label && (
          <label className="text-xs font-semibold tracking-wider uppercase text-slate-500">
            {label}
          </label>
        )}
        
        {/* Hidden native select for form integration & ref preservation */}
        <select
          ref={ref}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className="hidden"
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Custom UI Trigger Button */}
        <div
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`relative w-full text-[16px] md:text-sm py-2.5 rounded-xl border bg-white px-4 text-slate-900 flex justify-between items-center transition-all shadow-sm ${
            disabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'cursor-pointer hover:border-primary/50 hover:shadow focus-within:ring-2 focus-within:ring-primary/45 focus-within:border-primary'
          } ${error ? 'border-danger focus-within:ring-danger/45 focus-within:border-danger' : 'border-slate-200'} ${className}`}
        >
          <span className="pr-4 font-medium text-slate-700 text-left whitespace-normal leading-tight">{selectedOption?.label || 'Pilih opsi...'}</span>
          <ChevronDown 
            size={16} 
            className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary' : ''}`} 
          />
        </div>

        {/* Custom UI Dropdown Menu */}
        <AnimatePresence>
          {isOpen && !disabled && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="absolute z-50 w-full top-full mt-2 bg-white/95 backdrop-blur-xl border border-slate-200/60 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] overflow-hidden"
            >
              <div className="max-h-64 overflow-y-auto py-1.5 scrollbar-hide">
                {options.map((opt) => {
                  const isSelected = opt.value === value;
                  return (
                    <div
                      key={opt.value}
                      onClick={() => handleSelect(opt.value)}
                      className={`flex items-center justify-between px-3.5 py-2.5 mx-1.5 my-0.5 rounded-lg text-sm cursor-pointer transition-colors ${
                        isSelected 
                          ? 'bg-primary/10 text-primary font-semibold' 
                          : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 font-medium'
                      }`}
                    >
                      <span className="whitespace-normal leading-tight pr-2">{opt.label}</span>
                      {isSelected && <Check size={16} className="text-primary shrink-0 mt-0.5" />}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <p className="text-xs font-medium text-danger mt-0.5">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
