'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '../../components/Layout';
import { supabase } from '../../lib/supabase';

// אייקונים קיימים — ללא שינוי
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

// נהגים – ללא שינוי
const DRIVERS = [
  { name: 'חכמת', img: 'https://i.postimg.cc/d3S0NJJZ/Screenshot-20250623-200646-Facebook.jpg' },
  { name: 'עלי', img: 'https://i.postimg.cc/tCNbgXK3/Screenshot-20250623-200744-Tik-Tok.jpg' }
];

const RAMI_AVATAR =
  "https://media-mrs2-2.cdn.whatsapp.net/v/t61.24694-24/620186722_866557896271587_5747987865837500471_n.jpg?stp=dst-jpg_s96x96_tt6&ccb=11-4&oh=01_Q5Aa4AG_JCByU59rXu4ybPiRgaD2riDMbb0ujm-XlzxUbmgPXA&oe=69D7EBEB&_nc_sid=5e03e0&_nc_cat=111";

export default function SabanDashboard() {
  const [mounted, setMounted] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    setMounted(true);
    fetchData();

    const t = setInterval(() => setNow(new Date()), 1000);

    const channel = supabase
      .channel('dashboard_live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        fetchData
      )
      .subscribe();

    return () => {
      clearInterval(t);
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('delivery_date', today)
      .neq('status', 'deleted');

    setOrders(data ?? []);
  };

  const calculateTime = (target: string) => {
    const diff = new Date(target).getTime() - now.getTime();
    if (diff <= 0) return { expired: true };

    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);

    return { expired: false, h, m, s, urgent: diff < 3600000 };
  };

  if (!mounted) return null;

  return (
    <AppLayout>
      <div dir="rtl" className="p-6 w-full">
        
        {/* כותרת הדשבורד */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-[#00c89d]">לוח משימות LIVE</h2>
            <p className="text-gray-400 mt-1">מחובר בזמן אמת למאגר המרכזי</p>
          </div>

          {/* זמן ושעה */}
          <div className="text-right">
            <p className="text-2xl font-semibold text-white">{now.toLocaleTimeString('he-IL')}</p>
            <p className="text-gray-400">{new Date().toLocaleDateString('he-IL')}</p>
          </div>
        </div>

        {/* גריד כרטיסים */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          <AnimatePresence>
            {orders.length > 0 ? (
              orders.map((order) => {
                const t = calculateTime(`${order.delivery_date}T${order.order_time}`);

                const driverImg =
                  DRIVERS.find((d) => d.name === order.driver_name)?.img || RAMI_AVATAR;

                return (
                  <motion.div
                    key={order.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="
                      glass-card rounded-xl p-5 shadow-xl relative
                      border border-white/10 backdrop-blur-md
                      bg-white/10 hover:bg-white/20 transition
                      cursor-pointer
                    "
                  >
                    {/* תצוגת סטטוס */}
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-white font-semibold flex items-center gap-2">
                        <Truck size={20} className="text-emerald-300" />
                        הובלה #{order.id.slice(0, 5)}
                      </span>

                      {!t.expired ? (
                        t.urgent ? (
                          <span className="text-red-400 text-sm flex items-center gap-1">
                            <AlertCircle size={16} />
                            דחוף
                          </span>
                        ) : (
                          <span className="text-emerald-400 text-sm flex items-center gap-1">
                            <Activity size={16} />
                            פעיל
                          </span>
                        )
                      ) : (
                        <span className="text-gray-400 text-sm flex items-center gap-1">
                          <CheckCheck size={16} />
                          בוצע / חלף
                        </span>
                      )}
                    </div>

                    {/* מידע */}
                    <div className="space-y-2 text-white">
                      <p className="font-semibold text-lg">{order.client_info}</p>

                      <div className="flex items-center gap-2 text-gray-200">
                        <MapPin size={18} className="text-blue-300" />
                        {order.location}
                      </div>

                      {/* טיימר */}
                      <div className="flex items-center gap-2 text-gray-200">
                        <Clock size={18} className="text-yellow-300" />
                        {!t.expired ? (
                          <span className="font-bold text-xl">
                            {String(t.h).padStart(2, '0')}:
                            {String(t.m).padStart(2, '0')}:
                            {String(t.s).padStart(2, '0')}
                          </span>
                        ) : (
                          <span className="text-gray-400">המשימה הסתיימה</span>
                        )}
                      </div>

                      <p className="text-gray-300">שעת אספקה: {order.order_time}</p>
                    </div>

                    {/* נהג מבצע */}
                    <div className="flex items-center gap-3 mt-4">
                      <img
                        src={driverImg}
                        className="w-12 h-12 rounded-2xl object-cover border-2 border-emerald-400 shadow-md"
                      />
                      <div>
                        <p className="text-white font-semibold">נהג מבצע</p>
                        <p className="text-gray-300">{order.driver_name}</p>
                      </div>
                    </div>

                    {/* כפתור AI */}
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      className="
                        mt-5 w-full flex items-center justify-center gap-2
                        bg-[#00c89d]/80 hover:bg-[#00c89d]
                        text-black font-bold py-2 rounded-xl
                        shadow-inner
                      "
                    >
                      <Bot size={20} />
                      עריכה עם AI
                    </motion.button>
                  </motion.div>
                );
              })
            ) : (
              <p className="text-gray-300 text-lg">אין משימות פעילות להיום</p>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* עיצוב Glass */}
      <style>{`
        .glass-card {
          background: rgba(255, 255, 255, 0.12);
          border-radius: 16px;
          backdrop-filter: blur(10px);
        }
      `}</style>
    </AppLayout>
  );
}
