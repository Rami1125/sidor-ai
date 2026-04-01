'use client';
import React, { useState, useEffect } from 'react';
import AppLayout from '../../components/Layout';
import { supabase } from '../../lib/supabase';
import { 
  Truck, Box, MapPin, ChevronDown, Clock, 
  User, Calendar, Activity, CheckCircle2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DRIVERS = {
  'חכמת': 'https://i.postimg.cc/d3S0NJJZ/Screenshot-20250623-200646-Facebook.jpg',
  'עלי': 'https://i.postimg.cc/tCNbgXK3/Screenshot-20250623-200744-Tik-Tok.jpg'
};

export default function MasterDashboard() {
  const [truckOrders, setTruckOrders] = useState<any[]>([]);
  const [containerOrders, setContainerOrders] = useState<any[]>([]);
  const [openStatusId, setOpenStatusId] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());
  const today = new Date().toISOString().split('T')[0];
  
// 1. וודא שיש לך את ה-State של הזמן הנוכחי בראש הקומפוננטה
const [now, setNow] = useState(new Date());

useEffect(() => {
  // טעינה ראשונית של הנתונים
  fetchData();

  // מנוע הטיימר: מעדכן את now בכל שנייה ומכריח את ה-UI להתרענן
  const timer = setInterval(() => {
    setNow(new Date());
  }, 1000);

  // מנוע Realtime: מאזין לשינויים ב-Supabase
  const channel = supabase
    .channel('master-live-sync')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'orders' },
      () => fetchData()
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'container_management' },
      () => fetchData()
    )
    .subscribe();

  // ניקוי משאבים: חשוב מאוד כדי למנוע כפילויות וזליגת זיכרון
  return () => {
    clearInterval(timer);
    supabase.removeChannel(channel);
  };
}, []);

