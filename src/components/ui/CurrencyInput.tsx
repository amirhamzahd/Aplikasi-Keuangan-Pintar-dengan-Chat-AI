import React, { useState, useEffect } from 'react';
import { Input, InputProps } from './Input';

interface CurrencyInputProps extends Omit<InputProps, 'type' | 'onChange'> {
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function CurrencyInput({ value, onChange, ...props }: CurrencyInputProps) {
  const formatValue = (val: string | number) => {
    if (val === '' || val === undefined || val === null) return '';
    const numericValue = val.toString().replace(/[^0-9]/g, '');
    if (!numericValue) return '';
    return new Intl.NumberFormat('id-ID').format(parseInt(numericValue, 10));
  };

  const [displayValue, setDisplayValue] = useState(formatValue(value));

  useEffect(() => {
    const numericVal = value.toString().replace(/[^0-9]/g, '');
    const currentNumericDisplay = displayValue.toString().replace(/[^0-9]/g, '');
    if (numericVal !== currentNumericDisplay) {
      setDisplayValue(formatValue(value));
    }
  }, [value, displayValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const numericString = rawValue.replace(/[^0-9]/g, '');
    setDisplayValue(formatValue(numericString));
    
    const syntheticEvent = {
      ...e,
      target: {
        ...e.target,
        value: numericString,
        name: e.target.name
      }
    };
    
    onChange(syntheticEvent as React.ChangeEvent<HTMLInputElement>);
  };

  return (
    <Input
      {...props}
      type="text"
      inputMode="numeric"
      className={`w-full text-[16px] md:text-sm py-2.5 rounded-xl border border-slate-200 bg-slate-50 px-4 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/45 focus:border-primary transition-all pl-[42px] ${
        props.error ? 'border-danger focus:ring-danger/45 focus:border-danger' : ''
      } ${props.className || ''}`}
      value={displayValue}
      onChange={handleChange}
    />
  );
}
