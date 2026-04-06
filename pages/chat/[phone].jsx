'use client';
import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import { Menu, Send, X, Calculator, Camera, FileText, Plus, ShoppingCart, Share2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useRouter } from 'next/router';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

const SABAN_LOGO = "https://i.postimg.cc/3wTMxG7W/ai.jpg";

const QUICK_QUERIES = [
  { label: 'אני רוצה להזמין', icon: '🎯', color: 'text-red-500' },
  { label: 'הזמנת מכולה/מנוף', icon: '🏗️', color: 'text-blue-400' },
  { label: 'ייעוץ טכני/מפרט', icon: '🎓', color: 'text-orange-500' },
  { label: 'מוצרי איטום וגבס', icon: '⛈️', color: 'text-emerald-400' },
  { label: 'שעות פעילות וסניפים', icon: '🏢', color: 'text-slate-400' },
  { label: 'צריך עזרה מנציג', icon: '👤', color: 'text-purple-500' }
];

export default function SabanAIAssistant() {
  const router = useRouter();
  const { phone } = router.query;

  const [showSplash, setShowSplash] = useState(true);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanPreview, setScanPreview] = useState(null);
  const [showCart, setShowCart] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [showSparkle, setShowSparkle] = useState(false);

  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setTimeout(() => setShowSplash(false), 800);
    if (messages.length === 0) {
      setMessages([{ role: 'ai', content: "אהלן בוס! כאן המומחה של ח.סבן. שלח צילום של הליקוי או תאר לי מה הבעיה, ואני בונה לך מפרט." }]);
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, streamingText, isScanning]);

  const playNotification = () => {
    const audio = new Audio('/message-pop.mp3');
    audio.play().catch(() => {});
  };

  const calculateProductsBySQM = (sqm) => {
    const items = [
      { id: 1, name: "סיקפלקס 11FC", qty: Math.ceil(sqm / 3), unit: "יחידות" },
      { id: 2, name: "קלסימו X (5 קג)", qty: Math.ceil(sqm / 10), unit: "שקים" },
      { id: 3, name: "סופרקריל מט (5 ליטר)", qty: Math.ceil(sqm / 15), unit: "גלונים" }
    ];
    setCartItems(items);
    setShowCart(true);
    playNotification();
  };

  const processVisualScan = async (base64) => {
    try {
      const aiRes = await fetch('/api/tools-brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, senderPhone: phone })
      });
      const data = await aiRes.json();
      setShowSparkle(true);
      playNotification();
      setTimeout(() => setShowSparkle(false), 3000);
      setMessages(prev => [...prev, { role: 'ai', content: data.reply }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'ai', content: "בוס, הסריקה נכשלה. נסה שוב." }]);
    } finally {
      setIsScanning(false);
      setScanPreview(null);
    }
  };

  const askAI = async (query) => {
    if (!query || !query.trim() || loading) return;

    const sqmMatch = query.match(/\d+/);
    if (sqmMatch && messages[messages.length - 1]?.content.toLowerCase().includes('מ"ר')) {
      calculateProductsBySQM(parseInt(sqmMatch[0]));
    }

    setMessages(prev => [...prev, { role: 'user', content: query }]);
    setLoading(true);
    setInput('');

    try {
      const res = await fetch('/api/customer-brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query, senderPhone: phone })
      });
      const data = await res.json();
      setLoading(false);
      setIsTyping(true);
      playNotification();
      
      setStreamingText("");
      const words = data.reply.split(" ");
      let i = 0;
      const interval = setInterval(() => {
        if (i < words.length) {
          setStreamingText(prev => prev + (i === 0 ? "" : " ") + words[i]);
          i++;
        } else {
          clearInterval(interval);
          setMessages(prev => [...prev, { role: 'ai', content: data.reply }]);
          setStreamingText("");
          setIsTyping(false);
        }
      }, 30);
    } catch (e) {
      setLoading(false);
      setMessages(prev => [...prev, { role: 'ai', content: "יש תקלה בחיבור אחי." }]);
    }
  };

  const handleShareToWhatsApp = () => {
    const list = cartItems.map(item => `• ${item.name}: ${item.qty} ${item.unit}`).join('\n');
    const text = encodeURIComponent(`הזמנה חדשה מהיועץ של ח.סבן:\nעבור מספר: ${phone}\n\n${list}`);
    window.open(`https://wa.me/972508860896?text=${text}`, '_blank');
  };

  return (
    <div className="h-screen w-full flex flex-col font-sans relative overflow-hidden bg-[#0b141a] text-[#e9edef]" dir="rtl">
      <Head>
        <title>ח.סבן AI | יועץ טכני</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"/> 
      </Head>

      <div className="absolute inset-0 bg-[url('https://i.postimg.cc/wTFJbMNp/Designer-1.png')] bg-center bg-cover opacity-5 z-0" />

      <AnimatePresence>
        {showSplash && (
          <motion.div exit={{ opacity: 0 }} className="fixed inset-0 bg-[#0b141a] z-[100] flex items-center justify-center">
            <img src={SABAN_LOGO} className="w-24 h-24 rounded-3xl shadow-2xl animate-pulse"/>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="h-16 flex items-center justify-between px-5 bg-[#202c33] border-b border-white/5 z-10 shadow-lg shrink-0">
        <Menu size={22} className="text-slate-400" />
        <div className="flex items-center gap-3">
          <div className="flex flex-col text-left items-end">
            <span className="font-bold text-xs text-emerald-500 uppercase italic">Saban AI Assistant</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[9px] text-slate-400 uppercase font-bold">Online</span>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_5px_#10b981]" />
            </div>
          </div>
          <img src={SABAN_LOGO} className="w-10 h-10 rounded-full border border-emerald-500/30 shadow-lg"/>
        </div>
        <div className="relative cursor-pointer" onClick={() => setShowCart(true)}>
          <ShoppingCart size={22} className="text-emerald-500" />
          {cartItems.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-[10px] w-4 h-4 rounded-full flex items-center justify-center animate-bounce">!</span>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4 z-10 custom-scrollbar pb-32">
        {messages.map((m, i) => (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'} relative`}>
            {m.role === 'ai' && showSparkle && i === messages.length - 1 && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-2 -right-2 text-yellow-400">
                <Sparkles size={20} className="animate-pulse" />
              </motion.div>
            )}
            <div className={`max-w-[85%] p-3 px-4 rounded-2xl shadow-md ${m.role === 'user' ? 'bg-[#202c33] text-white rounded-tl-none' : 'bg-[#005c4b] text-white rounded-tr-none'}`}>
              <ReactMarkdown remarkPlugins={[remarkGfm]} className="text-[14px] leading-relaxed prose prose-invert font-medium">
                {m.content}
              </ReactMarkdown>
            </div>
          </motion.div>
        ))}
        {(isTyping || streamingText) && (
          <div className="flex justify-end">
            <div className="max-w-[85%] p-3 px-4 rounded-2xl bg-[#005c4b] rounded-tr-none shadow-md">
              <span className="text-[14px] leading-relaxed font-medium">{streamingText || "מחשב..."}</span>
            </div>
          </div>
        )}

        <AnimatePresence>
          {isScanning && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-center my-4">
              <div className="relative w-48 h-64 rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-2xl bg-black">
                {scanPreview && <img src={scanPreview} className="w-full h-full object-cover opacity-60" />}
                <motion.div initial={{ top: 0 }} animate={{ top: '100%' }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }} className="absolute left-0 w-full h-1 bg-emerald-400 shadow-[0_0_15px_#10b981] z-20" />
                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-emerald-400 animate-pulse tracking-widest uppercase">Analyzing...</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={scrollRef} />
      </main>

      <AnimatePresence>
        {showCart && (
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed inset-y-0 right-0 w-80 bg-[#111b21] z-50 shadow-2xl border-l border-white/10 p-5 flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-black text-emerald-500">רשימת הזמנה</h2>
              <X onClick={() => setShowCart(false)} className="text-slate-400 cursor-pointer" />
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto no-scrollbar">
              {cartItems.length > 0 ? cartItems.map(item => (
                <div key={item.id} className="bg-[#202c33] p-4 rounded-xl border-r-4 border-emerald-500 shadow-lg">
                  <p className="font-bold text-sm text-white">{item.name}</p>
                  <p className="text-emerald-500 font-black mt-1">{item.qty} {item.unit}</p>
                </div>
              )) : (
                <div className="text-center text-slate-500 mt-20">
                  <p>אין מוצרים ברשימה.</p>
                  <p className="text-xs">תגיד לי כמה מ"ר השטח!</p>
                </div>
              )}
            </div>
            {cartItems.length > 0 && (
              <button onClick={handleShareToWhatsApp} className="w-full bg-emerald-600 py-4 rounded-2xl flex items-center justify-center gap-3 font-bold shadow-lg mt-4 hover:bg-emerald-500">
                <Share2 size={20} /> שתף למחלקת הזמנות
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="fixed bottom-0 left-0 right-0 p-3 bg-[#0b141a] border-t border-white/5 z-20">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3 mb-1">
          {QUICK_QUERIES.map((q, i) => (
            <button key={i} onClick={() => askAI(q.label)} className="whitespace-nowrap px-4 py-2 bg-[#202c33] rounded-full text-[11px] font-bold border border-white/5 flex items-center gap-2 active:scale-95 shadow-lg transition-all">
              <span className={q.color}>{q.icon}</span>{q.label}
            </button>
          ))}
        </div>
        
        <form onSubmit={(e) => { e.preventDefault(); askAI(input); }} className="flex items-center gap-2 max-w-4xl mx-auto">
          <div className="relative">
            <AnimatePresence>
              {showMenu && (
                <motion.div initial={{ scale: 0, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0, y: 20 }} className="absolute bottom-14 right-0 flex flex-col gap-3">
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-2xl hover:bg-blue-500"><FileText size={20}/></button>
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center shadow-2xl hover:bg-emerald-500"><Camera size={20}/></button>
                </motion.div>
              )}
            </AnimatePresence>
            <button type="button" onClick={() => setShowMenu(!showMenu)} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-xl ${showMenu ? 'bg-red-500 rotate-45' : 'bg-[#2a3942] text-emerald-500'}`}><Plus size={24} /></button>
          </div>

          <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              setShowMenu(false);
              setIsScanning(true);
              const reader = new FileReader();
              reader.readAsDataURL(file);
              reader.onload = (ev) => {
                setScanPreview(ev.target.result);
                processVisualScan(ev.target.result);
              };
            }
          }} accept="image/*" />

          <div className="flex-1 bg-[#2a3942] rounded-3xl flex items-center px-4 py-1.5 border border-white/10 shadow-inner">
            <textarea 
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="אחי, כמה מטר השטח?"
              className="flex-1 bg-transparent py-2.5 outline-none text-sm resize-none font-bold placeholder:text-slate-500"
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), askAI(input))}
            />
            <button type="submit" disabled={loading} className={`mr-2 transition-all ${loading ? 'opacity-30' : 'text-emerald-500 hover:scale-110 active:scale-90'}`}><Send size={22} className="rotate-180"/></button>
          </div>
        </form>
      </footer>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(16, 185, 129, 0.2); border-radius: 10px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .prose strong { color: #10b981; font-weight: 800; }
        .prose p { margin-bottom: 0.5rem; }
      `}</style>
    </div>
  );
}
