'use client';
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import AppLayout from '../../components/Layout'; // וודא שהנתיב ל-Layout נכון
import { supabase } from '../../lib/supabase';
import { 
  Clock, MapPin, Truck, Box, Activity, CheckCheck, Bot, AlertCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DRIVERS = [
  { name: 'חכמת', img: 'https://i.postimg.cc/d3S0NJJZ/Screenshot-20250623-200646-Facebook.jpg' },
  { name: 'עלי', img: 'https://i.postimg.cc/tCNbgXK3/Screenshot-20250623-200744-Tik-Tok.jpg' }
];

const RAMI_AVATAR = "https://raw.githubusercontent.com/Rami1125/sidor-ai/refs/heads/main/public/rami-avatar.jpg?stp=dst-jpg_s96x96_tt6&ccb=11-4&oh=01_Q5Aa4AG_JCByU59rXu4ybPiRgaD2riDMbb0ujm-XlzxUbmgPXA&oe=69D7EBEB&_nc_sid=5e03e0&_nc_cat=111";

export default function MasterDashboard() {
  const [mounted, setMounted] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    setMounted(true);
    fetchData();
    const t = setInterval(() => setNow(new Date()), 1000);

    const channel = supabase
      .channel('master_live_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchData)
      .subscribe();

    return () => {
      clearInterval(t);
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    const today = new Date().toLocaleDateString('en-CA');
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('delivery_date', today)
      .neq('status', 'deleted')
      .order('order_time', { ascending: true });

    setOrders(data ?? []);
  };

  const calculateTime = (dateStr: string, timeStr: string) => {
    if (!timeStr) return { expired: true };
    const target = new Date(`${dateStr.replace(/-/g, '/')} ${timeStr}`);
    const diff = target.getTime() - now.getTime();
    
    if (diff <= 0) return { expired: true };

    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);

    return { 
      expired: false, h, m, s, 
      urgent: diff < 3600000 
    };
  };

  if (!mounted) return null;

  return (
    <AppLayout>
      <div dir="rtl" className="p-6 w-full min-h-screen bg-[#0a0f18] text-white font-sans">
        <Head>
          <title>Master Dashboard | Saban OS</title>
        </Head>

        {/* Header - Master Style */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-ping" />
              <h1 className="text-4xl font-black italic tracking-tighter text-emerald-400 uppercase">Master Dashboard</h1>
            </div>
            <p className="text-slate-500 font-bold text-[10px] tracking-[0.3em] mt-2 uppercase">Real-time Operations Command</p>
          </div>

          <div className="bg-slate-900/80 backdrop-blur-xl px-6 py-4 rounded-[2rem] border border-white/5 shadow-2xl text-center">
            <p className="text-2xl font-black font-mono text-emerald-400">{now.toLocaleTimeString('he-IL')}</p>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{new Date().toLocaleDateString('he-IL')}</p>
          </div>
        </div>

        {/* Grid System */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {orders.length > 0 ? orders.map((order) => {
              const t = calculateTime(order.delivery_date, order.order_time);
              const driver = DRIVERS.find(d => d.name === order.driver_name);
              const driverImg = driver?.img || RAMI_AVATAR;

              return (
                <motion.div
                  key={order.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="group relative bg-slate-900/40 backdrop-blur-3xl rounded-[2.5rem] p-7 border border-white/10 hover:border-emerald-500/50 transition-all duration-500 shadow-2xl"
                >
                  {/* Neon Indicator */}
                  <div className={`absolute top-0 right-0 w-2 h-full rounded-l-full ${t.urgent && !t.expired ? 'bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.6)]' : 'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]'}`} />

                  <div className="flex justify-between items-start mb-6">
                    <div className="p-4 bg-white/5 rounded-3xl group-hover:bg-emerald-500/10 transition-colors">
                      {order.client_info?.includes('מכולה') ? <Box className="text-blue-400" size={28} /> : <Truck className="text-emerald-400" size={28} />}
                    </div>
                    <span className="text-[10px] font-black text-slate-600 font-mono tracking-widest">#{order.id.slice(0, 8)}</span>
                  </div>

                  <h3 className="text-2xl font-black mb-1 truncate tracking-tight">{order.client_info}</h3>
                  <div className="flex items-center gap-2 text-slate-400 text-sm mb-8 font-bold">
                    <MapPin size={16} className="text-emerald-500" /> {order.location}
                  </div>

                  {/* Countdown Timer */}
                  <div className={`p-5 rounded-[2rem] mb-8 flex items-center justify-between border ${t.urgent && !t.expired ? 'bg-red-500/10 border-red-500/30' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-500 uppercase mb-1">Time Remaining</span>
                      <div className={`text-3xl font-black font-mono tracking-tighter ${t.urgent && !t.expired ? 'text-red-400' : 'text-emerald-400'}`}>
                        {!t.expired ? `${String(t.h).padStart(2, '0')}:${String(t.m).padStart(2, '0')}:${String(t.s).padStart(2, '0')}` : "EXPIRED"}
                      </div>
                    </div>
                    <Clock size={32} className={t.urgent && !t.expired ? 'text-red-500/50' : 'text-emerald-500/30'} />
                  </div>

                  {/* Driver & Status */}
                  <div className="flex items-center gap-4 bg-white/5 p-4 rounded-3xl border border-white/5">
                    <img src={driverImg} alt={order.driver_name} className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-500/20" />
                    <div className="flex-1">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Driver</p>
                      <p className="text-lg font-black italic">{order.driver_name || "Unassigned"}</p>
                    </div>
                    <Activity size={20} className={t.expired ? 'text-slate-700' : 'text-emerald-500 animate-pulse'} />
                  </div>

                  {/* AI Inject Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="mt-8 w-full py-5 bg-emerald-500 text-black font-black rounded-[1.5rem] flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-all uppercase italic text-sm"
                  >
                    <Bot size={22} /> AI Inject Panel
                  </motion.button>
                </motion.div>
              );
            }) : (
              <div className="col-span-full py-40 text-center opacity-10">
                 <AlertCircle size={100} className="mx-auto mb-6" />
                 <h2 className="text-5xl font-black uppercase italic">No Active Tasks</h2>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </AppLayout>
  );
}
