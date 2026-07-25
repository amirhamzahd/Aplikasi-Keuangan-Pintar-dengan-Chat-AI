import React from 'react';

export function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="py-6 text-center text-[11px] font-bold text-slate-400 border-t border-slate-100 bg-white/20 backdrop-blur-sm w-full mt-auto print:hidden">
      &copy; {currentYear} Aplikasi Keuangan Pintar
    </footer>
  );
}
