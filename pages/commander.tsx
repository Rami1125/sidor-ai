'use client';
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import OrderBoard from '@/components/OrderBoard'; // ייבוא הלוח החדש
import { ShoppingBag, BellRing, Settings, ShieldCheck } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Commander() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // שליפת נתונים ראשונית וחיבור ל-Realtime
  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel('commander-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setOrders(data);
    }
    setLoading(false);
  };

  // פונקציית העדכון שהלוח דורש
  const handleUpdate = async (id: string, updates: any) => {
    try {
      const res = await fetch('/api/update-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, updates })
      });
      if (res.ok) fetchOrders();
    } catch (err) {
      console.error("Commander Update Error:", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col italic" dir="rtl">
<Head>
  <title>לוח הזמנות</title>
  {/* התיקון לאזהרה שקיבלת */}
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"/>
</Head>

      {/* Header יוקרתי - עיצוב היברידי */}
      <header className="bg-white border-b border-slate-100 p-6 sticky top-0 z-50 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-slate-900 p-3 rounded-2xl shadow-lg">
            <ShieldCheck className="text-emerald-400" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none italic">
              SABAN <span className="text-emerald-500">COMMANDER</span>
            </h1>
            <p className="text-[9px] font-bold text-slate-400 tracking-[0.3em] uppercase mt-1">Operational Control Tower</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-50 border border-slate-100 px-5 py-2 rounded-2xl flex items-center gap-3 shadow-inner">
            <BellRing className="text-slate-400" size={18} />
            <span className="text-lg font-black text-slate-900">{orders.filter(o => o.status === 'pending').length}</span>
          </div>
          <button className="p-3 bg-slate-900 text-white rounded-2xl shadow-xl active:scale-95 transition-all">
            <Settings size={20} />
          </button>
        </div>
      </header>

      {/* אזור הלוח */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
        <section className="mb-8">
          <div className="flex items-center justify-between mb-6 px-2">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] italic">לוח הזמנות פעיל</h2>
            <div className="h-px flex-1 bg-slate-100 mx-4" />
          </div>

          {/* התיקון כאן: הזרקת ה-Orders וה-onUpdate לתוך הלוח */}
          {loading ? (
            <div className="flex justify-center p-20 animate-pulse text-slate-300 font-black italic uppercase">Synchronizing...</div>
          ) : (
            <OrderBoard orders={orders} onUpdate={handleUpdate} />
          )}
        </section>
      </main>

      <style jsx global>{`
        body { background: #F8FAFC; margin: 0; }
        ::-webkit-scrollbar { width: 0px; }
      `}</style>
    </div>
  );
}
