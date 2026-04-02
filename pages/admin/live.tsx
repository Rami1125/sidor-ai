'use client';

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import AppLayout from '../../components/Layout';
import { supabase } from '../../lib/supabase';

// איקונים, ללא שינוי
import {
  Clock,
  MapPin,
  Truck,
  Box,
  Activity,
  CheckCheck,
  Bot,
  AlertCircle
} from 'lucide-react';

import { motion, AnimatePresence } from 'framer-motion';
import ChatPopup from 'admin/ChatPopup';

const DRIVERS = [
  { name: 'חכמת', img: 'https://i.postimg.cc/d3S0NJJZ/Screenshot-20250623-200646-Facebook.jpg' },
  { name: 'עלי', img: 'https://i.postimg.cc/tCNbgXK3/Screenshot-20250623-200744-Tik-Tok.jpg' }
];

const RAMI_AVATAR =
  "https://raw.githubusercontent.com/Rami1125/sidor-ai/refs/heads/main/public/rami-avatar.jpg";

export default function MasterDashboard() {
  const [mounted, setMounted] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [now, setNow] = useState(new Date());
  const [activeOrder, setActiveOrder] = useState<any | null>(null);

  useEffect(() => {
    setMounted(true);
    fetchData();
    const t = setInterval(() => setNow(new Date()), 1000);

    // שינוי בזמן אמת
    const channel = supabase
      .channel('master_live_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, onOrderChange)
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
      .order('order_time');

    setOrders(data ?? []);
  };

  const onOrderChange = (payload: any) => {
    fetchData();
    playAlertSound();

    // פנייה לשרת שלך כדי לשלוח התראה
    if (payload.new?.client_info) {
      fetch("https://your-server.com/send-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: payload.new.client_info,
          orderId: payload.new.id
        })
      });
    }
  };

  const playAlertSound = () => {
    const audio = new Audio('/alert-sound.mp3');
    audio.volume = 0.5;
    audio.play();
  };

  const calculateTime = (dateStr: string, timeStr: string) => {
    if (!timeStr) return { expired: true };
    const target = new Date(`${dateStr.replace(/-/g, '/')} ${timeStr}`);
    const diff = target.getTime() - now.getTime();

    if (diff <= 0) return { expired: true };

    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);

    return { expired: false, h, m, s, urgent: diff < 3600000, nearly: diff < 1200000 };
  };

  const getCardColor = (t: any) => {
    if (t.expired) return "bg-gray-200 border-gray-300";
    if (t.urgent && t.nearly) return "bg-red-100 border-red-400";
    if (t.urgent) return "bg-orange-100 border-orange-400";
    return "bg-green-100 border-green-300";
  };

  if (!mounted) return null;

  return (
    <AppLayout>
      <Head>
        <title>Master Dashboard</title>
      </Head>

      {/* עיצוב כללי */}
      <div dir="rtl" className="p-6 bg-gray-50 min-h-screen">

        {/* כותרת */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-blue-600">Master Dashboard</h1>
            <p className="text-gray-600">מערכת חיה בזמן אמת</p>
          </div>

          <div className="text-right">
            <p className="text-2xl font-semibold">{now.toLocaleTimeString('he-IL')}</p>
            <p className="text-gray-500">{new Date().toLocaleDateString('he-IL')}</p>
          </div>
        </div>

        {/* גריד כרטיסים */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence>
            {orders.length > 0 ? (
              orders.map((order) => {
                const t = calculateTime(order.delivery_date, order.order_time);
                const cardColor = getCardColor(t);
                const driver = DRIVERS.find((d) => d.name === order.driver_name);

                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`rounded-xl shadow-md border p-5 ${cardColor}`}
                  >
                    {/* כותרת */}
                    <div className="flex justify-between items-center mb-2">
                      <h2 className="font-bold text-xl">{order.client_info}</h2>
                      {!t.expired ? (
                        t.urgent ? (
                          <span className="text-red-600 flex items-center gap-1">
                            <AlertCircle size={18} /> דחוף
                          </span>
                        ) : (
                          <span className="text-green-600 flex items-center gap-1">
                            <Activity size={18} /> פעיל
                          </span>
                        )
                      ) : (
                        <span className="text-gray-500 flex items-center gap-1">
                          <CheckCheck size={18} /> הסתיים
                        </span>
                      )}
                    </div>

                    {/* פרטים */}
                    <div className="text-gray-800 space-y-1">
                      <div className="flex items-center gap-2">
                        <MapPin size={20} className="text-blue-600" />
                        {order.location}
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock size={20} className="text-yellow-500" />
                        {!t.expired ? (
                          <span className="font-bold text-lg">
                            {String(t.h).padStart(2, '0')}:
                            {String(t.m).padStart(2, '0')}:
                            {String(t.s).padStart(2, '0')}
                          </span>
                        ) : (
                          "חלף"
                        )}
                      </div>

                      {order.container_number && (
                        <div className="flex items-center gap-2">
                          <Box size={20} className="text-purple-600" />
                          מכולה: {order.container_number}
                        </div>
                      )}
                    </div>

                    {/* נהג */}
                    <div className="flex items-center gap-3 mt-4">
                      <img
                        src={driver?.img ?? RAMI_AVATAR}
                        className="w-12 h-12 rounded-full object-cover border border-gray-400"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = RAMI_AVATAR;
                        }}
                      />

                      <div>
                        <p className="text-gray-700 font-bold">נהג:</p>
                        <p className="text-gray-600">{order.driver_name}</p>
                      </div>
                    </div>

                    {/* כפתור AI */}
                    <button
                      onClick={() => setActiveOrder(order)}
                      className="mt-5 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg flex items-center justify-center gap-2"
                    >
                      <Bot size={20} />
                      עדכן הזמנה עם AI
                    </button>
                  </motion.div>
                );
              })
            ) : (
              <p className="text-gray-600">אין משימות להיום</p>
            )}
          </AnimatePresence>
        </div>

        {/* פופ-אפ AI */}
        {activeOrder && (
          <ChatPopup order={activeOrder} onClose={() => setActiveOrder(null)} />
        )}
      </div>
    </AppLayout>
  );
}
