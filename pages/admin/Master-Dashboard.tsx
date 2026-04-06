// pages/admin/master-dashboard.tsx
'use client';
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import AppLayout from '../../components/Layout';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, MapPin, Truck, Box, AlertCircle, 
  User, Bell, Sparkles, Send, X, Bot,
  Monitor, Smartphone, Moon, Sun, Filter
} from 'lucide-react';
import { ChatPopup } from '../../components/ChatPopup';

export default function MasterDashboard() {
  const [mounted, setMounted] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [now, setNow] = useState(new Date());
  const [isDarkMode, setIsDarkMode] = useState(true); // ערכת עיצוב ברירת מחדל

  useEffect(() => {
    setMounted(true);
    fetchData();
    const interval = setInterval(() => setNow(new Date()), 1000);
    
    // סנכרון Real-time
    const sub = supabase.channel('master_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchData())
      .subscribe();

    return () => { 
      clearInterval(interval); 
      supabase.removeChannel(sub); 
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
    setOrders(data || []);
  };

  // לוגיקת צבעים משתנה לפי דחיפות (Chameleon Effect)
  const getUrgencyStyles = (timeStr: string) => {
    if (!timeStr) return isDarkMode ? "bg-[#1A1D21] border-slate-800" : "bg-white border-slate-100";
    const [hours, minutes] = timeStr.split(':').map(Number);
    const target = new Date();
    target.setHours(hours, minutes, 0);
    
    const diff = (target.getTime() - now.getTime()) / 60000;

    if (diff <= 0) return isDarkMode ? "opacity-50 bg-slate-900" : "opacity-50 bg-slate-100";
    if (diff < 30) return "border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)] ring-1 ring-red-500";
    if (diff < 90) return "border-orange-400 shadow-[0_0_10px_rgba(251,146,60,0.1)]";
    return isDarkMode ? "bg-[#1A1D21] border-slate-800" : "bg-white border-slate-100 shadow-sm";
  };

  if (!mounted) return null;

  const theme = {
    bg: isDarkMode ? "bg-[#0B0E11]" : "bg-[#F8FAFC]",
    card: isDarkMode ? "bg-[#16191D]" : "bg-white",
    text: isDarkMode ? "text-white" : "text-slate-900",
    subText: isDarkMode ? "text-slate-400" : "text-slate-500",
    border: isDarkMode ? "border-slate-800" : "border-slate-100"
  };

  return (
    <AppLayout>
      <div className={`min-h-screen ${theme.bg} ${theme.text} transition-colors duration-500 p-4 md:p-8 font-sans`} dir="rtl">
        <Head>
          <title>Command Center | Saban OS</title>
        </Head>

        {/* Top Navigation Bar */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 bg-inherit sticky top-0 z-30 pb-4 border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Bot className="text-black" size={24} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tighter italic">SABAN <span className="text-emerald-500">CONTROL</span></h1>
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">System Live • {orders.length} Active Tasks</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-3 rounded-xl border ${theme.border} ${theme.card} hover:scale-105 transition-all`}
            >
              {isDarkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-indigo-600" />}
            </button>
            
            {/* Desktop/Mobile Status Indicator */}
            <div className={`hidden md:flex items-center gap-4 px-6 py-3 rounded-xl ${theme.card} border ${theme.border}`}>
              <div className="text-left">
                <p className="text-xl font-black font-mono leading-none">{now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</p>
                <p className="text-[9px] font-black uppercase opacity-50 tracking-tighter">Current Time</p>
              </div>
              <Monitor size={20} className="text-emerald-500" />
            </div>
          </div>
        </header>

        {/* Dashboard Grid - רספונסיבי לחלוטין */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence mode="popLayout">
            {orders.map((order) => (
              <motion.div
                key={order.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`group rounded-[2rem] p-6 border-2 transition-all duration-300 relative ${theme.card} ${getUrgencyStyles(order.order_time)}`}
              >
                {/* Card Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-black truncate leading-tight">{order.client_info}</h3>
                    <div className="flex items-center gap-2 mt-1 opacity-50 text-[10px] font-bold uppercase">
                      <Truck size={12} /> {order.driver_name || 'ממתין לשיבוץ'}
                    </div>
                  </div>
                  <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-white/5' : 'bg-slate-50'}`}>
                    {order.is_container ? <Box className="text-emerald-500" size={20} /> : <Truck className="text-blue-500" size={20} />}
                  </div>
                </div>

                {/* Body */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-sm font-medium opacity-80">
                    <MapPin className="text-emerald-500" size={16} /> 
                    <span className="truncate">{order.location || order.delivery_address || 'כתובת כללית'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm font-medium opacity-80">
                    <Clock className="text-emerald-500" size={16} />
                    <span>{order.order_time}</span>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className={`flex items-center justify-between pt-4 border-t ${theme.border}`}>
                   <button 
                    onClick={() => setSelectedOrder(order)}
                    className="flex items-center gap-2 text-xs font-black text-emerald-500 hover:gap-3 transition-all"
                   >
                     עדכון AI <Sparkles size={14} />
                   </button>
                   <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${isDarkMode ? 'bg-emerald-500/10 text-emerald-500' : 'bg-emerald-50 text-emerald-700'}`}>
                     {order.status || 'Active'}
                   </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Mobile View Navigation (Bottom Bar) */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-inherit border-t border-white/5 flex items-center justify-around px-8 z-40 backdrop-blur-md">
          <Smartphone size={24} className="text-emerald-500" />
          <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center -translate-y-6 shadow-xl shadow-emerald-500/40">
            <Filter size={24} className="text-black" />
          </div>
          <User size={24} className="opacity-40" />
        </div>

        {/* AI Supervisor Popup */}
        <AnimatePresence>
          {selectedOrder && (
            <ChatPopup order={selectedOrder} onClose={() => setSelectedOrder(null)} />
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
