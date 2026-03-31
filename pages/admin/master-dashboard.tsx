'use client';
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { supabase } from '../../lib/supabase';
import { 
  Clock, MapPin, Share2, RefreshCcw, 
  ChevronRight, Box, Truck, Calendar, Activity 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SabanModernDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('delivery_date', selectedDate)
      .neq('status', 'deleted');
    
    setOrders(data || []);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#e0e0e0] font-sans selection:bg-emerald-500/30" dir="rtl">
      <Head><title>SABAN OS | Command Center</title></Head>

      {/* רקע דקורטיבי עדין */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-emerald-500/5 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-[1600px] mx-auto p-4 md:p-8">
        
        {/* Header מעוצב */}
        <header className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12 bg-white/[0.03] backdrop-blur-md border border-white/10 p-6 rounded-[2.5rem] shadow-2xl">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)]">
              <Activity className="text-black" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white italic">SABAN <span className="text-emerald-500">OS</span></h1>
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold opacity-50">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                Live Command Center
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-black/40 p-2 rounded-2xl border border-white/5">
            <input 
              type="date" 
              value={selectedDate} 
              onChange={e => setSelectedDate(e.target.value)}
              className="bg-transparent px-4 py-2 outline-none font-bold text-sm text-emerald-500 cursor-pointer"
            />
            <button 
              onClick={fetchData}
              className={`p-3 rounded-xl transition-all ${loading ? 'rotate-180 opacity-50' : 'hover:bg-white/10'}`}
            >
              <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </header>

        {/* סטטיסטיקה מהירה */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'הזמנות פעילות', value: orders.length, icon: Box, color: 'text-emerald-500' },
            { label: 'נהגים בחוץ', value: new Set(orders.map(o => o.driver_name)).size, icon: Truck, color: 'text-blue-500' },
          ].map((stat, i) => (
            <div key={i} className="bg-white/[0.03] border border-white/5 p-5 rounded-3xl backdrop-blur-sm">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={stat.color} size={20} />
                <span className="text-2xl font-black text-white">{stat.value}</span>
              </div>
              <div className="text-[10px] font-bold opacity-40 uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* לוח הזמנות - Grid מודרני */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {orders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group relative bg-[#111111] border border-white/5 rounded-[2.5rem] p-8 hover:border-emerald-500/30 transition-all shadow-xl overflow-hidden"
              >
                {/* אפקט Hover עדין */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="flex justify-between items-start mb-6">
                  <div className="px-4 py-1 bg-white/5 rounded-full text-[10px] font-black tracking-widest uppercase opacity-60">
                    #{order.order_number || 'N/A'}
                  </div>
                  <div className="flex gap-2">
                     <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                  </div>
                </div>

                <h3 className="text-2xl font-black text-white mb-2 group-hover:text-emerald-400 transition-colors leading-tight">
                  {order.client_info || order.client_name}
                </h3>
                
                <div className="flex items-center gap-2 text-sm opacity-50 mb-8 font-medium">
                  <MapPin size={14} className="text-emerald-500" />
                  {order.location || order.delivery_address}
                </div>

                <div className="flex items-center justify-between bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
                      <Clock size={18} />
                    </div>
                    <span className="text-xl font-mono font-black italic text-white">{order.order_time}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] font-bold opacity-30 uppercase">נהג מבצע</div>
                    <div className="text-xs font-black text-emerald-500 uppercase">{order.driver_name || 'טרם נקבע'}</div>
                  </div>
                </div>

                <button className="w-full mt-6 py-3 bg-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all hover:bg-emerald-500 hover:text-black">
                  צפה בפרטים מלאים
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {orders.length === 0 && !loading && (
          <div className="text-center py-40 opacity-20">
            <Box size={80} className="mx-auto mb-4" />
            <p className="text-xl font-bold tracking-widest uppercase">אין הזמנות פעילות לתאריך זה</p>
          </div>
        )}
      </div>
    </div>
  );
}
