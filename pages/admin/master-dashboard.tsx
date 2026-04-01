'use client';
import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import AppLayout from '../../components/Layout';
import { supabase } from '../../lib/supabase';
import { 
  Clock, MapPin, Truck, Box, Timer, Activity, 
  CheckCheck, AlertCircle, Warehouse, ChevronRight 
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
  const [now, setNow] = useState(new Date());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setMounted(true);
    fetchData();
    const t = setInterval(() => setNow(new Date()), 1000);
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
    const channel = supabase.channel('master_sync').on('postgres_changes', { event: '*', schema: 'public' }, fetchData).subscribe();
    return () => { clearInterval(t); channel.unsubscribe(); };
  }, []);

  const fetchData = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data: o } = await supabase.from('orders').select('*').eq('delivery_date', today);
    const { data: c } = await supabase.from('container_management').select('*').eq('is_active', true);
    setTruckOrders(o || []);
    setContainerSites(c || []);
  };

  const calculateProgress = (date: string, time: string, isContainer = false) => {
    const target = new Date(`${date}T${time || '08:00'}`);
    const diff = target.getTime() - now.getTime();
    const daysDiff = Math.ceil(Math.abs(diff) / (1000 * 60 * 60 * 24));
    
    if (isContainer) return { days: daysDiff, isUrgent: daysDiff >= 9 };
    
    const h = Math.floor(Math.abs(diff) / 3600000);
    const m = Math.floor((Math.abs(diff) % 3600000) / 60000);
    return { h, m, expired: diff <= 0, progress: Math.min(Math.max(100 - (diff / 36000000) * 100, 0), 100) };
  };

  if (!mounted) return null;

  return (
    <AppLayout>
      <div className="flex h-full bg-[#F0F2F5] overflow-hidden" dir="rtl">
        <Head><title>SABAN OS | MASTER</title></Head>

        {/* דוח צדדי לחיץ - משודרג */}
        <aside className="hidden xl:flex w-80 flex-col bg-white border-l border-slate-200 shadow-xl overflow-y-auto">
          <div className="p-8 pb-4 font-black text-xs text-slate-400 uppercase tracking-widest">מחסן מכולות ונהגים</div>
          <div className="p-4 space-y-3">
            {/* נהגים */}
            {DRIVERS.map(d => (
              <button key={d.name} className="w-full flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100 hover:border-emerald-500 transition-all group">
                <div className="flex items-center gap-3">
                  <img src={d.img} className="w-8 h-8 rounded-full object-cover border-2 border-emerald-500 shadow-sm" />
                  <span className="text-sm font-black">{d.name}</span>
                </div>
                <span className="bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black">
                  {truckOrders.filter(o => o.driver_name === d.name).length}
                </span>
              </button>
            ))}
            {/* קבלנים */}
            {['שארק 30', 'כראדי 32', 'שי שרון 40'].map((con, idx) => (
              <button key={con} className="w-full flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-100 hover:border-blue-500 transition-all">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${idx === 0 ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>CM</div>
                  <span className="text-sm font-black">{con}</span>
                </div>
                <span className="bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded-full font-black">
                  {containerSites.filter(c => c.contractor_name === con).length}
                </span>
              </button>
            ))}
          </div>
        </aside>

        {/* תוכן ראשי */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-10 scrollbar-hide pb-32">
          {activeTab === 'live' && (
            <div className="space-y-12">
              
              {/* סקציה 1: הזמנות חומרי בניין (חכמת ועלי) */}
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <Truck className="text-emerald-600" size={24} />
                  <h2 className="text-2xl font-black italic tracking-tighter">הזמנות פתוחות | <span className="text-slate-400 font-medium">חומרי בניין</span></h2>
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
                              <span className={`text-2xl font-mono ${timer.expired ? 'text-red-500 animate-pulse' : 'text-slate-800'}`}>
                                 {timer.expired ? 'בביצוע' : `${timer.h}:${String(timer.m).padStart(2,'0')}`}
                              </span>
                              <span className="text-[10px] text-slate-400 uppercase tracking-widest">שעת יעד: {order.order_time}</span>
                           </div>
                           <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                              <motion.div initial={{ width: 0 }} animate={{ width: `${timer.progress}%` }} className={`h-full ${timer.expired ? 'bg-red-500' : 'bg-emerald-500'}`} />
                           </div>
                        </div>

                        <div className="mt-4 flex items-center gap-3 border-t border-slate-50 pt-4">
                          <img src={DRIVERS.find(d => d.name === order.driver_name)?.img || 'https://i.postimg.cc/mD8zQcby/rami.jpg'} className="w-10 h-10 rounded-xl object-cover border-2 border-emerald-500" />
                          <span className="text-sm font-black">{order.driver_name}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* סקציה 2: מכולות פתוחות (מתחת להזמנות) */}
              <section>
                <div className="flex items-center gap-3 mb-6 border-t border-slate-200 pt-12">
                  <Box className="text-blue-600" size={24} />
                  <h2 className="text-2xl font-black italic tracking-tighter">מכולות בשטח | <span className="text-slate-400 font-medium">ניהול מלאי</span></h2>
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
                           <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
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
        </main>

        {/* Mobile Bottom Bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t flex items-center justify-around z-[100]">
           <button onClick={() => setActiveTab('live')} className={activeTab === 'live' ? 'text-emerald-600' : 'text-slate-400'}><LayoutDashboard size={24}/></button>
           <button onClick={() => setActiveTab('chat')} className={activeTab === 'chat' ? 'text-emerald-600' : 'text-slate-400'}><Bot size={24}/></button>
        </div>
      </div>
    </AppLayout>
  );
}
