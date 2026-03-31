'use client';
import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { supabase } from '../../lib/supabase';
import { 
  Menu, X, Send, Bot, Calendar, RefreshCcw, User, MapPin, Clock, MessageSquare, Timer 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// הגדרות עיצוב WhatsApp Dark
const WA_BG = "bg-[#111b21]"; 
const WA_PANEL = "bg-[#202c33]"; 
const WA_GREEN = "bg-[#00a884]"; 
const WA_TEXT = "text-[#e9edef]"; 
const WA_SUB = "text-[#8696a0]"; 

const STATUS_MAP: any = {
  'approved': { label: 'מאושר', color: 'bg-[#00a884]' },
  'pending': { label: 'ממתין', color: 'bg-[#f1c40f] text-[#111b21]' },
  'rejected': { label: 'בוטל', color: 'bg-[#ea0038]' }
};

const QUICK_QUERIES = [
  "כמה הזמנות יש היום?", "מצב מכולות", "העברות היום", "סיכום תפעולי"
];

export default function SabanAIAssistant() {
  const [activeView, setActiveView] = useState<'chat' | 'live'>('chat');
  const [isOpen, setIsOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTimeout(() => setShowSplash(false), 800);
    fetchLiveOrders();
    const interval = setInterval(fetchLiveOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const fetchLiveOrders = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data: o } = await supabase.from('orders').select('*').eq('delivery_date', today);
    const { data: c } = await supabase.from('container_management').select('*').eq('is_active', true);
    setOrders([...(o || []), ...(c || [])]);
  };

  const askAI = async (query: string) => {
    if (!query.trim() || loading) return;
    setMessages(prev => [...prev, { role: 'user', content: query }]);
    setLoading(true); setInput('');
    try {
      const res = await fetch('/api/ai-analyst', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, sender_name: 'ראמי' })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'ai', content: data.reply || data.answer }]);
    } catch (e) { 
      setMessages(prev => [...prev, { role: 'ai', content: "בוס, יש תקלה בחיבור למוח." }]); 
    } finally { setLoading(false); }
  };

  return (
    <div className={`h-screen ${WA_BG} ${WA_TEXT} flex flex-col font-sans overflow-hidden`} dir="rtl">
      <Head><title>sabanos | AI Companion</title></Head>

      <AnimatePresence>
        {showSplash && (
          <motion.div exit={{ opacity: 0 }} className={`fixed inset-0 ${WA_BG} z-[100] flex items-center justify-center`}>
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center gap-4">
               <div className="w-32 h-32 bg-emerald-500 rounded-[2.5rem] flex items-center justify-center shadow-2xl">
                  <Bot size={64} className="text-black" />
               </div>
               <span className="text-2xl font-black italic tracking-tighter">SABAN <span className="text-emerald-500">OS</span></span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className={`h-16 flex items-center justify-between px-6 ${WA_PANEL} border-b border-white/5 z-50 shadow-md`}>
        <button onClick={() => setIsOpen(true)} className="p-2"><Menu size={24} /></button>
        <span className="font-black text-lg tracking-tighter uppercase text-emerald-500 italic">SABAN {activeView === 'chat' ? 'AI' : 'LIVE'}</span>
        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 font-black text-xs border border-emerald-500/20">
          {orders.length}
        </div>
      </header>

      {/* תפריט צד Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsOpen(false)} className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className={`fixed top-0 right-0 h-full w-72 ${WA_PANEL} z-[70] p-8 shadow-2xl border-l border-white/5`}>
              <div className="flex justify-between items-center mb-12">
                  <span className="font-black text-xl italic text-emerald-500">SABAN 1994</span>
                  <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/5 rounded-full"><X size={24}/></button>
              </div>
              <nav className="space-y-3">
                <button onClick={() => { setActiveView('chat'); setIsOpen(false); }} className={`w-full p-4 rounded-2xl flex items-center gap-4 font-bold transition-all ${activeView === 'chat' ? 'bg-emerald-500 text-black' : 'hover:bg-white/5'}`}><MessageSquare size={20}/> AI ANALYST</button>
                <button onClick={() => { setActiveView('live'); setIsOpen(false); }} className={`w-full p-4 rounded-2xl flex items-center gap-4 font-bold transition-all ${activeView === 'live' ? 'bg-emerald-500 text-black' : 'hover:bg-white/5'}`}><Timer size={20}/> משימות LIVE</button>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 pb-32 scrollbar-hide bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat">
        {activeView === 'chat' ? (
          messages.map((m, i) => (
            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[85%] p-4 rounded-2xl font-bold shadow-md ${m.role === 'user' ? 'bg-[#202c33] border border-white/5' : 'bg-[#005c4b] text-[#e9edef]'}`}>{m.content}</div>
            </motion.div>
          ))
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {orders.map((order) => (
              <div key={order.id} className={`p-5 rounded-2xl ${WA_PANEL} border-r-4 border-emerald-500 shadow-lg`}>
                <div className="flex justify-between mb-2">
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${STATUS_MAP[order.status]?.color || 'bg-slate-700'}`}>{STATUS_MAP[order.status]?.label || order.status}</span>
                  <span className={`${WA_SUB} font-mono text-[9px]`}>#{order.id.slice(0,6)}</span>
                </div>
                <h3 className="text-lg font-black">{order.client_name || order.client_info}</h3>
                <div className={`${WA_SUB} text-xs flex items-center gap-1 mb-3`}><MapPin size={12}/> {order.delivery_address || order.location}</div>
                <div className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5">
                  <div className="flex items-center gap-2 text-emerald-500 font-black text-lg italic"><Clock size={16}/> {order.order_time}</div>
                  <span className="text-[10px] font-bold opacity-60">{order.driver_name || order.contractor_name}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        {loading && <div className="flex justify-center"><Bot className="animate-bounce text-emerald-500" /></div>}
      </main>

      {activeView === 'chat' && (
        <footer className={`fixed bottom-0 left-0 right-0 p-4 ${WA_BG} z-40 border-t border-white/5`}>
          <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
            {QUICK_QUERIES.map((q, i) => (
              <button key={i} onClick={() => askAI(q)} className={`whitespace-nowrap px-4 py-2 ${WA_PANEL} rounded-full text-[10px] font-bold border border-white/5 active:scale-95 transition-all`}>{q}</button>
            ))}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); askAI(input); }} className="relative">
            <input value={input} onChange={e => setInput(e.target.value)} placeholder="כתוב פקודה למערכת..." className={`w-full p-4 pr-12 rounded-full ${WA_PANEL} border-none outline-none focus:ring-1 focus:ring-emerald-500 text-sm`} />
            <button type="submit" className="absolute left-2 top-2 w-10 h-10 bg-emerald-500 text-black rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all"><Send size={18} className="rotate-180" /></button>
          </form>
        </footer>
      )}
    </div>
  );
}
