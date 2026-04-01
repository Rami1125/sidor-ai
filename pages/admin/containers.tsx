'use client';
import React, { useState, useEffect } from 'react';
import AppLayout from '../../components/Layout';
import { supabase } from '../../lib/supabase';
import { 
  Box, Search, MapPin, Calendar, Clock, 
  History, ArrowLeftRight, ChevronLeft, Volume2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// לוגואים של מחסנים
const WAREHOUSES = [
  { id: 'shark30', name: 'שארק 30', logo: 'https://ui-avatars.com/api/?name=S30&background=0284c7&color=fff' },
  { id: 'karadi32', name: 'כראדי 32', logo: 'https://ui-avatars.com/api/?name=K32&background=334155&color=fff' },
  { id: 'shai', name: 'שי שרון', logo: 'https://ui-avatars.com/api/?name=SS&background=7c3aed&color=fff' }
];

export default function AdvancedContainers() {
  const [containers, setContainers] = useState<any[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string | null>(null);
  const [selectedClientHistory, setSelectedClientHistory] = useState<any[] | null>(null);
  const [activeClient, setActiveClient] = useState<string | null>(null);

  const playSound = () => {
    const audio = new Audio('/sounds/click.mp3');
    audio.play().catch(() => {});
  };

  useEffect(() => {
    fetchContainers();
  }, [selectedWarehouse]);

  const fetchContainers = async () => {
    let query = supabase.from('container_management').select('*').eq('is_active', true);
    if (selectedWarehouse) query = query.eq('contractor_name', selectedWarehouse);
    const { data } = await query;
    setContainers(data || []);
  };

  const showHistory = async (clientName: string) => {
    playSound();
    setActiveClient(clientName);
    const { data } = await supabase
      .from('container_management')
      .select('*')
      .eq('client_name', clientName)
      .order('start_date', { ascending: false });
    setSelectedClientHistory(data || []);
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-[#F8F9FA] pb-24" dir="rtl">
        
        {/* כפתורי מחסנים עם לוגו - סליידר מובייל */}
        <div className="p-4 bg-white border-b border-slate-200 sticky top-16 z-40">
          <p className="text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest px-2">בחר מחסן לצפייה</p>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            <button 
              onClick={() => { setSelectedWarehouse(null); playSound(); }}
              className={`flex-shrink-0 px-6 py-2 rounded-2xl font-black text-xs transition-all border ${!selectedWarehouse ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'}`}
            >
              הכל
            </button>
            {WAREHOUSES.map(w => (
              <button 
                key={w.id}
                onClick={() => { setSelectedWarehouse(w.name); playSound(); }}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-2xl border transition-all ${selectedWarehouse === w.name ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200' : 'bg-white border-slate-200'}`}
              >
                <img src={w.logo} className="w-6 h-6 rounded-lg object-cover" alt="" />
                <span className="text-xs font-black whitespace-nowrap">{w.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 space-y-4">
          {containers.map(c => (
            <motion.div 
              whileTap={{ scale: 0.98 }}
              onClick={() => showHistory(c.client_name)}
              key={c.id} 
              className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 relative overflow-hidden group active:bg-slate-50 transition-colors"
            >
              <div className="absolute right-0 top-0 w-2 h-full bg-blue-500" />
              
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-black text-slate-900">{c.client_name}</h3>
                  <p className="text-xs font-bold text-slate-400 flex items-center gap-1 mt-1">
                    <MapPin size={12} /> {c.delivery_address}
                  </p>
                </div>
                <div className="text-left bg-blue-50 px-3 py-1 rounded-xl">
                  <span className="text-[10px] font-black text-blue-600 uppercase">{c.container_size || '8 קוב'}</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                 <div className="flex items-center gap-2 text-slate-500 text-[11px] font-bold">
                    <History size={14} className="text-blue-500" />
                    <span>לחץ להיסטוריית לקוח</span>
                 </div>
                 <ChevronLeft size={16} className="text-slate-300" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Modal היסטוריית לקוח - נפתח מלמטה */}
        <AnimatePresence>
          {selectedClientHistory && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedClientHistory(null)} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]" />
              <motion.div 
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[3rem] z-[110] max-h-[85vh] overflow-y-auto p-8 shadow-2xl"
              >
                <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8" />
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl"><History size={28}/></div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 leading-none">{activeClient}</h2>
                        <p className="text-xs font-bold text-slate-400 mt-1 uppercase">תיק מכולות והיסטוריית הצבות</p>
                    </div>
                </div>

                <div className="space-y-6">
                  {selectedClientHistory.map((item, idx) => (
                    <div key={item.id} className="relative pr-8 border-r-2 border-slate-100 pb-2">
                        <div className={`absolute -right-[9px] top-0 w-4 h-4 rounded-full border-4 border-white shadow-sm ${idx === 0 ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        <div className="flex justify-between items-start mb-1">
                            <span className="text-[10px] font-black text-slate-400">{new Date(item.start_date).toLocaleDateString('he-IL')}</span>
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${item.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                {item.is_active ? 'פעיל כרגע' : 'הושלם'}
                            </span>
                        </div>
                        <p className="text-sm font-black text-slate-800">{item.action_type === 'exchange' ? 'החלפת מכולה' : 'הצבה חדשה'}</p>
                        <p className="text-xs font-bold text-slate-500">{item.delivery_address} | {item.contractor_name}</p>
                    </div>
                  ))}
                </div>
                
                <button onClick={() => setSelectedClientHistory(null)} className="w-full mt-10 bg-slate-900 text-white py-4 rounded-2xl font-black text-sm active:scale-95 transition-all">סגור תצוגה</button>
              </motion.div>
            </>
          )}
        </AnimatePresence>

      </div>
    </AppLayout>
  );
}
