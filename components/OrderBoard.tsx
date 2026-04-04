'use client';
import React, { useState } from 'react';
import { 
  Truck, Clock, CheckCircle, Package, Eye, 
  MessageSquare, AlertCircle, RefreshCw, LogOut, MapPin, ExternalLink 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Order {
  id: string;
  order_number: number;
  client_info: string;
  product_name: string;
  warehouse: string;
  status: string;
  order_time: string;
  delivery_time?: string;
  driver_info?: string;
  customer_note?: string;
  has_new_note?: boolean;
  is_container?: boolean; // שדה המכולה החדש
  created_at: string;
}

export default function OrderBoard({ orders, onUpdate }: { orders: Order[], onUpdate: (id: string, updates: any) => void }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-6 pb-20">
      <AnimatePresence mode="popLayout">
        {orders.map((order) => {
          // חישוב ימי שכירות למכולה
          const days = order.is_container ? Math.floor((Date.now() - new Date(order.created_at).getTime()) / (1000 * 60 * 60 * 24)) : 0;
          const isRentalAlert = order.is_container && days >= 9;
          const isChameleon = order.has_new_note || isRentalAlert;

          return (
            <motion.div
              layout
              key={order.id}
              className={`relative rounded-[2.5rem] border-2 transition-all duration-500 overflow-hidden shadow-sm
                ${isChameleon ? 'border-emerald-400 bg-emerald-50/50 shadow-emerald-100' : 'border-slate-100 bg-white'}`}
            >
              {/* Header הכרטיס - עיצוב בהיר עם נגיעות כהות */}
              <div className="p-5 md:p-8 flex items-center gap-4 md:gap-8">
                <div className={`w-16 h-16 md:w-24 md:h-24 rounded-[2rem] flex flex-col items-center justify-center font-black italic shadow-inner shrink-0
                  ${order.is_container ? 'bg-slate-900 text-blue-400' : 'bg-slate-100 text-slate-800'}`}>
                  <span className="text-[10px] opacity-50 uppercase tracking-tighter">ID</span>
                  <span className="text-xl md:text-3xl">#{order.order_number}</span>
                </div>

                <div className="flex-1 min-w-0 text-right">
                  <div className="flex items-center gap-2 mb-1">
                    {order.is_container && (
                      <span className="bg-blue-600 text-white text-[10px] px-3 py-0.5 rounded-full font-black italic">📦 מכולה 8 קו"ב</span>
                    )}
                    {isChameleon && (
                      <span className="bg-emerald-500 text-white text-[10px] px-3 py-0.5 rounded-full font-black animate-pulse">🦎 התראה</span>
                    )}
                    <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg">
                      <Clock size={12}/> {order.order_time}
                    </span>
                  </div>
                  <h2 className="text-2xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase truncate italic leading-none">
                    {order.product_name || (order.is_container ? "הזמנת מכולה" : "סל מוצרים")}
                  </h2>
                  <p className="text-slate-500 font-bold text-sm mt-1 truncate">{order.client_info}</p>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => setExpandedId(expandedId === order.id ? null : order.id)} 
                    className={`p-4 md:p-6 rounded-3xl transition-all ${expandedId === order.id ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>
                    <Eye size={24}/>
                  </button>
                  <button onClick={() => onUpdate(order.id, { status: 'completed' })} 
                    className="p-4 md:p-6 rounded-3xl bg-orange-500 text-white shadow-lg shadow-orange-200 active:scale-95 transition-all">
                    <CheckCircle size={24}/>
                  </button>
                </div>
              </div>

              {/* תוכן מורחב - Logic Layers */}
              {expandedId === order.id && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 md:p-12 bg-white border-t-2 border-slate-50 space-y-8">
                  
                  {/* לוגיקת מכולות ייעודית */}
                  {order.is_container && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className={`p-6 rounded-[2rem] border-2 flex justify-between items-center ${days >= 9 ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-blue-50 border-blue-100 text-blue-900'}`}>
                        <div>
                          <span className="text-[10px] font-black uppercase opacity-60">ימי שכירות בשטח</span>
                          <div className="text-4xl font-black italic">{days} / 10</div>
                        </div>
                        {days >= 9 && <AlertCircle size={40} className="animate-bounce" />}
                      </div>
                      
                      <button 
                        onClick={() => window.open('https://www.herzliya.muni.il/טופס-הצבת-מכולות/')}
                        className="bg-slate-900 text-white p-6 rounded-[2rem] flex items-center justify-between group hover:bg-blue-600 transition-all"
                      >
                        <div className="text-right">
                          <span className="text-[10px] font-black opacity-50 uppercase italic">עיריית הרצליה</span>
                          <div className="text-xl font-black">טופס היתר הצבה</div>
                        </div>
                        <ExternalLink size={24} className="group-hover:translate-x-[-5px] transition-transform" />
                      </button>
                    </div>
                  )}

                  {/* שדות ניהול כלליים */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                      <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">שעת אספקה / תיאום</label>
                      <input 
                        className="text-3xl font-black text-blue-600 bg-transparent outline-none w-full italic" 
                        defaultValue={order.delivery_time} 
                        onBlur={(e) => onUpdate(order.id, { delivery_time: e.target.value })}
                        placeholder="קבע שעה..."
                      />
                    </div>
                    <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                      <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">נהג משויך</label>
                      <input 
                        className="text-3xl font-black text-slate-900 bg-transparent outline-none w-full italic" 
                        defaultValue={order.driver_info} 
                        onBlur={(e) => onUpdate(order.id, { driver_info: e.target.value })}
                        placeholder="שם הנהג..."
                      />
                    </div>
                  </div>

                  {/* הערת לקוח / זיקית */}
                  <div className={`p-8 rounded-[2.5rem] border-2 shadow-sm ${isChameleon ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-slate-900 text-white border-slate-800'}`}>
                    <div className="flex items-center gap-2 mb-2 opacity-60 text-[10px] font-black uppercase italic">
                      <MessageSquare size={14}/> הודעה אחרונה מהצאט
                    </div>
                    <p className="text-2xl font-black italic leading-tight">{order.customer_note || "אין הערות מיוחדות"}</p>
                  </div>

                  {/* רשימת ליקוט */}
                  <div className="bg-slate-50 p-8 rounded-[3rem] border border-slate-200">
                    <div className="flex items-center gap-2 mb-4 text-slate-400">
                      <Package size={18}/>
                      <span className="text-xs font-black uppercase tracking-widest italic">פירוט הזמנה לליקוט</span>
                    </div>
                    <div className="text-3xl md:text-5xl font-black text-slate-800 italic leading-none tracking-tighter whitespace-pre-line uppercase">
                      {order.warehouse}
                    </div>
                  </div>

                  {/* כפתורי פעולה למכולה */}
                  {order.is_container && (
                    <div className="flex gap-4">
                      <button className="flex-1 py-6 bg-slate-100 text-slate-900 rounded-[2rem] font-black text-xl flex items-center justify-center gap-3 hover:bg-blue-100 transition-all">
                        <RefreshCw size={20}/> החלפה
                      </button>
                      <button className="flex-1 py-6 bg-slate-900 text-white rounded-[2rem] font-black text-xl flex items-center justify-center gap-3 hover:bg-red-600 transition-all">
                        <LogOut size={20}/> הוצאה
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
