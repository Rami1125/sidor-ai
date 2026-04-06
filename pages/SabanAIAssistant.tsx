'use client';
import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import { Menu, Send, X, Calculator, Camera, FileText, Image as ImageIcon, Plus, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
const SABAN_LOGO = "https://i.postimg.cc/3wTMxG7W/ai.jpg";

export default function SabanAIAssistant() {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [scanPreview, setScanPreview] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isScanning]);

  // לוגיקת סריקה וניתוח ויזואלי
  const processVisualScan = async (base64: string, file: File) => {
    try {
      // כיווץ תמונה ב-Client Side לביצועים מקסימליים
      const img = new Image();
      img.src = base64;
      await new Promise((res) => (img.onload = res));
      
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 1000;
      const scale = MAX_WIDTH / img.width;
      canvas.width = MAX_WIDTH;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
      const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6).split(',')[1];

      // העלאה וניתוח במקביל או בטור לפי הלוגים המוצלחים
      const driveRes = await fetch('/api/upload-to-drive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: `scan_${Date.now()}.jpg`, fileData: compressedBase64, mimeType: 'image/jpeg', phone: 'admin' })
      });
      const driveData = await driveRes.json();

      const aiRes = await fetch('/api/tools-brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: "נתח את התמונה", imageBase64: compressedBase64, imageUrl: driveData.link })
      });
      const aiData = await aiRes.json();

      setMessages(prev => [...prev, { role: 'ai', content: aiData.reply }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'ai', content: "בוס, הסריקה נכשלה. וודא שיש קליטה ונסה שוב." }]);
    } finally {
      setTimeout(() => {
        setIsScanning(false);
        setScanPreview(null);
      }, 1000);
    }
  };

  const handleFileAction = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setShowMenu(false);
    setIsScanning(true);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      if (file.type.includes('image')) {
        setScanPreview(base64);
        await processVisualScan(base64, file);
      } else {
        setMessages(prev => [...prev, { role: 'ai', content: "קיבלתי את המסמך, אני מעבד את הנתונים..." }]);
        setIsScanning(false);
      }
    };
  };

  const askAI = async (text: string) => {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setLoading(true); setInput('');
    const res = await fetch('/api/customer-brain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, senderPhone: 'admin' })
    });
    const data = await res.json();
    setMessages(prev => [...prev, { role: 'ai', content: data.reply }]);
    setLoading(false);
  };

  return (
    <div className="h-screen w-full flex flex-col bg-[#0b141a] text-[#e9edef] font-sans" dir="rtl">
      <Head><title>Saban OS | AI Visual Assistant</title></Head>

      <header className="h-16 bg-[#202c33] flex items-center justify-between px-5 shadow-2xl z-50 border-b border-emerald-500/10">
        <div className="flex items-center gap-3">
          <img src={SABAN_LOGO} className="w-10 h-10 rounded-xl border border-emerald-500/30" />
          <div className="flex flex-col">
            <span className="font-black text-emerald-500 text-sm tracking-tighter italic">SABAN OS</span>
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em]">Visual Engine Active</span>
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4 relative custom-scrollbar">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[85%] p-3 px-4 rounded-2xl shadow-lg ${m.role === 'user' ? 'bg-[#202c33] rounded-tl-none border border-white/5' : 'bg-[#005c4b] rounded-tr-none'}`}>
              <ReactMarkdown remarkPlugins={[remarkGfm]} className="text-sm prose prose-invert">{m.content}</ReactMarkdown>
            </div>
          </div>
        ))}

        <AnimatePresence>
          {isScanning && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex justify-end">
              <div className="relative w-64 h-80 rounded-3xl overflow-hidden border-2 border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.2)] bg-black">
                {scanPreview && <img src={scanPreview} className="w-full h-full object-cover opacity-50" />}
                <motion.div 
                  initial={{ top: 0 }} animate={{ top: '100%' }} 
                  transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                  className="absolute left-0 w-full h-1 bg-emerald-400 shadow-[0_0_15px_#4ade80] z-20"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-emerald-400 tracking-widest uppercase animate-pulse">Scanning Infrastructure...</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={scrollRef} />
      </main>

      <footer className="p-4 bg-[#111b21] border-t border-white/5 z-[60]">
        <div className="max-w-4xl mx-auto flex items-end gap-3">
          <div className="relative">
            <AnimatePresence>
              {showMenu && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="absolute bottom-16 right-0 flex flex-col gap-3">
                  <button onClick={() => fileInputRef.current?.click()} className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-xl"><FileText size={20}/></button>
                  <button onClick={() => fileInputRef.current?.click()} className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center text-white shadow-xl"><Camera size={20}/></button>
                </motion.div>
              )}
            </AnimatePresence>
            <button onClick={() => setShowMenu(!showMenu)} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-xl ${showMenu ? 'bg-red-500 rotate-45' : 'bg-[#2a3942] text-emerald-500 border border-white/10'}`}><Plus size={24} /></button>
          </div>
          
          <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileAction} accept="image/*,application/pdf" />

          <div className="flex-1 bg-[#2a3942] rounded-2xl flex items-center px-4 py-1 border border-white/5 focus-within:border-emerald-500/30 transition-all">
            <textarea 
              value={input} onChange={(e) => setInput(e.target.value)}
              placeholder="שלח הודעה או סרוק סדק..."
              className="flex-1 bg-transparent py-3 outline-none text-sm resize-none"
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), askAI(input))}
            />
            <button onClick={() => askAI(input)} className="mr-2 text-emerald-500 hover:scale-110 transition-all"><Send size={22} className="rotate-180"/></button>
          </div>
        </div>
      </footer>
    </div>
  );
}
