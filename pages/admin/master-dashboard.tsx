'use client';
import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import AppLayout from '../../components/Layout';
import { supabase } from '../../lib/supabase';
import { 
  Clock, MapPin, Truck, Box, Timer, Activity, 
  CheckCheck, AlertCircle, Warehouse, Send, Bot, ArrowRightLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DRIVERS = [
  { name: 'חכמת', img: 'https://i.postimg.cc/d3S0NJJZ/Screenshot-20250623-200646-Facebook.jpg' },
  { name: 'עלי', img: 'https://i.postimg.cc/tCNbgXK3/Screenshot-20250623-200744-Tik-Tok.jpg' }
];

export default function MasterDashboard() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'live' | 'containers' | 'chat'>('live');
  const [truckOrders, setTruckOrders] = useState<any[]>([]);
  const [containerSites, setContainerSites] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
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
    
    const channel = supabase.channel('master_sync_v3')
      .on('postgres_changes', { event: '*', schema: 'public' }, fetchData)
      .subscribe();
      
    return () => { clearInterval(t); channel.unsubscribe(); };
  }, []);

  const fetchData = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data: o } = await supabase.from('orders').select('*').eq('delivery_date', today);
    const { data: c } = await supabase.from('container_management').select('*').eq('is_active', true);
    const { data: tr } = await supabase.from('transfers').select('*').eq('transfer_date', today);
    setTruckOrders(o || []);
    setContainerSites(c || []);
    setTransfers(tr || []);
  };

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

  const calculateProgress = (date: string, time: string, isContainer = false) => {
    const target = new Date(`${date}T${time || '08:00'}`);
    const diff = target.getTime() - now.getTime();
    const daysDiff = Math.ceil(Math.abs(diff) / (1000 * 60 * 60 * 24));
    
    if (isContainer) return { days: daysDiff, isUrgent: daysDiff >= 9 };
    
    const h = Math.floor(Math.abs(diff) / 3600000);
    const m = Math.floor((Math.abs(diff) % 3600000) / 60000);
    const s = Math.floor((Math.abs(diff) % 60000) / 1000);
    return { h, m, s, expired: diff <= 0, progress: Math.min(Math.max(100 - (diff / 36000000) * 100, 0), 100) };
  };

  if (!mounted) return null;

  return (
    <AppLayout>
      <div className="flex h-full bg-[#F0F2F5] overflow-hidden" dir="rtl">
        <Head><title>SABAN OS | MASTER</title></Head>

        {/* דוח צדדי לחיץ - משודרג עם נהגים ומחסני מכולות */}
        <aside className="hidden xl:flex w-80 flex-col bg-white border-l border-slate-200 shadow-xl overflow-y-auto">
          <div className="p-8 pb-4 font-black text-[10px] text-slate-400 uppercase tracking-[0.2em]">סיכום תפעולי (לחיץ)</div>
          <div className="p-4 space-y-4">
            
            {/* נהגים חכמת ועלי */}
            <div className="space-y-2">
              <p className="text-[10px] font-black text-slate-400 mb-2 mr-2">נהגים</p>
              {DRIVERS.map(d => (
                <button key={d.name} onClick={() => navigateToChat(`למי סיפק ${d.name} היום?`)} className="w-full flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100 hover:border-emerald-500 transition-all group shadow-sm">
                  <div className="flex items-center gap-3">
                    <img src={d.img} className="w-8 h-8 rounded-full object-cover border-2 border-emerald-500" />
                    <span className="text-xs font-black">{d.name}</span>
                  </div>
                  <span className="bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black">
                    {truckOrders.filter(o => o.driver_name === d.name).length}
                  </span>
                </button>
              ))}
            </div>

            {/* קבלני מכולות */}
            <div className="space-y-2">
              <p className="text-[10px] font-black text-slate-400 mb-2 mr-2">מחסן מכולות</p>
              {['שארק 30', 'כראדי 32', 'שי שרון 40'].map((con, idx) => (
                <button key={con} onClick={() => navigateToChat(`מי הן המכולות של ${con} בשטח?`)} className="w-full flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-100 hover:border-blue-500 transition-all shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black ${idx === 0 ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>CM</div>
                    <span className="text-xs font-black">{con}</span>
                  </div>
                  <span className="bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded-full font-black">
                    {containerSites.filter(c => c.contractor_name === con).length}
                  </span>
                </button>
              ))}
            </div>

            {/* העברות */}
            <button onClick={() => navigateToChat(`מה מצב העברות בין סניפים היום?`)} className="w-full flex items-center justify-between p-4 bg-slate-900 text-white rounded-[2rem] hover:bg-emerald-600 transition-all shadow-xl mt-4">
                <div className="flex items-center gap-3 font-black italic"><ArrowRightLeft size={16}/><span className="text-xs">העברות סניפים</span></div>
                <span className="text-[10px] font-black opacity-60">{transfers.length}</span>
            </button>
          </div>
        </aside>

        {/* תוכן ראשי */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-10 scrollbar-hide pb-32">
          <AnimatePresence mode="wait">
            {activeTab === 'live' && (
              <div className="space-y-12">
                
                {/* סקציה 1: הזמנות חומרי בניין */}
                <section>
                  <div className="flex items-center gap-3 mb-6">
                    <Truck className="text-emerald-600" size={24} />
                    <h2 className="text-2xl font-black italic tracking-tighter">הזמנות פתוחות | <span className="text-slate-400 font-medium text-lg">LIVE</span></h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {truckOrders.map(order => {
                      const timer = calculateProgress(order.delivery_date, order.order_time);
                      return (
                        <div key={order.id} className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100 relative overflow-hidden group">
                          <div className="flex justify-between mb-4">
                            <span className="bg-slate-900 text-emerald-500 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest">ORDER</span>
                            <span className="text-xs font-mono font-black text-slate-300">#{order.id.slice(0,5)}</span>
                          </div>
                          <h3 className="text-2xl font-black mb-1 tracking-tighter leading-none">{order.client_info}</h3>
                          <p className="text-xs font-bold text-slate-400 mb-6 flex items-center gap-1"><MapPin size={12}/> {order.location}</p>
                          
                          <div className="space-y-3 mb-6">
                             <div className="flex justify-between items-end font-black">
                                <span className={`text-3xl font-mono ${timer.expired ? 'text-red-500 animate-pulse' : 'text-slate-800'}`}>
                                   {timer.expired ? 'בביצוע' : `${timer.h}:${String(timer.m).padStart(2,'0')}:${String(timer.s).padStart(2,'0')}`}
                                </span>
                                <span className="text-[10px] text-slate-400 uppercase tracking-widest">יעד: {order.order_time}</span>
                             </div>
                             <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                <motion.div initial={{ width: 0 }} animate={{ width: `${timer.progress}%` }} className={`h-full ${timer.expired ? 'bg-red-500' : 'bg-emerald-500'}`} />
                             </div>
                          </div>

                          <div className="mt-4 flex items-center gap-3 border-t border-slate-50 pt-4">
                            <img src={DRIVERS.find(d => d.name === order.driver_name)?.img || 'https://i.postimg.cc/mD8zQcby/rami.jpg'} className="w-12 h-12 rounded-xl object-cover border-2 border-emerald-500 shadow-sm" />
                            <span className="text-base font-black">{order.driver_name}</span>
                            <div className="mr-auto text-emerald-500 opacity-20 group-hover:opacity-100"><CheckCheck size={20}/></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* סקציה 2: מכולות פתוחות */}
                <section>
                  <div className="flex items-center gap-3 mb-6 border-t border-slate-200 pt-12">
                    <Box className="text-blue-600" size={24} />
                    <h2 className="text-2xl font-black italic tracking-tighter">מכולות בשטח | <span className="text-slate-400 font-medium text-lg">10 ימים</span></h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {containerSites.map(site => {
                      const days = calculateProgress(site.start_date, '08:00', true);
                      return (
                        <div key={site.id} className={`bg-white p-6 rounded-[2.5rem] shadow-xl border-2 transition-all ${days.isUrgent ? 'border-red-500 animate-pulse' : 'border-slate-50'}`}>
                          <div className="flex justify-between mb-4">
                            <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase text-white ${days.isUrgent ? 'bg-red-500' : 'bg-blue-600'}`}>
                              {site.action_type || 'מכולה'}
                            </span>
                          </div>
                          <h3 className="text-2xl font-black mb-1 tracking-tighter leading-none">{site.client_name}</h3>
                          <p className="text-xs font-bold text-slate-400 mb-6 flex items-center gap-1"><MapPin size={12}/> {site.delivery_address}</p>
                          
                          <div className="space-y-3 mb-6">
                             <div className="flex justify-between items-end font-black">
                                <span className={`text-xl font-mono ${days.isUrgent ? 'text-red-500' : 'text-slate-800'}`}>{days.days} / 10 ימים</span>
                                <span className="text-[10px] text-slate-400 uppercase tracking-widest">{days.isUrgent ? 'נא לפנות' : 'זמן בשטח'}</span>
                             </div>
                             <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                                <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min((days.days/10)*100, 100)}%` }} className={`h-full ${days.isUrgent ? 'bg-red-500' : 'bg-emerald-500'}`} />
                             </div>
                          </div>
                          <div className="text-[11px] font-black text-slate-700 uppercase flex items-center gap-2">
                            <Warehouse size={14} className="text-slate-400" /> {site.contractor_name}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>
            )}

            {/* חדר צ'אט (מנוהל מהדוח) */}
            {activeTab === 'chat' && (
              <motion.div key="chat" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="h-full flex flex-col bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 max-w-5xl mx-auto">
                <div className="p-5 bg-slate-900 text-emerald-500 border-b border-white/5 flex items-center gap-3">
                  <Bot size={22} className="animate-pulse" />
                  <span className="font-black text-sm uppercase tracking-widest italic">SABAN OS AI Supervisor</span>
                </div>
                <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[85%] p-5 rounded-[2.2rem] text-sm font-bold shadow-sm ${m.role === 'user' ? 'bg-slate-100 text-slate-800 rounded-tr-none' : 'bg-emerald-600 text-white rounded-tl-none'}`}>{m.content}</div>
                    </div>
                  ))}
                  {loading && <div className="text-[10px] font-black text-emerald-500 animate-pulse uppercase tracking-widest italic">המוח מנתח...</div>}
                </div>
                <form onSubmit={handleChatCommand} className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                   <input value={input} onChange={e => setInput(e.target.value)} placeholder="הקלד פקודה למוח..." className="flex-1 p-4 bg-white rounded-2xl border border-slate-200 outline-none text-sm font-bold shadow-inner" />
                   <button type="submit" className="bg-emerald-600 text-white w-14 h-14 rounded-2xl shadow-xl active:scale-90 transition-all flex items-center justify-center"><Send size={20} className="rotate-180"/></button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </AppLayout>
  );
}
