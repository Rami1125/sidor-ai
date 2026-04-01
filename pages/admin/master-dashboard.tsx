'use client';
import React, { useState, useEffect } from 'react';
import AppLayout from '../../components/Layout';
import { supabase } from '../../lib/supabase';
import { 
  Truck, Box, MapPin, ChevronDown, CheckCircle2, 
  Clock, AlertCircle, Trash2, Archive 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MasterDashboard() {
  const [truckOrders, setTruckOrders] = useState<any[]>([]);
  const [containerOrders, setContainerOrders] = useState<any[]>([]);
  const [openStatusId, setOpenStatusId] = useState<string | null>(null);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetchData();
    const channel = supabase.channel('live_sync').on('postgres_changes', { event: '*', schema: 'public' }, fetchData).subscribe();
    return () => { channel.unsubscribe(); };
  }, []);

  const fetchData = async () => {
    const { data: o } = await supabase.from('orders').select('*').eq('delivery_date', today).neq('status', 'history');
    const { data: c } = await supabase.from('container_management').select('*').eq('is_active', true);
    setTruckOrders(o || []);
    setContainerOrders(c || []);
  };

  const updateStatus = async (id: string, table: string, newStatus: string) => {
    const { error } = await supabase.from(table).update({ status: newStatus }).eq('id', id);
    if (!error) {
      setOpenStatusId(null);
      fetchData();
    }
  };

  // רכיב כפתור סטטוס נפתח
  const StatusPicker = ({ id, currentStatus, table }: { id: string, currentStatus: string, table: string }) => (
    <div className="relative">
      <button 
        onClick={() => setOpenStatusId(openStatusId === id ? null : id)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black transition-all border ${
          currentStatus === 'approved' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 
          currentStatus === 'pending' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-slate-50 border-slate-200 text-slate-700'
        }`}
      >
        {currentStatus === 'approved' ? 'מאושר' : currentStatus === 'pending' ? 'ממתין' : 'בוצע'}
        <ChevronDown size={12} />
      </button>

      <AnimatePresence>
        {openStatusId === id && (
          <motion.div 
            initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
            className="absolute left-0 mt-2 w-32 bg-white rounded-2xl shadow-2xl border border-slate-100 z-[100] overflow-hidden"
          >
            {[
              { label: 'ממתין', val: 'pending', color: 'text-amber-600' },
              { label: 'מאושר', val: 'approved', color: 'text-emerald-600' },
              { label: 'היסטוריה', val: 'history', color: 'text-slate-400' }
            ].map(s => (
              <button 
                key={s.val}
                onClick={() => updateStatus(id, table, s.val)}
                className={`w-full text-right px-4 py-2 text-[11px] font-bold hover:bg-slate-50 transition-colors ${s.color}`}
              >
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
      <div className="p-4 lg:p-8 bg-[#F8F9FA] min-h-screen" dir="rtl">
        
        {/* סקציה 1: הובלות חומרי בניין (חכמת/עלי) */}
        <section className="mb-12">
          <h2 className="flex items-center gap-2 text-xl font-black italic mb-6 text-slate-800">
            <Truck className="text-emerald-600" /> סידור עבודה נהגים
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {truckOrders.map(order => (
              <div key={order.id} className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100 relative">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{order.driver_name}</span>
                  <StatusPicker id={order.id} currentStatus={order.status} table="orders" />
                </div>
                <h3 className="text-2xl font-black tracking-tighter mb-1">{order.client_info}</h3>
                <p className="text-xs font-bold text-slate-400 flex items-center gap-1 mb-6"><MapPin size={12}/> {order.location}</p>
                <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full animate-pulse ${order.status === 'approved' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    <span className="font-mono font-black text-lg">{order.order_time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* סקציה 2: מכולות (מתחת להובלות) */}
        <section>
          <h2 className="flex items-center gap-2 text-xl font-black italic mb-6 text-slate-800">
            <Box className="text-blue-600" /> מכולות והצבות
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {containerOrders.map(container => (
              <div key={container.id} className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100 border-r-8 border-r-blue-500">
                <div className="flex justify-between items-start mb-4">
                  <span className="bg-blue-50 text-blue-700 text-[9px] font-black px-3 py-1 rounded-full">{container.contractor_name}</span>
                  <StatusPicker id={container.id} currentStatus={container.status} table="container_management" />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-1">{container.client_name}</h3>
                <p className="text-xs font-bold text-slate-400 mb-6 flex items-center gap-1"><MapPin size={12}/> {container.delivery_address}</p>
                <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                   <div className="text-sm font-black text-slate-800">{container.container_size || '8 קוב'}</div>
                   <div className="font-mono font-black text-blue-600 italic">{container.order_time || '12:00'}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </AppLayout>
  );
}
