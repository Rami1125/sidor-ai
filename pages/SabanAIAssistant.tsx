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

  // גלילה אוטומטית לתחתית
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isScanning]);

  // לוגיקת טיפול בקבצים (תמונה/PDF)
  const handleFileAction = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setShowMenu(false);
    setIsScanning(true);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async (event) => {
      const base64Full = event.target?.result as string;
      
      if (file.type.includes('image')) {
        setScanPreview(base64Full); // הצגת ה-Preview לסריקה
        await processVisualScan(base64Full, file);
      } else if (file.type === 'application/pdf') {
        await processDocument(file.name, base64Full);
      }
    };
  };

const processVisualScan = async (base64: string, file: File) => {
    try {
      const img = new Image();
      img.src = base64;
      await new Promise((resolve) => (img.onload = resolve));

      // כיווץ אופטימלי ל-AI
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 1000;
      const scale = MAX_WIDTH / img.width;
      canvas.width = MAX_WIDTH;
      canvas.height = img.height * scale;
      
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // איכות 0.6 חוסכת המון מקום בלי לפגוע בזיהוי
      const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6).split(',')[1];

      // שליחה למוח הסורק
      const aiRes = await fetch('/api/tools-brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: "נתח סדק/מוצר", imageBase64: compressedBase64 })
      });
      
      const aiData = await aiRes.json();
      setMessages(prev => [...prev, { role: 'ai', content: aiData.reply }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'ai', content: "בוס, התמונה גדולה מדי או שיש תקלה בתקשורת. נסה שוב." }]);
    } finally {
      setIsScanning(false);
      setScanPreview(null);
    }
  };

  const askAI = async (text: string) => {
    if (!text.trim() || loading) return;
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setLoading(true); setInput('');

    try {
      const res = await fetch('/api/customer-brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, senderPhone: 'admin' })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'ai', content: data.reply }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'ai', content: "תקלה בתקשורת עם המוח." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex flex-col bg-[#0b141a] text-[#e9edef] overflow-hidden font-sans" dir="rtl">
      <Head><title>Saban OS | Visual Intelligence</title></Head>

      {/* Header יוקרתי */}
      <header className="h-16 bg-[#202c33] flex items-center justify-between px-5 shadow-lg shrink-0 z-50 border-b border-white/5">
        <div className="flex items-center gap-3">
          <img src={SABAN_LOGO} className="w-10 h-10 rounded-full border-2 border-emerald-500 shadow-lg shadow-emerald-500/20"/>
          <div className="flex flex-col text-right">
            <span className="font-black text-emerald-500 text-sm tracking-tight uppercase italic">SABAN OS</span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Visual Brain v2.0</span>
          </div>
        </div>
        <Calculator className="text-emerald-500 hover:scale-110 transition-transform cursor-pointer" size={24} />
      </header>

      {/* Chat & Scanner Area */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar relative">
        <div className="absolute inset-0 bg-[url('https://i.postimg.cc/wTFJbMNp/Designer-1.png')] bg-center bg-cover opacity-5 z-0" />
        
        {messages.map((m, i) => (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'} relative z-10`}>
            <div className={`max-w-[85%] p-3 px-4 rounded-2xl shadow-xl ${m.role === 'user' ? 'bg-[#202c33] rounded-tl-none border border-white/5' : 'bg-[#005c4b] rounded-tr-none'}`}>
              <ReactMarkdown remarkPlugins={[remarkGfm]} className="text-sm leading-relaxed prose prose-invert">{m.content}</ReactMarkdown>
            </div>
          </motion.div>
        ))}

        {/* אנימציית סריקה ויזואלית */}
        <AnimatePresence>
          {isScanning && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-end relative z-20">
              <div className="relative w-64 h-80 rounded-3xl overflow-hidden border-2 border-emerald-500 shadow-[0_0_25px_rgba(16,185,129,0.3)] bg-black">
                {scanPreview && <img src={scanPreview} className="w-full h-full object-cover opacity-60" />}
                <motion.div 
                  initial={{ top: 0 }} animate={{ top: '100%' }} 
                  transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                  className="absolute left-0 w-full h-1.5 bg-emerald-400 shadow-[0_0_20px_#4ade80] z-30"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[1px]">
                  <span className="text-[10px] font-black text-emerald-400 animate-pulse uppercase tracking-[0.4em]">Analyzing Structure...</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={scrollRef} />
      </main>

      {/* Footer עם תפריט המבורגר קבצים */}
      <footer className="p-4 bg-[#111b21] border-t border-white/5 relative z-[60]">
        <div className="max-w-4xl mx-auto flex items-end gap-3">
          
          <div className="relative">
            <AnimatePresence>
              {showMenu && (
                <motion.div initial={{ scale: 0, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0, y: 20 }} className="absolute bottom-16 right-0 flex flex-col gap-3">
                  <button onClick={() => fileInputRef.current?.click()} className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all text-white"><FileText size={20}/></button>
                  <button onClick={() => fileInputRef.current?.click()} className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all text-white"><ImageIcon size={20}/></button>
                  <button onClick={() => fileInputRef.current?.click()} className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all text-white"><Camera size={20}/></button>
                </motion.div>
              )}
            </AnimatePresence>
            <button 
              onClick={() => setShowMenu(!showMenu)} 
              className={`w-12 h-12 rounded-full flex items-center justify-center shadow-2xl transition-all ${showMenu ? 'bg-red-500 rotate-45' : 'bg-[#2a3942] text-emerald-500 border border-white/5'}`}
            >
              <Plus size={24} />
            </button>
          </div>

          <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileAction} accept="image/*,application/pdf" />

          <div className="flex-1 bg-[#2a3942] rounded-2xl flex items-center px-4 py-1 border border-white/5 focus-within:border-emerald-500/50 transition-all shadow-inner">
            <textarea 
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="מה נסרוק היום בוס?"
              className="flex-1 bg-transparent py-3 outline-none text-sm resize-none font-bold"
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), askAI(input))}
            />
            <button onClick={() => askAI(input)} className="mr-2 text-emerald-500 hover:scale-110 transition-transform active:scale-90">
              <Send size={22} className="rotate-180" />
            </button>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #10b981; border-radius: 10px; }
        .prose strong { color: #10b981; font-weight: 900; }
      `}</style>
    </div>
  );
}
