'use client';
import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { supabase } from '../../lib/supabase';
import { 
  LayoutDashboard, Send, Clock, MapPin, Bot, Truck, Box, 
  Trash2, Timer, Sun, Moon, Activity, CheckCheck, AlertTriangle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DRIVERS = [
  { name: 'חכמת', img: 'https://i.postimg.cc/d3S0NJJZ/Screenshot-20250623-200646-Facebook.jpg' },
  { name: 'עלי', img: 'https://i.postimg.cc/tCNbgXK3/Screenshot-20250623-200744-Tik-Tok.jpg' }
];

export default function SabanUltimateControlCenter() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'live' | 'containers' | 'chat'>('live');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [truckOrders, setTruckOrders] = useState<any[]>([]);
  const [containerSites, setContainerSites] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    setMounted(true);
    fetchData();
    const t = setInterval(() => setNow(new Date()), 1000);
    const channel = supabase.channel('db_sync').on('postgres_changes', { event: '*', schema: 'public' }, fetchData).subscribe();
    return () => { clearInterval(t); channel.unsubscribe(); };
  }, [selectedDate]);

  const fetchData = async () => {
    const { data: o } = await supabase.from('orders').select('*').eq('delivery_date', selectedDate).neq('status', 'history');
    const { data: c } = await supabase.from('container_management').select('*').eq('is_active', true);
    setTruckOrders(o || []);
    setContainerSites(c || []);
  };

  const calculateDays = (startDate: string) => {
    const start = new Date(startDate);
    const diffTime = Math.abs(now.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleChatCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    
    const cmd = input;
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
      setMessages(prev => [...prev, { role: 'ai', content: data.answer }]);
      fetchData(); // רענון נתונים לאחר פקודה (הזרקה/מחיקה/סגירה)
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', content: 'בוס, תקלה בחיבור למוח.' }]);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  // דוח מספרי פינתי
  const stats = {
    total: containerSites.length,
    shark: containerSites.filter(s => s.contractor_name === 'שארק 30').length,
    karadi: containerSites.filter(s => s.contractor_name === 'כראדי 32').length,
    sharon: containerSites.filter(s => s.contractor_name === 'שי שרון 40').length,
  };

  return (
    <div className={`flex h-screen w-full transition-all duration-700 font-sans overflow-hidden ${isDarkMode ? 'bg-[#050505] text-white' : 'bg-[#F0F2F5] text-slate-900'}`} dir="rtl">
      <Head>
        <title>SABAN OS | Command Center</title>
        <meta name="mobile-web-app-capable" content="yes" />
      </Head>

      {/* Sidebar */}
      <aside className={`hidden lg:flex w-80 flex-col transition-all border-l ${isDarkMode ? 'bg-black/40 border-white/5' : 'bg-white/70 border-slate-200'} backdrop-blur-2xl z-50`}>
        <div className="p-10 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-black shadow-lg"><Activity size={24} /></div>
          <div><h1 className="text-2xl font-black italic tracking-tighter text-emerald-600">SABAN OS</h1></div>
        </div>
        <nav className="flex-1 p-6 space-y-3">
          {[
            { id: 'live', label: 'משימות LIVE', icon: Timer },
            { id: 'containers', label: 'ניהול מכולות', icon: Box },
            { id: 'chat', label: 'AI Supervisor', icon: Bot },
          ].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`w-full p-5 rounded-3xl flex items-center gap-5 transition-all ${activeTab === item.id ? 'bg-emerald-600 text-black font-black shadow-xl' : 'text-slate-400 hover:bg-white/5'}`}>
              <item.icon size={22} /> <span className="text-sm font-bold">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Stats Corner */}
        <div className="absolute top-28 left-8 z-40 hidden xl:flex flex-col gap-2 scale-90 origin-top-left">
          <div className="bg-white/80 backdrop-blur-md p-4 rounded-3xl border border-slate-200 shadow-xl">
            <p className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">דוח מכולות בשטח</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col"><span className="text-2xl font-black text-emerald-600">{stats.total}</span><span className="text-[9px] font-bold">סה"כ</span></div>
              <div className="flex flex-col"><span className="text-lg font-black text-slate-700">{stats.shark}</span><span className="text-[9px] font-bold">שארק</span></div>
              <div className="flex flex-col"><span className="text-lg font-black text-slate-700">{stats.karadi}</span><span className="text-[9px] font-bold">כראדי</span></div>
              <div className="flex flex-col"><span className="text-lg font-black text-slate-700">{stats.sharon}</span><span className="text-[9px] font-bold">ש.שרון</span></div>
            </div>
          </div>
        </div>

        <header className="h-24 shrink-0 flex items-center justify-between px-8 border-b bg-white/50 backdrop-blur-md border-slate-200">
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="p-3 rounded-2xl font-black text-xs border border-slate-200 outline-none shadow-sm" />
          <div className="font-mono font-black text-3xl text-emerald-600 italic">{now.toLocaleTimeString('he-IL')}</div>
        </header>

        <div className="flex-1 overflow-y-auto p-12 pb-32 scrollbar-hide">
          <AnimatePresence mode="wait">
            
            {/* מכולות - פס התקדמות ימים */}
            {activeTab === 'containers' && (
              <motion.div key="containers" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {containerSites.map(site => {
                  const days = calculateDays(site.start_date);
                  const isUrgent = days >= 9;
                  const progress = Math.min((days / 10) * 100, 100);

                  return (
                    <motion.div 
                      key={site.id} 
                      animate={isUrgent ? { scale: [1, 1.02, 1], borderColor: ['#f1f5f9', '#ef4444', '#f1f5f9'] } : {}} 
                      transition={isUrgent ? { repeat: Infinity, duration: 2 } : {}}
                      className={`p-8 rounded-[3.5rem] bg-white shadow-2xl relative border-2 ${isUrgent ? 'border-red-500' : 'border-slate-100'}`}
                    >
                      <div className="flex justify-between items-start mb-6">
                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest text-white ${isUrgent ? 'bg-red-500' : 'bg-emerald-600'}`}>
                          {site.action_type || 'מכולה'}
                        </span>
                        {isUrgent && <AlertTriangle size={20} className="text-red-500 animate-pulse" />}
                      </div>
                      <h3 className="text-2xl font-black text-slate-900 leading-tight mb-2">{site.client_name}</h3>
                      <div className="flex items-center gap-2 text-slate-400 font-bold text-xs mb-8"><MapPin size={14}/> {site.delivery_address}</div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                          <span>ימי הצבה: {days}/10</span>
                          <span>{10 - days} ימים ליעד</span>
                        </div>
                        <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                          <motion.div 
                            initial={{ width: 0 }} animate={{ width: `${progress}%` }} 
                            className={`h-full rounded-full ${isUrgent ? 'bg-red-500' : 'bg-emerald-500'}`} 
                          />
                        </div>
                      </div>

                      <div className="mt-8 flex items-center gap-4 border-t border-slate-100 pt-6">
                        <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-emerald-500 shadow-lg"><Truck size={20}/></div>
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-slate-400 uppercase">קבלן מבצע</span>
                          <span className="text-base font-black">{site.contractor_name}</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}

            {/* חדר צ'אט מקצועי */}
            {activeTab === 'chat' && (
              <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full max-w-5xl mx-auto glass-panel rounded-[3rem] bg-white/80 backdrop-blur-xl shadow-2xl border border-white overflow-hidden">
                <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[80%] p-6 rounded-[2.5rem] text-sm font-bold shadow-sm ${m.role === 'user' ? 'bg-slate-100 text-slate-800 rounded-tr-none' : 'bg-emerald-600 text-white rounded-tl-none'}`}>
                        {m.content}
                      </div>
                    </div>
                  ))}
                  {loading && <div className="text-[10px] font-black text-emerald-500 animate-pulse uppercase tracking-[0.5em] italic">המוח מעבד פקודה...</div>}
                </div>
                <div className="p-8 bg-slate-50/50 border-t border-slate-100">
                  <form onSubmit={handleChatCommand} className="flex gap-3 relative">
                    <input 
                      value={input} onChange={e => setInput(e.target.value)}
                      placeholder="מחיקת הזמנה 123 | סגירה להיסטוריה | הובלה חדשה..." 
                      className="flex-1 bg-white border border-slate-200 p-5 rounded-3xl outline-none font-bold text-sm shadow-inner" 
                    />
                    <button type="submit" className="bg-emerald-600 text-white w-16 h-16 rounded-3xl flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all">
                      <Send size={24} className="rotate-180"/>
                    </button>
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
