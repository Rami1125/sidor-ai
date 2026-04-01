'use client';
import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import AppLayout from '../../components/Layout';
import { supabase } from '../../lib/supabase';
import { 
  Clock, MapPin, Truck, Box, Timer, Activity, 
  CheckCheck, AlertCircle, Send, Bot, Warehouse, 
  LayoutDashboard, MessageSquare, Bell, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DRIVERS = [
  { name: 'חכמת', img: 'https://i.postimg.cc/d3S0NJJZ/Screenshot-20250623-200646-Facebook.jpg' },
  { name: 'עלי', img: 'https://i.postimg.cc/tCNbgXK3/Screenshot-20250623-200744-Tik-Tok.jpg' }
];

export default function MasterCommandCenter() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'live' | 'lease' | 'chat'>('live');
  const [isMobile, setIsMobile] = useState(false);
  const [truckOrders, setTruckOrders] = useState<any[]>([]);
  const [containerSites, setContainerSites] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(new Date());

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setMounted(true);
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth < 1024 && (window as any).OneSignal) {
        (window as any).OneSignal.SlidingPermissionPrompt.push({force: true});
      }
    };
    checkDevice();
    fetchData();
    const t = setInterval(() => setNow(new Date()), 1000);
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
    
    const channel = supabase.channel('os_v3_core').on('postgres_changes', { event: '*', schema: 'public' }, fetchData).subscribe();
    return () => { clearInterval(t); channel.unsubscribe(); };
  }, []);

  const fetchData = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data: o } = await supabase.from('orders').select('*').eq('delivery_date', today);
    const { data: c } = await supabase.from('container_management').select('*').eq('is_active', true);
    setTruckOrders(o || []);
    setContainerSites(c || []);
  };

  const handleAction = async (forcedQuery?: string) => {
    const cmd = forcedQuery || input;
    if (!cmd.trim() || loading) return;
    
    audioRef.current?.play().catch(() => {});
    setInput('');
    setLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: cmd }]);

    try {
      const res = await fetch('/api/ai-supervisor-core', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: cmd, sender_name: 'ראמי' })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'ai', content: data.reply }]);
      fetchData();
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const calculateDays = (date: string) => {
    const diff = Math.ceil(Math.abs(now.getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
    return { days: diff, isUrgent: diff >= 9, progress: Math.min((diff / 10) * 100, 100) };
  };

  if (!mounted) return null;

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-64px)] bg-[#F8F9FA] overflow-hidden font-sans" dir="rtl">
        <Head><title>SABAN OS | Command Center</title></Head>

        {/* Sidebar - Desktop Only */}
        {!isMobile && (
          <aside className="w-80 bg-[#111B21] text-white flex flex-col p-6 z-50 shadow-2xl">
            <div className="flex items-center gap-3 mb-12 p-2">
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-black shadow-lg shadow-emerald-500/20"><Zap size={20}/></div>
              <span className="font-black italic text-xl tracking-tighter">SABAN OS <span className="text-[10px] block opacity-50 not-italic tracking-widest">v3.0 PRO</span></span>
            </div>
            
            <nav className="space-y-2 flex-1">
              {[
                { id: 'live', label: 'משימות LIVE', icon: LayoutDashboard },
                { id: 'lease', label: 'ניהול מכולות', icon: Box },
                { id: 'chat', label: 'AI Supervisor', icon: MessageSquare },
              ].map(item => (
                <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all ${activeTab === item.id ? 'bg-emerald-600 text-white shadow-lg' : 'hover:bg-white/5 text-slate-400'}`}>
                  <item.icon size={20} /> <span className="text-sm font-black">{item.label}</span>
                </button>
              ))}
            </nav>

            <div className="bg-white/5 rounded-3xl p-4 mt-auto">
               <p className="text-[10px] font-black text-slate-500 uppercase mb-4 tracking-widest text-center border-b border-white/5 pb-2">סיכום תפעולי</p>
               <div className="space-y-3">
                  {DRIVERS.map(d => (
                    <div key={d.name} onClick={() => {setActiveTab('chat'); handleAction(`למי סיפק ${d.name} היום?`);}} className="flex items-center justify-between cursor-pointer group">
                      <div className="flex items-center gap-2">
                        <img src={d.img} className="w-6 h-6 rounded-full object-cover border border-emerald-500" />
                        <span className="text-[11px] font-bold group-hover:text-emerald-500 transition-all">{d.name}</span>
                      </div>
                      <span className="text-[10px] font-black opacity-40">{truckOrders.filter(o => o.driver_name === d.name).length}</span>
                    </div>
                  ))}
               </div>
            </div>
          </aside>
        )}

        {/* Main View Area */}
        <main className="flex-1 relative flex flex-col overflow-hidden w-full">
          
          <div className="flex-1 overflow-y-auto p-4 lg:p-10 scrollbar-hide pb-32">
            <AnimatePresence mode="wait">

              {/* LIVE VIEW: ORDERS & PENDING CONTAINERS */}
              {activeTab === 'live' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-12 max-w-7xl mx-auto">
                  
                  {/* ORDERS SECTION */}
                  <section>
                    <div className="flex items-center justify-between mb-8">
                       <h2 className="text-2xl font-black italic tracking-tighter flex items-center gap-2"><Truck className="text-emerald-600" /> הזמנות פתוחות</h2>
                       <div className="text-2xl font-mono font-black text-emerald-600">{now.toLocaleTimeString('he-IL')}</div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {truckOrders.map(order => (
                        <div key={order.id} className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100 relative group overflow-hidden">
                          <span className="bg-slate-900 text-emerald-500 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest mb-4 inline-block">ORDER</span>
                          <h3 className="text-2xl font-black tracking-tighter mb-1">{order.client_info}</h3>
                          <p className="text-xs font-bold text-slate-400 mb-6 flex items-center gap-1"><MapPin size={12}/> {order.location}</p>
                          <div className="flex items-center gap-3 pt-4 border-t border-slate-50">
                             <img src={DRIVERS.find(d => d.name === order.driver_name)?.img} className="w-10 h-10 rounded-xl object-cover border-2 border-emerald-500" />
                             <div className="flex flex-col">
                                <span className="text-[9px] font-black text-slate-400 uppercase">נהג מבצע</span>
                                <span className="text-sm font-black">{order.driver_name}</span>
                             </div>
                             <div className="mr-auto font-mono font-black text-emerald-600 italic text-xl">{order.order_time}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* PENDING CONTAINERS */}
                  <section className="pt-12 border-t border-slate-200">
                    <h2 className="text-xl font-black italic tracking-tighter flex items-center gap-2 mb-8 text-slate-400"><Box /> מכולות שטרם הוצבו</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 opacity-60">
                      {containerSites.filter(c => c.status === 'pending').map(site => (
                        <div key={site.id} className="bg-slate-100 p-6 rounded-[2.5rem] border border-dashed border-slate-300">
                          <h3 className="text-lg font-black text-slate-600">{site.client_name}</h3>
                          <div className="flex items-center gap-2 mt-4 text-[10px] font-black uppercase text-slate-400">
                             <Warehouse size={14}/> {site.contractor_name} | {site.order_time}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </motion.div>
              )}

              {/* LEASE MANAGEMENT VIEW */}
              {activeTab === 'lease' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 max-w-7xl mx-auto">
                  {containerSites.map(site => {
                    const l = calculateDays(site.start_date);
                    return (
                      <div key={site.id} className={`p-8 rounded-[3.5rem] bg-white shadow-2xl relative border-2 transition-all ${l.isUrgent ? 'border-red-500 animate-pulse' : 'border-slate-50'}`}>
                        <div className="flex justify-between items-start mb-6">
                           <span className={`px-4 py-1.5 rounded-full text-[9px] font-black text-white ${l.isUrgent ? 'bg-red-500' : 'bg-slate-900'}`}>{site.action_type || 'SITE'}</span>
                           {l.isUrgent && <AlertCircle className="text-red-500" />}
                        </div>
                        <h3 className="text-2xl font-black mb-2">{site.client_name}</h3>
                        <p className="text-xs font-bold text-slate-400 mb-8">{site.delivery_address}</p>
                        <div className="space-y-4">
                           <div className="flex justify-between text-xl font-mono font-black italic">
                              <span className={l.isUrgent ? 'text-red-500' : 'text-emerald-600'}>{l.days} / 10 ימים</span>
                           </div>
                           <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                              <motion.div initial={{ width: 0 }} animate={{ width: `${l.progress}%` }} className={`h-full ${l.isUrgent ? 'bg-red-500' : 'bg-emerald-500'}`} />
                           </div>
                        </div>
                        <div className="mt-8 flex items-center justify-between text-[11px] font-black text-slate-700 uppercase">
                           <div className="flex items-center gap-2"><Activity size={14}/> {site.contractor_name}</div>
                           <span className="opacity-30">{site.start_date}</span>
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              )}

              {/* AI SUPERVISOR CHAT (EDGE TO EDGE) */}
              {activeTab === 'chat' && (
                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="h-full flex flex-col bg-white rounded-[2rem] lg:rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 max-w-5xl mx-auto">
                   <div className="p-6 bg-[#111B21] text-emerald-500 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <Bot size={24} className="animate-pulse" />
                         <span className="font-black text-sm uppercase tracking-widest italic">SABAN AI Supervisor</span>
                      </div>
                      <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-[0_0_10px_#10b981]" />
                   </div>
                   <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
                      {messages.map((m, i) => (
                        <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                          <div className={`max-w-[85%] p-5 rounded-[2rem] text-sm font-bold shadow-sm ${m.role === 'user' ? 'bg-slate-100 text-slate-800 rounded-tr-none' : 'bg-emerald-600 text-white rounded-tl-none'}`}>{m.content}</div>
                        </div>
                      ))}
                      {loading && <div className="text-[10px] font-black text-emerald-500 animate-pulse uppercase italic tracking-[0.3em]">המוח מנתח ומזריק...</div>}
                   </div>
                   <form onSubmit={(e) => {e.preventDefault(); handleAction();}} className="p-6 bg-slate-50 border-t flex gap-3">
                      <input value={input} onChange={e => setInput(e.target.value)} placeholder="כתוב פקודה למוח (מחיקה/הזרקה/תיוג)..." className="flex-1 p-5 bg-white rounded-2xl border border-slate-200 outline-none text-sm font-bold shadow-inner" />
                      <button type="submit" className="bg-emerald-600 text-white w-16 h-16 rounded-2xl shadow-xl flex items-center justify-center active:scale-90 transition-all"><Send size={24} className="rotate-180"/></button>
                   </form>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* MOBILE NAVIGATION BAR (FLOATING) */}
          {isMobile && (
            <div className="fixed bottom-6 left-6 right-6 h-20 bg-[#111B21]/90 backdrop-blur-xl rounded-[2.5rem] border border-white/10 flex items-center justify-around z-[100] shadow-2xl">
               {[
                 { id: 'live', icon: LayoutDashboard },
                 { id: 'lease', icon: Box },
                 { id: 'chat', icon: MessageSquare },
               ].map(tab => (
                 <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`p-4 transition-all ${activeTab === tab.id ? 'text-emerald-500 scale-125' : 'text-slate-500'}`}>
                    <tab.icon size={26} />
                 </button>
               ))}
            </div>
          )}
        </main>
      </div>
    </AppLayout>
  );
}
