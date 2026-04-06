'use client';
import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import { Menu, Send, X, Calculator, Camera, FileText, Plus, ShoppingCart, Share2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useRouter } from 'next/router';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');
const SABAN_LOGO = "https://i.postimg.cc/3wTMxG7W/ai.jpg";

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
      setMessages([{ role: 'ai', content: "אהלן בוס! שלח צילום של הליקוי או תאר לי מה הבעיה." }]);
    }
  }, []);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, streamingText, isScanning]);

  const playNotification = () => { new Audio('/message-pop.mp3').play().catch(() => {}); };

  const calculateOrder = (sqm) => {
    const items = [
      { id: 1, name: "סיקפלקס 11FC לבן", qty: 1, unit: "יח'" },
      { id: 2, name: "קלסימו X (5 קג)", qty: 1, unit: "שק" },
      { id: 3, name: "סופרקריל מט 2 ליטר", qty: 1, unit: "גלון" }
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
      setShowSparkle(true); playNotification();
      setTimeout(() => setShowSparkle(false), 3000);
      setMessages(prev => [...prev, { role: 'ai', content: data.reply }]);
    } catch (e) { setMessages(prev => [...prev, { role: 'ai', content: "נכשלתי בניתוח אחי." }]); }
    finally { setIsScanning(false); setScanPreview(null); }
  };

  const askAI = async (query) => {
    if (!query?.trim() || loading) return;
    const sqmMatch = query.match(/\d+/);
    if (sqmMatch && messages[messages.length-1]?.content.includes('מ"ר')) {
      calculateOrder(parseInt(sqmMatch[0]));
    }
    setMessages(prev => [...prev, { role: 'user', content: query }]);
    setLoading(true); setInput('');
    try {
      const res = await fetch('/api/customer-brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query, senderPhone: phone })
      });
      const data = await res.json();
      setLoading(false); setIsTyping(true); playNotification();
      let i = 0; const words = data.reply.split(" ");
      const interval = setInterval(() => {
        if (i < words.length) { setStreamingText(prev => prev + (i === 0 ? "" : " ") + words[i]); i++; }
        else { clearInterval(interval); setMessages(prev => [...prev, { role: 'ai', content: data.reply }]); setStreamingText(""); setIsTyping(false); }
      }, 30);
    } catch (e) { setLoading(false); setMessages(prev => [...prev, { role: 'ai', content: "תקלה בחיבור אחי." }]); }
  };

  return (
    <div className="h-screen w-full flex flex-col bg-[#0b141a] text-[#e9edef] overflow-hidden" dir="rtl">
      <Head><title>ח.סבן AI | Expert</title></Head>
      <header className="h-16 bg-[#202c33] flex items-center justify-between px-5 z-10 shadow-xl border-b border-white/5">
        <Menu size={22} className="text-slate-400" />
        <div className="flex items-center gap-3">
          <img src={SABAN_LOGO} className="w-10 h-10 rounded-full border-2 border-emerald-500/50 shadow-lg" />
        </div>
        <div className="relative cursor-pointer" onClick={() => setShowCart(true)}>
          <ShoppingCart size={22} className="text-emerald-500" />
          {cartItems.length > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-[10px] w-4 h-4 rounded-full flex items-center justify-center animate-bounce">!</span>}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4 z-10 custom-scrollbar pb-32">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'} relative`}>
            {m.role === 'ai' && showSparkle && i === messages.length - 1 && (
               <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-2 -right-2 text-yellow-400"><Sparkles size={20}/></motion.div>
            )}
            <div className={`max-w-[85%] p-3 px-4 rounded-2xl ${m.role === 'user' ? 'bg-[#202c33]' : 'bg-[#005c4b]'}`}>
              <ReactMarkdown remarkPlugins={[remarkGfm]} className="text-sm prose prose-invert font-medium">{m.content}</ReactMarkdown>
            </div>
          </div>
        ))}
        {isTyping && <div className="flex justify-end"><div className="bg-[#005c4b] p-3 rounded-2xl text-sm font-medium">{streamingText}</div></div>}
        <div ref={scrollRef} />
      </main>

      <AnimatePresence>
        {showCart && (
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed inset-y-0 right-0 w-80 bg-[#111b21] z-50 p-5 shadow-2xl border-l border-white/10">
            <div className="flex justify-between mb-8"><h2 className="text-xl font-bold text-emerald-500">רשימת ציוד</h2><X onClick={() => setShowCart(false)} className="cursor-pointer" /></div>
            <div className="space-y-4 flex-1 overflow-y-auto">
              {cartItems.map(item => (
                <div key={item.id} className="bg-[#202c33] p-4 rounded-xl border-r-4 border-emerald-500 shadow-lg">
                  <p className="font-bold text-sm text-white">{item.name}</p>
                  <p className="text-emerald-500 font-black mt-1">{item.qty} {item.unit}</p>
                </div>
              ))}
            </div>
            <button onClick={() => window.open(`https://wa.me/972508860896?text=${encodeURIComponent(cartItems.map(i => i.name + ': ' + i.qty).join('\n'))}`)} className="w-full bg-emerald-600 py-4 rounded-2xl mt-8 font-bold flex items-center justify-center gap-2"><Share2 size={20}/> שלח למחסן</button>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="fixed bottom-0 left-0 right-0 p-3 bg-[#0b141a] border-t border-white/5 z-20">
        <form onSubmit={(e) => { e.preventDefault(); askAI(input); }} className="flex items-center gap-2 max-w-4xl mx-auto">
          <button type="button" onClick={() => fileInputRef.current.click()} className="w-12 h-12 bg-[#2a3942] rounded-full flex items-center justify-center text-emerald-500"><Camera size={24}/></button>
          <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => {
            const reader = new FileReader();
            reader.readAsDataURL(e.target.files[0]);
            reader.onload = (ev) => { setScanPreview(ev.target.result); setIsScanning(true); processVisualScan(ev.target.result); };
          }} />
          <textarea value={input} onChange={e => setInput(e.target.value)} placeholder="אחי, כמה מטר השטח?" className="flex-1 bg-[#2a3942] rounded-3xl px-4 py-3 outline-none text-sm resize-none font-bold" onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), askAI(input))} />
          <button type="submit" className="text-emerald-500 active:scale-90"><Send size={24} className="rotate-180"/></button>
        </form>
      </footer>
    </div>
  );
}
