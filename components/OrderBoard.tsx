'use client';
import React, { useState, useEffect, useRef } from 'react';
import { 
  Truck, Clock, CheckCircle, Package, Eye, 
  MessageSquare, AlertCircle, RefreshCw, LogOut, ExternalLink, Printer, Share2, Hash, Edit3, User, Save, MapPin, Phone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Order {
  id: string;
  order_number: number;
  comax_number?: string;
  client_info: string;
  customer_contact?: string; // איש קשר
  delivery_address?: string; // כתובת אספקה
  customer_id?: string;      // מספר לקוח
  product_name: string;
  warehouse: string;
  status: string;
  order_time: string;
  delivery_time?: string;
  driver_info?: string;
  customer_note?: string;
  has_new_note?: boolean;
  is_container?: boolean;
  created_at: string;
}

export default function OrderBoard({ orders, onUpdate }: { orders: Order[], onUpdate: (id: string, updates: any) => void }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevOrdersCount = useRef(orders.length);

  useEffect(() => {
    const hasNewOrder = orders.length > prevOrdersCount.current;
    if (hasNewOrder) audioRef.current?.play().catch(() => {});
    prevOrdersCount.current = orders.length;
  }, [orders]);

  return (
    <div className="space-y-6 pb-20">
      <audio ref={audioRef} src="/order-notification.mp3" preload="auto" />
      
      <AnimatePresence mode="popLayout">
        {orders.map((order) => {
          const isChameleon = order.has_new_note;

          return (
            <motion.div
              layout
              key={order.id}
              className={`relative rounded-[2.5rem] border-2 transition-all duration-500 overflow-hidden shadow-sm
                ${isChameleon ? 'border-emerald-400 bg-emerald-50/50' : 'border-slate-100 bg-white'}`}
            >
              <div className="p-5 md:p-8 flex items-center gap-4 md:gap-8">
                {/* מזהה הזמנה */}
                <div className="w-16 h-16 md:w-24 md:h-24 rounded-[2rem] bg-slate-900 text-blue-400 flex flex-col items-center justify-center font-black italic shrink-0 shadow-lg">
                  <span className="text-[10px] opacity-50 uppercase">ID</span>
                  <span className="text-xl md:text-3xl">#{order.order_number}</span>
                </div>

                <div className="flex-1 min-w-0 text-right">
                  <h2 className="text-2xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase truncate italic leading-none mb-2">
                    {order.product_name || "הזמנה כללית"}
                  </h2>

                  {/* שורת פרטי לקוח ועריכה */}
                  <div className="flex flex-wrap items-center gap-3">
                    {/* מספר קומקס */}
                    <div className="flex items-center gap-1 bg-slate-900 text-emerald-400 px-3 py-1 rounded-xl text-xs font-black">
                      <Hash size={12} />
                      <input 
                        className="bg-transparent border-none outline-none w-16"
                        defaultValue={order.comax_number}
                        onBlur={(e) => onUpdate(order.id, { comax_number: e.target.value })}
                        placeholder="קומקס"
                      />
                    </div>

                    {/* כפתור פתיחת עריכה מורחבת */}
                    <button 
                      onClick={() => setEditingId(editingId === order.id ? null : order.id)}
                      className={`flex items-center gap-2 px-4 py-1 rounded-xl border transition-all font-bold text-xs
                        ${editingId === order.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100'}`}
                    >
                      <Edit3 size={12} />
                      {editingId === order.id ? 'סגור עריכה' : 'ערוך לקוח'}
                    </button>

                    <span className="text-slate-400 font-bold text-xs italic">{order.client_info}</span>
                  </div>

                  {/* פאנל עריכת לקוח חכם - נפתח בלחיצה על ערוך לקוח */}
                  <AnimatePresence>
                    {editingId === order.id && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 p-4 bg-slate-50 rounded-[1.5rem] border border-slate-100">
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase mr-2 italic">שם לקוח / חברה</label>
                            <input 
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:border-blue-400"
                              defaultValue={order.client_info}
                              onBlur={(e) => onUpdate(order.id, { client_info: e.target.value })}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase mr-2 italic">איש קשר / טלפון</label>
                            <input 
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:border-blue-400"
                              defaultValue={order.customer_contact}
                              onBlur={(e) => onUpdate(order.id, { customer_contact: e.target.value })}
                              placeholder="שם + נייד"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase mr-2 italic">מספר לקוח (קומקס)</label>
                            <input 
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:border-blue-400"
                              defaultValue={order.customer_id}
                              onBlur={(e) => onUpdate(order.id, { customer_id: e.target.value })}
                              placeholder="מספר לקוח..."
                            />
                          </div>
                          <div className="md:col-span-3 space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase mr-2 italic">כתובת אספקה מלאה</label>
                            <div className="relative">
                              <MapPin size={14} className="absolute left-3 top-3 text-slate-300" />
                              <input 
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 pr-10 text-sm font-bold outline-none focus:border-blue-400"
                                defaultValue={order.delivery_address}
                                onBlur={(e) => onUpdate(order.id, { delivery_address: e.target.value })}
                                placeholder="רחוב, עיר, קומה..."
                              />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex gap-2 shrink-0">
                  <button onClick={() => setExpandedId(expandedId === order.id ? null : order.id)} 
                    className={`p-4 md:p-6 rounded-3xl transition-all ${expandedId === order.id ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-400'}`}>
                    <Eye size={24}/>
                  </button>
                  <button onClick={() => onUpdate(order.id, { status: 'completed' })} 
                    className="p-4 md:p-6 rounded-3xl bg-orange-500 text-white shadow-lg shadow-orange-200">
                    <CheckCircle size={24}/>
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
