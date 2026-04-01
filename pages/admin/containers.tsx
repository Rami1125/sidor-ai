'use client';
import React, { useState, useEffect } from 'react';
import AppLayout from '../../components/Layout';
import { supabase } from '../../lib/supabase';
import { 
  Box, Plus, Search, MapPin, Calendar, 
  Trash2, Edit3, CheckCircle2, AlertCircle, Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ContainerManagement() {
  const [containers, setContainers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchContainers();
    // האזנה לשינויים בזמן אמת
    const channel = supabase.channel('containers_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'container_management' }, fetchContainers)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchContainers = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('container_management')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error) setContainers(data || []);
    setIsLoading(false);
  };

  const deleteContainer = async (id: string) => {
    if (confirm('בוס, בטוח שרוצים למחוק את המכולה הזו?')) {
      await supabase.from('container_management').delete().eq('id', id);
      fetchContainers();
    }
  };

  const filteredContainers = containers.filter(c => 
    c.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.delivery_address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="min-h-screen bg-[#FBFBFC] pb-20" dir="rtl">
        {/* Header דף */}
        <div className="bg-white border-b border-slate-200 px-4 py-8 lg:px-10">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3 italic">
                <Box className="text-blue-600" size={32} /> ניהול מערך מכולות
              </h1>
              <p className="text-slate-500 font-bold mt-1 uppercase text-[11px] tracking-widest">מעקב הצבות, פינויים וימי שכירות</p>
            </div>
            
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-black flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-200 active:scale-95">
              <Plus size={20} /> הצבה חדשה
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-4 lg:p-10">
          {/* סרגל חיפוש ופילטרים */}
          <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100 mb-8 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="חפש לפי לקוח או כתובת..."
                className="w-full bg-slate-50 border-none rounded-xl py-3 pr-12 pl-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-50 rounded-xl text-slate-600 font-black text-sm hover:bg-slate-100 transition-all border border-slate-100">
              <Filter size={18} /> פילטרים
            </button>
          </div>

          {/* טבלת מכולות / גריד כרטיסים למובייל */}
          <div className="grid grid-cols-1 gap-4">
            {isLoading ? (
              <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>
            ) : filteredContainers.map((c) => (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={c.id} 
                className="bg-white p-6 rounded-[2rem] shadow-md border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-xl transition-all border-r-[12px] border-r-blue-500"
              >
                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner">
                    <Box size={28} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-black text-slate-900 leading-none">{c.client_name}</h3>
                      <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-tighter">#{c.id.slice(0, 5)}</span>
                    </div>
                    <p className="text-sm font-bold text-slate-400 flex items-center gap-1"><MapPin size={14} /> {c.delivery_address}</p>
                    <div className="flex items-center gap-4 mt-3">
                      <span className="flex items-center gap-1 text-[11px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                        <Calendar size={12} /> הוקם: {new Date(c.start_date).toLocaleDateString('he-IL')}
                      </span>
                      <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{c.contractor_name}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-none pt-4 md:pt-0">
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-300 uppercase mb-1">סטטוס נוכחי</p>
                    <span className={`px-4 py-1.5 rounded-full text-xs font-black border ${
                      c.status === 'approved' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-amber-50 border-amber-100 text-amber-700'
                    }`}>
                      {c.status === 'approved' ? 'בשטח' : 'ממתין'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                      <Edit3 size={20} />
                    </button>
                    <button 
                      onClick={() => deleteContainer(c.id)}
                      className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
