'use client';
import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { supabase } from '../../lib/supabase';
import { 
  LayoutDashboard, MessageSquare, Send, Clock, MapPin, 
  Bot, Truck, Box, RefreshCcw, Trash2, 
  Timer, Sun, Moon, Calendar, User, X, Activity, ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// נתוני נהגים עם התמונות שסיפקת
const DRIVERS = [
  { name: 'חכמת', img: 'https://i.postimg.cc/d3S0NJJZ/Screenshot-20250623-200646-Facebook.jpg' },
  { name: 'עלי', img: 'https://i.postimg.cc/tCNbgXK3/Screenshot-20250623-200744-Tik-Tok.jpg' }
];

const TIME_SLOTS = Array.from({ length: 23 }, (_, i) => {
  const hour = Math.floor(i / 2) + 6;
  const min = i % 2 === 0 ? '00' : '30';
  return `${hour.toString().padStart(2, '0')}:${min}`;
});

export default function SabanUltimateControlCenter() {
  const [activeTab, setActiveTab] = useState<'live' | 'sidor' | 'containers' | 'chat'>('live');
  const [isDarkMode, setIsDarkMode] = useState(false); // ברירת מחדל בהיר נקי
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [truckOrders, setTruckOrders] = useState<any[]>([]);
  const [containerSites, setContainerSites] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(new Date());

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
    const t = setInterval(() => setNow(new Date()), 1000);
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
    
    const channel = supabase.channel('db_sync')
      .on('postgres_changes', { event: '*', schema: 'public' }, fetchData)
      .subscribe();
      
    return () => { clearInterval(t); channel.unsubscribe(); };
  }, [selectedDate]);

  const fetchData = async () => {
    const { data: o } = await supabase.from('orders').select('*').eq('delivery_date', selectedDate);
    const { data: c } = await supabase.from('container_management').select('*').eq('is_active', true);
    const { data: tr } = await supabase.from('transfers').select('*').eq('transfer_date', selectedDate);
    
    setTruckOrders(o || []);
    setContainerSites(c || []);
    setTransfers(tr || []);
  };

  const calculateTime = (target: string) => {
    const diff = new Date(target).getTime() - now.getTime();
    if (diff <= 0) return { expired: true };
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return { expired: false, h, m, s, urgent: diff < 3600000 };
  };

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const msg = input; setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setLoading(true);

    try {
      const res = await fetch('/api/ai-analyst', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: msg, sender_name: 'ראמי' })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      audioRef.current?.play().catch(() => {});
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  return (
    <div className={`flex h-screen w-full transition-all duration-700 font-sans overflow-hidden ${isDarkMode ? 'bg-[#050505] text-white' : 'bg-[#F0F2F5] text-slate-900'}`} dir="rtl">
      <Head><title>SABAN OS | Command Center</title></Head>

      {/* Sidebar - Desktop (Glassmorphism) */}
      <aside className={`hidden lg:flex w-80 flex-col transition-all border-l ${isDarkMode ? 'bg-black/40 border-white/5' : 'bg-white/70 border-slate-200'} backdrop-blur-2xl z-50`}>
        <div className="p-10 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            <Activity size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black italic tracking-tighter">SABAN <span className="text-emerald-600">OS</span></h1>
            <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">Management System</p>
          </div>
        </div>

        <nav className="flex-1 p-6 space-y-3">
          {[
            { id: 'live', label: 'משימות LIVE', icon: Timer },
            { id: 'sidor', label: 'סידור נהגים', icon: Truck },
            { id: 'containers', label: 'מכולות', icon: Box },
            { id: 'chat', label: 'AI Supervisor', icon: Bot },
          ].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`w-full p-5 rounded-3xl flex items-center gap-5 transition-all ${activeTab === item.id ? (isDarkMode ? 'bg-emerald-500 text-black font-black shadow-emerald-500/20' : 'bg-white text-emerald-600 font-black shadow-xl border border-slate-100') : 'text-slate-400 hover:bg-white/5'}`}>
              <item.icon size={22} /> <span className="text-sm font-bold">{item.label}</span>
            </button>
          ))}
        </nav>

        <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-10 flex items-center gap-4 text-slate-400 hover:text-emerald-500 transition-all uppercase text-[10px] font-black">
          {isDarkMode ? <Sun size={20}/> : <Moon size={20}/>} מצב {isDarkMode ? 'יום' : 'לילה'}
        </button>
      </aside>

      {/* Mobile Nav */}
      <nav className={`lg:hidden fixed bottom-0 left-0 right-0 h-20 z-[100] flex items-center justify-around border-t backdrop-blur-xl ${isDarkMode ? 'bg-black/80 border-white/5' : 'bg-white/80 border-slate-200'}`}>
        {[{ id: 'live', icon: Timer }, { id: 'sidor', icon: Truck }, { id: 'containers', icon: Box }, { id: 'chat', icon: Bot }].map(btn => (
          <button key={btn.id} onClick={() => setActiveTab(btn.id as any)} className={`p-4 transition-all ${activeTab === btn.id ? 'text-emerald-600' : 'text-slate-400'}`}>
            <btn.icon size={24} />
          </button>
        ))}
      </nav>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className={`h-24 shrink-0 flex items-center justify-between px-8 border-b ${isDarkMode ? 'bg-black/20 border-white/5' : 'bg-white/50 border-slate-200'} backdrop-blur-md`}>
          <div className="flex items-center gap-4">
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className={`p-3 rounded-2xl font-black text-xs outline-none shadow-sm ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'}`} />
          </div>
          <div className="font-mono font-black text-2xl lg:text-4xl text-emerald-600 italic tracking-tighter">
            {now.toLocaleTimeString('he-IL')}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 lg:p-12 pb-24 lg:pb-12">
          <AnimatePresence mode="wait">
            
            {activeTab === 'live' && (
              <motion.div key="live" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {[
                  ...truckOrders.map(t => ({ ...t, type: 'ORDER', title: t.client_info, sub: t.location, target: `${t.delivery_date}T${t.order_time}`, person: t.driver_name })),
                  ...containerSites.map(c => ({ ...c, type: 'CONTAINER', title: c.client_name, sub: c.delivery_address, target: `${c.start_date}T${c.order_time || '08:00'}`, person: c.contractor_name })),
                ].map(order => {
                  const t = calculateTime(order.target);
                  return (
                    <div key={order.id} className={`p-8 rounded-[3rem] border transition-all relative group shadow-lg ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-white border-slate-100'} ${t.urgent && !t.expired ? 'ring-2 ring-amber-500 animate-pulse' : ''}`}>
                      <div className="flex justify-between items-start mb-6">
                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest text-white ${order.type === 'CONTAINER' ? 'bg-blue-600' : 'bg-emerald-600'}`}>
                          {order.type}
                        </span>
                        <span className="text-[10px] font-black opacity-30 italic">#{order.id.slice(0,5)}</span>
                      </div>
                      <h3 className="text-3xl font-black mb-2 tracking-tighter leading-tight">{order.title}</h3>
                      <div className="flex items-center gap-2 text-slate-400 font-bold text-xs mb-10"><MapPin size={14}/> {order.sub}</div>
                      
                      <div className={`p-6 rounded-[2.5rem] flex items-center justify-between ${t.expired ? 'bg-slate-100 text-slate-400' : (t.urgent ? 'bg-amber-500 text-white' : 'bg-slate-900 text-emerald-400')}`}>
                        <div className="flex items-center gap-4">
                          <Clock size={24}/>
                          <span className="text-3xl font-black font-mono">
                            {!t.expired ? `${String(t.h).padStart(2,'0')}:${String(t.m).padStart(2,'0')}:${String(t.s).padStart(2,'0')}` : "בוצע"}
                          </span>
                        </div>
                      </div>

                      <div className="mt-8 flex items-center gap-4 border-t border-slate-100 pt-8">
                        <img src={DRIVERS.find(d => d.name === order.person)?.img || 'https://i.postimg.cc/T34X4BqB/default.jpg'} className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-500 shadow-md" />
                        <div>
                          <span className="text-[9px] font-black text-slate-400 uppercase">נהג / אחראי</span>
                          <p className="text-lg font-black">{order.person}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}

            {activeTab === 'sidor' && (
              <motion.div key="sidor" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12 max-w-6xl mx-auto">
                {DRIVERS.map(driver => (
                  <div key={driver.name} className="bg-white rounded-[3.5rem] shadow-xl overflow-hidden border border-slate-100">
                    <div className="p-8 bg-slate-900 text-white flex items-center gap-6">
                      <img src={driver.img} className="w-20 h-20 rounded-full border-4 border-emerald-500 object-cover" />
                      <h3 className="text-4xl font-black italic tracking-tighter">לוז: {driver.name}</h3>
                    </div>
                    <div className="p-6 grid grid-cols-1 gap-3">
                      {TIME_SLOTS.map(slot => {
                        const order = truckOrders.find(o => o.driver_name === driver.name && o.order_time === slot);
                        return (
                          <div key={slot} className="flex items-center gap-6 group">
                            <span className="text-xs font-black font-mono text-slate-300 w-12">{slot}</span>
                            <div className={`flex-1 p-5 rounded-3xl transition-all ${order ? 'bg-emerald-50 border-r-8 border-emerald-500 text-slate-900' : 'bg-slate-50 text-slate-300 italic'}`}>
                              {order ? <span className="font-black">{order.client_info} | {order.location}</span> : "פנוי לשיבוץ"}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === 'chat' && (
              <motion.div key="chat" className="flex flex-col h-[calc(100vh-200px)] max-w-4xl mx-auto glass-panel rounded-[3rem] overflow-hidden bg-white shadow-2xl">
                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[80%] p-5 rounded-[2rem] text-sm font-bold shadow-sm ${m.role === 'user' ? 'bg-slate-100 text-slate-800 rounded-tr-none' : 'bg-emerald-600 text-white rounded-tl-none'}`}>
                        {m.content}
                      </div>
                    </div>
                  ))}
                  {loading && <div className="text-[10px] font-black text-emerald-500 animate-pulse uppercase mr-4">המוח חושב...</div>}
                </div>
                <div className="p-6 bg-slate-50 border-t border-slate-100">
                  <form onSubmit={handleChat} className="flex gap-3">
                    <input value={input} onChange={e => setInput(e.target.value)} placeholder="הזמן הובלה/מכולה..." className="flex-1 bg-white border border-slate-200 p-4 rounded-2xl outline-none font-bold text-sm" />
                    <button type="submit" className="bg-slate-900 text-emerald-500 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"><Send size={20} className="rotate-180"/></button>
                  </form>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
