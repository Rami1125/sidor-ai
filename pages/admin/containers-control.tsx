'use client';
import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Truck, Clock, AlertTriangle, RefreshCw, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function ContainersControl() {
  const [containers, setContainers] = useState<any[]>([]);

  useEffect(() => {
    fetchContainers();
    const sub = supabase.channel('containers').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchContainers).subscribe();
    return () => { supabase.removeChannel(sub); };
  }, []);

  const fetchContainers = async () => {
    const { data } = await supabase.from('orders').select('*').eq('is_container', true).neq('status', 'removed');
    if (data) setContainers(data);
  };

  return (
    <div className="min-h-screen bg-slate-900 p-4 md:p-10 text-white italic" dir="rtl">
      <header className="mb-10 flex justify-between items-center border-b-2 border-blue-500 pb-6">
        <h1 className="text-4xl font-black italic">CONTAINER <span className="text-blue-400">HUB</span></h1>
        <div className="bg-blue-600 px-6 py-2 rounded-full font-bold animate-pulse">
          {containers.length} פעילות בשטח
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {containers.map((c) => {
          const days = Math.floor((Date.now() - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24));
          const isDanger = days >= 9;

          return (
            <motion.div 
              key={c.id}
              initial={{ scale: 0.9 }} animate={{ scale: 1 }}
              className={`p-6 rounded-[2.5rem] border-4 transition-all ${isDanger ? 'bg-emerald-500 border-emerald-300 text-slate-900' : 'bg-slate-800 border-slate-700'}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${isDanger ? 'bg-slate-900 text-white' : 'bg-blue-600'}`}>
                  <Truck size={24} />
                </div>
                <div className="text-left font-black">
                  <span className="text-xs opacity-50 block">ימי שכירות</span>
                  <span className="text-3xl">{days}/10</span>
                </div>
              </div>

              <h2 className="text-2xl font-black mb-2">{c.warehouse}</h2>
              <p className="text-sm opacity-80 mb-6">{c.client_info}</p>

              <div className="flex gap-2">
                <button className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                  <RefreshCw size={18}/> החלפה
                </button>
                <button className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                  <LogOut size={18}/> הוצאה
                </button>
              </div>

              {isDanger && (
                <div className="mt-4 p-3 bg-slate-900 text-emerald-400 rounded-xl flex items-center gap-2 animate-bounce">
                  <AlertTriangle size={18}/> <span>נדנוד יום 9: צור קשר עם הלקוח!</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
