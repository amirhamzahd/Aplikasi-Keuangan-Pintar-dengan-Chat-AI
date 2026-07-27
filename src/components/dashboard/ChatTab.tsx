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
  Bot, User, X, Loader2, ArrowRight, MessageSquare, Send, Camera, Mic, Image as ImageIcon, Sparkles, Landmark, Wallet, Banknote, CreditCard, ChevronRight
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
  return text.split('\n').map((line, i) => {
    const isBullet = line.match(/^[\-\*]\s/);
    const content = isBullet ? line.substring(2) : line;
    
    const parts = content.split(/\*\*(.*?)\*\*/g);
    const renderedLine = parts.map((part, index) => {
      if (index % 2 === 1) {
        return <strong key={index} className="font-bold text-slate-900">{part}</strong>;
      }
      return <span key={index}>{part}</span>;
    });

    if (isBullet) {
      return <div key={i} className="pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-slate-400 my-1">{renderedLine}</div>;
    }
    return <span key={i}>{renderedLine}<br /></span>;
  });
};

interface ChatTabProps {
  onClose?: () => void;
}

export function ChatTab({ onClose }: ChatTabProps = {}) {
  const { addTransaction, addDebt, payDebtPartial, accounts, transactions, debts, budgets, categories, goals } = useTransactions();
  const { user } = useAuth();
  
  const isExpired = user?.planExpiredAt ? new Date(user.planExpiredAt) < new Date() : false;

  if (!user || user.planType === 'NONE' || user.planType === 'BASIC' || isExpired) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-slate-50/50 rounded-3xl border border-slate-100">
        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
          <Bot size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Fitur Terkunci</h2>
        <p className="text-sm text-slate-500 mb-6 max-w-sm">
          {isExpired 
            ? 'Masa aktif paket Anda telah habis. Silakan perpanjang paket untuk menggunakan kembali fitur asisten AI DIAMOND.' 
            : 'Asisten AI DIAMOND hanya tersedia untuk paket Plus dan Pro. Upgrade sekarang untuk mencatat transaksi dengan suara atau chat pintar.'}
        </p>
      </div>
    );
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

  const getAccountIcon = (type: string, isInsufficient: boolean) => {
    const className = isInsufficient ? "opacity-60 text-slate-400" : "text-blue-600";
    const t = type.toLowerCase();
    if (t.includes('bank') || t.includes('kartu')) return <CreditCard size={18} className={className} />;
    if (t.includes('wallet') || t.includes('gopay') || t.includes('dana') || t.includes('ovo') || t.includes('shopee')) return <Wallet size={18} className={className} />;
    if (t.includes('tunai') || t.includes('cash')) return <Banknote size={18} className={className} />;
    return <Landmark size={18} className={className} />;
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

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
      if (parsedTx.isDebtPayment) {
        const targetPerson = (parsedTx.personName || "").toLowerCase();
        const activeDebt = debts.find(d => d.status !== 'paid' && d.person.toLowerCase().includes(targetPerson));
        if (activeDebt) {
          payDebtPartial(activeDebt.id, parsedTx.amount, accountId);
          parsedTx._debtPaymentSuccess = true;
          parsedTx._debtPaymentPerson = activeDebt.person;
        } else {
          // Fallback if no matching debt is found
          addTransaction({
            description: parsedTx.description,
            amount: parsedTx.amount,
            type: parsedTx.type,
            category: 'Hutang/Piutang',
            accountId: accountId,
            tags: parsedTx.tags,
            date: new Date().toISOString()
          });
        }
      } else if (parsedTx.isDebt) {
        addDebt({
          person: parsedTx.personName || "Seseorang",
          type: parsedTx.debtType === 'give' ? 'receivable' : 'debt',
          amount: parsedTx.amount,
          remaining: parsedTx.amount,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Default 30 hari
          accountId: accountId
        } as any);
      } else {
        addTransaction({
          description: parsedTx.description,
          amount: parsedTx.amount,
          type: parsedTx.type,
          category: parsedTx.category,
          accountId: accountId,
          tags: parsedTx.tags,
          date: new Date().toISOString()
        });
      }
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
          let successMsg = `Sip! ${typeLabel} untuk "${parsedTx.description}" sebesar Rp${parsedTx.amount.toLocaleString('id-ID')} berhasil dicatat ke kategori ${parsedTx.category} menggunakan **${accountName}** 💸`;
          
          if (parsedTx.isDebtPayment) {
            if (parsedTx._debtPaymentSuccess) {
              successMsg = `Sip! Cicilan/Pelunasan hutang untuk "${parsedTx._debtPaymentPerson}" sebesar Rp${parsedTx.amount.toLocaleString('id-ID')} berhasil dibukukan menggunakan **${accountName}** 💸`;
            } else {
              successMsg = `Maaf, catatan hutang untuk "${parsedTx.personName}" tidak ditemukan. Transaksi tetap dicatat sebagai ${typeLabel} biasa menggunakan **${accountName}**.`;
            }
          } else if (parsedTx.isDebt) {
            successMsg = `Sip! Catatan ${parsedTx.debtType === 'take' ? 'Hutang dari' : 'Piutang ke'} ${parsedTx.personName} sebesar Rp${parsedTx.amount.toLocaleString('id-ID')} berhasil disimpan 📝`;
          }
            
          return {
            ...msg,
            text: successMsg,
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

    recognition.onstart = () => setIsRecording(true);
    recognition.onerror = () => { setIsRecording(false); alert('Gagal mendengarkan suara. Coba lagi.'); };
    recognition.onend = () => setIsRecording(false);

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
    setMessages(prev => [...prev, { id: `user-${Date.now()}`, sender: 'user', text }]);
    setIsProcessing(true);

    // Case 1: Complete pending transaction
    if (pendingTxDesc) {
      const amountNum = parseFloat(text.replace(/[^0-9]/g, ''));
      if (isNaN(amountNum) || amountNum <= 0) {
        setMessages(prev => [...prev, { id: `ai-${Date.now()}`, sender: 'ai', text: `Maaf, nominal salah. Berapa nominal untuk "${pendingTxDesc}"?` }]);
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
      try {
        const response = await fetch('/api/gemini', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: text,
            context: {
              transactions: transactions.slice(0, 100),
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
            } catch(e) {}
          }
          replyText = `Gagal merespon: ${errorMsg}`;
        }
        setMessages(prev => [...prev, { id: `ai-${Date.now()}`, sender: 'ai', text: replyText || 'Maaf, saya tidak bisa terhubung ke server Gemini saat ini.' }]);
      } catch (err) {
        setMessages(prev => [...prev, { id: `ai-${Date.now()}`, sender: 'ai', text: 'Terjadi kesalahan jaringan.' }]);
      }
      setIsProcessing(false);
      return;
    }

    // Case 3: Standard parse for transaction command
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
        parsedArray = Array.isArray(data.result) ? data.result : [data.result];
      } else {
        parsedArray = parseMultipleIndonesianNLP(text, categories);
      }
    } catch (err) {
      console.error(err);
      parsedArray = parseMultipleIndonesianNLP(text, categories);
    }
    const missingAmounts = parsedArray.filter(p => p.amount === 0);
    if (missingAmounts.length > 0) {
      setPendingTxDesc(text);
      setMessages(prev => [...prev, { id: `ai-${Date.now()}`, sender: 'ai', text: `Berapa nominal transaksi untuk "${missingAmounts[0].description}"?` }]);
      setIsProcessing(false);
      return;
    }

    const multiText = parsedArray.length > 1 
      ? `Transaksi ganda terdeteksi:\n${parsedArray.map(p => `- ${p.description}: Rp${p.amount.toLocaleString('id-ID')}`).join('\n')}\n\nGunakan Sumber Dana yang mana untuk semua transaksi ini?`
      : `Transaksi terdeteksi: "${parsedArray[0].description}" Rp${parsedArray[0].amount.toLocaleString('id-ID')}. Gunakan Sumber Dana yang mana?`;

    setMessages(prev => [...prev, { id: `ai-${Date.now()}`, sender: 'ai', text: multiText, type: 'account_selection', data: { parsedTx: parsedArray } }]);
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

  // Upload receipt
  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMessages(prev => [...prev, { id: `user-${Date.now()}`, sender: 'user', text: `[Mengunggah Struk: ${file.name}]` }]);
    setIsScanningOCR(true);

    try {
      const base64Data = await compressImage(file);
      
      const response = await fetch('/api/gemini/receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64Data })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      
      const parsedData = {
        ...data,
        category: parseMultipleIndonesianNLP(data.description || '', categories)[0]?.category || data.category || 'Lainnya'
      };
      
      setMessages(prev => [...prev, { id: `ai-${Date.now()}`, sender: 'ai', text: '', type: 'account_selection_ocr', data: { parsedTx: parsedData } }]);
    } catch (err: any) {
      let errorMsg = err.message;
      if (errorMsg.includes('429') || errorMsg.includes('quota')) {
        errorMsg = 'Limit AI sementara penuh karena terlalu banyak request. Silakan tunggu 1 menit lalu coba lagi ya! ⏳';
      } else if (errorMsg.includes('{')) {
        try {
          const parsedErr = JSON.parse(errorMsg);
          if (parsedErr.error?.message) errorMsg = parsedErr.error.message;
        } catch(e) {}
      }
      setMessages(prev => [...prev, { id: `ai-${Date.now()}`, sender: 'ai', text: `Gagal memproses struk: ${errorMsg}` }]);
    } finally {
      setIsScanningOCR(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };


  return (
    <>
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] md:hidden"
        onClick={onClose}
      />
      <div className="fixed top-24 bottom-24 left-4 right-4 md:relative md:h-[calc(100dvh-140px)] bg-white rounded-3xl md:shadow-sm shadow-2xl md:border md:border-slate-200 overflow-hidden w-auto md:w-full flex flex-col z-[70]">
        <div className="p-3 md:p-4 bg-white border-b border-slate-100 flex items-center justify-between shadow-sm relative z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-md">
              <Bot size={18} />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-slate-800">DIAMOND AI Assistant</h4>
              <span className="text-[10px] text-success font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></span>
                Online - Siap Membantu
              </span>
            </div>
          </div>
          {onClose && (
            <button 
              onClick={onClose}
              className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 active:scale-95 transition-transform md:hidden"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <div className="flex-1 p-3 md:p-5 overflow-y-auto space-y-3 bg-slate-50/50">
          {messages.length === 1 && (
            <div className="space-y-3 pb-4">
              <p className="text-[11px] uppercase font-extrabold text-slate-400 tracking-wider px-1">Contoh Input:</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { text: 'Beli kopi 18k di Starbucks', icon: '☕' },
                  { text: 'Gaji 6 juta mending dibagi gimana?', icon: '💰' },
                  { text: 'Bayar listrik 200rb pakai BCA', icon: '⚡' },
                  { text: 'Berapa total pengeluaran bulan ini?', icon: '📊' }
                ].map((eg, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(eg.text)}
                    className="flex flex-col items-start text-left p-3 rounded-2xl border border-slate-200 bg-white hover:bg-blue-50 hover:border-blue-200 hover:shadow-md hover:-translate-y-0.5 text-slate-700 cursor-pointer transition-all shadow-sm group"
                  >
                    <span className="text-xl mb-1.5 opacity-80 group-hover:scale-110 transition-transform">{eg.icon}</span>
                    <span className="text-[10px] sm:text-xs font-bold leading-snug">{eg.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col gap-1.5 w-full ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`p-3 rounded-2xl ${(msg.type === 'account_selection_ocr' || msg.type === 'account_selection') ? 'w-full md:max-w-full' : 'max-w-[90%] md:max-w-[75%] w-fit'} text-xs md:text-sm leading-relaxed flex flex-col gap-2 ${
              msg.sender === 'user'
                ? 'bg-blue-600 text-white font-medium rounded-tr-sm shadow-md'
                : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm'
            }`}>
              {msg.type === 'account_selection_ocr' && msg.data?.parsedTx ? (
                <>
                  <div className="text-slate-600 font-bold flex items-center gap-2">
                    <Sparkles size={16} className="text-amber-500" />
                    Struk berhasil dipindai!
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-3 shadow-sm">
                     <div className="font-extrabold text-base text-slate-800 uppercase">{msg.data.parsedTx.description || 'MERCHANT'}</div>
                     {msg.data.parsedTx.items && msg.data.parsedTx.items.length > 0 && (
                       <div className="flex flex-col gap-0 border-y border-dashed border-slate-200 py-2">
                         {msg.data.parsedTx.items.map((item: any, idx: number) => (
                           <div key={idx} className="flex justify-between items-start py-2">
                             <div className="flex flex-col pr-3">
                               <span className="font-bold text-slate-800 text-xs md:text-sm leading-tight">{item.name}</span>
                               {item.qty > 1 && (
                                 <span className="text-[10px] md:text-xs text-slate-500 font-medium mt-0.5">
                                   {item.qty} x Rp{((item.price || 0) / item.qty).toLocaleString('id-ID')}
                                 </span>
                               )}
                             </div>
                             <span className="font-extrabold text-slate-800 text-xs md:text-sm whitespace-nowrap">
                               Rp{(item.price || 0).toLocaleString('id-ID')}
                             </span>
                           </div>
                         ))}
                       </div>
                     )}
                     <div className="flex justify-between items-center pt-1">
                        <span className="font-extrabold text-slate-800">Total</span>
                        <span className="font-extrabold text-blue-600 text-lg">Rp{(msg.data.parsedTx.amount || 0).toLocaleString('id-ID')}</span>
                     </div>
                  </div>
                  <div className="flex flex-col gap-3 mt-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setMessages(prev => prev.filter(m => m.id !== msg.id));
                        }}
                        className="flex-1 p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-colors text-center"
                      >
                        Batal
                      </button>
                      <button
                        onClick={() => {
                          setMessages(prev => prev.filter(m => m.id !== msg.id));
                          const textToEdit = `${msg.data.parsedTx.description} ${msg.data.parsedTx.amount}`;
                          setInput(textToEdit);
                        }}
                        className="flex-1 p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-colors text-center"
                      >
                        Ubah
                      </button>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      <div className="text-[10px] text-slate-500 font-bold mb-2 text-center uppercase tracking-wider">
                        Klik Rekening Untuk Membayar
                      </div>
                      <div className="flex gap-2 overflow-x-auto no-scrollbar snap-x pb-2 pt-1 px-1 -mx-1">
                        {accounts.slice(0, 4).map(acc => {
                          const totalExpenseForValidation = msg.data.parsedTx.amount || 0;
                          const isInsufficient = totalExpenseForValidation > 0 && acc.balance < totalExpenseForValidation;
                          return (
                            <button
                              key={acc.id}
                              disabled={isInsufficient}
                              onClick={() => handleAccountSelect(msg.id, acc.id, msg.data.parsedTx)}
                              className={`min-w-[80px] snap-start shrink-0 p-2.5 rounded-2xl border text-[11px] font-bold flex flex-col items-center justify-center gap-2 transition-all ${
                                isInsufficient 
                                  ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed' 
                                  : 'bg-white border-blue-100 text-slate-700 hover:border-blue-300 hover:bg-blue-50 cursor-pointer shadow-sm hover:shadow-md'
                              }`}
                            >
                              <div className={`p-1.5 rounded-full ${isInsufficient ? 'bg-slate-200' : 'bg-blue-100/50'}`}>
                                {getAccountIcon(acc.type, isInsufficient)}
                              </div>
                              <span className="truncate w-full text-center">{acc.name}</span>
                            </button>
                          );
                        })}
                        {accounts.length > 4 && (
                          <button
                            onClick={() => setActiveAccountSelection({ msgId: msg.id, parsedTx: msg.data.parsedTx, totalExpenseForValidation: msg.data.parsedTx.amount || 0 })}
                            className="min-w-[80px] snap-start shrink-0 p-2.5 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[11px] font-bold text-slate-600 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer shadow-sm hover:shadow-md"
                          >
                            <div className="p-1.5 rounded-full bg-slate-200/50 text-slate-500 flex items-center justify-center">
                              <ChevronRight size={18} />
                            </div>
                            <span>Lihat Semua</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {msg.text && msg.type !== 'account_selection' && <div className="space-y-1.5">{renderFormattedText(msg.text)}</div>}
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
                      <div className="flex flex-col gap-3">
                        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                            <div className={`px-4 py-3 border-b ${headerBg} flex justify-between items-center`}>
                              <span className={`text-xs font-extrabold uppercase tracking-wider ${headerColor}`}>
                                {txs.length > 1 ? `Total ${headerType}` : headerType}
                              </span>
                              <span className={`text-base font-extrabold ${headerColor}`}>
                                Rp{totalAmount.toLocaleString('id-ID')}
                              </span>
                            </div>
                            <div className="p-4 space-y-4">
                              {txs.map((tx: any, idx: number) => (
                                <div key={idx} className={idx > 0 ? "pt-4 border-t border-slate-100" : ""}>
                                  <div className="flex justify-between items-start mb-1.5">
                                    <div className="text-sm font-bold text-slate-800">{tx.description}</div>
                                    {txs.length > 1 && (
                                       <div className={`text-sm font-bold ${tx.type === 'expense' ? 'text-red-600' : 'text-emerald-600'}`}>
                                          Rp{(tx.amount || 0).toLocaleString('id-ID')}
                                       </div>
                                    )}
                                  </div>
                                  <div className="text-[10px] font-semibold text-slate-600 bg-slate-100 w-fit px-2 py-0.5 rounded-md uppercase tracking-wider">{tx.category || 'Lainnya'}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setMessages(prev => prev.filter(m => m.id !== msg.id));
                          }}
                          className="flex-1 p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-colors text-center"
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
                          className="flex-1 p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-colors text-center"
                        >
                          Ubah
                        </button>
                      </div>

                      <div className="pt-2 border-t border-slate-100">
                        <div className="text-[10px] text-slate-500 font-bold mb-2 text-center uppercase tracking-wider">{accountSelectionText}</div>
                        <div className="flex gap-2 overflow-x-auto snap-x pb-3 pt-1 px-1 -mx-1">
                          {accounts.slice(0, 4).map(acc => {
                            const isInsufficient = totalExpenseForValidation > 0 && acc.balance < totalExpenseForValidation;
                            return (
                              <button
                                key={acc.id}
                                disabled={isInsufficient}
                                onClick={() => handleAccountSelect(msg.id, acc.id, msg.data.parsedTx)}
                                className={`min-w-[80px] snap-start shrink-0 p-2.5 rounded-2xl border text-[11px] font-bold flex flex-col items-center justify-center gap-2 transition-all ${
                                  isInsufficient 
                                    ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed' 
                                    : 'bg-white border-blue-100 text-slate-700 hover:border-blue-300 hover:bg-blue-50 cursor-pointer shadow-sm hover:shadow-md'
                                }`}
                              >
                                <div className={`p-1.5 rounded-full ${isInsufficient ? 'bg-slate-200' : 'bg-blue-100/50'}`}>
                                  {getAccountIcon(acc.type, isInsufficient)}
                                </div>
                                <span className="truncate w-full text-center">{acc.name}</span>
                              </button>
                            );
                          })}
                          {accounts.length > 4 && (
                            <button
                              onClick={() => setActiveAccountSelection({ msgId: msg.id, parsedTx: msg.data.parsedTx, totalExpenseForValidation })}
                              className="min-w-[80px] snap-start shrink-0 p-2.5 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[11px] font-bold text-slate-600 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer shadow-sm hover:shadow-md"
                            >
                              <div className="p-1.5 rounded-full bg-slate-200/50 text-slate-500 flex items-center justify-center">
                                <ChevronRight size={18} />
                              </div>
                              <span>Lihat Semua</span>
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
            <div className="p-3.5 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/60 rounded-2xl rounded-tl-sm flex items-center gap-3 shadow-sm relative">
              <div className="p-1.5 bg-blue-600 rounded-xl shadow-md shadow-blue-600/20 relative">
                <div className="absolute inset-0 bg-blue-400 rounded-xl animate-ping opacity-20"></div>
                <Sparkles size={14} className="text-white animate-pulse" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-extrabold text-blue-900 tracking-tight">AI sedang bekerja</span>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold text-blue-600/70 uppercase tracking-wider">Menganalisis pencatatan</span>
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
            <div className="p-3.5 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200/60 rounded-2xl rounded-tl-sm flex items-center gap-3 shadow-sm relative">
              <div className="p-1.5 bg-indigo-600 rounded-xl shadow-md shadow-indigo-600/20">
                <Loader2 size={14} className="text-white animate-spin" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-extrabold text-indigo-900 tracking-tight">AI Memindai Struk</span>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold text-indigo-600/70 uppercase tracking-wider">Membaca teks gambar</span>
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
      </div>

      <div className="p-3 border-t border-slate-200 bg-white shrink-0">
        <div className="max-w-4xl mx-auto">
          <input type="file" ref={fileInputRef} accept="image/*" onChange={handleReceiptUpload} className="hidden" />
          <input type="file" ref={cameraInputRef} accept="image/*" capture="environment" onChange={handleReceiptUpload} className="hidden" />
          
          <div className="bg-slate-50 border border-slate-200 rounded-2xl focus-within:ring-2 focus-within:ring-blue-500/45 focus-within:border-blue-500 transition-all shadow-sm flex flex-col p-1.5 overflow-hidden">
            <textarea 
              rows={2}
              placeholder={pendingTxDesc ? "Ketik nominal..." : "Ketik instruksi transaksi Anda di sini..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className="w-full text-[16px] md:text-sm py-2 px-3 bg-transparent text-slate-900 placeholder-slate-400 focus:outline-none resize-none"
            />

            <div className="flex items-center justify-between px-1 pb-1">
              <div className="flex items-center gap-0.5">
                {user?.planType === 'PRO' && (
                  <>
                    <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-100/50 transition cursor-pointer" title="Upload dari Galeri">
                      <ImageIcon size={18} />
                    </button>
                    <button onClick={() => cameraInputRef.current?.click()} className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-100/50 transition cursor-pointer" title="Ambil Foto Langsung">
                      <Camera size={18} />
                    </button>
                  </>
                )}
                <button
                  onClick={startSpeechRecognition}
                  className={`p-2 rounded-xl transition cursor-pointer ${
                    isRecording 
                      ? 'text-white bg-danger animate-pulse shadow-sm shadow-danger/20' 
                      : 'text-slate-500 hover:text-blue-600 hover:bg-blue-100/50'
                  }`}
                  title="Dikte Transaksi"
                >
                  <Mic size={18} />
                </button>
              </div>
              
              <button 
                onClick={() => handleSendMessage()} 
                disabled={!input.trim() || isProcessing}
                className="p-2 rounded-xl bg-blue-600 text-white disabled:bg-slate-300 disabled:cursor-not-allowed hover:bg-blue-700 transition cursor-pointer shadow-sm shadow-blue-600/20"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
        <AnimatePresence>
          {activeAccountSelection && (
            <div className="absolute inset-0 bg-white z-[80] flex flex-col">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="w-full h-full flex flex-col"
              >
                <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
                  <h3 className="font-extrabold text-slate-800 text-lg">Pilih Rekening</h3>
                  <button 
                    onClick={() => setActiveAccountSelection(null)}
                    className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="p-4 overflow-y-auto bg-slate-50/50 flex-1 space-y-2.5">
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
                        className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                          isInsufficient 
                            ? 'bg-slate-50 border-slate-200 cursor-not-allowed opacity-75' 
                            : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-blue-50 hover:shadow-md cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <div className={`p-2.5 rounded-xl ${isInsufficient ? 'bg-slate-200' : 'bg-blue-100/50'}`}>
                            {getAccountIcon(acc.type, isInsufficient)}
                          </div>
                          <div className="flex flex-col items-start">
                            <span className={`font-bold text-sm ${isInsufficient ? 'text-slate-500' : 'text-slate-800'}`}>{acc.name}</span>
                            <span className="text-[11px] font-semibold text-slate-400 mt-0.5 uppercase tracking-wider">{acc.type}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className={`font-extrabold text-sm ${isInsufficient ? 'text-slate-400' : 'text-slate-700'}`}>
                            Rp{acc.balance.toLocaleString('id-ID')}
                          </span>
                          {isInsufficient && (
                            <span className="text-[10px] font-bold text-red-500 mt-0.5">Saldo tidak cukup</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
