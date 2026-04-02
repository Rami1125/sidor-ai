'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '../../components/Layout';
import { supabase } from '../../lib/supabase';
import ChatPopup from 'admin/ChatPopup';

// אייקונים
import {
  Clock,
  MapPin,
  Truck,
  Box,
  Activity,
  Check,
  Bot,
  AlertCircle,
  ChevronDown
} from 'lucide-react';

import { motion, AnimatePresence } from 'framer-motion';

import AnimatedOrderCard from '../../components/AnimatedOrderCard';
import BottomSheet from '../../components/BottomSheet';
import WarehouseLogos from '../../components/WarehouseLogos';
import ContainerDetails from '../../components/ContainerDetails';

export default function LiveDashboard() {
  const [mounted, setMounted] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [containers, setContainers] = useState<any[]>([]);
  const [now, setNow] = useState(new Date());
  const [activeOrder, setActiveOrder] = useState<any | null>(null);

  useEffect(() => {
    setMounted(true);
    fetchData();
    const t = setInterval(() => setNow(new Date()), 1000);

    const channel = supabase
      .channel('live_full_sync')
      .on('postgres_changes', { event: '*', table: 'orders', schema: 'public' }, fetchData)
      .on('postgres_changes', { event: '*', table: 'container_management', schema: 'public' }, fetchData)
      .subscribe();

    return () => {
      clearInterval(t);
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    const today = new Date().toLocaleDateString('en-CA');

    // Orders
    const { data: orderData } = await supabase
      .from('orders')
      .select('*')
      .eq('delivery_date', today)
      .neq('status', 'deleted')
      .order('order_time', { ascending: true });

    // Containers
    const { data: containerData } = await supabase
      .from('container_management')
      .select('*')
      .order('created_at', { ascending: false });

    setOrders(orderData ?? []);
    setContainers(containerData ?? []);
  };

  const getContainerInfo = (order) => {
    // התאמת מכולה לפי שם לקוח / ID
    return containers.find((c) =>
      c.client_name?.includes(order.client_info?.split('/')[0]) ||
      c.order_number === order.order_number
    );
  };

  const onCardClick = (order) => {
    const containerInfo = getContainerInfo(order);
    setActiveOrder({ ...order, containerInfo });
  };

  const closeBottomSheet = () => {
    setActiveOrder(null);
  };

  if (!mounted) return null;

  return (
    <AppLayout>
      <div dir="rtl" className="p-6 bg-gray-50 min-h-screen">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-blue-800">לוח משימות LIVE</h1>
            <p className="text-gray-600">הצגת כל ההזמנות • מכולות • מחסנים • חיבור AI</p>
          </div>

          <div className="text-right">
            <p className="text-2xl font-semibold">{now.toLocaleTimeString('he-IL')}</p>
            <p className="text-gray-500">{new Date().toLocaleDateString('he-IL')}</p>
          </div>
        </div>

        {/* GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence>
            {orders.map((order) => (
              <AnimatedOrderCard
                key={order.id}
                order={order}
                now={now}
                warehouseLogo={WarehouseLogos(order.warehouse)}
                onClick={() => onCardClick(order)}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* BOTTOM SHEET DETAILS */}
        <AnimatePresence>
          {activeOrder && (
            <BottomSheet onClose={closeBottomSheet}>
              {/* תוכן מלא בתוך החלון המתגלש */}
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-gray-800">
                  {activeOrder.client_info}
                </h2>
                <p className="text-gray-500">{activeOrder.location}</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Clock className="text-yellow-600" />
                  <span className="font-semibold">
                    שעת אספקה: {activeOrder.order_time}
                  </span>
                </div>

                {activeOrder.warehouse && (
                  <div className="flex items-center gap-3">
                    {WarehouseLogos(activeOrder.warehouse)}
                    <span className="font-semibold">{activeOrder.warehouse}</span>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Truck className="text-blue-600" />
                  <span>{activeOrder.driver_name}</span>
                </div>
              </div>

              {/* פרטי מכולה */}
              {activeOrder.containerInfo && (
                <ContainerDetails container={activeOrder.containerInfo} />
              )}

              {/* כפתור AI */}
              <button className="
                fixed bottom-5 left-1/2 -translate-x-1/2
                bg-blue-600 hover:bg-blue-700 text-white
                px-6 py-3 rounded-full shadow-xl 
                flex items-center gap-2 text-lg font-bold
              ">
                <Bot size={22} />
                עדכן באמצעות AI
              </button>
            </BottomSheet>
          )}
        </AnimatePresence>

      </div>
    </AppLayout>
  );
}
