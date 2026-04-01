'use client';

import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { supabase } from '@/lib/supabase';
import { 
  LayoutDashboard, Send, Clock, MapPin, Bot, Truck, Box, 
  Timer, Activity, CheckCheck, AlertCircle, ArrowRightLeft, Warehouse,
  RefreshCcw, Trash2, Navigation
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DRIVERS = [
  { name: 'חכמת', img: 'https://i.postimg.cc/d3S0NJJZ/Screenshot-20250623-200646-Facebook.jpg' },
  { name: 'עלי', img: 'https://i.postimg.cc/tCNbgXK3/Screenshot-20250623-200744-Tik-Tok.jpg' }
];

export default function SabanUltimateControlCenter() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'live' | 'containers' | 'chat'>('live'); // ברירת מחדל ל-LIVE
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
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
    if (!supabase) return;

    fetchData();
    const t = setInterval(() => setNow(new Date()), 1000);
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
    
    const channel = supabase.channel('db_sync')
      .on('postgres_changes', { event: '*', schema: 'public' }, fetchData)
      .subscribe();

    return () => { 
      clearInterval(t); 
      if (channel) channel.unsubscribe(); 
    };
  }, [selectedDate]);

  const fetchData = async () => {
    if (!supabase) return;
    try {
      const { data: o } = await supabase.from('orders').select('*').eq('delivery_date', selectedDate).order('created_at', { ascending: false });
      const { data: c } = await supabase.from('container_management').select('*').eq('is_active', true);
      const { data: tr } = await supabase.from('transfers').select('*').eq('transfer_date', selectedDate);
      setTruckOrders(o || []);
      setContainerSites(c || []);
      setTransfers(tr || []);
    } catch (err) {
      console.error("Fetch Error:", err);
    }
  };

  const calculateCountdown = (orderTime: string) => {
    const target = new Date(orderTime).getTime() + (3 * 60 * 60 * 1000); // יעד של 3 שעות מהזמנה
    const diff = target - now.getTime();
    if (diff <= 0) return "זמן עבר";
    const h = Math.floor(diff / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);
    return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleChatCommand = async (e: React.FormEvent | null, forcedQuery?: string) => {
    if (e) e.preventDefault();
    const cmd = forcedQuery || input;
    if (!cmd.trim() || loading) return;
    
    setInput('');
    setLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: cmd }]);

    try {
      const res = await fetch('/api/gemini', {
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

  if (!mounted) return null;

  return (
    <div className="flex h-screen w-full bg-[#F0F2F5] text-slate-900 font-sans overflow-hidden" dir="rtl">
      <Head><title>SABAN OS | Control Center</title></Head>

      <aside className="hidden lg:flex w-80 flex-col bg-white border-l border-slate-200 z-50 shadow-2xl">
        <div className="p-8 flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-black shadow-lg"><Activity size={20} /></div>
          <h1 className="text-xl font-black italic tracking-tighter">SABAN OS</h1>
        </div>

        <nav className="flex-1 p-6 space-y-2">
          {[
            { id: 'live', label: 'הזמנות LIVE', icon: Timer }, 
            { id: 'containers', label: 'מכולות', icon: Box }, 
            { id: 'chat', label: 'AI Supervisor', icon: Bot }
          ].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all ${activeTab === item.id ? 'bg-emerald-600 text-white font-black shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>
              <item.icon size={20} /> <span className="text-sm font-bold">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-6 bg-slate-50 border-t border-slate-100 space-y-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">מחסן מכולות וניהול</p>
          <div className="space-y-2">
            {[
              { name: 'שארק 30', count: containerSites.filter(c => c.contractor_name === 'שארק 30').length, color: 'bg-emerald-100 text-emerald-700' },
              { name: 'כראדי 32', count: containerSites.filter(c => c.contractor_name === 'כראדי 32').length, color: 'bg-blue-100 text-blue-700' }
            ].map(con => (
              <div key={con.name} className="w-full flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200">
                <div className="flex items-center gap-2"><Warehouse size={14} className="text-slate-400"/><span className="text-xs font-bold">{con.name}</span></div>
                <span className={`${con.color} text-[10px] px-2 py-0.5 rounded-full font-black`}>{con.count} מכולות</span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-20 flex items-center justify-between px-8 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm z-10">
           <div className="flex items-center gap-3">
              <Timer size={24} className="text-emerald-600" />
              <h2 className="text-xl font-black italic uppercase tracking-tighter">מרכז שליטה LIVE <span className="text-slate-400">/ SABAN OS</span></h2>
           </div>
           <div className="font-mono font-black text-2xl text-emerald-600 tracking-tighter">{now.toLocaleTimeString('he-IL')}</div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <AnimatePresence mode="wait">
            
            {/* לשונית הזמנות LIVE - כרטיסים חכמים עם טיימר ונהגים */}
            {activeTab === 'live' && (
              <motion.div key="live" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {truckOrders.map(order => {
                  const driver = DRIVERS.find(d => d.name === order.driver_name) || DRIVERS[0];
                  const countdown = calculateCountdown(order.created_at);
                  const isLate = countdown === "זמן עבר";

                  return (
                    <motion.div key={order.id} layout className="bg-white rounded-[2.5rem] border border-slate-100 p-6 shadow-xl relative overflow-hidden group hover:shadow-2xl transition-all">
                      <div className="flex justify-between items-start mb-6">
                        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${isLate ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-emerald-100 text-emerald-600'}`}>
                          {isLate ? 'חריגת זמן' : 'בביצוע'}
                        </div>
                        <div className="text-2xl font-black font-mono text-slate-800 tracking-tighter bg-slate-50 px-3 py-1 rounded-2xl border border-slate-100">
                          {countdown}
                        </div>
                      </div>

                      <div className="space-y-1 mb-6">
                        <h3 className="text-2xl font-black text-slate-900 leading-none">{order.customer_name}</h3>
                        <p className="text-sm font-bold text-slate-400 flex items-center gap-1 italic"><MapPin size={14} className="text-blue-500" /> {order.delivery_address}</p>
                      </div>

                      <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                             <img src={driver.img} alt={driver.name} className="w-14 h-14 rounded-2xl object-cover shadow-lg border-2 border-white ring-2 ring-slate-100" />
                             <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">נהג מבצע</p>
                            <p className="text-lg font-black text-slate-800 tracking-tight">{driver.name}</p>
                          </div>
                        </div>
                        <button className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center hover:bg-emerald-600 transition-all shadow-lg">
                           <Navigation size={20} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}

            {/* לשונית מכולות - כרטיסי מכולה כפי שהיה */}
            {activeTab === 'containers' && (
              <motion.div key="containers" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {containerSites.map(site => (
                  <div key={site.id} className="p-6 rounded-[2.5rem] bg-white border border-slate-100 shadow-xl relative group">
                    <h3 className="text-xl font-black mb-1">{site.client_name}</h3>
                    <p className="text-xs font-bold text-slate-400 flex items-center gap-1"><MapPin size={12} className="text-emerald-500"/> {site.delivery_address}</p>
                    <div className="mt-4 p-4 bg-slate-50 rounded-2xl">
                       <span className="text-[10px] font-black text-slate-400 uppercase">קבלן: {site.contractor_name}</span>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
      `}</style>
    </div>
  );
}
