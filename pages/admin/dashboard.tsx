'use client';
import React, { useState, useEffect, useRef } from 'react';
import AppLayout from '../../components/Layout'; // ייבוא הלייאאוט עם התפריט
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
    
    // סנכרון בזמן אמת מול המאגר
    const channel = supabase.channel('dashboard_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchData)
      .subscribe();

    return () => {
      clearInterval(t);
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase.from('orders')
      .select('*')
      .eq('delivery_date', today)
      .neq('status', 'deleted');
    setOrders(data || []);
  };

  const calculateTime = (target: string) => {
    const diff = new Date(target).getTime() - now.getTime();
    if (diff <= 0) return { expired: true };
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return { expired: false, h, m, s, urgent: diff < 3600000 };
  };

  if (!mounted) return null;

  return (
    <AppLayout> {/* שימוש בלייאאוט כדי לשמור על התפריט הצדדי */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#F0F2F5] p-4 lg:p-8" dir="rtl">
        
        {/* Header פנימי לדשבורד */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic">לוח משימות <span className="text-emerald-600">LIVE</span></h1>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">מחובר למאגר הנתונים המרכזי</p>
          </div>
          <div className="text-left">
            <div className="font-mono font-black text-2xl text-emerald-600 italic leading-none">
              {now.toLocaleTimeString('he-IL')}
            </div>
            <p className="text-[10px] font-bold text-slate-400 mt-1">{new Date().toLocaleDateString('he-IL')}</p>
          </div>
        </div>

        {/* גריד המשימות */}
        <div className="flex-1 overflow-y-auto pb-24 scrollbar-hide">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <AnimatePresence>
              {orders.length > 0 ? orders.map((order) => {
                const t = calculateTime(`${order.delivery_date}T${order.order_time}`);
                return (
                  <motion.div 
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`bg-white rounded-[2.5rem] p-6 shadow-xl border border-slate-100 relative group transition-all ${t.urgent && !t.expired ? 'ring-2 ring-amber-500' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-2">
                         <span className="bg-slate-900 text-emerald-500 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest">הובלה</span>
                         {t.urgent && !t.expired && <span className="bg-amber-500 text-white text-[9px] font-black px-3 py-1 rounded-full animate-pulse uppercase">דחוף</span>}
                      </div>
                      <span className="text-[10px] font-mono text-slate-300">#{order.id.slice(0,5)}</span>
                    </div>

                    <h3 className="text-2xl font-black text-slate-900 leading-none mb-2 tracking-tighter">{order.client_info}</h3>
                    <div className="flex items-center gap-2 text-slate-400 font-bold text-xs mb-8">
                      <MapPin size={14} className="text-emerald-500" /> {order.location}
                    </div>

                    <div className={`p-5 rounded-2xl flex items-center justify-between ${t.expired ? 'bg-slate-50 text-slate-300' : 'bg-slate-900 text-emerald-400 shadow-lg shadow-emerald-500/10'}`}>
                      <div className="flex items-center gap-3">
                        <Clock size={20} />
                        <span className="text-2xl font-black font-mono">
                          {!t.expired ? `${String(t.h).padStart(2,'0')}:${String(t.m).padStart(2,'0')}:${String(t.s).padStart(2,'0')}` : "בוצע / חלף"}
                        </span>
                      </div>
                      <span className="text-[10px] font-black opacity-50 uppercase">{order.order_time}</span>
                    </div>

                    <div className="mt-6 flex items-center gap-4 border-t border-slate-50 pt-6">
                      <img 
                        src={DRIVERS.find(d => d.name === order.driver_name)?.img || RAMI_AVATAR} 
                        className="w-12 h-12 rounded-2xl object-cover border-2 border-emerald-500 shadow-sm"
                        onError={(e) => { (e.target as HTMLImageElement).src = RAMI_AVATAR; }}
                      />
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-400 uppercase">נהג מבצע</span>
                        <span className="text-base font-black text-slate-800">{order.driver_name}</span>
                      </div>
                      <div className="mr-auto opacity-20">
                        <CheckCheck size={20} />
                      </div>
                    </div>
                  </motion.div>
                );
              }) : (
                <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-300">
                  <AlertCircle size={48} className="mb-4 opacity-20" />
                  <p className="font-black text-xl italic uppercase tracking-widest">אין משימות פעילות להיום</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
