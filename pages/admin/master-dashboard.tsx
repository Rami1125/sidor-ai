'use client';
import React, { useState, useEffect, useRef } from 'react';
import AppLayout from '../../components/Layout';
import { supabase } from '../../lib/supabase';
import { 
  Truck, Box, MapPin, ChevronDown, Clock, 
  User, Calendar, Activity, CheckCircle2, AlertTriangle, BellRing,Archive
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import OneSignal from 'react-onesignal';

// 1. מילון תמונות נהגים וקבלנים (משודרג)
const AVATARS: Record<string, string> = {
  // נהגים
  'חכמת': 'https://i.postimg.cc/d3S0NJJZ/Screenshot-20250623-200646-Facebook.jpg',
  'עלי': 'https://i.postimg.cc/tCNbgXK3/Screenshot-20250623-200744-Tik-Tok.jpg',
  // קבלני מכולות
  'שארק 30': 'https://i.postimg.cc/6qH6mQYp/shark30-logo.jpg', // דוגמה ל-URL
  'כראדי 32': 'https://i.postimg.cc/xT0sM6yV/karadi32-logo.jpg', // דוגמה ל-URL
  'שי שרון': 'https://i.postimg.cc/Y9x9zYyF/shai-sharon-logo.jpg'  // דוגמה ל-URL
};

// אפקט קולי לפעולה (צלצול)
const playActionSound = () => {
  const audio = new Audio('/sounds/notification.mp3'); // וודא שהקובץ קיים ב-public/sounds
  audio.play().catch(e => console.log('Audio play failed:', e));
};

export default function MasterDashboard() {
  const [truckOrders, setTruckOrders] = useState<any[]>([]);
  const [containerOrders, setContainerOrders] = useState<any[]>([]);
  const [openStatusId, setOpenStatusId] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());
  const [lastAction, setLastAction] = useState<string | null>(null);
  const today = new Date().toISOString().split('T')[0];

  // 2. אתחול OneSignal ו-Realtime
  useEffect(() => {
    // אתחול OneSignal (החלף ב-App ID שלך)
    OneSignal.init({ appId: "YOUR_ONESIGNAL_APP_ID", allowLocalhostAsSecureOrigin: true });

    fetchData();

    // מנוע טיימרים (1 שניה)
    const timerInterval = setInterval(() => setNow(new Date()), 1000);

    // מנוע Realtime משופר עם צלצול והתראה
    const channel = supabase.channel('command_center_api')
      .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
        fetchData(); // רענון נתונים
        playActionSound(); // צלצול

        // יצירת הודעת התראה מפורטת
        let message = '';
        if (payload.eventType === 'INSERT') message = `✅ הוקמה הזמנה חדשה בטבלת ${payload.table}`;
        if (payload.eventType === 'DELETE') message = `🗑️ נמחקה רשומה מטבלת ${payload.table}`;
        if (payload.eventType === 'UPDATE') message = `🔄 עודכנה הזמנה בטבלת ${payload.table}`;
        
        setLastAction(message);
        setTimeout(() => setLastAction(null), 5000); // הסרת ההודעה אחרי 5 שניות
      })
      .subscribe();

    return () => {
      clearInterval(timerInterval);
      channel.unsubscribe();
    };
  }, []);

  const fetchData = async () => {
    const { data: o } = await supabase.from('orders').select('*').eq('delivery_date', today).neq('status', 'history');
    const { data: c } = await supabase.from('container_management').select('*').eq('is_active', true);
    setTruckOrders(o || []);
    setContainerOrders(c || []);
  };

  // 3. חישוב טיימר משודרג עם "הבהוב דחוף"
  const calculateTimer = (targetTime: string) => {
    if (!targetTime) return { text: '--:--:--', isPast: false, isUrgent: false, minutesLeft: 999 };
    const [hours, minutes] = targetTime.split(':').map(Number);
    const target = new Date();
    target.setHours(hours, minutes, 0, 0);
    const diff = target.getTime() - now.getTime();
    const minutesLeft = diff / 60000;
    const isPast = diff < 0;
    const absDiff = Math.abs(diff);
    const h = Math.floor(absDiff / 3600000);
    const m = Math.floor((absDiff % 3600000) / 60000);
    const s = Math.floor((absDiff % 60000) / 1000);

    return { 
      text: `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`, 
      isPast,
      minutesLeft,
      isUrgent: !isPast && minutesLeft < 60 // הבהוב אם נשארה פחות משעה
    };
  };

  const updateStatus = async (id: string, table: string, newStatus: string) => {
    await supabase.from(table).update({ status: newStatus }).eq('id', id);
    setOpenStatusId(null);
    fetchData();
  };

  // 4. רכיב כפתור סטטוס נפתח (מעוצב)
  const StatusPicker = ({ id, currentStatus, table }: { id: string, currentStatus: string, table: string }) => (
    <div className="relative">
      <button 
        onClick={(e) => { e.stopPropagation(); setOpenStatusId(openStatusId === id ? null : id); }}
        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black border transition-all ${
          currentStatus === 'approved' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-700'
        }`}
      >
        {currentStatus === 'approved' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
        {currentStatus === 'approved' ? 'מאושר' : 'ממתין'}
        <ChevronDown size={12} />
      </button>
      <AnimatePresence>
  {openStatusId === id && (
    <motion.div initial={{ opacity: 0, y: 5, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 5, scale: 0.95 }}
      className="absolute left-0 mt-2 w-36 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden"
    >
      {[
        { label: 'ממתין', val: 'pending', icon: <Clock size={12}/>, color: 'text-amber-600' },
        { label: 'מאושר', val: 'approved', icon: <CheckCircle2 size={12}/>, color: 'text-emerald-600' },
        { label: 'היסטוריה', val: 'history', icon: <Archive size={12}/>, color: 'text-slate-400' }
      ].map(s => (
        <button key={s.val} onClick={() => updateStatus(id, table, s.val)} className={`w-full text-right px-4 py-2.5 text-[11px] font-bold hover:bg-slate-50 flex items-center gap-2 ${s.color}`}>
          {s.icon} {s.label}
        </button>
      ))}
    </motion.div>
  )}
</AnimatePresence>>
    </div>
  );

  return (
    <AppLayout>
      <div className="min-h-screen bg-[#FBFBFC] p-4 lg:p-10 overflow-x-hidden" dir="rtl">
        
        {/* באנר עדכון פעולה (Realtime Notification) */}
        <AnimatePresence>
          {lastAction && (
            <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }}
              className="fixed top-20 right-4 lg:right-10 bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl z-[100] flex items-center gap-3 border border-slate-700"
            >
              <BellRing className="text-emerald-400 animate-pulse" size={18} />
              <span className="text-sm font-bold tracking-tight">{lastAction}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* סידור עבודה נהגים */}
        <section className="mb-16">
          <h2 className="text-2xl font-black italic mb-8 flex items-center gap-3 text-slate-800"><Truck className="text-emerald-600" /> סידור עבודה נהגים</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 overflow-x-auto pb-6 scrollbar-hide">
            {truckOrders.map(order => {
              const timer = calculateTimer(order.order_time);
              return (
                <div key={order.id} className={`bg-white p-7 rounded-[2.5rem] shadow-xl border relative transition-all min-w-[320px] ${timer.isUrgent ? 'border-amber-300 ring-2 ring-amber-100' : 'border-slate-100'}`}>
                  {/* הבהוב ויזואלי להזמנה דחופה (פחות משעה) */}
                  {timer.isUrgent && (
                    <div className="absolute top-6 left-6 flex items-center gap-1.5 bg-amber-500 text-white text-[9px] font-black px-3 py-1 rounded-full animate-pulse uppercase">
                      <AlertTriangle size={11} /> דחוף (שעה)
                    </div>
                  )}

                  <div className="flex justify-between items-start mb-6 pt-4">
                    <StatusPicker id={order.id} currentStatus={order.status} table="orders" />
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{order.driver_name}</span>
                  </div>
                  
                  <h3 className="text-2xl font-black tracking-tighter leading-none mb-1 text-slate-950">{order.client_info}</h3>
                  <p className="text-xs font-bold text-slate-400 mb-8 flex items-center gap-1"><MapPin size={12}/> {order.location}</p>
                  
                  <div className="flex justify-between items-end pt-5 border-t border-slate-100">
                    <div className="flex flex-col">
                      <span className={`text-3xl font-mono font-black tracking-tight ${timer.isPast ? 'text-red-500' : (timer.isUrgent ? 'text-amber-500' : 'text-slate-950')}`}>
                        {timer.isPast ? 'באיחור' : timer.text}
                      </span>
                      <span className="text-[11px] font-black text-slate-300">יעד: {order.order_time}</span>
                    </div>
                    <div className="text-center">
                       <img src={AVATARS[order.driver_name] || `https://ui-avatars.com/api/?name=${order.driver_name}`} className="w-14 h-14 rounded-2xl object-cover border-4 border-emerald-50 shadow-inner mb-1.5" />
                       <span className="text-[10px] font-black text-slate-400 block uppercase">{order.driver_name}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* מכולות והצבות (עם תמונות קבלנים) */}
        <section>
          <h2 className="text-2xl font-black italic mb-8 flex items-center gap-3 text-slate-800"><Box className="text-blue-600" /> מכולות והצבות</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 overflow-x-auto pb-6 scrollbar-hide">
            {containerOrders.map(c => {
              const timer = calculateTimer(c.order_time || '12:00');
              const daysDiff = Math.ceil(Math.abs(now.getTime() - new Date(c.start_date).getTime()) / (1000 * 60 * 60 * 24));
              
              return (
                <div key={c.id} className={`bg-white p-7 rounded-[2.5rem] shadow-xl border transition-all min-w-[320px] border-slate-100 border-r-[14px] border-r-blue-500`}>
                  
                  <div className="flex justify-between items-start mb-6">
                    <StatusPicker id={c.id} currentStatus={c.status} table="container_management" />
                    <span className="bg-blue-50 text-blue-700 text-[10px] font-black px-3.5 py-1 rounded-full uppercase tracking-tight">{c.action_type || 'הצבה'}</span>
                  </div>
                  
                  <h3 className="text-xl font-black text-slate-950 mb-1">{c.client_name}</h3>
                  <p className="text-xs font-bold text-slate-400 mb-8 flex items-center gap-1"><MapPin size={12}/> {c.delivery_address}</p>
                  
                  <div className="flex justify-between items-center gap-4 pt-5 border-t border-slate-100">
                    <div className="flex flex-col gap-1.5 w-full">
                        <div className="flex justify-between items-center text-[11px] font-black italic">
                          <span className="text-blue-600">{daysDiff} / 10 ימים</span>
                          <span className="text-slate-400 font-mono">{c.order_time}</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                          <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${Math.min((daysDiff / 10) * 100, 100)}%` }} />
                        </div>
                    </div>
                    {/* תמונת קבלן למכולות */}
                    <div className="text-center flex-shrink-0">
                       <img src={AVATARS[c.contractor_name] || `https://ui-avatars.com/api/?name=${c.contractor_name}&background=random`} className="w-12 h-12 rounded-xl object-cover border-2 border-blue-100 shadow-sm mb-1" alt={c.contractor_name} />
                       <span className="text-[9px] font-black text-slate-400 block uppercase leading-none">{c.contractor_name}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      </div>
    </AppLayout>
  );
}
