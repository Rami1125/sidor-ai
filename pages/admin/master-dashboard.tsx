'use client';
import React, { useState, useEffect } from 'react';
import AppLayout from '../../components/Layout';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, MapPin, Truck, Box, AlertCircle, User, Bell } from 'lucide-react';
import { ChatPopup } from '../../components/ChatPopup';

export default function MasterDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => setNow(new Date()), 1000);
    const sub = supabase.channel('live').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
      new Audio('/sounds/notify.mp3').play().catch(() => {}); // צלצול בשינוי
      fetchData();
    }).subscribe();
    return () => { clearInterval(interval); supabase.removeChannel(sub); };
  }, []);

  const fetchData = async () => {
    const { data } = await supabase.from('orders').select('*').eq('delivery_date', new Date().toISOString().split('T')[0]);
    setOrders(data || []);
  };

  const getChameleonStyle = (dateStr: string, timeStr: string) => {
    const target = new Date(`${dateStr.replace(/-/g, '/')} ${timeStr}`);
    const diff = (target.getTime() - now.getTime()) / 60000; // דקות

    if (diff <= 0) return "bg-slate-100 border-slate-200 opacity-60 grayscale"; // הסתיים
    if (diff < 20) return "bg-[#FF4B4B]/5 border-[#FF4B4B]/30 animate-pulse-red"; // אדום ניאון
    if (diff < 60) return "bg-[#FFA33C]/5 border-[#FFA33C]/30 animate-pulse-orange"; // כתום
    return "bg-white border-slate-100 shadow-sm"; // ירוק-טורקיז (רגיל)
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-[#FDFDFD] p-8 font-sans" dir="rtl">
        <header className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#00C8A5] rounded-2xl flex items-center justify-center shadow-lg shadow-[#00C8A5]/20">
              <Bell className="text-white animate-bounce" size={24} />
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic">לוח משימות <span className="text-[#3D7AFE]">LIVE</span></h1>
          </div>
          <div className="text-left bg-white p-5 rounded-[2rem] shadow-xl border border-slate-50 min-w-[200px]">
            <p className="text-2xl font-black text-[#3D7AFE]">{now.toLocaleTimeString('he-IL')}</p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date().toLocaleDateString('he-IL')}</p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          <AnimatePresence>
            {orders.map((order) => (
              <motion.div
                key={order.id} layout
                className={`rounded-[2.5rem] p-8 border-2 transition-all duration-500 relative overflow-hidden ${getChameleonStyle(order.delivery_date, order.order_time)}`}
              >
                {/* אזור עליון: מידע עסקי */}
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900">{order.client_info}</h3>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">הזמנה #{order.order_number}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl">
                    {order.client_info?.includes('מכולה') ? <Box className="text-[#3D7AFE]" size={24} /> : <Truck className="text-[#00C8A5]" size={24} />}
                  </div>
                </div>

                {/* אזור מרכז: לוגיסטיקה */}
                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3 text-slate-500 font-bold text-sm">
                    <MapPin className="text-blue-400" size={18} /> {order.location}
                  </div>
                  <div className="flex items-center gap-3 text-slate-400 text-xs font-bold bg-slate-50 p-3 rounded-2xl inline-block">
                    אזור: {order.warehouse || "ראשי"} | {order.is_container ? "8 קוב" : "חומרים"}
                  </div>
                </div>

                {/* אזור תחתון: זמן ונהג */}
                <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 overflow-hidden border-2 border-white shadow-md">
                      <img src={`https://ui-avatars.com/api/?name=${order.driver_name}&background=3D7AFE&color=fff`} alt="driver" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-400 uppercase">נהג</span>
                      <span className="text-sm font-black text-slate-800">{order.driver_name}</span>
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="text-xl font-black text-slate-900 font-mono">{order.order_time}</div>
                    <div className="text-[9px] font-black text-[#00C8A5] uppercase tracking-tighter">זמן אספקה</div>
                  </div>
                </div>

                {/* כפתור AI מודרני */}
                <button 
                  onClick={() => setSelectedOrder(order)}
                  className="mt-8 w-full py-4 bg-[#F8FAFF] border border-[#3D7AFE]/10 text-[#3D7AFE] font-black rounded-2xl flex items-center justify-center gap-2 hover:bg-[#3D7AFE] hover:text-white transition-all shadow-sm"
                >
                  <Sparkles size={18} /> עדכן הזמנה עם AI
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {selectedOrder && (
            <ChatPopup order={selectedOrder} onClose={() => setSelectedOrder(null)} />
          )}
        </AnimatePresence>
      </div>

      <style jsx global>{`
        @keyframes pulse-red { 0%, 100% { border-color: rgba(255, 75, 75, 0.3); } 50% { border-color: rgba(255, 75, 75, 1); box-shadow: 0 0 20px rgba(255, 75, 75, 0.2); } }
        @keyframes pulse-orange { 0%, 100% { border-color: rgba(255, 163, 60, 0.3); } 50% { border-color: rgba(255, 163, 60, 1); } }
        .animate-pulse-red { animation: pulse-red 1.5s infinite; }
        .animate-pulse-orange { animation: pulse-orange 2s infinite; }
      `}</style>
    </AppLayout>
  );
}
