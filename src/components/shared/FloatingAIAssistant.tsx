'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTransactions } from '@/context/TransactionContext';
import { parseIndonesianNLP, parseMultipleIndonesianNLP, parseReceiptOCR } from '@/utils/nlpParser';
import { handleFinancialAssistant } from '@/utils/financialAssistant';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { 
  Bot, User, X, Loader2, ArrowRight, MessageSquare, Send, Camera, Mic
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Tesseract from 'tesseract.js';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  type?: 'text' | 'ocr_result' | 'nlp_success' | 'account_selection';
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
  
  // Widget Open State
  const [isOpen, setIsOpen] = useState(false);
  
  // Chat States
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: 'welcome', 
      sender: 'ai', 
      text: 'Halo! Saya DIAMOND, asisten cerdasmu. Catat transaksi dengan mengetik "Beli bensin 20rb", kirim suara via mic, atau upload struk.' 
    }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isScanningOCR, setIsScanningOCR] = useState(false);
  const [pendingTxDesc, setPendingTxDesc] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom of chat
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isProcessing, isOpen]);

  const handleAccountSelect = (msgId: string, accountId: string, parsedTxData: any) => {
    const parsedArray = Array.isArray(parsedTxData) ? parsedTxData : [parsedTxData];

    parsedArray.forEach(parsedTx => {
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
        if (parsedArray.length > 1) {
          return {
            ...msg,
            text: `Sip! ${parsedArray.length} transaksi berhasil dicatat sekaligus otomatis 💸`,
            type: 'nlp_success',
            data: undefined
          };
        } else {
          const parsedTx = parsedArray[0];
          const typeLabel = parsedTx.type === 'income' ? 'Pemasukan' : 'Pengeluaran';
          return {
            ...msg,
            text: `Sip! ${typeLabel} untuk "${parsedTx.description}" sebesar Rp${parsedTx.amount.toLocaleString('id-ID')} berhasil dicatat ke kategori ${parsedTx.category} 💸`,
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

      const parsed = parseIndonesianNLP(pendingTxDesc, categories);
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
        
        setMessages(prev => [...prev, {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: data.reply || data.error || 'Maaf, saya tidak bisa terhubung ke server Gemini saat ini.'
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

    // Case 3: Standard parse for transaction command
    const parsedArray = parseMultipleIndonesianNLP(text, categories);

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

  // OCR Upload
  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanningOCR(true);
    
    try {
      // Create a local object URL for the raw color image
      const imageUrl = URL.createObjectURL(file);
      const result = await Tesseract.recognize(imageUrl, 'ind');
      const text = result.data.text;
      URL.revokeObjectURL(imageUrl); // clean up
      
      // Parse the extracted text using OCR specific NLP logic
      const parsed = parseReceiptOCR(text, categories);
      parsed.tags.push('ocr');
      
      if (parsed.amount === 0) {
        setPendingTxDesc("Belanja (OCR)");
        setMessages(prev => [...prev, {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: `Struk terdeteksi tapi nominal gagal terbaca. Berapa total belanjanya?`
        }]);
      } else {
        setMessages(prev => [...prev, {
          id: `ocr-${Date.now()}`,
          sender: 'ai',
          text: `Struk terdeteksi!\n\n` + 
                `**Hasil Scan:** "${parsed.description}"\n` +
                `**Total:** Rp${parsed.amount.toLocaleString('id-ID')}\n\n` +
                `Gunakan Sumber Dana yang mana?`,
          type: 'account_selection',
          data: { parsedTx: parsed }
        }]);
      }
    } catch (err) {
      console.error('OCR Error:', err);
      setMessages(prev => [...prev, {
        id: `ocr-err-${Date.now()}`,
        sender: 'ai',
        text: `Gagal memproses struk. Pastikan gambar cukup terang dan teks dapat dibaca.`
      }]);
    }

    setIsScanningOCR(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 print:hidden floating-ai-assistant">
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
                <div className="space-y-1.5 pb-2">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Contoh Input:</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      'Beli kopi 18k',
                      'Pengeluaran bulan ini',
                      'Gaji 6 juta bagi gimana',
                      'Apa itu dana darurat'
                    ].map(eg => (
                      <button
                        key={eg}
                        onClick={() => setInput(eg)}
                        className="text-[10px] text-left p-2 rounded-lg border border-slate-100 bg-white hover:bg-slate-50 text-slate-600 font-semibold cursor-pointer transition"
                      >
                        {eg}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg) => (
                <div key={msg.id} className={`flex flex-col gap-2 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`p-3 rounded-xl max-w-[85%] text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-primary text-white font-medium rounded-tr-none shadow-sm'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-[0_1px_2px_rgba(0,0,0,0.02)]'
                  }`}>
                    {renderFormattedText(msg.text)}
                  </div>
                  
                  {msg.type === 'account_selection' && msg.data?.parsedTx && (
                    <div className="flex flex-wrap gap-2 max-w-[95%]">
                      {accounts.map(acc => (
                        <button
                          key={acc.id}
                          onClick={() => handleAccountSelect(msg.id, acc.id, msg.data.parsedTx)}
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-primary border border-indigo-100 rounded-lg text-[10px] font-bold cursor-pointer transition shadow-sm"
                        >
                          {acc.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {isProcessing && (
                <div className="flex justify-start">
                  <div className="p-3 bg-white border border-slate-200 rounded-xl rounded-tl-none flex gap-1 items-center">
                    <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" />
                    <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:0.15s]" />
                    <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:0.3s]" />
                  </div>
                </div>
              )}

              {isScanningOCR && (
                <div className="flex justify-start">
                  <div className="p-3 bg-white border border-slate-200 rounded-xl rounded-tl-none flex items-center gap-2 text-slate-500">
                    <Loader2 className="animate-spin text-primary shrink-0" size={14} />
                    <span className="text-[10px] font-bold">AI membaca struk...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Footer */}
            <div className="p-3 border-t border-slate-100 bg-white space-y-2">
              <div className="flex gap-2">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept="image/*" 
                  onChange={handleReceiptUpload} 
                  className="hidden" 
                />
                
                {/* Upload Receipt */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 rounded-lg border border-slate-200 text-slate-400 hover:text-primary hover:bg-slate-50 transition cursor-pointer"
                  title="Upload Struk OCR"
                >
                  <Camera size={15} />
                </button>

                <Input 
                  placeholder={pendingTxDesc ? "Ketik nominal..." : "Ketik transaksi..."}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="py-1 px-3 text-xs"
                />

                {/* Microphone Voice */}
                <button
                  onClick={startSpeechRecognition}
                  className={`p-2.5 rounded-lg border transition cursor-pointer ${
                    isRecording 
                      ? 'bg-danger text-white border-danger animate-pulse' 
                      : 'border-slate-200 text-slate-400 hover:text-slate-700'
                  }`}
                  title="Dikte Transaksi"
                >
                  <Mic size={15} />
                </button>

                <Button 
                  onClick={() => handleSendMessage()} 
                  disabled={!input.trim() || isProcessing}
                  size="sm"
                  className="px-3"
                >
                  <Send size={12} />
                </Button>
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
        className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shadow-xl hover:bg-blue-700 transition cursor-pointer"
      >
        {isOpen ? <X size={20} /> : <MessageSquare size={20} />}
      </motion.button>
    </div>
  );
}
