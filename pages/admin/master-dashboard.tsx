'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Clock, MapPin, Share2, RefreshCcw } from 'lucide-react';

export default function SabanLiveDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const showOrders = process.env.NEXT_PUBLIC_ENABLE_ORDER === 'true';

  useEffect(() => { if (showOrders) fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase.from('orders').select('*').eq('delivery_date', today);
    setOrders(data || []);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white p-6" dir="rtl">
      <header className="flex justify-between items-center mb-10 bg-white/5 p-6 rounded-[2rem] border border-white/5">
        <h1 className="text-4xl font-black italic text-emerald-500 uppercase">Saban Real-Time</h1>
        <button onClick={fetchData} className="p-3 bg-emerald-500/10 rounded-full text-emerald-500"><RefreshCcw /></button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {orders.map(o => (
          <div key={o.id} className="bg-[#161B2C] p-8 rounded-[3rem] border border-white/5 border-r-4 border-emerald-500 shadow-xl">
            <h2 className="text-3xl font-black mb-2">{o.client_info}</h2>
            <div className="flex items-center gap-2 text-sm opacity-60 mb-6"><MapPin size={14}/> {o.location}</div>
            <div className="bg-black/20 p-4 rounded-2xl flex justify-between items-center">
              <span className="text-2xl font-mono font-black text-emerald-400 italic">{o.order_time}</span>
              <span className="text-xs font-bold px-3 py-1 bg-white/10 rounded-full">{o.driver_name}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
