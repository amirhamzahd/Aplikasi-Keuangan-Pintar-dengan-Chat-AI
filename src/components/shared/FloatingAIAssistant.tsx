'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTransactions } from '@/context/TransactionContext';
import { useAuth } from '@/context/AuthContext';
import { parseIndonesianNLP, parseMultipleIndonesianNLP, parseReceiptOCR } from '@/utils/nlpParser';
import { handleFinancialAssistant } from '@/utils/financialAssistant';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import {
  Bot, User, X, Loader2, ArrowRight, MessageSquare, Send, Camera, Mic, Image as ImageIcon, Sparkles, Plus,
  Wallet, PieChart, TrendingUp, Landmark, Banknote, CreditCard, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  type?: 'text' | 'ocr_result' | 'nlp_success' | 'account_selection' | 'account_selection_ocr';
  data?: any;
}

const renderFormattedText = (text: string) => {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, index) => {
    if (index % 2 === 1) {
      return <strong key={index} className="font-bold">{part}</strong>;
    }
    return <span key={index}>{
      part.split('\n').map((line, i, arr) => (
        <React.Fragment key={i}>
          {line}
          {i !== arr.length - 1 && <br />}
        </React.Fragment>
      ))
    }</span>;
  });
};

export function FloatingAIAssistant() {
  const { addTransaction, accounts, transactions, budgets, categories, goals } = useTransactions();
  const { user } = useAuth();

  // Widget Open State
  const [isOpen, setIsOpen] = useState(false);

  // Check expiration
  const isExpired = user?.planExpiredAt ? new Date(user.planExpiredAt) < new Date() : false;

  // Early return if user is not Plus or Pro, or if expired
  if (!user || user.planType === 'NONE' || user.planType === 'BASIC' || isExpired) {
    return null;
  }

  // Chat States
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: user?.planType === 'PLUS'
        ? 'Halo! Saya DIAMOND, asisten cerdasmu. Catat transaksi dengan mengetik "Beli bensin 20rb" atau kirim suara via mic.'
        : 'Halo! Saya DIAMOND, asisten cerdasmu. Catat transaksi dengan mengetik "Beli bensin 20rb", kirim suara via mic, atau upload struk.'
    }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isScanningOCR, setIsScanningOCR] = useState(false);
  const [pendingTxDesc, setPendingTxDesc] = useState<string | null>(null);
  const [activeAccountSelection, setActiveAccountSelection] = useState<{ msgId: string, parsedTx: any, totalExpenseForValidation: number } | null>(null);

  const getAccountIcon = (name: string, isInsufficient: boolean) => {
    const iconClass = isInsufficient ? "opacity-60" : "";
    const lowerName = name.toLowerCase();
    if (lowerName.includes('tunai') || lowerName.includes('cash')) return <Banknote size={14} className={iconClass} />;
    if (lowerName.includes('bca') || lowerName.includes('mandiri') || lowerName.includes('bri') || lowerName.includes('bni') || lowerName.includes('bank')) return <CreditCard size={14} className={iconClass} />;
    return <Wallet size={14} className={iconClass} />;
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom of chat
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isProcessing, isOpen]);

  const handleAccountSelect = (msgId: string, accountId: string, parsedTxData: any) => {
    const parsedArray = Array.isArray(parsedTxData) ? parsedTxData : [parsedTxData];

    let totalExpense = 0;
    parsedArray.forEach((tx: any) => {
      if (tx.type === 'expense') totalExpense += (tx.amount || 0);
    });

    const account = accounts.find(a => a.id === accountId);
    if (account && totalExpense > 0 && account.balance < totalExpense) {
      setMessages(prev => prev.map(msg => {
        if (msg.id === msgId) {
          return {
            ...msg,
            text: `Maaf, saldo di rekening ${account.name} tidak cukup (Sisa: Rp${account.balance.toLocaleString('id-ID')}). Silakan pilih rekening lain atau Batal.`
          };
        }
        return msg;
      }));
      return;
    }

    parsedArray.forEach((parsedTx: any) => {
      addTransaction({
        description: parsedTx.description,
        amount: parsedTx.amount,
        type: parsedTx.type,
        category: parsedTx.category,
        accountId: accountId,
        tags: parsedTx.tags,
        date: new Date().toISOString()
      });
    });

    setMessages(prev => prev.map(msg => {
      if (msg.id === msgId) {
        const account = accounts.find(a => a.id === accountId);
        const accountName = account ? account.name : 'Rekening';
        if (parsedArray.length > 1) {
          return {
            ...msg,
            text: `Sip! ${parsedArray.length} transaksi berhasil dicatat otomatis menggunakan **${accountName}** 💸`,
            type: 'nlp_success',
            data: undefined
          };
        } else {
          const parsedTx = parsedArray[0];
          const typeLabel = parsedTx.type === 'income' ? 'Pemasukan' : 'Pengeluaran';
          return {
            ...msg,
            text: `Sip! ${typeLabel} untuk "${parsedTx.description}" sebesar Rp${parsedTx.amount.toLocaleString('id-ID')} berhasil dicatat ke kategori ${parsedTx.category} menggunakan **${accountName}** 💸`,
            type: 'nlp_success',
            data: undefined
          };
        }
      }
      return msg;
    }));
  };

  // Speech Recognition (Voice AI)
  const startSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Browser Anda tidak mendukung Web Speech API (Gunakan Chrome atau Safari).');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'id-ID';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onerror = () => {
      setIsRecording(false);
      alert('Gagal mendengarkan suara. Coba lagi.');
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.onresult = (event: any) => {
      const speechResult = event.results[0][0].transcript;
      setInput(speechResult);
      handleSendMessage(speechResult);
    };

    recognition.start();
  };

  // Chat message submission
  const handleSendMessage = async (textToSend?: string | any) => {
    const text = (typeof textToSend === 'string' ? textToSend : input).trim();
    if (!text) return;

    setInput('');

    const userMsg: Message = { id: `user-${Date.now()}`, sender: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setIsProcessing(true);

    await new Promise((resolve) => setTimeout(resolve, 800));

    // Case 1: Complete pending transaction
    if (pendingTxDesc) {
      const amountNum = parseFloat(text.replace(/[^0-9]/g, ''));
      if (isNaN(amountNum) || amountNum <= 0) {
        setMessages(prev => [...prev, {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: `Maaf, nominal salah. Berapa nominal untuk "${pendingTxDesc}"?`
        }]);
        setIsProcessing(false);
        return;
      }

      let parsed: any = null;
      try {
        const response = await fetch('/api/gemini/parse-tx', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: pendingTxDesc,
            categories: categories.map(c => ({ name: c.name, type: c.type }))
          })
        });
        const data = await response.json();
        if (data.result) {
          parsed = Array.isArray(data.result) ? data.result[0] : data.result;
        } else {
          parsed = parseIndonesianNLP(pendingTxDesc, categories);
        }
      } catch (err) {
        parsed = parseIndonesianNLP(pendingTxDesc, categories);
      }

      parsed.amount = amountNum;

      setMessages(prev => [...prev, {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: `Transaksi terdeteksi: "${parsed.description}" Rp${parsed.amount.toLocaleString('id-ID')}. Gunakan Sumber Dana yang mana?`,
        type: 'account_selection',
        data: { parsedTx: parsed }
      }]);

      setPendingTxDesc(null);
      setIsProcessing(false);
      return;
    }

    // Case 2: Route through Financial Assistant Analysis/Education/Consultation
    const assistantResult = handleFinancialAssistant(text, transactions, accounts, budgets);
    if (!assistantResult.isTransactionCommand) {
      // Call Gemini API
      try {
        const response = await fetch('/api/gemini', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: text,
            context: {
              transactions: transactions.slice(0, 100), // pass last 100 tx to avoid huge payload
              budgets,
              accounts: accounts.map(a => ({ name: a.name, balance: a.balance })),
              goals: goals.map(g => ({ name: g.name, target: g.target, current: g.current }))
            }
          })
        });

        const data = await response.json();

        let replyText = data.reply;
        if (data.error) {
          let errorMsg = typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
          if (errorMsg.includes('429') || errorMsg.includes('quota')) {
            errorMsg = 'Limit AI sementara penuh karena terlalu banyak request. Silakan tunggu 1 menit lalu coba lagi ya! ⏳';
          } else if (errorMsg.includes('503') || errorMsg.includes('demand')) {
            errorMsg = 'Saat ini server AI sedang sangat sibuk (overload) dari Google. Mohon tunggu beberapa saat dan coba lagi ya! ⏳';
          } else if (errorMsg.includes('{')) {
            try {
              const match = errorMsg.match(/\{.*\}/);
              if (match) {
                const parsed = JSON.parse(match[0]);
                if (parsed.error?.message) errorMsg = parsed.error.message;
              }
            } catch (e) { }
          }
          replyText = `Gagal merespon: ${errorMsg}`;
        }

        setMessages(prev => [...prev, {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: replyText || 'Maaf, saya tidak bisa terhubung ke server Gemini saat ini.'
        }]);
      } catch (err) {
        setMessages(prev => [...prev, {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: 'Terjadi kesalahan jaringan saat menghubungi Gemini.'
        }]);
      }

      setIsProcessing(false);
      return;
    }

    // Case 3: Standard parse for transaction command (Using Gemini AI for High Accuracy)
    let parsedArray: any[] = [];
    try {
      const response = await fetch('/api/gemini/parse-tx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text,
          categories: categories.map(c => ({ name: c.name, type: c.type }))
        })
      });
      const data = await response.json();
      if (data.result) {
        parsedArray = Array.isArray(data.result) ? data.result : [data.result]; // Parse returns single object, we wrap in array to match old behavior
      } else {
        // Fallback to local NLP if Gemini fails
        parsedArray = parseMultipleIndonesianNLP(text, categories);
      }
    } catch (err) {
      console.error(err);
      parsedArray = parseMultipleIndonesianNLP(text, categories);
    }
    const missingAmounts = parsedArray.filter(p => p.amount === 0);
    if (missingAmounts.length > 0) {
      setPendingTxDesc(text);
      setMessages(prev => [...prev, {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: `Berapa nominal transaksi untuk "${missingAmounts[0].description}"?`
      }]);
      setIsProcessing(false);
      return;
    }

    const multiText = parsedArray.length > 1
      ? `Transaksi ganda terdeteksi:\n${parsedArray.map(p => `- ${p.description}: Rp${p.amount.toLocaleString('id-ID')}`).join('\n')}\n\nGunakan Sumber Dana yang mana untuk semua transaksi ini?`
      : `Transaksi terdeteksi: "${parsedArray[0].description}" Rp${parsedArray[0].amount.toLocaleString('id-ID')}. Gunakan Sumber Dana yang mana?`;

    setMessages(prev => [...prev, {
      id: `ai-${Date.now()}`,
      sender: 'ai',
      text: multiText,
      type: 'account_selection',
      data: { parsedTx: parsedArray }
    }]);

    setIsProcessing(false);
  };

  // Helper to compress image before sending to API
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1024;
          const MAX_HEIGHT = 1024;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // OCR Upload (Gemini Vision)
  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanningOCR(true);

    try {
      // Compress the image before uploading to prevent Vercel 4.5MB limits and timeouts
      const base64Data = await compressImage(file);

      const response = await fetch('/api/gemini/receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64Data })
      });

      if (!response.ok) throw new Error('API Error');

      const parsed = await response.json();
      parsed.tags = ['ocr'];

      if (parsed.amount === 0) {
        setPendingTxDesc("Belanja (Struk)");
        setMessages(prev => [...prev, {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: `Struk gagal dianalisis. Berapa total belanjanya?`
        }]);
      } else {
        setMessages(prev => [...prev, {
          id: `ocr-${Date.now()}`,
          sender: 'ai',
          text: '',
          type: 'account_selection_ocr',
          data: { parsedTx: parsed }
        }]);
      }
    } catch (err: any) {
      console.error('OCR/Compression Error:', err);
      let errorMsg = err.message || 'Pastikan format foto didukung dan jelas.';
      if (errorMsg.includes('429') || errorMsg.includes('quota')) {
        errorMsg = 'Limit AI sementara penuh karena terlalu banyak request. Silakan tunggu 1 menit lalu coba lagi ya! ⏳';
      } else if (errorMsg.includes('{')) {
        try {
          const parsedErr = JSON.parse(errorMsg);
          if (parsedErr.error?.message) errorMsg = parsedErr.error.message;
        } catch (e) { }
      }
      setMessages(prev => [...prev, {
        id: `ocr-err-${Date.now()}`,
        sender: 'ai',
        text: `Gagal memproses struk: ${errorMsg}`
      }]);
    } finally {
      setIsScanningOCR(false);
      // reset input so same file can be selected again
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 print:hidden floating-ai-assistant hidden md:flex md:flex-col md:items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="w-[360px] md:w-[380px] h-[500px] bg-white border border-slate-200 shadow-2xl rounded-2xl flex flex-col overflow-hidden mb-4"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
                  <Bot size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">DIAMOND AI Assistant</h4>
                  <span className="text-[9px] text-success font-bold flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-success animate-pulse"></span>
                    Online
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 no-scrollbar bg-slate-50/30">

              {/* Examples suggestions */}
              {messages.length === 1 && (
                <div className="space-y-2 pb-2">
                  <p className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider px-1">Contoh Input:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { text: 'Beli kopi 18k di Starbucks', icon: '☕' },
                      { text: 'Gaji 6 juta bagi gimana', icon: '💰' },
                      { text: 'Bayar listrik 200rb via BCA', icon: '⚡' },
                      { text: 'Pengeluaran bulan ini', icon: '📊' }
                    ].map((eg, i) => (
                      <button
                        key={i}
                        onClick={() => setInput(eg.text)}
                        className="flex flex-col items-start text-left p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-blue-50 hover:border-blue-200 hover:shadow-sm hover:-translate-y-0.5 text-slate-700 cursor-pointer transition-all shadow-sm group"
                      >
                        <span className="text-lg mb-1 opacity-80 group-hover:scale-110 transition-transform">{eg.icon}</span>
                        <span className="text-[9px] font-bold leading-tight">{eg.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg) => (
                <div key={msg.id} className={`flex flex-col gap-2 w-full ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`p-3 rounded-xl ${(msg.type === 'account_selection_ocr' || msg.type === 'account_selection') ? 'w-full' : 'max-w-[92%] w-fit'} text-xs leading-relaxed flex flex-col gap-3 ${msg.sender === 'user'
                      ? 'bg-primary text-white font-medium rounded-tr-none shadow-sm'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-[0_1px_2px_rgba(0,0,0,0.02)]'
                    }`}>
                    {msg.type === 'account_selection_ocr' && msg.data?.parsedTx ? (
                      <>
                        <div className="text-slate-600 font-medium">Struk terdeteksi dengan cerdas!</div>

                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-col gap-2 shadow-sm">
                          <div className="font-bold text-sm text-slate-800 uppercase">{msg.data.parsedTx.description || 'MERCHANT'}</div>

                          {msg.data.parsedTx.items && msg.data.parsedTx.items.length > 0 && (
                            <div className="flex flex-col gap-0 border-y border-dashed border-slate-200 py-2 mt-1">
                              {msg.data.parsedTx.items.map((item: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-start py-1.5">
                                  <div className="flex flex-col pr-2">
                                    <span className="font-bold text-slate-800 text-[10px] leading-tight">{item.name}</span>
                                    {item.qty > 1 && (
                                      <span className="text-[9px] text-slate-500 font-medium mt-0.5">
                                        {item.qty} x Rp{((item.price || 0) / item.qty).toLocaleString('id-ID')}
                                      </span>
                                    )}
                                  </div>
                                  <span className="font-extrabold text-slate-800 text-[10px] whitespace-nowrap">
                                    Rp{(item.price || 0).toLocaleString('id-ID')}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="flex justify-between items-center pt-1 mt-1">
                            <span className="font-bold text-slate-800 text-xs">Total</span>
                            <span className="font-bold text-blue-600 text-xs">Rp{(msg.data.parsedTx.amount || 0).toLocaleString('id-ID')}</span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 mt-2">
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setMessages(prev => prev.filter(m => m.id !== msg.id));
                              }}
                              className="flex-1 p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold transition-colors text-center"
                            >
                              Batal
                            </button>
                            <button
                              onClick={() => {
                                setMessages(prev => prev.filter(m => m.id !== msg.id));
                                const textToEdit = `${msg.data.parsedTx.description} ${msg.data.parsedTx.amount}`;
                                setInput(textToEdit);
                              }}
                              className="flex-1 p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold transition-colors text-center"
                            >
                              Ubah
                            </button>
                          </div>

                          <div className="pt-2 border-t border-slate-100">
                            <div className="text-[9px] text-slate-500 font-bold mb-2 text-center uppercase tracking-wider">
                              Klik Rekening Untuk Membayar
                            </div>
                            <div className="flex gap-1.5 overflow-x-auto snap-x pb-3 pt-1 px-1 -mx-1 custom-scrollbar">
                              {accounts.slice(0, 4).map(acc => {
                                const totalExpenseForValidation = msg.data.parsedTx.amount || 0;
                                const isInsufficient = totalExpenseForValidation > 0 && acc.balance < totalExpenseForValidation;
                                return (
                                  <button
                                    key={acc.id}
                                    disabled={isInsufficient}
                                    onClick={() => handleAccountSelect(msg.id, acc.id, msg.data.parsedTx)}
                                    className={`min-w-[70px] snap-start shrink-0 p-1.5 rounded-lg border text-[10px] font-bold flex flex-col items-center justify-center gap-1 transition-all ${isInsufficient
                                        ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                                        : 'bg-white border-blue-100 hover:border-blue-300 hover:bg-blue-50 text-blue-700 cursor-pointer shadow-sm'
                                      }`}
                                  >
                                    {getAccountIcon(acc.name, isInsufficient)}
                                    <span className="truncate w-full px-1 text-center">{acc.name}</span>
                                  </button>
                                );
                              })}
                              {accounts.length > 4 && (
                                <button
                                  onClick={() => setActiveAccountSelection({ msgId: msg.id, parsedTx: msg.data.parsedTx, totalExpenseForValidation: msg.data.parsedTx.amount || 0 })}
                                  className="min-w-[70px] snap-start shrink-0 p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[10px] font-bold flex flex-col items-center justify-center gap-1 transition-all shadow-sm"
                                >
                                  <ChevronRight size={14} className="text-slate-400" />
                                  <span className="truncate w-full px-1 text-center">Lihat Semua</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        {msg.text && msg.type !== 'account_selection' && <div>{renderFormattedText(msg.text)}</div>}

                        {msg.type === 'account_selection' && msg.data?.parsedTx && (() => {
                          const txs = Array.isArray(msg.data.parsedTx) ? msg.data.parsedTx : [msg.data.parsedTx];
                          const totalAmount = txs.reduce((sum: number, tx: any) => sum + (tx.amount || 0), 0);
                          const totalExpenseForValidation = txs.reduce((sum: number, tx: any) => sum + (tx.type === 'expense' ? (tx.amount || 0) : 0), 0);
                          const allExpense = txs.every((tx: any) => tx.type === 'expense');
                          const allIncome = txs.every((tx: any) => tx.type === 'income');
                          const headerType = allExpense ? 'Pengeluaran' : allIncome ? 'Pemasukan' : 'Total Transaksi';
                          const headerColor = allExpense ? 'text-red-600' : allIncome ? 'text-emerald-600' : 'text-blue-600';
                          const headerBg = allExpense ? 'bg-red-50/50 border-red-100' : allIncome ? 'bg-emerald-50/50 border-emerald-100' : 'bg-blue-50/50 border-blue-100';
                          const accountSelectionText = allExpense ? 'Klik Rekening Untuk Membayar' : allIncome ? 'Klik Rekening Untuk Menyimpan' : 'Pilih Rekening Transaksi';

                          return (
                            <div className="flex flex-col gap-2 mt-1">
                              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                <div className={`px-3 py-2 border-b ${headerBg} flex justify-between items-center`}>
                                  <span className={`text-[10px] font-extrabold uppercase tracking-wider ${headerColor}`}>
                                    {txs.length > 1 ? `Total ${headerType}` : headerType}
                                  </span>
                                  <span className={`text-sm font-extrabold ${headerColor}`}>
                                    Rp{totalAmount.toLocaleString('id-ID')}
                                  </span>
                                </div>
                                <div className="p-3 space-y-3">
                                  {txs.map((tx: any, idx: number) => (
                                    <div key={idx} className={idx > 0 ? "pt-3 border-t border-slate-100" : ""}>
                                      <div className="flex justify-between items-start mb-1">
                                        <div className="text-xs font-bold text-slate-800">{tx.description}</div>
                                        {txs.length > 1 && (
                                          <div className={`text-xs font-bold ${tx.type === 'expense' ? 'text-red-600' : 'text-emerald-600'}`}>
                                            Rp{(tx.amount || 0).toLocaleString('id-ID')}
                                          </div>
                                        )}
                                      </div>
                                      <div className="text-[9px] font-semibold text-slate-600 bg-slate-100 w-fit px-1.5 py-0.5 rounded uppercase tracking-wider">{tx.category || 'Lainnya'}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div className="flex gap-1.5 mt-1">
                                <button
                                  onClick={() => setMessages(prev => prev.filter(m => m.id !== msg.id))}
                                  className="flex-1 p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold transition-colors text-center"
                                >
                                  Batal
                                </button>
                                <button
                                  onClick={() => {
                                    setMessages(prev => prev.filter(m => m.id !== msg.id));
                                    const textToEdit = Array.isArray(msg.data.parsedTx)
                                      ? msg.data.parsedTx.map((t: any) => `${t.description} ${t.amount}`).join(', ')
                                      : `${msg.data.parsedTx.description} ${msg.data.parsedTx.amount}`;
                                    setInput(textToEdit);
                                  }}
                                  className="flex-1 p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold transition-colors text-center"
                                >
                                  Ubah
                                </button>
                              </div>

                              <div className="pt-2 border-t border-slate-100">
                                <div className="text-[9px] text-slate-500 font-bold mb-2 text-center uppercase tracking-wider">{accountSelectionText}</div>
                                <div className="flex gap-1.5 overflow-x-auto snap-x pb-3 pt-1 px-1 -mx-1 custom-scrollbar">
                                  {accounts.slice(0, 4).map(acc => {
                                    const isInsufficient = totalExpenseForValidation > 0 && acc.balance < totalExpenseForValidation;
                                    return (
                                      <button
                                        key={acc.id}
                                        disabled={isInsufficient}
                                        onClick={() => handleAccountSelect(msg.id, acc.id, msg.data.parsedTx)}
                                        className={`min-w-[70px] snap-start shrink-0 p-1.5 rounded-lg border text-[10px] font-bold flex flex-col items-center justify-center gap-1 transition-all ${isInsufficient
                                            ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                                            : 'bg-white border-blue-100 hover:border-blue-300 hover:bg-blue-50 text-blue-700 cursor-pointer shadow-sm'
                                          }`}
                                      >
                                        {getAccountIcon(acc.name, isInsufficient)}
                                        <span className="truncate w-full px-1 text-center">{acc.name}</span>
                                      </button>
                                    );
                                  })}
                                  {accounts.length > 4 && (
                                    <button
                                      onClick={() => setActiveAccountSelection({ msgId: msg.id, parsedTx: msg.data.parsedTx, totalExpenseForValidation })}
                                      className="min-w-[70px] snap-start shrink-0 p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[10px] font-bold flex flex-col items-center justify-center gap-1 transition-all shadow-sm"
                                    >
                                      <ChevronRight size={14} className="text-slate-400" />
                                      <span className="truncate w-full px-1 text-center">Lihat Semua</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </>
                    )}
                  </div>
                </div>
              ))}

              {isProcessing && (
                <div className="flex justify-start">
                  <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/60 rounded-2xl rounded-tl-sm flex items-center gap-3 shadow-sm relative w-full">
                    <div className="p-1.5 bg-blue-600 rounded-xl shadow-md shadow-blue-600/20 relative">
                      <div className="absolute inset-0 bg-blue-400 rounded-xl animate-ping opacity-20"></div>
                      <Sparkles size={14} className="text-white animate-pulse" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-extrabold text-blue-900 tracking-tight">AI sedang bekerja</span>
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] font-bold text-blue-600/70 uppercase tracking-wider">Menganalisis pencatatan</span>
                        <span className="flex gap-0.5 ml-1">
                          <span className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" />
                          <span className="w-1 h-1 bg-blue-500 rounded-full animate-bounce [animation-delay:0.15s]" />
                          <span className="w-1 h-1 bg-blue-500 rounded-full animate-bounce [animation-delay:0.3s]" />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {isScanningOCR && (
                <div className="flex justify-start">
                  <div className="p-3 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200/60 rounded-2xl rounded-tl-sm flex items-center gap-3 shadow-sm relative w-full">
                    <div className="p-1.5 bg-indigo-600 rounded-xl shadow-md shadow-indigo-600/20">
                      <Loader2 size={14} className="text-white animate-spin" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-extrabold text-indigo-900 tracking-tight">AI Memindai Struk</span>
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] font-bold text-indigo-600/70 uppercase tracking-wider">Membaca teks gambar</span>
                        <span className="flex gap-0.5 ml-1">
                          <span className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce" />
                          <span className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.15s]" />
                          <span className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.3s]" />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
              <AnimatePresence>
                {activeAccountSelection && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="absolute inset-x-0 bottom-0 bg-white rounded-t-2xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] border-t border-slate-100 z-20 flex flex-col max-h-[70%]"
                  >
                    <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
                      <div>
                        <h3 className="font-bold text-slate-800 text-xs">Pilih Sumber Dana</h3>
                        <p className="text-[9px] text-slate-500">Pilih rekening untuk transaksi ini</p>
                      </div>
                      <button
                        onClick={() => setActiveAccountSelection(null)}
                        className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div className="p-3 overflow-y-auto custom-scrollbar">
                      <div className="flex flex-col gap-2">
                        {accounts.map(acc => {
                          const isInsufficient = activeAccountSelection.totalExpenseForValidation > 0 && acc.balance < activeAccountSelection.totalExpenseForValidation;
                          return (
                            <button
                              key={acc.id}
                              disabled={isInsufficient}
                              onClick={() => {
                                handleAccountSelect(activeAccountSelection.msgId, acc.id, activeAccountSelection.parsedTx);
                                setActiveAccountSelection(null);
                              }}
                              className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition-all ${isInsufficient
                                  ? 'bg-slate-50 border-slate-100 opacity-60 cursor-not-allowed'
                                  : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 cursor-pointer shadow-sm'
                                }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${isInsufficient ? 'bg-slate-200 text-slate-500' : 'bg-blue-100 text-blue-600'}`}>
                                  {getAccountIcon(acc.name, isInsufficient)}
                                </div>
                                <div className="text-left">
                                  <div className="font-bold text-[11px] text-slate-800">{acc.name}</div>
                                  <div className="text-[10px] text-slate-500">Saldo: Rp{acc.balance.toLocaleString('id-ID')}</div>
                                </div>
                              </div>
                              <ChevronRight size={16} className={isInsufficient ? "text-slate-300" : "text-blue-400"} />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Input Footer */}
            <div className="p-3 border-t border-slate-100 bg-white">
              {/* Hidden input for Gallery */}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleReceiptUpload}
                className="hidden"
              />
              {/* Hidden input for Camera */}
              <input
                type="file"
                ref={cameraInputRef}
                accept="image/*"
                capture="environment"
                onChange={handleReceiptUpload}
                className="hidden"
              />

              <div className="bg-slate-50 border border-slate-200 rounded-xl focus-within:ring-2 focus-within:ring-blue-500/45 focus-within:border-blue-500 transition-all shadow-sm flex flex-col p-1 overflow-hidden">
                <textarea
                  rows={2}
                  placeholder={pendingTxDesc ? "Ketik nominal..." : "Ketik transaksi..."}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="w-full text-[16px] md:text-xs py-1.5 px-2 bg-transparent text-slate-900 placeholder-slate-400 focus:outline-none resize-none"
                />

                <div className="flex items-center justify-between px-1 pb-0.5">
                  <div className="flex items-center gap-0.5">
                    {/* Gallery & Camera Buttons (PRO ONLY) */}
                    {user?.planType === 'PRO' && (
                      <>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-100/50 transition cursor-pointer"
                          title="Upload dari Galeri"
                        >
                          <ImageIcon size={16} />
                        </button>

                        <button
                          onClick={() => cameraInputRef.current?.click()}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-100/50 transition cursor-pointer"
                          title="Ambil Foto Langsung"
                        >
                          <Camera size={16} />
                        </button>
                      </>
                    )}

                    {/* Microphone Voice */}
                    <button
                      onClick={startSpeechRecognition}
                      className={`p-1.5 rounded-lg transition cursor-pointer ${isRecording
                          ? 'text-white bg-danger animate-pulse shadow-sm shadow-danger/20'
                          : 'text-slate-400 hover:text-blue-600 hover:bg-blue-100/50'
                        }`}
                      title="Dikte Transaksi"
                    >
                      <Mic size={16} />
                    </button>
                  </div>

                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!input.trim() || isProcessing}
                    className="p-1.5 rounded-lg bg-blue-600 text-white disabled:bg-slate-300 disabled:cursor-not-allowed hover:bg-blue-700 transition cursor-pointer shadow-sm shadow-blue-600/20"
                  >
                    <Send size={14} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={isOpen ? {} : { rotate: [0, -8, 8, -4, 4, 0] }}
        transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 4 }}
        onClick={() => setIsOpen(!isOpen)}
        className="hidden md:flex w-12 h-12 rounded-full bg-primary text-white items-center justify-center shadow-xl hover:bg-blue-700 transition cursor-pointer"
      >
        {isOpen ? <X size={20} /> : <MessageSquare size={20} />}
      </motion.button>
    </div>
  );
}
