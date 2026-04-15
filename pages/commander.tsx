'use client';
import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import OrderBoard from '../components/OrderBoard';
import { ShieldCheck, BellRing, Settings, Loader2 } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Commander() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetchOrders();
    const channel = supabase.channel('commander-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchOrders())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchOrders = async () => {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (data) setOrders(data);
    setLoading(false);
  };

  const handleUpdate = async (id: string, updates: any) => {
    const res = await fetch('/api/update-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, updates })
    });
    if (res.ok) fetchOrders();
  };

  return (
    // fixed inset-0 תופס את כל המסך, overflow-hidden מונע מהדף "לברוח"
    <div className="fixed inset-0 bg-[#F8FAFC] flex flex-col overflow-hidden italic" dir="rtl">
      <Head>
        <title>SABAN COMMANDER</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
        <meta name="mobile-web-app-capable" content="yes" />
      </Head>
      
      <audio ref={audioRef} src="/order-notification.mp3" preload="auto" />

      {/* Header קבוע למעלה */}
      <header className="bg-white border-b border-slate-100 p-4 md:p-6 shrink-0 z-50 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 p-2 rounded-xl shadow-lg">
            <ShieldCheck className="text-emerald-400" size={20} />
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tighter uppercase italic">SABAN <span className="text-emerald-500">OS</span></h1>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 px-4 py-1.5 rounded-2xl border border-slate-100">
          <BellRing className="text-slate-400" size={16} />
          <span className="text-md font-black">{orders.filter(o => o.status === 'pending').length}</span>
        </div>
      </header>

      {/* כאן התיקון: flex-1 לוקח את כל השטח, ו-overflow-y-auto מאפשר גלילה רק כאן */}
      <main className="flex-1 overflow-y-auto overscroll-contain p-4 md:p-8 custom-scroll">
        <div className="max-w-7xl mx-auto w-full pb-24"> 
          {loading ? (
            <div className="flex flex-col items-center justify-center p-20 gap-4 text-slate-300 italic">
              <Loader2 className="animate-spin" size={32} />
              <span className="font-black uppercase tracking-widest">Synchronizing...</span>
            </div>
          ) : (
            <OrderBoard orders={orders} onUpdate={handleUpdate} />
          )}
        </div>
      </main>

      {/* CSS להעלמת סרגל גלילה מכוער במובייל */}
      <style jsx global>{`
        body { margin: 0; padding: 0; overflow: hidden; height: 100vh; -webkit-overflow-scrolling: touch; }
        .custom-scroll::-webkit-scrollbar { width: 0px; background: transparent; }
        input, button { -webkit-tap-highlight-color: transparent; }
      `}</style>
    </div>
  );
}
