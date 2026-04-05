'use client';
import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import { Menu, Send, X, Calculator, Camera, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
const SABAN_LOGO = "https://i.postimg.cc/3wTMxG7W/ai.jpg";
const WA_TEXT = "text-[#e9edef]";

const QUICK_QUERIES = [
  { label: 'אני רוצה להזמין', icon: '🎯', color: 'text-red-500' },
  { label: 'הזמנת מכולה/מנוף', icon: '🏗️', color: 'text-blue-400' },
  { label: 'ייעוץ טכני/מפרט', icon: '🎓', color: 'text-orange-500' },
  { label: 'מוצרי איטום וגבס', icon: '⛈️', color: 'text-emerald-400' },
  { label: 'שעות פעילות וסניפים', icon: '🏢', color: 'text-slate-400' },
  { label: 'צריך עזרה מנציג', icon: '👤', color: 'text-purple-500' }
];

export default function SabanAIAssistant() {
  const [showSplash, setShowSplash] = useState(true);
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [selectedProductSku, setSelectedProductSku] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, streamingText]);

  // לוגיקת העלאת תמונה
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = async () => {
      const base64Data = reader.result as string;
      const base64Clean = base64Data.split(',')[1];

      try {
        const res = await fetch('/api/upload-to-drive', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: `Saban_AI_${Date.now()}.jpg`,
            fileData: base64Clean,
            mimeType: file.type,
            phone: 'admin' // ניתן להחליף במזהה לקוח דינמי
          }),
        });

        const data = await res.json();
        if (data.link) {
          // שליחת הלינק ל-AI לניתוח
          askAI(`שלחתי תמונה לניתוח: ${data.link}`);
        }
      } catch (error) {
        console.error("Upload error", error);
      } finally {
        setUploading(false);
      }
    };
  };

  const askAI = async (query: string) => {
    if (!query.trim() || loading || isTyping) return;
    setMessages(prev => [...prev, { role: 'user', content: query }]);
    setLoading(true);
    setInput('');

    try {
      const res = await fetch('/api/tools-brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query, senderPhone: 'admin' })
      });
      const data = await res.json();
      setLoading(false);
      
      setIsTyping(true);
      setStreamingText("");
      const words = data.reply.split(" ");
      let i = 0;
      const play = () => {
        if (i < words.length) {
          setStreamingText(p => p + (i === 0 ? "" : " ") + words[i]);
          i++;
          setTimeout(play, 40);
        } else {
          setMessages(prev => [...prev, { role: 'ai', content: data.reply }]);
          setStreamingText("");
          setIsTyping(false);
        }
      };
      play();
    } catch (e) { 
      setLoading(false);
      setMessages(prev => [...prev, { role: 'ai', content: "משהו השתבש בחיבור למוח." }]); 
    }
  };

  return (
    <div className={`h-screen w-full flex flex-col font-sans relative overflow-hidden bg-[#0b141a] ${WA_TEXT}`} dir="rtl">
      <Head>
        <title>ח.סבן AI | עוזר אישי</title>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#10b981" />
        <script src="https://cdn.onesignal.com/sdks/OneSignalSDK.js" async></script>
      </Head>

      <div className="absolute inset-0 bg-[url('https://i.postimg.cc/wTFJbMNp/Designer-1.png')] bg-center bg-cover opacity-10 z-0" />

      <AnimatePresence>
        {showSplash && (
          <motion.div exit={{ opacity: 0 }} className="fixed inset-0 bg-[#0b141a] z-[100] flex items-center justify-center">
            <img src={SABAN_LOGO} className="w-32 h-32 rounded-3xl shadow-2xl animate-pulse"/>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="h-16 flex items-center justify-between px-5 bg-[#202c33] border-b border-white/5 z-10 shrink-0">
        <Menu size={22} className="text-slate-400" />
        <div className="flex items-center gap-3">
          <div className="flex flex-col text-left items-end">
            <span className="font-bold text-sm text-emerald-500 leading-none">ח.סבן - עוזר חכם</span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10px] text-slate-400">מחובר כעת</span>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_#10b981]" />
            </div>
          </div>
          <img src={SABAN_LOGO} className="w-9 h-9 rounded-full border border-emerald-500/30 shadow-lg"/>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4 z-10 custom-scrollbar">
        {messages.map((m, i) => (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[85%] p-3 px-4 rounded-2xl shadow-md ${m.role === 'user' ? 'bg-[#202c33] text-white rounded-tl-none' : 'bg-[#005c4b] text-white rounded-tr-none'}`}>
              <ReactMarkdown remarkPlugins={[remarkGfm]} className="text-[14px] leading-relaxed prose prose-invert">{m.content}</ReactMarkdown>
            </div>
          </motion.div>
        ))}

        {(isTyping || streamingText) && (
          <div className="flex justify-end">
            <div className="max-w-[85%] p-3 px-4 rounded-2xl bg-[#005c4b] rounded-tr-none shadow-md border border-emerald-400/10">
              <span className="text-[14px]">{streamingText || "מנתח נתונים..."}</span>
              <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 0.6 }} className="inline-block w-1 h-4 bg-emerald-300 ml-1 translate-y-1" />
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </main>

      <footer className="p-3 bg-[#0b141a] border-t border-white/5 z-10">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3">
          {QUICK_QUERIES.map((q, i) => (
            <button key={i} onClick={() => askAI(q.label)} className="whitespace-nowrap px-4 py-2 bg-[#202c33] rounded-full text-[12px] font-semibold border border-white/5 flex items-center gap-2 active:scale-95">
              <span className={q.color}>{q.icon}</span>{q.label}
            </button>
          ))}
        </div>

        <div className="max-w-5xl mx-auto flex gap-2 items-center">
          {/* כפתור מצלמה מעוצב */}
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-12 h-12 bg-[#202c33] hover:bg-[#2a3942] text-emerald-500 rounded-full flex items-center justify-center transition-all border border-white/5 active:scale-90"
          >
            {uploading ? <Loader2 size={20} className="animate-spin" /> : <Camera size={22} />}
          </button>
          <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />

          <form onSubmit={(e) => { e.preventDefault(); askAI(input); }} className="flex-1 flex gap-2">
            <input 
              value={input} 
              onChange={e => setInput(e.target.value)} 
              placeholder="איך אפשר לעזור אחי?" 
              className="flex-1 p-3 px-5 rounded-full bg-[#2a3942] text-white outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
            />
            <button 
              type="submit" 
              disabled={loading || isTyping} 
              className="w-12 h-12 bg-emerald-500 text-[#0b141a] rounded-full flex items-center justify-center hover:bg-emerald-400 active:scale-90 disabled:opacity-50"
            >
              <Send size={18} className="rotate-180" />
            </button>
          </form>
        </div>
      </footer>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(16, 185, 129, 0.2); border-radius: 10px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
