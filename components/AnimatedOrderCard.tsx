'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  MapPin,
  Truck,
  AlertCircle,
  Activity,
  Check
} from 'lucide-react';

export default function AnimatedOrderCard({
  order,
  now,
  warehouseLogo,
  onClick
}: any) {

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

  const t = calculateTime(order.delivery_date, order.order_time);

  const getCardColor = () => {
    if (t.expired) return "bg-gray-200 border-gray-400";
    if (t.ultra) return "bg-red-100 border-red-400 shadow-red-300 shadow-md";
    if (t.urgent) return "bg-orange-100 border-orange-300 shadow-orange-200 shadow";
    return "bg-green-100 border-green-300";
  };

  return (
    <motion.div
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{
        opacity: 1,
        y: 0,
        boxShadow: t.ultra
          ? "0 0 14px rgba(255,0,0,0.35)"
          : t.urgent
          ? "0 0 12px rgba(255,140,0,0.28)"
          : "0 0 6px rgba(0,200,0,0.20)"
      }}
      transition={{ duration: 0.35 }}
      className={`rounded-xl p-5 border cursor-pointer transition-all ${getCardColor()}`}
    >
      {/* HEADER */}
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-xl font-bold">{order.client_info}</h2>
        <div className="w-10 h-10">{warehouseLogo}</div>
      </div>

      {/* LOCATION */}
      <div className="flex items-center gap-2 text-gray-700 mb-2">
        <MapPin className="text-blue-600" size={20} />
        {order.location}
      </div>

      {/* TIMER */}
      <div className="flex items-center gap-2 text-gray-700 mb-3">
        <Clock className="text-yellow-600" size={20} />
        {!t.expired ? (
          <span className="font-bold text-2xl">
            {String(t.h).padStart(2, '0')}:
            {String(t.m).padStart(2, '0')}:
            {String(t.s).padStart(2, '0')}
          </span>
        ) : (
          <span className="text-gray-500">חלף</span>
        )}
      </div>

      {/* STATUS */}
      <div>
        {!t.expired ? (
          t.ultra ? (
            <div className="text-red-700 flex items-center gap-1 font-bold">
              <AlertCircle size={18} /> קריטי
            </div>
          ) : t.urgent ? (
            <div className="text-orange-600 flex items-center gap-1">
              <Activity size={18} /> דחוף
            </div>
          ) : (
            <div className="text-green-700 flex items-center gap-1">
              <Activity size={18} /> פעיל
            </div>
          )
        ) : (
          <div className="text-gray-600 flex items-center gap-1">
            <Check size={18} /> הסתיים
          </div>
        )}
      </div>
    </motion.div>
  );
}
