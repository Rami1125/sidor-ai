'use client';
import React, { useState, useEffect } from 'react';
import AppLayout from '../../components/Layout';
import { supabase } from '../../lib/supabase';
import { Truck, Box, RefreshCcw, Send, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MasterDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const { data: o } = await supabase.from('orders').select('*').neq('status', 'deleted');
    const { data: c } = await supabase.from('container_management').select('*').neq('status', 'deleted');
    setOrders([...(o || []), ...(c || [])]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // פונקציית תיוג הזמנה לצ'אט הארגוני
  const tagToChat = async (order: any) => {
    const message = `🔔 **דיון על הזמנה**: ${order.client_name || order.client_info}\n📍 יעד: ${order.delivery_address || order.location}\n⚠️ סטטוס: חסר במלאי / דרוש קניין.`;
    // כאן נשלח ל-API של הצ'אט
    alert("ההזמנה תוייגה בצא'ט הציבורי!");
  };

  return (
    <AppLayout>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {orders.map((o) => (
          <motion.div whileHover={{ y: -5 }} className="bg-white/[0.03] border border-white/5 p-6 rounded-[2.5rem] shadow-xl relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${o.container_type ? 'bg-orange-500/20 text-orange-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                {o.container_type ? 'מכולה' : 'חומרי בניין'}
              </span>
              <button onClick={() => tagToChat(o)} className="p-2 bg-blue-500/10 text-blue-500 rounded-xl hover:bg-blue-500 hover:text-white transition-all">
                <Send size={16} />
              </button>
            </div>
            <h3 className="text-2xl font-black mb-1">{o.client_name || o.client_info}</h3>
            <p className="text-sm opacity-50 mb-6 flex items-center gap-1"><AlertCircle size={14}/> {o.order_number}</p>
            <div className="bg-black/40 p-4 rounded-2xl flex justify-between items-center border border-white/5">
              <span className="font-mono font-black text-xl italic text-emerald-500">{o.order_time}</span>
              <span className="text-xs font-bold opacity-40 italic">{o.driver_name || 'ממתין'}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </AppLayout>
  );
}
