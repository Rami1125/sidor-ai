import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Truck, Box, MessageSquare, ChevronRight, AlertCircle } from 'lucide-react';
import Layout from '../../components/Layout';

// רכיב טיימר עם לוגיקת הבהוב
const OrderTimer = ({ deliveryTime, deliveryDate }: { deliveryTime: string, deliveryDate: string }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const target = new Date(`${deliveryDate}T${deliveryTime}`);
      const diff = target.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft('ביצוע...');
        setIsUrgent(false);
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff / (1000 * 60)) % 60);
        setTimeLeft(`${hours}ש : ${mins}ד`);
        // הבהוב אם נשאר פחות משעה
        setIsUrgent(diff < 3600000);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [deliveryTime, deliveryDate]);

  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold ${
      isUrgent ? 'bg-red-500/20 text-red-500 animate-pulse' : 'bg-emerald-500/10 text-emerald-500'
    }`}>
      <Clock size={14} />
      <span>{timeLeft}</span>
    </div>
  );
};

export default function MasterDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [containers, setContainers] = useState<any[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    fetchData();
    const subscription = supabase
      .channel('master_sync')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(subscription); };
  }, []);

  const fetchData = async () => {
    const { data: o } = await supabase.from('orders').select('*').order('delivery_time', { ascending: true });
    const { data: c } = await supabase.from('container_management').select('*').eq('is_active', true);
    if (o) setOrders(o);
    if (c) setContainers(c);
  };

  return (
    <Layout>
      <Head>
        <title>SabanOS | Master Dashboard</title>
      </Head>

      <div className="flex h-screen bg-[#0a0a0a] text-gray-100 overflow-hidden">
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <header className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-black bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
                SabanOS Master
              </h1>
              <p className="text-gray-500 text-sm italic">ניהול חומרים ומכולות בזמן אמת</p>
            </div>
            <button 
              onClick={() => setIsChatOpen(!isChatOpen)}
              className="md:hidden p-3 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/20"
            >
              <MessageSquare size={24} />
            </button>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* סקשן הזמנות חומרי בניין */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Truck className="text-emerald-500" />
                <h2 className="text-xl font-bold">הזמנות פעילות</h2>
              </div>
              
              <div className="grid gap-4">
                {orders.map((order) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={order.id}
                    className="bg-[#161616] border border-white/5 p-4 rounded-2xl flex justify-between items-center group hover:border-emerald-500/30 transition-all shadow-xl"
                  >
                    <div className="flex gap-4 items-center">
                      <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center group-hover:bg-emerald-500/10 transition-colors">
                        <Box size={24} className="text-gray-400 group-hover:text-emerald-500" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{order.customer_name}</h3>
                        <p className="text-sm text-gray-500">{order.material_type} | {order.location}</p>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                      <OrderTimer deliveryTime={order.delivery_time} deliveryDate={order.delivery_date} />
                      <span className="text-xs font-mono text-gray-600">{order.delivery_time}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* סקשן מכולות */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Box className="text-blue-500" />
                <h2 className="text-xl font-bold">סטטוס מכולות בשטח</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {containers.map((container) => (
                  <div key={container.id} className="bg-[#161616] border border-white/5 p-4 rounded-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-1 h-full bg-blue-500" />
                    <h3 className="font-bold">{container.customer_name}</h3>
                    <p className="text-xs text-gray-500 mb-3">{container.site_address}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded uppercase">
                        {container.container_size || '8m³'}
                      </span>
                      <span className="text-sm font-bold">{container.days_on_site || 0} ימים</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </main>

        {/* Side Chat Overlay / Menu */}
        <AnimatePresence>
          {(isChatOpen || typeof window !== 'undefined' && window.innerWidth > 768) && (
            <motion.aside 
              initial={{ x: 400 }}
              animate={{ x: 0 }}
              exit={{ x: 400 }}
              className="w-full md:w-[400px] border-l border-white/5 bg-[#0f0f0f] flex flex-col"
            >
              <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#161616]">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="font-bold">Sidor-AI Supervisor</span>
                </div>
                <button onClick={() => setIsChatOpen(false)} className="md:hidden">
                  <ChevronRight />
                </button>
              </div>
              <iframe 
                src="/admin/group-chat" 
                className="flex-1 w-full border-none"
                title="AI Chat"
              />
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
