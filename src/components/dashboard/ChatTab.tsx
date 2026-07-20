'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTransactions } from '@/context/TransactionContext';
import { parseIndonesianNLP } from '@/utils/nlpParser';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { 
 Sparkles, Mic, MicOff, Send, Camera, UploadCloud, 
 Bot, User, AlertCircle, CheckCircle2, ShieldAlert,
 Loader2, Receipt, ArrowRight, Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
 id: string;
 sender: 'user' | 'ai';
 text: string;
 type?: 'text' | 'ocr_result' | 'nlp_success';
 data?: any;
}

const renderFormattedText = (text: string) => {
  const html = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold double
    .replace(/\*(.*?)\*/g, '<strong>$1</strong>')     // Bold single
    .replace(/\*/g, '')                               // Remove stray asterisks
    .replace(/\n/g, '<br />');                        // Line breaks
    
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
};

export function ChatTab() {
 const { addTransaction, accounts, transactions } = useTransactions();
 
 // States
 const [messages, setMessages] = useState<Message[]>([
 { 
 id: 'welcome', 
 sender: 'ai', 
 text: 'Halo! Saya DIAMOND, asisten keuangan cerdasmu. Kamu bisa mencatat transaksi lewat suara, upload foto struk, atau ketik langsung seperti "Makan ayam geprek 25 ribu" atau "Beli kopi 18k". Ada yang mau dicatat hari ini?' 
 }
 ]);
 const [input, setInput] = useState('');
 const [isProcessing, setIsProcessing] = useState(false);
 const [isRecording, setIsRecording] = useState(false);
 const [isScanningOCR, setIsScanningOCR] = useState(false);
 
 // Pending Transaction State for NLP "Ask Back"
 const [pendingTxDesc, setPendingTxDesc] = useState<string | null>(null);

 const messagesEndRef = useRef<HTMLDivElement>(null);
 const fileInputRef = useRef<HTMLInputElement>(null);

 // Auto-scroll to bottom of messages
 useEffect(() => {
 messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
 }, [messages, isProcessing]);

 // Voice AI - Web Speech API Integration
 const startSpeechRecognition = () => {
 const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
 if (!SpeechRecognition) {
 alert('Browser Anda tidak mendukung Web Speech API (Gunakan Chrome atau Safari).');
 return;
 }

 const recognition = new SpeechRecognition();
 recognition.lang = 'id-ID'; // Indonesian Language
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

 // MESSAGE SEND HANDLER
 const handleSendMessage = async (textToSend?: string | any) => {
 const text = (typeof textToSend === 'string' ? textToSend : input).trim();
 if (!text) return;

 setInput('');

 // Append user message
 const userMsg: Message = { id: `user-${Date.now()}`, sender: 'user', text };
 setMessages(prev => [...prev, userMsg]);
 setIsProcessing(true);

 // Simulate AI Delay
 await new Promise((resolve) => setTimeout(resolve, 1000));

 // Case 1: Checking if AI asked back for amount
 if (pendingTxDesc) {
 const amountNum = parseFloat(text.replace(/[^0-9]/g, ''));
 if (isNaN(amountNum) || amountNum <= 0) {
 setMessages(prev => [...prev, {
 id: `ai-${Date.now()}`,
 sender: 'ai',
 text: `Maaf, nominal yang Anda masukkan salah. Berapa nominal untuk "${pendingTxDesc}"?`
 }]);
 setIsProcessing(false);
 return;
 }

 // Complete the pending transaction
 const parsed = parseIndonesianNLP(pendingTxDesc);
 parsed.amount = amountNum;
 
 addTransaction({
 description: parsed.description,
 amount: parsed.amount,
 type: parsed.type,
 category: parsed.category,
 accountId: accounts[0]?.id || 'acc-cash',
 tags: parsed.tags,
 date: new Date().toISOString()
 });

 setMessages(prev => [...prev, {
 id: `ai-${Date.now()}`,
 sender: 'ai',
 text: `Sip! Transaksi berhasil dicatat: "${parsed.description}" sebesar Rp${parsed.amount.toLocaleString('id-ID')} masuk kategori ${parsed.category}.`,
 type: 'nlp_success'
 }]);

 setPendingTxDesc(null);
 setIsProcessing(false);
 return;
 }

 // Case 2: Standard NLP Parsing
 const parsed = parseIndonesianNLP(text);

 // If amount is 0, AI asks back!
 if (parsed.amount === 0) {
 setPendingTxDesc(text);
 setMessages(prev => [...prev, {
 id: `ai-${Date.now()}`,
 sender: 'ai',
 text: `Berapa nominal transaksi untuk "${text}"?`
 }]);
 setIsProcessing(false);
 return;
 }

 // Standard transaction creation
 addTransaction({
 description: parsed.description,
 amount: parsed.amount,
 type: parsed.type,
 category: parsed.category,
 accountId: accounts[0]?.id || 'acc-cash',
 tags: parsed.tags,
 date: new Date().toISOString()
 });

 setMessages(prev => [...prev, {
 id: `ai-${Date.now()}`,
 sender: 'ai',
 text: `Berhasil mencatat ${parsed.type === 'income' ? 'pemasukan' : 'pengeluaran'} "${parsed.description}" sebesar Rp${parsed.amount.toLocaleString('id-ID')} ke kategori ${parsed.category}.`,
 type: 'nlp_success'
 }]);

 setIsProcessing(false);
 };

 // OCR RECEIPT UPLOAD HANDLER
 const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (!file) return;

 setIsScanningOCR(true);
 
 // Simulate AI OCR progress stages
 await new Promise((resolve) => setTimeout(resolve, 1200)); // Stage 1
 await new Promise((resolve) => setTimeout(resolve, 1000)); // Stage 2

 // OCR extracted data mockup
 const ocrMerchant = 'Starbucks Coffee';
 const ocrItems = [
 { name: 'Espresso Single', price: 35000 },
 { name: 'Butter Croissant', price: 28000 }
 ];
 const ocrTax = 6300;
 const ocrTotal = 69300;

 // Create OCR Transaction
 addTransaction({
 description: `${ocrMerchant} (${ocrItems.map(i => i.name).join(', ')})`,
 amount: ocrTotal,
 type: 'expense',
 category: 'Makanan & Minuman',
 accountId: accounts[0]?.id || 'acc-cash',
 tags: ['ocr', 'starbucks'],
 date: new Date().toISOString()
 });

 setMessages(prev => [...prev, {
 id: `ocr-${Date.now()}`,
 sender: 'ai',
 text: `Struk belanja berhasil dipindai! 🧾\n\n` + 
 `**Toko:** ${ocrMerchant}\n` + 
 `**Item:**\n` +
 ocrItems.map(item => ` - ${item.name} (Rp${item.price.toLocaleString('id-ID')})`).join('\n') + `\n` +
 `**Pajak:** Rp${ocrTax.toLocaleString('id-ID')}\n` +
 `**Total Pengeluaran:** Rp${ocrTotal.toLocaleString('id-ID')}\n\n` +
 `Transaksi otomatis dicatat ke kategori Makanan & Minuman.`,
 type: 'ocr_result',
 data: {
 merchant: ocrMerchant,
 total: ocrTotal,
 items: ocrItems
 }
 }]);

 setIsScanningOCR(false);
 };



  return (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[50vh] md:h-[72vh]">
  
  {/* LEFT: AI Chat screen (Col span 2) */}
  <Card className="lg:col-span-2 flex flex-col h-full overflow-hidden border-border/20">
 
 {/* Chat Header */}
 <div className="p-4 border-b border-border/10 flex items-center justify-between bg-slate-50/50 ">
 <div className="flex items-center gap-3">
 <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white">
 <Bot size={20} />
 </div>
 <div>
 <h3 className="text-sm font-bold text-slate-800 ">DIAMOND AI Assistant</h3>
 <div className="flex items-center gap-1 text-[10px] text-success font-semibold">
 <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></span>
 Ready to chat
 </div>
 </div>
 </div>
 <Badge variant="outline">NLP v1.2</Badge>
 </div>

 {/* Message Thread */}
 <div className="flex-1 p-4 overflow-y-auto space-y-4 no-scrollbar">
 {messages.map((msg) => (
 <motion.div 
 key={msg.id}
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
 >
 <div className={`flex gap-2 max-w-[75%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
 
 {/* Avatar */}
 <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white font-bold text-xs ${
 msg.sender === 'user' 
 ? 'bg-gradient-to-tr from-primary to-blue-400' 
 : 'bg-slate-800 border border-border/10'
 }`}>
 {msg.sender === 'user' ? <User size={14} /> : <Bot size={14} className="text-primary" />}
 </div>

 {/* Message Body */}
 <div className={`p-4 rounded-2xl text-xs md:text-sm leading-relaxed ${
 msg.sender === 'user'
 ? 'bg-primary text-white rounded-tr-none shadow-md shadow-primary/10 font-medium'
 : 'bg-white border border-border/20 text-slate-800 rounded-tl-none shadow-sm'
 }`}>
 {renderFormattedText(msg.text)}
 </div>

 </div>
 </motion.div>
 ))}
 
 {/* AI Thinking Animation */}
 {isProcessing && (
 <div className="flex justify-start">
 <div className="flex gap-2 max-w-[85%]">
 <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-white shrink-0">
 <Bot size={14} className="text-primary" />
 </div>
 <div className="p-4 bg-white border border-border/20 rounded-2xl rounded-tl-none flex gap-1.5 items-center">
 <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
 <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
 <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
 </div>
 </div>
 </div>
 )}

 <div ref={messagesEndRef} />
 </div>

 {/* Input Bar */}
 <div className="p-4 border-t border-border/10 bg-slate-50/50 flex gap-2">
 <Input 
 placeholder={pendingTxDesc ? "Ketik nominal nominal..." : "Ketik pesan atau transaksi..."}
 value={input}
 onChange={(e) => setInput(e.target.value)}
 onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
 className="flex-1"
 disabled={isProcessing}
 />
 
 {/* Mic Button */}
 <button
 onClick={startSpeechRecognition}
 className={`p-3 rounded-xl border border-border transition flex items-center justify-center cursor-pointer ${
 isRecording 
 ? 'bg-danger text-white border-danger animate-pulse' 
 : 'bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 '
 }`}
 title="Dikte Transaksi (Voice AI)"
 >
 {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
 </button>

 {/* Send Button */}
 <Button 
 onClick={() => handleSendMessage()} 
 disabled={!input.trim() || isProcessing}
 size="icon"
 >
 <Send size={16} />
 </Button>
 </div>

 </Card>

 {/* RIGHT: Quick controls & Receipt OCR scanner */}
 <div className="space-y-6">
 
 {/* Receipt OCR Scanner Box */}
 <Card className="flex flex-col h-fit">
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <Camera size={18} className="text-primary" />
 OCR Struk Belanja
 </CardTitle>
 <CardDescription>Upload foto struk belanja untuk dicatat otomatis</CardDescription>
 </CardHeader>
 <CardContent>
 {isScanningOCR ? (
 <div className="border border-border/40 bg-slate-50 p-8 rounded-xl text-center space-y-3.5">
 <Loader2 className="animate-spin text-primary mx-auto" size={32} />
 <div className="space-y-1">
 <p className="text-xs font-bold text-slate-800 ">Membaca Struk...</p>
 <p className="text-[10px] text-slate-400">AI sedang mengekstrak item dan pajak</p>
 </div>
 </div>
 ) : (
 <div 
 onClick={() => fileInputRef.current?.click()}
 className="border-2 border-dashed border-border/80 hover:border-primary/50 transition rounded-xl p-8 text-center cursor-pointer bg-slate-50/50 space-y-2 group"
 >
 <input 
 type="file" 
 ref={fileInputRef}
 accept="image/*"
 onChange={handleReceiptUpload}
 className="hidden"
 />
 <UploadCloud size={32} className="mx-auto text-slate-400 group-hover:text-primary transition-colors" />
 <div className="space-y-1">
 <p className="text-xs font-bold text-slate-800 ">Pilih Foto Struk</p>
 <p className="text-[10px] text-slate-400">Mendukung file JPG, PNG, WebP</p>
 </div>
 </div>
 )}
 </CardContent>
 </Card>

 {/* Quick NLP prompts examples */}
 <Card>
 <CardHeader>
 <CardTitle>Contoh Input AI</CardTitle>
 <CardDescription>Ketuk untuk menyalin ke input bar</CardDescription>
 </CardHeader>
 <CardContent className="space-y-2.5">
 {[
 'Beli kopi 18k',
 'Makan ayam geprek 25 ribu',
 'Isi Pertalite 100rb',
 'Gajian bulan ini 7 juta',
 'Transfer dari client 5 juta',
 'Beli laptop cicilan 800rb',
 'Bayar listrik'
 ].map((eg, idx) => (
 <button
 key={idx}
 onClick={() => setInput(eg)}
 className="w-full text-left p-2 rounded-lg border border-border/10 bg-slate-50/30 hover:bg-slate-100 text-xs font-semibold text-slate-600 flex items-center justify-between cursor-pointer transition-colors"
 >
 <span>{eg}</span>
 <ArrowRight size={12} className="opacity-45" />
 </button>
 ))}
 </CardContent>
 </Card>

 </div>

 </div>
 );
}
