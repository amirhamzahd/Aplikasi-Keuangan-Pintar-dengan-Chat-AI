'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TermsModal({ isOpen, onClose }: TermsModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 md:p-8 border border-slate-100 relative overflow-hidden flex flex-col max-h-[85vh]"
          >
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl" />

            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors z-50"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
                <Shield size={20} />
              </div>
              <h3 className="text-xl font-extrabold text-slate-800">
                Syarat & Kebijakan Privasi
              </h3>
            </div>

            <div className="overflow-y-auto pr-2 pb-4 space-y-4 text-sm text-slate-600 relative z-10 flex-1 custom-scrollbar">
              <div>
                <h4 className="font-bold text-slate-800 text-base mb-2">1. Ketentuan Penggunaan</h4>
                <p>
                  Dengan menggunakan layanan DIAMOND Finance AI, Anda setuju untuk mematuhi semua syarat dan ketentuan yang berlaku. Layanan ini disediakan "sebagaimana adanya" untuk membantu Anda mengelola keuangan pribadi secara lebih cerdas dengan bantuan AI.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-base mb-2">2. Kebijakan Privasi Data</h4>
                <p>
                  Keamanan data Anda adalah prioritas kami. Semua data transaksi, saldo, dan percakapan dengan asisten AI disimpan dengan enkripsi tingkat tinggi.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-base mb-2">3. Penggunaan AI</h4>
                <p>
                  Saran keuangan yang diberikan oleh DIAMOND AI adalah hasil analisis algoritma kecerdasan buatan. Kami tidak bertanggung jawab atas kerugian finansial yang mungkin timbul akibat keputusan investasi atau pengeluaran berdasarkan saran tersebut. Harap gunakan pertimbangan Anda sendiri.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-base mb-2">4. Hak Akses & Berlangganan</h4>
                <p>
                  Akses ke fitur-fitur premium, termasuk asisten AI, diatur berdasarkan paket langganan Anda. Kami berhak mengubah harga dan fitur kapan saja dengan pemberitahuan sebelumnya.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 relative z-10 shrink-0">
              <Button variant="primary" className="w-full py-3" onClick={onClose}>
                Saya Mengerti & Setuju
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
