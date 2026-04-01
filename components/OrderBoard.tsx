'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Clock, MapPin, Truck, Box, Hash, UserCircle } from 'lucide-react';

export default function OrderBoard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
    const channel = supabase.channel('orders-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    // שליפת נתונים מהטבלה שלך
    const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (!error) setOrders(data || []);
    setLoading(false);
  };

  if (loading && orders.length === 0) return <div className="p-10 text-center font-black text-slate-400 animate-pulse">מתחבר למאגר נתונים...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-4 overflow-y-auto max-h-[85vh] scrollbar-hide" dir="rtl">
      <AnimatePresence>
        {orders.map((order) => (
          <motion.div 
            layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            key={order.id}
            className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 relative group hover:shadow-2xl transition-all"
          >
            {/* סטטוס צדדי - ירוק למאושר, כתום לכל השאר */}
            <div className={`absolute top-0 right-0 w-2 h-full ${order.status === 'approved' ? 'bg-emerald-500' : 'bg-orange-400'}`} />
            
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-slate-50 rounded-2xl">
                {/* לוגיקה חכמה: אם זה נהג מכולה (שארק/שי שרון) הצג אייקון מכולה, אחרת משאית */}
                {(order.driver_name?.includes('שארק') || order.client_info?.includes('מכולה')) ? 
                  <Box className="text-blue-500" size={24} /> : 
                  <Truck className="text-emerald-600" size={24} />
                }
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${order.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                  {order.status === 'approved' ? 'מאושר' : 'ממתין'}
                </span>
                <span className="text-[9px] font-bold text-slate-300 italic">#{order.order_number || 'N/A'}</span>
              </div>
            </div>

            {/* נתון ליבה: client_info */}
            <h3 className="text-xl font-black text-slate-900 mb-1 leading-tight min-h-[3rem]">
              {order.client_info || "לקוח לא ידוע"}
            </h3>
            
            {/* נתון מיקום: location */}
            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold mb-4">
               <MapPin size={14} className="text-emerald-500" /> {order.location || "מיקום טרם עודכן"}
            </div>

            {/* פירוט נתונים מה-DB שלך */}
            <div className="space-y-3 bg-slate-50 p-4 rounded-[2rem] border border-slate-100">
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2 text-slate-500 font-bold"><Clock size={16} /> שעה:</span>
                <span className="text-slate-900 font-black">{order.order_time || "גמיש"}</span>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2 text-slate-500 font-bold"><Package size={16} /> סניף/מחסן:</span>
                <span className="text-slate-900 font-black italic">{order.warehouse || order.source_branch || "ראשי"}</span>
              </div>

              <div className="flex justify-between items-center text-sm border-t border-slate-200 pt-2 mt-2">
                <span className="flex items-center gap-2 text-slate-500 font-bold"><UserCircle size={16} /> נהג מבצע:</span>
                <span className="text-emerald-700 font-black">{order.driver_name || "טרם שובץ"}</span>
              </div>
            </div>

            {/* תאריך אספקה */}
            <div className="mt-4 text-[10px] text-slate-300 font-bold text-left">
              תאריך: {order.delivery_date || "היום"}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