// 2. פונקציית השליפה נשארת כפי שהייתה
const fetchData = async () => {
  const today = new Date().toISOString().split('T')[0];
  const { data: o } = await supabase.from('orders')
    .select('*')
    .eq('delivery_date', today)
    .neq('status', 'history');
    
  const { data: c } = await supabase.from('container_management')
    .select('*')
    .eq('is_active', true);

  setTruckOrders(o || []);
  setContainerOrders(c || []);
};
  const updateStatus = async (id: string, table: string, newStatus: string) => {
    await supabase.from(table).update({ status: newStatus }).eq('id', id);
    setOpenStatusId(null);
    fetchData();
  };

  const StatusPicker = ({ id, currentStatus, table }: { id: string, currentStatus: string, table: string }) => (
    <div className="relative">
      <button 
        onClick={(e) => { e.stopPropagation(); setOpenStatusId(openStatusId === id ? null : id); }}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black border transition-all ${
          currentStatus === 'approved' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-700'
        }`}
      >
        {currentStatus === 'approved' ? 'מאושר' : 'ממתין'}
        <ChevronDown size={12} />
      </button>
      <AnimatePresence>
        {openStatusId === id && (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
            className="absolute left-0 mt-2 w-32 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden"
          >
            {[{ label: 'ממתין', val: 'pending' }, { label: 'מאושר', val: 'approved' }, { label: 'היסטוריה', val: 'history' }].map(s => (
              <button key={s.val} onClick={() => updateStatus(id, table, s.val)} className="w-full text-right px-4 py-2 text-[11px] font-bold hover:bg-slate-50">
                {s.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <AppLayout>
      <div className="min-h-screen bg-[#F8F9FA] p-4 lg:p-10 overflow-x-hidden" dir="rtl">
        
{/* סידור עבודה נהגים */}
<section className="mb-16">
  <h2 className="text-2xl font-black italic mb-8 flex items-center gap-3 text-slate-800">
    <Truck className="text-emerald-600" /> סידור עבודה נהגים
  </h2>
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 overflow-x-auto pb-4 scrollbar-hide">
    {truckOrders.map(order => {
      const timer = calculateTimer(order.order_time);
      // מילון תמונות נהגים מקומי - וודא שזה מוגדר גם מחוץ ל-return
      const DRIVER_IMAGES: Record<string, string> = {
        'חכמת': 'https://i.postimg.cc/d3S0NJJZ/Screenshot-20250623-200646-Facebook.jpg',
        'עלי': 'https://i.postimg.cc/tCNbgXK3/Screenshot-20250623-200744-Tik-Tok.jpg'
      };

      return (
        <div key={order.id} className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100 relative group min-w-[300px]">
          {/* חלק עליון: סטטוס ושם נהג */}
          <div className="flex justify-between items-start mb-6">
            <StatusPicker id={order.id} currentStatus={order.status} table="orders" />
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{order.driver_name}</span>
              {order.order_number && (
                <span className="text-[9px] font-mono font-bold text-emerald-600">#{order.order_number}</span>
              )}
            </div>
          </div>

          {/* תוכן מרכזי: לקוח ומיקום */}
          <h3 className="text-2xl font-black tracking-tighter leading-none mb-1">{order.client_info}</h3>
          <p className="text-xs font-bold text-slate-400 mb-4 flex items-center gap-1">
            <MapPin size={12}/> {order.location}
          </p>

          {/* תיוג מחסן */}
          {order.warehouse && (
            <div className="mb-8 inline-flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              <span className="text-[10px] font-black text-slate-500 uppercase">{order.warehouse}</span>
            </div>
          )}
          
          {/* חלק תחתון: טיימר ותמונת נהג */}
          <div className="flex justify-between items-end pt-4 border-t border-slate-50">
            <div className="flex flex-col">
              <span className={`text-2xl font-mono font-black ${timer.isPast ? 'text-red-500' : (timer.isUrgent ? 'text-amber-500 animate-pulse' : 'text-slate-900')}`}>
                {timer.isPast ? 'באיחור' : timer.text}
              </span>
              <span className="text-[10px] font-black text-slate-300">יעד: {order.order_time}</span>
            </div>

            <div className="text-center flex flex-col items-center gap-1">
               <div className="relative">
                 <img 
                   src={DRIVER_IMAGES[order.driver_name] || `https://ui-avatars.com/api/?name=${order.driver_name}&background=random`} 
                   className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-500 shadow-md" 
                   alt={order.driver_name}
                 />
                 {order.status === 'approved' && (
                   <div className="absolute -top-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 border-2 border-white">
                     <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                   </div>
                 )}
               </div>
               <span className="text-[9px] font-black text-slate-400 uppercase">{order.driver_name}</span>
            </div>
          </div>
        </div>
      );
    })}
  </div>
</section>

        {/* מכולות והצבות */}
        <section>
          <h2 className="text-2xl font-black italic mb-8 flex items-center gap-3 text-slate-800"><Box className="text-blue-600" /> מכולות והצבות</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 overflow-x-auto pb-4 scrollbar-hide">
            {containerOrders.map(c => {
              const timer = calculateTimer(c.order_time || '12:00');
              const daysDiff = Math.ceil(Math.abs(now.getTime() - new Date(c.start_date).getTime()) / (1000 * 60 * 60 * 24));
              return (
                <div key={c.id} className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100 border-r-[12px] border-r-blue-500 min-w-[300px]">
                  <div className="flex justify-between items-start mb-6">
                    <StatusPicker id={c.id} currentStatus={c.status} table="container_management" />
                    <span className="bg-blue-50 text-blue-700 text-[9px] font-black px-3 py-1 rounded-full uppercase">{c.contractor_name}</span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-1">{c.client_name}</h3>
                  <p className="text-xs font-bold text-slate-400 mb-8 flex items-center gap-1"><MapPin size={12}/> {c.delivery_address}</p>
                  
                  <div className="space-y-4">
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: `${Math.min((daysDiff / 10) * 100, 100)}%` }} />
                    </div>
                    <div className="flex justify-between items-center text-[11px] font-black italic">
                      <span className="text-blue-600">{daysDiff} / 10 ימים</span>
                      <span className="text-slate-400 font-mono">{c.order_time}</span>
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
