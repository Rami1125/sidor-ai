'use client';
import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import AppLayout from '../../components/Layout';
import { supabase } from '../../lib/supabase';
import { 
  Clock, MapPin, Truck, Box, Timer, Activity, 
  CheckCheck, AlertCircle, Warehouse, Send, Bot, Smartphone, Monitor
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DRIVERS = [
  { name: 'חכמת', img: 'https://i.postimg.cc/d3S0NJJZ/Screenshot-20250623-200646-Facebook.jpg' },
  { name: 'עלי', img: 'https://i.postimg.cc/tCNbgXK3/Screenshot-20250623-200744-Tik-Tok.jpg' }
];

export default function MasterDashboard() {
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState<'live' | 'containers' | 'chat'>('live');
  const [truckOrders, setTruckOrders] = useState<any[]>([]);
  const [containerSites, setContainerSites] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(new Date());

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setMounted(true);
    // זיהוי מכשיר וחיבור OneSignal
    const checkDevice = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile && (window as any).OneSignal) {
        (window as any).OneSignal.SlidingPermissionPrompt.push({force: true});
      }
    };
    
    checkDevice();
    fetchData();
    const t = setInterval(() => setNow(new Date()), 1000);
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
    
    const channel = supabase.channel('master_v2').on('postgres_changes', { event: '*', schema: 'public' }, fetchData).subscribe();
    return () => { clearInterval(t); channel.unsubscribe(); };
  }, []);

  const fetchData = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data: o } = await supabase.from('orders').select('*').eq('delivery_date', today);
    const { data: c } = await supabase.from('container_management').select('*').eq('is_active', true);
    setTruckOrders(o || []);
    setContainerSites(c || []);
  };

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const cmd = input; setInput(''); setLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: cmd }]);
    try {
      const res = await fetch('/api/ai-analyst', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: cmd, sender_name: 'ראמי' })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'ai', content: data.answer || data.reply }]);
      if (audioRef.current) audioRef.current.play();
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  if (!mounted) return null;

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-64px)] bg-[#F0F2F5] overflow-hidden" dir="rtl">
        <Head>
          <title>SABAN OS | PRO</title>
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
        </Head>

        {/* Sidebar - Desktop Only */}
        {!isMobile && (
          <aside className="w-80 bg-white border-l border-slate-200 shadow-xl flex flex-col z-50">
            <div className="p-8 pb-4">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-emerald-500 rounded-lg text-black"><Monitor size={20}/></div>
                <span className="font-black text-xs uppercase tracking-widest text-slate-400">Desktop Mode</span>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 text-center">סיכום מבצעי</p>
              <div className="space-y-2">
                {DRIVERS.map(d => (
                  <div key={d.name} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2">
                      <img src={d.img} className="w-6 h-6 rounded-full object-cover border border-emerald-500" />
                      <span className="text-xs font-bold">{d.name}</span>
                    </div>
                    <span className="bg-emerald-100 text-emerald-700 text-[9px] px-2 py-0.5 rounded-full font-black">
                      {truckOrders.filter(o => o.driver_name === d.name).length}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        )}

        {/* Main Interface */}
        <main className="flex-1 relative flex flex-col overflow-hidden w-full h-full">
          
          {/* Mobile Gateway Buttons - Floating Style */}
          {isMobile && (
            <div className="absolute bottom-24 left-4 right-4 z-50 flex gap-2">
               {['live', 'containers', 'chat'].map((tab) => (
                 <button 
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl transition-all ${activeTab === tab ? 'bg-emerald-600 text-white scale-105' : 'bg-white/90 backdrop-blur-md text-slate-400'}`}
                 >
                   {tab === 'live' ? 'הזמנות' : tab === 'containers' ? 'מכולות' : 'AI'}
                 </button>
               ))}
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4 lg:p-10 scrollbar-hide pb-40 lg:pb-10">
            <AnimatePresence mode="wait">
              
              {/* דף הזמנות / מכולות - Edge to Edge */}
              {(activeTab === 'live' || activeTab === 'containers') && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-8"
                >
                  {(activeTab === 'live' ? truckOrders : containerSites).map((item) => (
                    <div key={item.id} className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100 relative group overflow-hidden">
                       <div className="flex justify-between items-start mb-4">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase text-white ${activeTab === 'live' ? 'bg-emerald-600' : 'bg-blue-600'}`}>
                            {activeTab === 'live' ? 'ORDER' : item.action_type}
                          </span>
                       </div>
                       <h3 className="text-2xl font-black tracking-tighter leading-tight mb-1">{item.client_info || item.client_name}</h3>
                       <p className="text-xs font-bold text-slate-400 mb-6 flex items-center gap-1"><MapPin size={12}/> {item.location || item.delivery_address}</p>
                       
                       <div className="flex items-center gap-4 border-t border-slate-50 pt-4">
                          {activeTab === 'live' ? (
                            <>
                              <img src={DRIVERS.find(d => d.name === item.driver_name)?.img || ''} className="w-10 h-10 rounded-xl object-cover border border-emerald-500" />
                              <span className="text-sm font-black">{item.driver_name}</span>
                            </>
                          ) : (
                            <div className="flex items-center gap-2"><Warehouse size={16} className="text-blue-500"/><span className="text-sm font-black">{item.contractor_name}</span></div>
                          )}
                          <div className="mr-auto text-emerald-500"><Clock size={18} /></div>
                       </div>
                    </div>
                  ))}
                </motion.div>
              )}

              {/* חדר צ'אט בגודל מלא */}
              {activeTab === 'chat' && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  className="h-full flex flex-col bg-white rounded-[2rem] lg:rounded-[3rem] shadow-2xl overflow-hidden"
                >
                  <div className="p-4 bg-slate-900 text-emerald-500 flex items-center gap-3">
                    <Bot size={20} className="animate-pulse" />
                    <span className="font-black text-xs uppercase tracking-widest italic">SABAN AI Supervisor</span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
                    {messages.map((m, i) => (
                      <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-[85%] p-4 rounded-2xl text-sm font-bold ${m.role === 'user' ? 'bg-slate-100' : 'bg-emerald-600 text-white shadow-lg'}`}>{m.content}</div>
                      </div>
                    ))}
                  </div>
                  <form onSubmit={handleChat} className="p-4 bg-slate-50 border-t flex gap-2">
                    <input value={input} onChange={e => setInput(e.target.value)} placeholder="פקודה למוח..." className="flex-1 p-4 bg-white rounded-2xl border border-slate-200 outline-none text-sm font-bold shadow-inner" />
                    <button type="submit" className="bg-emerald-600 text-white w-14 h-14 rounded-2xl shadow-xl flex items-center justify-center"><Send size={20} className="rotate-180"/></button>
                  </form>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </main>
      </div>
    </AppLayout>
  );
}

// Icon Helper
const Warehouse = ({size, className}: any) => <Activity size={size} className={className} />;
