'use client';
import React, { useState, useEffect, useRef } from 'react';
import { 
  Truck, Clock, CheckCircle, Package, Eye, 
  MessageSquare, AlertCircle, RefreshCw, LogOut, ExternalLink, Printer, Share2, Hash, Edit3, User, MapPin, Phone, Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Order {
  id: string;
  order_number: number;
  comax_number?: string;
  client_info: string;
  customer_contact?: string;
  delivery_address?: string;
  customer_id?: string;
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

  // לוגיקת צלצול
  useEffect(() => {
    if (orders.length > prevOrdersCount.current || orders.some(o => o.has_new_note)) {
      audioRef.current?.play().catch(() => {});
    }
    prevOrdersCount.current = orders.length;
  }, [orders]);

  const handlePrint = (order: Order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const quantityMatches = order.warehouse.match(/(\d+)(?=\s*(יחידות|יחידה|שק|קוב|מ"ק))/g);
    const totalQuantity = quantityMatches ? quantityMatches.reduce((sum, qty) => sum + parseInt(qty), 0) : "---";
    const isContainer = order.is_container || order.warehouse.includes('מכולה');
    const orderTitle = isContainer ? "הזמנת מכולה" : "הזמנת חומרי בניין";

    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>הדפסת הזמנה #${order.order_number}</title>
          <style>
            body { font-family: sans-serif; padding: 20px; color: #1e293b; }
            .print-container { border: 2px solid #000; padding: 30px; border-radius: 15px; }
            .header { display: flex; justify-content: space-between; border-bottom: 3px solid #3b82f6; padding-bottom: 15px; margin-bottom: 20px; }
            .order-type { font-size: 28px; font-weight: 900; color: #1d4ed8; margin: 0; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; background: #f8fafc; padding: 15px; border-radius: 10px; }
            .info-item { font-size: 14px; border-bottom: 1px solid #e2e8f0; padding: 5px 0; }
            .items-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            .items-table th { background: #1e293b; color: white; padding: 10px; text-align: right; }
            .items-table td { border: 1px solid #cbd5e1; padding: 10px; font-size: 16px; font-weight: bold; }
            .total-box { display: inline-block; background: #000; color: #fff; padding: 10px 20px; border-radius: 8px; font-size: 18px; font-weight: bold; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="print-container">
            <div class="header">
              <div><h1 class="order-type">${orderTitle}</h1><div>מספר פנימי: #${order.order_number}</div></div>
              <div style="text-align: left;"><h2>ח. סבן חומרי בניין</h2><div>לוגיסטיקה ואספקה</div></div>
            </div>
            <div class="info-grid">
              <div class="info-item"><strong>לקוח:</strong> ${order.client_info}</div>
              <div class="info-item"><strong>קומקס:</strong> ${order.comax_number || '---'}</div>
              <div class="info-item"><strong>כתובת:</strong> ${order.delivery_address || '---'}</div>
              <div class="info-item"><strong>איש קשר:</strong> ${order.customer_contact || '---'}</div>
              <div class="info-item"><strong>שעה:</strong> ${order.order_time}</div>
              <div class="info-item"><strong>נהג:</strong> ${order.driver_info || '---'}</div>
            </div>
            <table class="items-table">
              <thead><tr><th>פירוט פריטים</th><th style="width:20%">סימון</th></tr></thead>
              <tbody>
                ${order.warehouse.split('\n').map(item => `<tr><td>${item}</td><td></td></tr>`).join('')}
              </tbody>
            </table>
            <div class="total-box">סה"כ כמות: ${totalQuantity}</div>
          </div>
          <script>window.onload = () => { window.print(); setTimeout(() => window.close(), 500); };</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 pb-24">
      <audio ref={audioRef} src="/order-notification.mp3" preload="auto" />
      <AnimatePresence mode="popLayout">
        {orders.map((order) => {
          const isExpanded = expandedId === order.id;
          const isChameleon = order.has_new_note;

          return (
            <motion.div layout key={order.id} className={`relative rounded-[2.5rem] border-2 transition-all bg-white overflow-hidden shadow-sm ${isChameleon ? 'border-emerald-400 bg-emerald-50/30 shadow-emerald-100' : 'border-slate-100'}`}>
              <div className="p-5 md:p-8 flex items-center gap-4 relative z-10">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-[2rem] bg-slate-900 text-blue-400 flex flex-col items-center justify-center font-black italic shrink-0">
                  <span className="text-[10px] opacity-40">ID</span>
                  <span className="text-xl md:text-2xl">#{order.order_number}</span>
                </div>

                <div className="flex-1 min-w-0 text-right">
                  <h2 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tighter truncate italic uppercase leading-none">{order.product_name || "הזמנה"}</h2>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <button onClick={(e) => { e.stopPropagation(); setEditingId(editingId === order.id ? null : order.id); }} className="flex items-center gap-1 px-3 py-1 rounded-xl bg-slate-100 text-slate-500 font-bold text-[10px] hover:bg-blue-600 hover:text-white transition-all">
                      <Edit3 size={12} /> ערוך לקוח
                    </button>
                    <span className="text-slate-400 font-bold text-[11px] italic">{order.client_info}</span>
                  </div>
                </div>

                <div className="flex gap-2 shrink-0 relative z-20">
                  <button onClick={(e) => { e.stopPropagation(); setExpandedId(isExpanded ? null : order.id); }} className={`p-4 md:p-5 rounded-3xl transition-all ${isExpanded ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-400'}`}>
                    <Eye size={24} strokeWidth={2.5} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); onUpdate(order.id, { status: 'completed' }); }} className="p-4 md:p-5 rounded-3xl bg-orange-500 text-white shadow-lg active:scale-90 transition-all">
                    <CheckCircle size={24} strokeWidth={2.5} />
                  </button>
                </div>
              </div>

              {editingId === order.id && (
                <div className="p-6 bg-slate-50 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4">
                   <input className="p-3 rounded-xl border border-slate-200 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500" placeholder="מספר לקוח" defaultValue={order.customer_id} onBlur={(e) => onUpdate(order.id, { customer_id: e.target.value })} />
                   <input className="p-3 rounded-xl border border-slate-200 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500" placeholder="איש קשר" defaultValue={order.customer_contact} onBlur={(e) => onUpdate(order.id, { customer_contact: e.target.value })} />
                   <input className="p-3 rounded-xl border border-slate-200 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500" placeholder="מספר קומקס" defaultValue={order.comax_number} onBlur={(e) => onUpdate(order.id, { comax_number: e.target.value })} />
                   <div className="md:col-span-3"><input className="w-full p-3 rounded-xl border border-slate-200 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500" placeholder="כתובת אספקה מלאה" defaultValue={order.delivery_address} onBlur={(e) => onUpdate(order.id, { delivery_address: e.target.value })} /></div>
                </div>
              )}

              {isExpanded && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 md:p-8 border-t-2 border-slate-50">
                  <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 mb-6 text-3xl font-black italic uppercase text-slate-800 whitespace-pre-line">{order.warehouse}</div>
                  <div className="flex gap-4">
                    <button onClick={() => handlePrint(order)} className="flex-1 py-5 bg-slate-900 text-white rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-blue-600 transition-all"><Printer size={22}/> הדפסה</button>
                    <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(order.warehouse)}`)} className="flex-1 py-5 bg-emerald-500 text-white rounded-2xl font-black flex items-center justify-center gap-3"><Share2 size={22}/> WhatsApp</button>
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
