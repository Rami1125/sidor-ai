'use client';
import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import { Menu, Send, X, Calculator, Truck, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// חיבור ל-DB המשותף לשני המאגרים
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
const SABAN_LOGO = "https://i.postimg.cc/3wTMxG7W/ai.jpg";

const QUICK_QUERIES = [
  { label: 'הזמנת חומרי בניין', icon: '🏗️', color: 'text-blue-400' },
  { label: 'הצבת מכולה 8 קוב', icon: '♻️', color: 'text-emerald-400' },
  { label: 'ייעוץ טכני ומוצרים', icon: '🎓', color: 'text-orange-400' },
  { label: 'צריך עזרה מנציג', icon: '👤', color: 'text-purple-400' }
];

export default function SabanAIAssistant() {
  const [showSplash, setShowSplash] = useState(true);
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [selectedProductSku, setSelectedProductSku] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTimeout(() => setShowSplash(false), 800);
  }, []);

  // האזנה להודעות מהמחשבון (Iframe)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'ADD_TO_ORDER') {
        const { productName, quantity, sku } = event.data;
        setSelectedProductSku(null); 
        const orderText = `אני רוצה להזמין ${quantity} יחידות של ${productName} (מק"ט ${sku})`;
        askAI(orderText);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, streamingText]);

  // לוגיקה חכמה לניתוב בין המאגרים
  const handleInternalCommands = async (text: string) => {
    // 1. זיהוי כרטיס מוצר (חומרי בניין מהמאגר הישן)
    if (text.includes("SHOW_PRODUCT_CARD:")) {
      const sku = text.split("SHOW_PRODUCT_CARD:")[1].split(/\s/)[0].trim();
      setTimeout(() => setSelectedProductSku(sku), 600);
    }

    // 2. שמירת הזמנה (מזהה אוטומטית אם זו מכולה או חומר בניין)
    if (text.includes("SAVE_ORDER_DB:")) {
      const orderData = text.split("SAVE_ORDER_DB:")[1].trim();
      const isContainer = orderData.toLowerCase().includes('מכולה') || orderData.includes('8 קוב');

      console.log(`🚀 מסנכרן הזמנה למאגר: ${isContainer ? 'Container-AI' : 'Sidor-Main'}`);

      // הזרקה ל-Supabase שמשותף לשני המאגרים
      await supabase.from('orders').insert([{
        client_info: `צאט-AI | ${new Date().toLocaleDateString('he-IL')}`,
        warehouse: orderData,
        is_container: isContainer, // כאן הקישור ללוח החדש
        status: 'pending',
        order_time: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
      }]);
    }
  };

  const typeEffect = (fullText: string) => {
    setIsTyping(true);
    setStreamingText("");
    const cleanText = fullText.replace(/SHOW_PRODUCT_CARD:[\w-]+\s?/, "").replace(/SAVE_ORDER_DB:.*?\s?/, "");
    const words = cleanText.split(" ");
    let i = 0;

    const playNextWord = () => {
      if (i < words.length) {
        setStreamingText((prev) => prev + (i === 0 ? "" : " ") + words[i]);
        i++;
        setTimeout(playNextWord, 40); 
      } else {
        setMessages(prev => [...prev, { role: 'ai', content: cleanText }]);
        setStreamingText("");
        setIsTyping(false);
        handleInternalCommands(fullText);
      }
    };
    playNextWord();
  };

  const askAI = async (query: string) => {
    if (!query.trim() || loading || isTyping) return;
    setMessages(prev => [...prev, { role: 'user', content: query }]);
    setLoading(true); setInput('');
    try {
      const res = await fetch('/api/customer-brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query, senderPhone: 'customer_web' })
      });
      const data = await res.json();
      setLoading(false);
      typeEffect(data.reply);
      new Audio('/order-notification.mp3').play().catch(() => {});
    } catch (e) { 
      setLoading(false);
      setMessages(prev => [...prev, { role: 'ai', content: "בוס, יש תקלה בחיבור למוח. נסה שוב." }]); 
    }
  };

  return (
    <div className="h-screen w-full flex flex-col font-sans relative overflow-hidden bg-[#0b141a] text-[#e9edef] italic" dir="rtl">
      <Head><title>SABAN AI | מפקדת שליטה</title></Head>

      {/* Splash Screen */}
      <AnimatePresence>
        {showSplash && (
          <motion.div exit={{ opacity: 0 }} className="fixed inset-0 bg-[#0b141a] z-[100] flex items-center justify-center">
            <img src={SABAN_LOGO} className="w-40 h-40 rounded-3xl shadow-2xl animate-pulse border-2 border-emerald-500/20"/>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product Card Modal (Iframe Connection) */}
      <AnimatePresence>
        {selectedProductSku && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl"
            onClick={() => setSelectedProductSku(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }}
              className="bg-[#111b21] w-full max-w-md h-[80vh] rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <header className="p-6 bg-[#202c33] flex justify-between items-center">
                <div className="flex items-center gap-2 text-emerald-400 font-black italic">
                   <Calculator size={20} /> <span>מחשבון ליקוט חכם</span>
                </div>
                <button onClick={() => setSelectedProductSku(null)} className="p-2 bg-white/5 rounded-full"><X size={20}/></button>
              </header>
              <div className="flex-1 overflow-hidden bg-white">
                <iframe src={`/product/${selectedProductSku}?embed=true`} className="w-full h-full border-none" />
              </div>
              <footer className="p-4 bg-[#202c33]">
                <button onClick={() => setSelectedProductSku(null)} className="w-full py-4 bg-emerald-600 rounded-2xl font-black text-white">חזרה לצאט</button>
              </footer>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Interface */}
      <div className="relative z-10 flex flex-col h-full">
        <header className="h-20 flex items-center justify-between px-6 bg-[#202c33]/90 backdrop-blur-md border-b border-white/5 shrink-0">
          <div className="flex items-center gap-3">
             <div className="relative">
                <img src={SABAN_LOGO} className="w-10 h-10 rounded-xl border border-emerald-500/20"/>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#202c33]" />
             </div>
             <div>
                <h1 className="font-black text-white leading-none">ח.סבן חומרי בנין</h1>
                <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">היועץ שלך כאן</span>
             </div>
          </div>
          <Menu className="text-slate-400" />
        </header>

        <main className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
          {messages.map((m, i) => (
            <motion.div initial={{ opacity: 0, x: m.role === 'user' ? -20 : 20 }} animate={{ opacity: 1, x: 0 }} key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[85%] p-4 rounded-[1.5rem] shadow-xl ${m.role === 'user' ? 'bg-[#202c33] rounded-tr-none' : 'bg-[#005c4b] rounded-tl-none border border-emerald-400/10'}`}>
                <ReactMarkdown remarkPlugins={[remarkGfm]} className="text-sm leading-relaxed prose prose-invert">{m.content}</ReactMarkdown>
              </div>
            </motion.div>
          ))}

          {(isTyping || streamingText) && (
            <div className="flex justify-end">
              <div className="max-w-[85%] p-4 rounded-[1.5rem] bg-[#005c4b] rounded-tl-none shadow-xl">
                <span className="text-sm">{streamingText || "..."}</span>
                <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} className="inline-block w-1 h-4 bg-emerald-300 ml-1" />
              </div>
            </div>
          )}
          <div ref={scrollRef} className="h-4" />
        </main>

        <footer className="p-4 bg-[#0b141a] border-t border-white/5">
          <div className="max-w-4xl mx-auto mb-4 flex gap-2 overflow-x-auto no-scrollbar">
            {QUICK_QUERIES.map((q, i) => (
              <button key={i} onClick={() => askAI(q.label)} className="whitespace-nowrap px-6 py-3 bg-[#202c33] rounded-2xl text-xs font-bold flex items-center gap-2 border border-white/5 hover:bg-[#2a3942] transition-all">
                <span className={q.color}>{q.icon}</span>{q.label}
              </button>
            ))}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); askAI(input); }} className="max-w-4xl mx-auto flex gap-3">
            <input value={input} onChange={e => setInput(e.target.value)} placeholder="כתוב הודעה..." className="flex-1 p-4 rounded-2xl bg-[#202c33] border-none outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-sm"/>
            <button type="submit" disabled={loading} className="w-14 h-14 bg-emerald-500 text-[#0b141a] rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-all">
              <Send size={22} className="rotate-180"/>
            </button>
          </form>
        </footer>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(16, 185, 129, 0.2); border-radius: 10px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
