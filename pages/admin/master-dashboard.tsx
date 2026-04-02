'use client';
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import AppLayout from '../../components/Layout';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
// הוספתי כאן את Sparkles וכל האייקונים הנדרשים
import { 
  Clock, MapPin, Truck, Box, AlertCircle, 
  User, Bell, Sparkles, Send, X, Bot 
} from 'lucide-react';
import { ChatPopup } from '../../components/ChatPopup';

export default function MasterDashboard() {
  const [mounted, setMounted] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    setMounted(true);
    fetchData();
    const interval = setInterval(() => setNow(new Date()), 1000);
    
    // סנכרון Real-time עם צלצול
    const sub = supabase.channel('master_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(() => {});
        fetchData();
      })
      .subscribe();

    return () => { 
      clearInterval(interval); 
      supabase.removeChannel(sub); 
    };
  }, []);

  const fetchData = async () => {
    const today = new Date().toLocaleDateString('en-CA');
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('delivery_date', today)
      .neq('status', 'deleted')
      .order('order_time', { ascending: true });
    setOrders(data || []);
  };

  const getChameleonStyle = (dateStr: string, timeStr: string) => {
    if (!timeStr) return "bg-white border-slate-100";
    const target = new Date(`${dateStr.replace(/-/g, '/')} ${timeStr}`);
    const diff = (target.getTime() - now.getTime()) / 60000;

    if (diff <= 0) return "bg-slate-100 border-slate-200 opacity-60"; // הסתיים
    if (diff < 20) return "bg-white border-[#FF4B4B] shadow-[0_0_15px_rgba(255,75,75,0.1)] ring-1 ring-[#FF4B4B]"; // אדום ניאון
    if (diff < 60) return "bg-white border-[#FFA33C] shadow-[0_0_10px_rgba(255,163,60,0.1)]"; // כתום
    return "bg-white border-slate-100 shadow-sm"; // תקין (טורקיז/לבן)
  };

  if (!mounted) return null;

  return (
    <AppLayout>
      <div className="min-h-screen bg-[#FDFDFD] p-8 font-sans" dir="rtl">
        <Head>
          <title>Master Dashboard | Saban OS</title>
        </Head>

        {/* Header פרימיום */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-[#00C8A5] rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-[#00C8A5]/20">
              <Bell className="text-white animate-bounce" size={28} />
            </div>
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic">לוח משימות <span className="text-[#3D7AFE]">LIVE</span></h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">Saban Logistics Operations</p>
            </div>
          </div>
          
          <div className="text-left bg-white px-8 py-5 rounded-[2.5rem] shadow-2xl border border-slate-50 min-w-[220px]">
            <p className="text-3xl font-black text-[#3D7AFE] font-mono">{now.toLocaleTimeString('he-IL')}</p>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{new Date().toLocaleDateString('he-IL')}</p>
          </div>
        </header>

        {/* Grid המשימות */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {orders.map((order) => (
              <motion.div
                key={order.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`rounded-[2.5rem] p-8 border-2 transition-all duration-500 relative ${getChameleonStyle(order.delivery_date, order.order_time)}`}
              >
                {/* חלק עליון */}
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 leading-tight mb-1">{order.client_info}</h3>
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <Hash size={10} /> הזמנה #{order.order_number || order.id.slice(0,5)}
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl">
                    {order.client_info?.includes('מכולה') ? <Box className="text-[#3D7AFE]" size={24} /> : <Truck className="text-[#00C8A5]" size={24} />}
                  </div>
                </div>

                {/* לוגיסטיקה */}
                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3 text-slate-600 font-bold text-sm">
                    <MapPin className="text-[#3D7AFE]" size={18} /> {order.location || 'לא צוינה כתובת'}
                  </div>
                  <div className="inline-flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-full text-[11px] font-black text-slate-500">
                    <span className="w-2 h-2 bg-[#00C8A5] rounded-full" />
                    אזור: {order.warehouse || 'ראשי'} | {order.driver_name || 'טרם שובץ'}
                  </div>
                </div>

                {/* זמן ונהג */}
                <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#3D7AFE]/10 flex items-center justify-center border-2 border-white shadow-sm overflow-hidden">
                      <img src={`https://ui-avatars.com/api/?name=${order.driver_name || 'U'}&background=3D7AFE&color=fff&bold=true`} alt="driver" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-400 uppercase">נהג מבצע</span>
                      <span className="text-sm font-black text-slate-800 italic">{order.driver_name || 'ממתין'}</span>
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="text-2xl font-black text-slate-900 font-mono tracking-tighter">{order.order_time}</div>
                    <div className="text-[9px] font-black text-[#00C8A5] uppercase tracking-tighter">זמן אספקה</div>
                  </div>
                </div>

                {/* כפתור AI */}
                <button 
                  onClick={() => setSelectedOrder(order)}
                  className="mt-8 w-full py-5 bg-[#F8FAFF] border border-[#3D7AFE]/10 text-[#3D7AFE] font-black rounded-2xl flex items-center justify-center gap-3 hover:bg-[#3D7AFE] hover:text-white transition-all shadow-sm group"
                >
                  <Sparkles size={18} className="group-hover:animate-spin" /> עדכן הזמנה עם AI
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* פופ-אפ צ'אט */}
        <AnimatePresence>
          {selectedOrder && (
            <ChatPopup order={selectedOrder} onClose={() => setSelectedOrder(null)} />
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}

// קומפוננטת עזר לאייקון האש
const Hash = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="9" x2="20" y2="9"></line><line x1="4" y1="15" x2="20" y2="15"></line><line x1="10" y1="3" x2="8" y2="21"></line><line x1="16" y1="3" x2="14" y2="21"></line></svg>
);
