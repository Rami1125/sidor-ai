'use client';
import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { supabase } from '../../lib/supabase';
import { 
  LayoutDashboard, Send, Clock, MapPin, Bot, Truck, Box, 
  Timer, Activity, CheckCheck, AlertCircle, ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DRIVERS = [
  { name: 'חכמת', img: 'https://i.postimg.cc/d3S0NJJZ/Screenshot-20250623-200646-Facebook.jpg' },
  { name: 'עלי', img: 'https://i.postimg.cc/tCNbgXK3/Screenshot-20250623-200744-Tik-Tok.jpg' }
];

export default function SabanUltimateControlCenter() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'live' | 'containers' | 'chat'>('live');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [truckOrders, setTruckOrders] = useState<any[]>([]);
  const [containerSites, setContainerSites] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(new Date());

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setMounted(true);
    fetchData();
    const t = setInterval(() => setNow(new Date()), 1000);
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
    
    const channel = supabase.channel('db_sync').on('postgres_changes', { event: '*', schema: 'public' }, fetchData).subscribe();
    return () => { clearInterval(t); channel.unsubscribe(); };
  }, [selectedDate]);

  const fetchData = async () => {
    const { data: o } = await supabase.from('orders').select('*').eq('delivery_date', selectedDate);
    const { data: c } = await supabase.from('container_management').select('*').eq('is_active', true);
    setTruckOrders(o || []);
    setContainerSites(c || []);
  };

  // פונקציית ניווט דינאמית עם צלצול
  const navigateToChat = (query: string) => {
    audioRef.current?.play().catch(() => {});
    setActiveTab('chat');
    handleChatCommand(null, query);
  };

  const handleChatCommand = async (e: React.FormEvent | null, forcedQuery?: string) => {
    if (e) e.preventDefault();
    const cmd = forcedQuery || input;
    if (!cmd.trim() || loading) return;
    
    setInput('');
    setLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: cmd }]);

    try {
      const res = await fetch('/api/ai-analyst', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: cmd, sender_name: 'ראמי' })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'ai', content: data.answer || data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', content: 'בוס, תקלה בחיבור למוח.' }]);
    } finally {
      setLoading(false);
    }
  };

  const calculateOrderProgress = (orderDate: string, orderTime: string) => {
    const target = new Date(`${orderDate}T${orderTime}`);
    const startOfDay = new Date(`${orderDate}T06:00:00`); // יום עבודה מתחיל ב-6
    const totalDuration = target.getTime() - startOfDay.getTime();
    const elapsed = now.getTime() - startOfDay.getTime();
    const progress = Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100);
    
    const diff = target.getTime() - now.getTime();
    const h = Math.floor(Math.abs(diff) / 3600000);
    const m = Math.floor((Math.abs(diff) % 3600000) / 60000);
    const s = Math.floor((Math.abs(diff) % 60000) / 1000);
    
    return { progress, h, m, s, expired: diff <= 0 };
  };

  if (!mounted) return null;

  return (
    <div className="flex h-screen w-full bg-[#F0F2F5] text-slate-900 font-sans overflow-hidden" dir="rtl">
      <Head><title>SABAN OS | Command Center</title></Head>

      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-80 flex-col bg-white border-l border-slate-200 z-50">
        <div className="p-8 flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-black shadow-lg"><Activity size={20} /></div>
          <h1 className="text-xl font-black italic tracking-tighter">SABAN OS</h1>
        </div>

        <nav className="flex-1 p-6 space-y-2">
          {[{ id: 'live', label: 'הזמנות LIVE', icon: Timer }, { id: 'containers', label: 'מכולות', icon: Box }, { id: 'chat', label: 'AI Supervisor', icon: Bot }].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all ${activeTab === item.id ? 'bg-emerald-600 text-white font-black shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>
              <item.icon size={20} /> <span className="text-sm font-bold">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* דוח צדדי לחיץ */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 space-y-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">סיכום תפעולי (לחיץ)</p>
          <div className="space-y-2">
            {DRIVERS.map(d => (
              <button key={d.name} onClick={() => navigateToChat(`למי סיפק ${d.name} היום?`)} className="w-full flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 hover:border-emerald-500 transition-all group">
                <div className="flex items-center gap-2">
                  <img src={d.img} className="w-6 h-6 rounded-full object-cover border border-emerald-500" />
                  <span className="text-xs font-bold text-slate-700">{d.name}</span>
                </div>
                <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full font-black">
                  {truckOrders.filter(o => o.driver_name === d.name && o.status === 'approved').length} סופקו
                </span>
              </button>
            ))}
            <button onClick={() => navigateToChat(`מי הן 2 ההזמנות של שארק 30?`)} className="w-full flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 hover:border-emerald-500 transition-all">
               <span className="text-xs font-bold text-slate-700">שארק 30</span>
               <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full font-black">
                 {containerSites.filter(c => c.contractor_name === 'שארק 30').length} מכולות
               </span>
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-20 flex items-center justify-between px-8 bg-white/80 backdrop-blur-md border-b border-slate-200">
           <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="p-2 rounded-xl font-black text-xs border border-slate-200 outline-none" />
           <div className="font-mono font-black text-2xl text-emerald-600">{now.toLocaleTimeString('he-IL')}</div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
          <AnimatePresence mode="wait">
            {activeTab === 'live' && (
              <motion.div key="live" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {truckOrders.map(order => {
                  const timer = calculateOrderProgress(order.delivery_date, order.order_time);
                  return (
                    <div key={order.id} className="p-6 rounded-[2.5rem] bg-white border border-slate-100 shadow-xl relative overflow-hidden group">
                      <div className="flex justify-between items-start mb-4">
                        <span className="bg-slate-900 text-emerald-500 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest">ORDER</span>
                        <div className="flex items-center gap-1 text-slate-300"><Clock size={12}/> <span className="text-[10px] font-bold">{order.order_time}</span></div>
                      </div>
                      <h3 className="text-xl font-black text-slate-900 leading-tight mb-1">{order.client_info}</h3>
                      <p className="text-xs font-bold text-slate-400 mb-6 flex items-center gap-1"><MapPin size={12}/> {order.location}</p>
                      
                      {/* טיימר ופס התקדמות */}
                      <div className="space-y-3 mb-6">
                         <div className="flex justify-between items-end">
                            <span className={`text-2xl font-black font-mono ${timer.expired ? 'text-red-500' : 'text-slate-800'}`}>
                               {timer.expired ? 'בביצוע' : `${timer.h}:${String(timer.m).padStart(2,'0')}:${String(timer.s).padStart(2,'0')}`}
                            </span>
                            <span className="text-[9px] font-black text-slate-400 uppercase">זמן יעד לאספקה</span>
                         </div>
                         <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${timer.progress}%` }} className={`h-full ${timer.expired ? 'bg-red-500' : 'bg-emerald-500'}`} />
                         </div>
                      </div>

                      <div className="flex items-center gap-3 border-t border-slate-50 pt-4">
                        <img 
                          src={DRIVERS.find(d => d.name === order.driver_name)?.img || 'https://i.postimg.cc/mD8zQcby/rami.jpg'} 
                          className="w-10 h-10 rounded-xl object-cover border border-emerald-500" 
                        />
                        <span className="text-sm font-black text-slate-700">{order.driver_name}</span>
                        <div className="mr-auto opacity-10 group-hover:opacity-100 transition-all"><CheckCheck size={18} className="text-emerald-500 cursor-pointer"/></div>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}

            {activeTab === 'chat' && (
              <motion.div key="chat" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="h-full flex flex-col bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100">
                <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
                  <Bot size={20} className="text-emerald-600" />
                  <span className="font-black text-sm uppercase italic">AI Supervisor Assistant</span>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[85%] p-4 rounded-2xl text-sm font-bold shadow-sm ${m.role === 'user' ? 'bg-slate-100 text-slate-800' : 'bg-emerald-600 text-white'}`}>{m.content}</div>
                    </div>
                  ))}
                  {loading && <div className="text-[10px] font-black text-emerald-500 animate-pulse uppercase tracking-widest italic">המוח מנתח נתונים...</div>}
                </div>
                <form onSubmit={handleChatCommand} className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
                   <input value={input} onChange={e => setInput(e.target.value)} placeholder="הקלד פקודה..." className="flex-1 p-3 bg-white rounded-xl border border-slate-200 outline-none text-sm font-bold" />
                   <button type="submit" className="bg-emerald-600 text-white p-3 rounded-xl shadow-lg active:scale-95 transition-all"><Send size={18} className="rotate-180"/></button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
