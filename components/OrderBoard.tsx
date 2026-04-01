'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Clock, User, MapPin, Truck, Box, Hash } from 'lucide-react';

export default function OrderBoard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
    const channel = supabase.channel('orders-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    // שליפה מותאמת לשמות העמודות ב-SQL שלך
    const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (!error) setOrders(data || []);
    setLoading(false);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-4 overflow-y-auto max-h-[85vh] scrollbar-hide">
      <AnimatePresence>
        {orders.map((order) => (
          <motion.div 
            layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            key={order.id}
            className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 relative group hover:shadow-2xl transition-all"
          >
            {/* סטטוס ויזואלי לפי עמודת status */}
            <div className={`absolute top-0 right-0 w-2 h-full ${order.status === 'approved' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
            
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-slate-50 rounded-2xl">
                {/* זיהוי מכולה לפי שם הנהג או התוכן */}
                {order.driver_name?.includes('שארק') ? <Box className="text-blue-500" /> : <Truck className="text-emerald-600" />}
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${order.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {order.status === 'approved' ? 'מאושר' : 'ממתין'}
                </span>
                <span className="text-[9px] font-bold text-slate-300">ID: {order.id.slice(0,8)}</span>
              </div>
            </div>

            {/* שם הלקוח נשלף מ-client_info */}
            <h3 className="text-xl font-black text-slate-900 mb-1 leading-tight">
              {order.client_info || "לקוח כללי"}
            </h3>
            
            {/* מיקום נשלף מ-location */}
            <div className="flex items-center gap-2 text-slate-400 text-[11px] font-bold mb-4">
               <MapPin size={12} /> {order.location || "לא צוין מיקום"}
            </div>

            {/* גוף הכרטיס - נתונים מה-DB שלך */}
            <div className="space-y-3 bg-slate-50 p-4 rounded-3xl border border-slate-100">
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2 text-slate-500 font-bold"><Clock size={14} /> שעה:</span>
                <span className="text-slate-900 font-black">{order.order_time || "--:--"}</span>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2 text-slate-500 font-bold"><Package size={14} /> מחסן:</span>
                <span className="text-slate-900 font-black italic">{order.warehouse || order.source_branch || "ראשי"}</span>
              </div>

              <div className="flex justify-between items-center text-sm border-t border-slate-200 pt-2 mt-2">
                <span className="flex items-center gap-2 text-slate-500 font-bold"><User size={14} /> נהג:</span>
                <span className="text-emerald-700 font-black uppercase">{order.driver_name || "טרם שובץ"}</span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2 text-slate-500 font-bold"><Hash size={14} /> הזמנה:</span>
                <span className="text-slate-900 font-black">#{order.order_number}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
