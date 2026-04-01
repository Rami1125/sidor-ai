'use client';
import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import AppLayout from '../../components/Layout';
import { supabase } from '../../lib/supabase';
import { 
  Clock, MapPin, Truck, Box, Timer, Activity, 
  CheckCheck, AlertCircle, Warehouse, Send, Bot, Calendar
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
  const [containerOrders, setContainerOrders] = useState<any[]>([]); // הזמנות מכולה להיום
  const [activeContainers, setActiveContainers] = useState<any[]>([]); // מכולות בשטח (שכירות)
  const [now, setNow] = useState(new Date());
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setMounted(true);
    fetchData();
    const t = setInterval(() => setNow(new Date()), 1000);
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
    const channel = supabase.channel('master_v5').on('postgres_changes', { event: '*', schema: 'public' }, fetchData).subscribe();
    return () => { clearInterval(t); channel.unsubscribe(); };
  }, []);

  const fetchData = async () => {
    const today = new Date().toISOString().split('T')[0];
    // שליפת הזמנות חומרים (ORDERS)
    const { data: orders } = await supabase.from('orders').select('*').eq('delivery_date', today);
    // שליפת מכולות בשטח (ניהול שכירות)
    const { data: containers } = await supabase.from('container_management').select('*').eq('is_active', true);
    
    setTruckOrders(orders || []);
    setActiveContainers(containers || []);
  };

  const calculateProgress = (date: string, time: string, isLease = false) => {
    const target = new Date(`${date}T${time || '08:00'}`);
    const diff = target.getTime() - now.getTime();
    
    if (isLease) {
      const daysDiff = Math.ceil(Math.abs(now.getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
      return { days: daysDiff, isUrgent: daysDiff >= 9, progress: Math.min((daysDiff / 10) * 100, 100) };
    }
    
    const h = Math.floor(Math.abs(diff) / 3600000);
    const m = Math.floor((Math.abs(diff) % 3600000) / 60000);
    const s = Math.floor((Math.abs(diff) % 60000) / 1000);
    return { h, m, s, expired: diff <= 0, bar: Math.min(Math.max(100 - (diff / 36000000) * 100, 0), 100) };
  };

  if (!mounted) return null;

  return (
    <AppLayout>
      <div className="flex h-full bg-[#F0F2F5] overflow-hidden" dir="rtl">
        <Head><title>SABAN OS | CONTROL</title></Head>

        {/* דוח צדדי לחיץ */}
        <aside className="hidden xl:flex w-72 flex-col bg-white border-l border-slate-200 shadow-xl overflow-y-auto">
          <div className="p-8 pb-4 font-black text-[10px] text-slate-400 uppercase tracking-widest">סטטוס מבצעי</div>
          <div className="p-4 space-y-3">
             {DRIVERS.map(d => (
               <div key={d.name} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-2">
                    <img src={d.img} className="w-8 h-8 rounded-full object-cover border border-emerald-500" />
                    <span className="text-xs font-black">{d.name}</span>
                  </div>
                  <span className="bg-emerald-500 text-white text-[9px] px-2 py-0.5 rounded-full font-black">
                    {truckOrders.filter(o => o.driver_name === d.name).length}
                  </span>
               </div>
             ))}
             {['30', '32', '40'].map(num => (
               <div key={num} className="flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center text-[10px] text-white font-black">{num}</div>
                    <span className="text-xs font-black">מחסן {num}</span>
                  </div>
                  <span className="text-slate-400 font-black text-[10px]">{activeContainers.filter(c => c.contractor_name?.includes(num)).length}</span>
               </div>
             ))}
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-6 lg:p-10 scrollbar-hide pb-32">
          
          {/* ניווט מהיר מובייל/טאבלט */}
          <div className="flex gap-2 mb-8 bg-white p-2 rounded-3xl shadow-sm w-fit border border-slate-100">
            <button onClick={() => setActiveTab('live')} className={`px-6 py-2 rounded-2xl text-xs font-black transition-all ${activeTab === 'live' ? 'bg-slate-900 text-white' : 'text-slate-400'}`}>משימות LIVE</button>
            <button onClick={() => setActiveTab('containers')} className={`px-6 py-2 rounded-2xl text-xs font-black transition-all ${activeTab === 'containers' ? 'bg-slate-900 text-white' : 'text-slate-400'}`}>ניהול שכירות</button>
          </div>

          <AnimatePresence mode="wait">
            
            {/* דף 1: הזמנות LIVE (חומרים למעלה, מכולות למטה) */}
            {activeTab === 'live' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
                
                {/* הזמנות חומרי בניין */}
                <section>
                  <h2 className="flex items-center gap-2 text-xl font-black italic mb-6"><Truck size={20} className="text-emerald-600"/> הזמנות פתוחות | חומרי בניין</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {truckOrders.map(order => {
                      const t = calculateProgress(order.delivery_date, order.order_time);
                      return (
                        <div key={order.id} className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100 group relative overflow-hidden transition-all hover:scale-[1.02]">
                          <div className="flex justify-between mb-4">
                            <span className="bg-emerald-600 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest">ORDER</span>
                          </div>
                          <h3 className="text-2xl font-black tracking-tighter leading-none mb-1">{order.client_info}</h3>
                          <p className="text-xs font-bold text-slate-400 mb-6 flex items-center gap-1"><MapPin size={12}/> {order.location}</p>
                          
                          <div className="space-y-3 mb-6">
                             <div className="flex justify-between items-end">
                                <span className={`text-2xl font-black font-mono ${t.expired ? 'text-red-500 animate-pulse' : 'text-slate-900'}`}>
                                  {t.expired ? 'בביצוע' : `${t.h}:${String(t.m).padStart(2,'0')}:${String(t.s).padStart(2,'0')}`}
                                </span>
                                <span className="text-[10px] text-slate-400 font-black">יעד: {order.order_time}</span>
                             </div>
                             <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                <motion.div initial={{ width: 0 }} animate={{ width: `${t.bar}%` }} className={`h-full ${t.expired ? 'bg-red-500' : 'bg-emerald-500'}`} />
                             </div>
                          </div>
                          
                          <div className="flex items-center gap-3 border-t border-slate-50 pt-4">
                            <img src={DRIVERS.find(d => d.name === order.driver_name)?.img} className="w-10 h-10 rounded-xl object-cover border-2 border-emerald-500 shadow-sm" />
                            <span className="text-sm font-black">{order.driver_name}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* מכולות היום (מתחת) */}
                <section>
                  <h2 className="flex items-center gap-2 text-xl font-black italic mb-6 pt-6 border-t border-slate-200"><Box size={20} className="text-blue-600"/> הזמנות מכולה להיום</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {activeContainers.filter(c => c.start_date === today).map(site => {
                       const t = calculateProgress(site.start_date, site.order_time);
                       return (
                        <div key={site.id} className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100">
                          <span className="bg-blue-600 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest mb-4 inline-block">{site.action_type}</span>
                          <h3 className="text-2xl font-black tracking-tighter mb-1">{site.client_name}</h3>
                          <p className="text-xs font-bold text-slate-400 mb-6"><MapPin size={12} className="inline ml-1"/>{site.delivery_address}</p>
                          <div className="font-mono font-black text-xl text-slate-800">{site.order_time}</div>
                          <div className="mt-4 flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-tighter pt-4 border-t border-slate-50">
                            <Warehouse size={14}/> {site.contractor_name}
                          </div>
                        </div>
                       );
                    })}
                  </div>
                </section>
              </motion.div>
            )}

            {/* דף 2: ניהול מכולות (שכירות ופס התקדמות 10 ימים) */}
            {activeTab === 'containers' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {activeContainers.map(site => {
                  const lease = calculateProgress(site.start_date, '', true);
                  return (
                    <div key={site.id} className={`p-8 rounded-[3.5rem] bg-white shadow-2xl relative border-2 ${lease.isUrgent ? 'border-red-500 animate-pulse' : 'border-slate-50'}`}>
                      <div className="flex justify-between mb-6">
                        <span className="bg-slate-900 text-emerald-500 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em]">MANAGEMENT</span>
                        {lease.isUrgent && <AlertCircle className="text-red-500" size={24} />}
                      </div>
                      <h3 className="text-2xl font-black text-slate-900 mb-2 leading-none">{site.client_name}</h3>
                      <p className="text-xs font-bold text-slate-400 mb-8">{site.delivery_address}</p>
                      
                      <div className="space-y-4">
                        <div className="flex justify-between items-end font-black">
                          <span className={`text-2xl font-mono ${lease.isUrgent ? 'text-red-500' : 'text-slate-800'}`}>{lease.days} / 10 ימים</span>
                          <span className="text-[10px] text-slate-400 uppercase tracking-widest">{lease.isUrgent ? 'נא לפנות' : 'שכירות פעילה'}</span>
                        </div>
                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                           <motion.div initial={{ width: 0 }} animate={{ width: `${lease.progress}%` }} className={`h-full ${lease.isUrgent ? 'bg-red-500' : 'bg-emerald-500'}`} />
                        </div>
                      </div>
                      <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                         <div className="flex items-center gap-2 font-black text-xs text-slate-600"><Warehouse size={16}/> {site.contractor_name}</div>
                         <div className="text-[10px] font-black text-slate-300">{site.start_date}</div>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}

          </AnimatePresence>
        </main>

        {/* Mobile Nav */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-100 flex items-center justify-around z-50">
           <button onClick={() => setActiveTab('live')} className={activeTab === 'live' ? 'text-emerald-600' : 'text-slate-400'}><Timer size={24}/></button>
           <button onClick={() => setActiveTab('containers')} className={activeTab === 'containers' ? 'text-emerald-600' : 'text-slate-400'}><Box size={24}/></button>
        </div>

      </div>
    </AppLayout>
  );
}
