import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, MessageSquare, Truck, CheckCircle, Bell, Send, ShieldAlert } from 'lucide-react';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function AdminControlCenter() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [adminMessage, setAdminMessage] = useState('');
  const [stats, setStats] = useState({ active: 0, orders: 0 });

  useEffect(() => {
    fetchData();
    // Realtime subscription - האזנה לשינויים בשיחות ובהזמנות
    const channel = supabase.channel('realtime-updates')
      .on('postgres_changes', { event: '*', table: 'customer_memory' }, fetchData)
      .on('postgres_changes', { event: '*', table: 'orders' }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchData = async () => {
    const { data: cust } = await supabase.from('customer_memory').select('*').order('updated_at', { ascending: false });
    const { data: ord } = await supabase.from('orders').select('*');
    if (cust) setCustomers(cust);
    setStats({ active: cust?.length || 0, orders: ord?.length || 0 });
  };

  const sendManualResponse = async () => {
    if (!adminMessage || !selectedCustomer) return;

    // 1. הזרקת התשובה לזיכרון הלקוח (המשתמש יראה את זה בצאט שלו)
    const newHistory = `${selectedCustomer.accumulated_knowledge}\n[ADMIN]: ${adminMessage}`;
    await supabase.from('customer_memory').update({ accumulated_knowledge: newHistory }).eq('clientId', selectedCustomer.clientId);

    // 2. שליחת Push דרך OneSignal (מניחים שיש API Route מוכן)
    await fetch('/api/admin/send-push', {
      method: 'POST',
      body: JSON.stringify({ userId: selectedCustomer.clientId, message: adminMessage })
    });

    setAdminMessage('');
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    // כאן תישלח התראה אוטומטית ללקוח
  };

  return (
    <div className="h-screen w-full bg-[#0b141a] text-[#e9edef] flex font-sans overflow-hidden" dir="rtl">
      {/* Sidebar - רשימת לקוחות "מודיעינית" */}
      <aside className="w-80 border-l border-white/5 bg-[#111b21] flex flex-col">
        <div className="p-6 border-b border-white/5">
          <h1 className="text-xl font-black text-emerald-500 flex items-center gap-2">
            <ShieldAlert size={24} /> Saban Control
          </h1>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="bg-[#202c33] p-3 rounded-xl border border-white/5 text-center">
              <span className="block text-xs text-slate-400">לקוחות</span>
              <span className="text-lg font-bold">{stats.active}</span>
            </div>
            <div className="bg-[#202c33] p-3 rounded-xl border border-white/5 text-center">
              <span className="block text-xs text-slate-400">הזמנות</span>
              <span className="text-lg font-bold text-emerald-400">{stats.orders}</span>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {customers.map(c => (
            <div 
              key={c.clientId} 
              onClick={() => setSelectedCustomer(c)}
              className={`p-4 rounded-xl cursor-pointer transition-all ${selectedCustomer?.clientId === c.clientId ? 'bg-emerald-500/20 border border-emerald-500/30' : 'hover:bg-white/5'}`}
            >
              <div className="flex justify-between items-center">
                <span className="font-bold">{c.user_name || "אורח"}</span>
                <span className="text-[10px] text-slate-500">{new Date(c.updated_at).toLocaleTimeString('he-IL')}</span>
              </div>
              <p className="text-xs text-slate-400 truncate mt-1">{c.clientId}</p>
            </div>
          ))}
        </div>
      </aside>

      {/* Main Area - צפייה בשיחה ומעקב הזמנות */}
      <main className="flex-1 flex flex-col bg-[url('https://i.postimg.cc/wTFJbMNp/Designer-1.png')] bg-opacity-5">
        <header className="h-20 bg-[#202c33]/90 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-8">
          {selectedCustomer ? (
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center font-bold text-black text-xl">
                {selectedCustomer.user_name?.[0] || "?"}
              </div>
              <div>
                <h2 className="font-bold text-lg">{selectedCustomer.user_name || "לקוח לא מזוהה"}</h2>
                <span className="text-xs text-emerald-400">מעקב פעיל...</span>
              </div>
            </div>
          ) : <div className="text-slate-400">בחר לקוח לצפייה בממשק המודיעין</div>}
          <div className="flex gap-4">
            <Bell size={20} className="text-slate-400 cursor-pointer" />
            <Menu size={20} className="text-slate-400 cursor-pointer" />
          </div>
        </header>

        {/* חלון שיקוף שיחה בזמן אמת */}
        <section className="flex-1 overflow-y-auto p-8 space-y-4">
          <AnimatePresence>
            {selectedCustomer?.accumulated_knowledge.split('\n').map((line: string, i: number) => (
              <motion.div 
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                key={i} 
                className={`flex ${line.includes('[ADMIN]') ? 'justify-start' : 'justify-end'}`}
              >
                <div className={`max-w-md p-4 rounded-2xl shadow-lg ${line.includes('[ADMIN]') ? 'bg-blue-600 rounded-bl-none' : 'bg-[#202c33] rounded-br-none'}`}>
                  <p className="text-sm">{line.replace('[ADMIN]:', '')}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </section>

        {/* לוח פיקוד ומענה ידני */}
        <footer className="p-6 bg-[#111b21] border-t border-white/5">
          <div className="flex gap-4 max-w-5xl mx-auto">
            <input 
              value={adminMessage}
              onChange={(e) => setAdminMessage(e.target.value)}
              placeholder="התערבות ידנית בשיחה (הלקוח לא יודע שזה אתה)..." 
              className="flex-1 bg-[#2a3942] rounded-xl p-4 outline-none border border-white/5 focus:border-emerald-500 transition-all"
            />
            <button 
              onClick={sendManualResponse}
              className="bg-emerald-600 hover:bg-emerald-500 p-4 px-8 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95"
            >
              <Send size={18} /> שלח מענה
            </button>
          </div>
        </footer>
      </main>

      {/* Right Panel - סטטוס הזמנה ואנימציות */}
      <aside className="w-96 border-r border-white/5 bg-[#111b21] p-6">
        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
          <Truck size={20} className="text-emerald-500" /> מעקב לוגיסטי
        </h3>
        <div className="space-y-6">
          <StatusCard 
            title="בהכנה" 
            icon={<Calculator className="text-blue-400" />} 
            active={true}
            onClick={() => {}}
          />
          <StatusCard 
            title="בדרך" 
            icon={<Truck className="text-orange-400 animate-bounce" />} 
            active={false}
            animate={{ x: [0, 50, 0] }}
            onClick={() => {}}
          />
          <StatusCard 
            title="בוצע" 
            icon={<CheckCircle className="text-emerald-500" />} 
            active={false}
            onClick={() => {}}
          />
        </div>
      </aside>
    </div>
  );
}

// קומפוננטת כרטיס סטטוס עם אנימציה
function StatusCard({ title, icon, active, animate, onClick }: any) {
  return (
    <motion.div 
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className={`p-6 rounded-2xl border cursor-pointer transition-all ${active ? 'bg-emerald-500/10 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-[#202c33] border-white/5'}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <motion.div animate={animate}>{icon}</motion.div>
          <span className={`font-bold ${active ? 'text-emerald-400' : 'text-slate-400'}`}>{title}</span>
        </div>
        {active && <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />}
      </div>
    </motion.div>
  );
}
