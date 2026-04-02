'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '../../components/Layout';
import { supabase } from '../../lib/supabase';

import {
  Clock,
  MapPin,
  Truck,
  Box,
  Activity,
  Check,
  Bot,
  AlertCircle
} from 'lucide-react';

import { motion, AnimatePresence } from 'framer-motion';
import ChatPopup from '../../components/ChatPopup2';

const DRIVERS = [
  { name: 'חכמת', img: 'https://i.postimg.cc/d3S0NJJZ/Screenshot-20250623-200646-Facebook.jpg' },
  { name: 'עלי', img: 'https://i.postimg.cc/tCNbgXK3/Screenshot-20250623-200744-Tik-Tok.jpg' }
];

const RAMI_AVATAR =
  "https://raw.githubusercontent.com/Rami1125/sidor-ai/refs/heads/main/public/rami-avatar.jpg";

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [now, setNow] = useState(new Date());
  const [activeOrder, setActiveOrder] = useState<any | null>(null);

  useEffect(() => {
    setMounted(true);
    fetchData();

    const t = setInterval(() => setNow(new Date()), 1000);

    const channel = supabase
      .channel('dashboard_live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        onOrderChanged
      )
      .subscribe();

    return () => {
      clearInterval(t);
      supabase.removeChannel(channel);
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

    setOrders(data ?? []);
  };

  const onOrderChanged = (payload: any) => {
    fetchData();
    playSound();
  };

  const playSound = () => {
    const snd = new Audio('/alert-sound.mp3');
    snd.volume = 0.5;
    snd.play();
  };

  const calculateTime = (dateStr: string, timeStr: string) => {
    if (!timeStr) return { expired: true };
    const target = new Date(`${dateStr} ${timeStr}`);
    const diff = target.getTime() - now.getTime();

    if (diff <= 0) return { expired: true };

    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);

    return {
      expired: false,
      h,
      m,
      s,
      urgent: diff < 3600000,
      ultra: diff < 1200000
    };
  };

  const getCardClass = (t: any) => {
    if (t.expired) return "bg-gray-200 border-gray-400";
    if (t.ultra) return "bg-red-100 border-red-500 shadow-red-300 shadow-sm";
    if (t.urgent) return "bg-orange-100 border-orange-400 shadow-orange-200 shadow-sm";
    return "bg-green-100 border-green-300";
  };

  if (!mounted) return null;

  return (
    <AppLayout>
      <div dir="rtl" className="p-6 bg-gray-50 min-h-screen">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-blue-700">לוח משימות LIVE</h1>
            <p className="text-gray-500">ניטור בזמן אמת • תפעול שוטף • AI Supervisor</p>
          </div>

          <div className="text-right">
            <p className="text-2xl font-bold">{now.toLocaleTimeString('he-IL')}</p>
            <p className="text-gray-500">{new Date().toLocaleDateString('he-IL')}</p>
          </div>
        </div>

        {/* GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {orders.map((order) => {
              const t = calculateTime(order.delivery_date, order.order_time);
              const cardColor = getCardClass(t);
              const driver = DRIVERS.find((x) => x.name === order.driver_name);

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  whileHover={{ scale: 1.02 }}
                  className={`rounded-xl p-6 border shadow-lg transition-all ${cardColor}`}
                >
                  {/* TOP ROW */}
                  <div className="flex justify-between items-center mb-3">
                    <h2 className="text-xl font-bold text-gray-800">{order.client_info}</h2>

                    {!t.expired ? (
                      t.ultra ? (
                        <span className="text-red-700 flex items-center gap-1 font-bold">
                          <AlertCircle size={18} /> קריטי
                        </span>
                      ) : t.urgent ? (
                        <span className="text-orange-600 flex items-center gap-1">
                          <Activity size={18} /> דחוף
                        </span>
                      ) : (
                        <span className="text-green-700 flex items-center gap-1">
                          <Activity size={18} /> פעיל
                        </span>
                      )
                    ) : (
                      <span className="text-gray-600 flex items-center gap-1">
                        <Check size={18} /> הסתיים
                      </span>
                    )}
                  </div>

                  {/* LOCATION */}
                  <div className="flex items-center gap-2 text-gray-700 mb-2">
                    <MapPin size={20} className="text-blue-600" />
                    {order.location}
                  </div>

                  {/* TIMER */}
                  <div className="flex items-center gap-2 text-gray-700 mb-2">
                    <Clock size={20} className="text-yellow-500" />

                    {!t.expired ? (
                      <span className="font-bold text-2xl tracking-wider">
                        {String(t.h).padStart(2, '0')}:
                        {String(t.m).padStart(2, '0')}:
                        {String(t.s).padStart(2, '0')}
                      </span>
                    ) : (
                      "חלף"
                    )}
                  </div>

                  {/* CONTAINER */}
                  {order.container_number && (
                    <div className="flex items-center gap-2 text-gray-700 mb-2">
                      <Box size={20} className="text-purple-600" />
                      מכולה: {order.container_number}
                    </div>
                  )}

                  {/* DRIVER */}
                  <div className="flex items-center gap-3 mt-4">
                    <img
                      src={driver?.img || RAMI_AVATAR}
                      className="w-12 h-12 rounded-xl object-cover border border-gray-300"
                    />

                    <div>
                      <p className="text-gray-700 font-bold">נהג:</p>
                      <p className="text-gray-600">{order.driver_name}</p>
                    </div>
                  </div>

                  {/* AI BUTTON */}
                  <button
                    onClick={() => setActiveOrder(order)}
                    className="mt-5 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl flex items-center justify-center gap-2 shadow-md"
                  >
                    <Bot size={20} />
                    עדכן הזמנה עם AI
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* AI POPUP */}
        {activeOrder && (
          <ChatPopup order={activeOrder} onClose={() => setActiveOrder(null)} />
        )}
      </div>
    </AppLayout>
  );
}
