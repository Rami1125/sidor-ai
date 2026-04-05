'use client';
import React, { useState, useEffect, useRef } from 'react';
import { 
  Truck, Clock, CheckCircle, Package, Eye, 
  MessageSquare, AlertCircle, RefreshCw, LogOut, ExternalLink, Printer, Share2, Hash, Edit3, User, Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Order {
  id: string;
  order_number: number;
  comax_number?: string;
  client_info: string;
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
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [tempClientInfo, setTempClientInfo] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevOrdersCount = useRef(orders.length);

  useEffect(() => {
    const hasNewOrder = orders.length > prevOrdersCount.current;
    const hasNewNote = orders.some(o => o.has_new_note);
    if (hasNewOrder || hasNewNote) {
      audioRef.current?.play().catch(() => {});
    }
    prevOrdersCount.current = orders.length;
  }, [orders]);

  const handlePrint = (order: Order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <div dir="rtl" style="font-family: sans-serif; padding: 30px;">
        <h1 style="border-bottom: 4px solid #000; padding-bottom: 10px;">ח. סבן - פקודת ליקוט #${order.order_number}</h1>
        <p><strong>קומקס:</strong> ${order.comax_number || '---'}</p>
        <p><strong>לקוח:</strong> ${order.client_info}</p>
        <hr/>
        <pre style="font-size: 22px; font-weight: bold;">${order.warehouse}</pre>
      </div>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="space-y-6 pb-20">
      <audio ref={audioRef} src="/order-notification.mp3" preload="auto" />
      
      <AnimatePresence mode="popLayout">
        {orders.map((order) => {
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
              <div className="p-5 md:p-8 flex items-center gap-4 md:gap-8">
                {/* ID מרובע */}
                <div className={`w-16 h-16 md:w-24 md:h-24 rounded-[2rem] flex flex-col items-center justify-center font-black italic shrink-0
                  ${order.is_container ? 'bg-slate-900 text-blue-400' : 'bg-slate-100 text-slate-800'}`}>
                  <span className="text-[10px] opacity-50 uppercase tracking-tighter">ID</span>
                  <span className="text-xl md:text-3xl">#{order.order_number}</span>
                </div>

                <div className="flex-1 min-w-0 text-right">
                  <div className="flex items-center gap-2 mb-1">
                    {order.is_container && <span className="bg-blue-600 text-white text-[10px] px-3 py-0.5 rounded-full font-black italic uppercase">Container</span>}
                    <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg italic">
                      <Clock size={12}/> {order.order_time}
                    </span>
                  </div>
                  
                  <h2 className="text-2xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase truncate italic leading-none">
                    {order.product_name || "הזמנה כללית"}
                  </h2>

                  <div className="flex flex-wrap items-center gap-3 mt-3">
                    {/* שדה קומקס */}
                    <div className="flex items-center gap-1 bg-slate-900 text-white px-3 py-1.5 rounded-xl shadow-lg border border-slate-700">
                      <Hash size={12} className="text-emerald-400" />
                      <input 
                        className="bg-transparent border-none outline-none text-xs font-black w-20 tracking-widest text-emerald-400"
                        placeholder="קומקס..."
                        defaultValue={order.comax_number}
                        onBlur={(e) => onUpdate(order.id, { comax_number: e.target.value })}
                      />
                    </div>

                    {/* עריכת פרטי לקוח */}
                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 group">
                      <User size={14} className="text-slate-400" />
                      {editingClientId === order.id ? (
                        <div className="flex items-center gap-2">
                          <input 
                            className="bg-white border border-blue-200 outline-none text-xs font-bold px-2 py-0.5 rounded-lg w-48 text-slate-900"
                            autoFocus
                            value={tempClientInfo}
                            onChange={(e) => setTempClientInfo(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    onUpdate(order.id, { client_info: tempClientInfo });
                                    setEditingClientId(null);
                                }
                            }}
                          />
                          <button onClick={() => { onUpdate(order.id, { client_info: tempClientInfo }); setEditingClientId(null); }}>
                            <Save size={14} className="text-blue-600" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-600">{order.client_info}</span>
                          <button 
                            onClick={() => { setEditingClientId(order.id); setTempClientInfo(order.client_info); }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Edit3 size={12} className="text-slate-400 hover:text-blue-600" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
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

              {expandedId === order.id && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 md:p-12 bg-white border-t-2 border-slate-50 space-y-8">
                  <div className="flex flex-col sm:flex-row gap-4 pt-6">
                    <button onClick={() => handlePrint(order)} className="flex-1 py-6 bg-slate-900 text-white rounded-[2rem] font-black text-xl flex items-center justify-center gap-4 shadow-xl">
                      <Printer size={24}/> הדפסה
                    </button>
                    <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(order.warehouse)}`)} className="flex-1 py-6 bg-emerald-500 text-white rounded-[2rem] font-black text-xl flex items-center justify-center gap-4 shadow-xl">
                      <Share2 size={24}/> WhatsApp
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
