'use client';
import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { supabase } from '../../lib/supabase';
import { 
  LayoutDashboard, Send, Clock, MapPin, 
  Bot, Truck, Box, Timer, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DRIVERS = [
  { name: 'חכמת', img: 'https://i.postimg.cc/d3S0NJJZ/Screenshot-20250623-200646-Facebook.jpg' },
  { name: 'עלי', img: 'https://i.postimg.cc/tCNbgXK3/Screenshot-20250623-200744-Tik-Tok.jpg' }
];

const RAMI_AVATAR = "https://media-mrs2-2.cdn.whatsapp.net/v/t61.24694-24/620186722_866557896271587_5747987865837500471_n.jpg?stp=dst-jpg_s96x96_tt6&ccb=11-4&oh=01_Q5Aa4AG_JCByU59rXu4ybPiRgaD2riDMbb0ujm-XlzxUbmgPXA&oe=69D7EBEB&_nc_sid=5e03e0&_nc_cat=111";

export default function SabanDashboard() {
  const [mounted, setMounted] = useState(false);
  const [truckOrders, setTruckOrders] = useState<any[]>([]);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    setMounted(true);
    fetchData();
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const fetchData = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase.from('orders').select('*').eq('delivery_date', today);
    setTruckOrders(data || []);
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
    <div className="flex h-screen w-full bg-[#F0F2F5] text-slate-900 font-sans overflow-hidden" dir="rtl">
      <Head>
        <title>SABAN OS | Dashboard</title>
        <meta name="mobile-web-app-capable" content="yes" />
      </Head>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-24 flex items-center justify-between px-8 bg-white/50 backdrop-blur-md border-b border-slate-200">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-black shadow-lg">
              <Activity size={20} />
            </div>
            <h1 className="text-xl font-black italic uppercase">SABAN <span className="text-emerald-600">OS</span></h1>
          </div>
          <div className="font-mono font-black text-3xl text-emerald-600 italic">
            {now.toLocaleTimeString('he-IL')}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {truckOrders.map(order => {
              const t = calculateTime(`${order.delivery_date}T${order.order_time}`);
              return (
                <div key={order.id} className="p-8 rounded-[3rem] border border-slate-100 bg-white shadow-lg relative group">
                  <span className="px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest text-white bg-emerald-600 mb-6 inline-block">הובלה</span>
                  <h3 className="text-2xl font-black mb-2 tracking-tighter leading-tight">{order.client_info}</h3>
                  <div className="flex items-center gap-2 text-slate-400 font-bold text-xs mb-8"><MapPin size={14}/> {order.location}</div>
                  
                  <div className={`p-6 rounded-[2rem] flex items-center justify-between ${t.expired ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 text-emerald-400'}`}>
                    <div className="flex items-center gap-4">
                      <Clock size={24}/>
                      <span className="text-2xl font-black font-mono">
                        {!t.expired ? `${String(t.h).padStart(2,'0')}:${String(t.m).padStart(2,'0')}:${String(t.s).padStart(2,'0')}` : "בוצע"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-8 flex items-center gap-4 border-t border-slate-100 pt-8">
                    <img 
                      src={DRIVERS.find(d => d.name === order.driver_name)?.img || RAMI_AVATAR} 
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-500"
                      onError={(e) => { (e.target as HTMLImageElement).src = RAMI_AVATAR; }}
                    />
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">נהג מבצע</span>
                      <p className="text-lg font-black">{order.driver_name}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
