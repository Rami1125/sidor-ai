'use client';
import React, { useState, useEffect } from 'react';
import AppLayout from '../../components/Layout';
import { supabase } from '../../lib/supabase';
import { 
  Truck, Box, MapPin, ChevronDown, Clock, 
  CheckCircle2, AlertTriangle, BellRing, Archive, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AVATARS: Record<string, string> = {
  'חכמת': 'https://i.postimg.cc/d3S0NJJZ/Screenshot-20250623-200646-Facebook.jpg',
  'עלי': 'https://i.postimg.cc/tCNbgXK3/Screenshot-20250623-200744-Tik-Tok.jpg',
  'שארק 30': 'https://ui-avatars.com/api/?name=S30&background=0284c7&color=fff',
  'כראדי 32': 'https://ui-avatars.com/api/?name=K32&background=334155&color=fff',
  'שי שרון': 'https://ui-avatars.com/api/?name=SS&background=7c3aed&color=fff'
};

export default function MasterDashboard() {
  const [truckOrders, setTruckOrders] = useState<any[]>([]);
  const [containerOrders, setContainerOrders] = useState<any[]>([]);
  const [openStatusId, setOpenStatusId] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());
  const [lastAction, setLastAction] = useState<string | null>(null);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetchData();
    const timerInterval = setInterval(() => setNow(new Date()), 1000);
    const channel = supabase.channel('dashboard_live')
      .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
        fetchData();
        const actionMsg = payload.eventType === 'INSERT' ? '✅ חדש' : payload.eventType === 'DELETE' ? '🗑️ נמחק' : '🔄 עודכן';
        setLastAction(`${actionMsg}`);
        setTimeout(() => setLastAction(null), 3000);
      }).subscribe();
    return () => { clearInterval(timerInterval); supabase.removeChannel(channel); };
  }, []);

  const fetchData = async () => {
    const { data: o } = await supabase.from('orders').select('*').eq('delivery_date', today).neq('status', 'history');
    const { data: c } = await supabase.from('container_management').select('*').eq('is_active', true);
    setTruckOrders(o || []);
    setContainerOrders(c || []);
  };

  const calculateTimer = (targetTime: string) => {
    if (!targetTime) return { text: '--:--:--', isPast: false, isUrgent: false };
    const [hours, minutes] = targetTime.split(':').map(Number);
    const target = new Date();
    target.setHours(hours, minutes, 0, 0);
    const diff = target.getTime() - now.getTime();
    const isPast = diff < 0;
    const absDiff = Math.abs(diff);
    const h = Math.floor(absDiff / 3600000);
    const m = Math.floor((absDiff % 3600000) / 60000);
    const s = Math.floor((absDiff % 60000) / 1000);
    return { text: `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`, isPast, isUrgent: !isPast && diff < 3600000 };
  };

  const updateStatus = async (id: string, table: string, newStatus: string) => {
    await supabase.from(table).update({ status: newStatus }).eq('id', id);
    setOpenStatusId(null);
    fetchData();
  };

  return (
    <AppLayout>
      {/* Container ראשי עם גובה גמיש שמאפשר גלילה */}
      <div className="w-full bg-[#FBFBFC] pb-20" dir="rtl">
        
        {/* התראות צפות */}
        <AnimatePresence>
          {lastAction && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="fixed top-20 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl z-[150] flex items-center gap-2 border border-slate-700 whitespace-nowrap"
            >
              <BellRing className="text-emerald-400 animate-pulse" size={16} />
              <span className="text-xs font-bold">{lastAction}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="p-4 lg:p-10 space-y-12">
          
          {/* סקציה: הובלות */}
          <section>
            <h2 className="text-xl font-black italic mb-6 flex items-center gap-2 text-slate-800">
              <Truck className="text-emerald-600" size={20} /> סידור נהגים
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
              {truckOrders.map(order => {
                const timer = calculateTimer(order.order_time);
                return (
                  <div key={order.id} className={`snap-center bg-white p-6 rounded-[2rem] shadow-lg border min-w-[280px] md:min-w-[320px] transition-all ${timer.isUrgent ? 'border-amber-300 ring-2 ring-amber-50' : 'border-slate-100'}`}>
                    <div className="flex justify-between items-start mb-4">
                        <button onClick={() => setOpenStatusId(openStatusId === order.id ? null : order.id)} className={`px-3 py-1 rounded-full text-[10px] font-black ${order.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                            {order.status === 'approved' ? 'מאושר' : 'ממתין'}
                        </button>
                        <span className="text-[10px] font-black text-slate-300 uppercase">{order.driver_name}</span>
                    </div>
                    <h3 className="text-xl font-black tracking-tight mb-1">{order.client_info}</h3>
                    <p className="text-[11px] font-bold text-slate-400 mb-6 flex items-center gap-1"><MapPin size={10}/> {order.location}</p>
                    <div className="flex justify-between items-end pt-4 border-t border-slate-50">
                      <div className="flex flex-col">
                        <span className={`text-2xl font-mono font-black ${timer.isPast ? 'text-red-500' : (timer.isUrgent ? 'text-amber-500 animate-pulse' : 'text-slate-900')}`}>
                          {timer.isPast ? 'איחור' : timer.text}
                        </span>
                        <span className="text-[9px] font-black text-slate-300 tracking-widest uppercase">יעד {order.order_time}</span>
                      </div>
                      <img src={AVATARS[order.driver_name] || `https://ui-avatars.com/api/?name=${order.driver_name}`} className="w-12 h-12 rounded-xl object-cover border-2 border-emerald-50 shadow-sm" />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* סקציה: מכולות */}
          <section>
            <h2 className="text-xl font-black italic mb-6 flex items-center gap-2 text-slate-800">
              <Box className="text-blue-600" size={20} /> מכולות והצבות
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
              {containerOrders.map(c => {
                const daysDiff = Math.ceil(Math.abs(now.getTime() - new Date(c.start_date).getTime()) / (1000 * 60 * 60 * 24));
                return (
                  <div key={c.id} className="snap-center bg-white p-6 rounded-[2rem] shadow-lg border border-slate-100 border-r-[10px] border-r-blue-500 min-w-[280px] md:min-w-[320px]">
                    <div className="flex justify-between items-start mb-4">
                       <span className="bg-blue-50 text-blue-700 text-[9px] font-black px-3 py-1 rounded-full uppercase">{c.action_type}</span>
                       <span className="text-[10px] font-black text-slate-300 uppercase">{c.contractor_name}</span>
                    </div>
                    <h3 className="text-lg font-black text-slate-900 mb-1">{c.client_name}</h3>
                    <p className="text-[11px] font-bold text-slate-400 mb-6 flex items-center gap-1"><MapPin size={10}/> {c.delivery_address}</p>
                    <div className="flex justify-between items-center gap-3 pt-4 border-t border-slate-50">
                        <div className="flex-1">
                            <div className="flex justify-between text-[9px] font-black mb-1">
                                <span className="text-blue-600">{daysDiff}/10 ימים</span>
                                <span className="text-slate-400 uppercase">זמן שכירות</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500" style={{ width: `${Math.min((daysDiff / 10) * 100, 100)}%` }}></div>
                            </div>
                        </div>
                        <img src={AVATARS[c.contractor_name] || `https://ui-avatars.com/api/?name=${c.contractor_name}`} className="w-10 h-10 rounded-lg object-cover" />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

        </div>
      </div>
    </AppLayout>
  );
}
