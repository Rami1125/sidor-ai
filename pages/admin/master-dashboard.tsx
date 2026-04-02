'use client';
import React, { useState, useEffect } from 'react';
import AppLayout from '../../components/Layout';
import { supabase } from '../../lib/supabase';
import { 
  Clock, MapPin, Truck, Box, Activity, CheckCheck, Bot, AlertCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DRIVERS = [
  { name: 'חכמת', img: 'https://i.postimg.cc/d3S0NJJZ/Screenshot-20250623-200646-Facebook.jpg' },
  { name: 'עלי', img: 'https://i.postimg.cc/tCNbgXK3/Screenshot-20250623-200744-Tik-Tok.jpg' }
];

const RAMI_AVATAR = "https://media-mrs2-2.cdn.whatsapp.net/v/t61.24694-24/620186722_866557896271587_5747987865837500471_n.jpg?stp=dst-jpg_s96x96_tt6&ccb=11-4&oh=01_Q5Aa4AG_JCByU59rXu4ybPiRgaD2riDMbb0ujm-XlzxUbmgPXA&oe=69D7EBEB&_nc_sid=5e03e0&_nc_cat=111";

export default function SabanDashboard() {
  const [mounted, setMounted] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    setMounted(true);
    fetchData();
    const t = setInterval(() => setNow(new Date()), 1000);

    const channel = supabase
      .channel('dashboard_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchData)
      .subscribe();

    return () => {
      clearInterval(t);
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    const today = new Date().toLocaleDateString('en-CA'); // מבטיח פורמט YYYY-MM-DD
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
      expired: false, 
      h, m, s, 
      urgent: diff < 3600000 // פחות משעה נהיה אדום
    };
  };

  if (!mounted) return null;

  return (
    <AppLayout>
      <div dir="rtl" className="p-6 w-full min-h-screen bg-[#0a0f18] text-white">
        
        {/* Header עם אפקט גלואו */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-ping" />
              <h2 className="text-4xl font-black italic tracking-tighter text-emerald-400">לוח משימות LIVE</h2>
            </div>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-2">Saban OS Logistics Interface</p>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-xl p-4 rounded-3xl border border-white/5 text-center min-w-[180px] shadow-2xl">
            <p className="text-2xl font-black font-mono text-emerald-400">{now.toLocaleTimeString('he-IL')}</p>
            <p className="text-slate-500 text-xs font-bold uppercase">{new Date().toLocaleDateString('he-IL')}</p>
          </div>
        </div>

        {/* Grid המשימות */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {orders.length > 0 ? (
              orders.map((order) => {
                const t = calculateTime(order.delivery_date, order.order_time);
                const driver = DRIVERS.find(d => d.name === order.driver_name);
                const driverImg = driver?.img || RAMI_AVATAR;

                return (
                  <motion.div
                    key={order.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="group relative bg-white/5 backdrop-blur-2xl rounded-[2.5rem] p-6 border border-white/10 hover:border-emerald-500/50 transition-all duration-500 shadow-2xl"
                  >
                    {/* אינדיקטור דחיפות צדדי */}
                    <div className={`absolute top-0 right-0 w-2 h-full rounded-l-full transition-colors ${t.urgent && !t.expired ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-emerald-500'}`} />

                    <div className="flex justify-between items-start mb-6">
                      <div className="p-3 bg-white/5 rounded-2xl">
                        <Truck size={24} className="text-emerald-400" />
                      </div>
                      <div className="text-left font-mono text-[10px] text-slate-500">ID: {order.id.slice(0, 8)}</div>
                    </div>

                    <h3 className="text-2xl font-black mb-1 truncate">{order.client_info}</h3>
                    <div className="flex items-center gap-2 text-slate-400 text-sm mb-6">
                      <MapPin size={16} className="text-emerald-500" /> {order.location}
                    </div>

                    {/* טיימר מעוצב */}
                    <div className={`p-4 rounded-3xl mb-6 flex items-center justify-between ${t.urgent && !t.expired ? 'bg-red-500/10 border border-red-500/20' : 'bg-emerald-500/10 border border-emerald-500/20'}`}>
                      <div className="flex items-center gap-2 text-slate-300 font-bold text-xs">
                        <Clock size={16} /> זמן נותר:
                      </div>
                      <div className={`text-2xl font-black font-mono ${t.urgent && !t.expired ? 'text-red-400' : 'text-emerald-400'}`}>
                        {!t.expired ? `${String(t.h).padStart(2, '0')}:${String(t.m).padStart(2, '0')}:${String(t.s).padStart(2, '0')}` : "הסתיים"}
                      </div>
                    </div>

                    {/* נהג */}
                    <div className="flex items-center gap-4 bg-white/5 p-3 rounded-2xl border border-white/5">
                      <img src={driverImg} className="w-12 h-12 rounded-xl object-cover border border-emerald-500/30" />
                      <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase">נהג מבצע</p>
                        <p className="text-sm font-black italic">{order.driver_name}</p>
                      </div>
                      <div className="mr-auto">
                        <Activity size={18} className={t.expired ? 'text-slate-600' : 'text-emerald-500 animate-pulse'} />
                      </div>
                    </div>

                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      className="mt-6 w-full py-4 bg-emerald-500 text-black font-black rounded-2xl flex items-center justify-center gap-2 hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20"
                    >
                      <Bot size={20} /> AI COMMAND
                    </motion.button>
                  </motion.div>
                );
              })
            ) : (
              <div className="col-span-full py-20 text-center opacity-20">
                <AlertCircle size={64} className="mx-auto mb-4" />
                <p className="text-3xl font-black italic uppercase">אין משימות להיום</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Layout>
  );
}
