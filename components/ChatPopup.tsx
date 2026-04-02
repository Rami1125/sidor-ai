import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Bot, Sparkles } from 'lucide-react';

export const ChatPopup = ({ order, onClose, onUpdate }: any) => {
  const [msg, setMsg] = useState('');
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }}
      className="fixed bottom-10 left-10 w-96 bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-slate-100 z-[100] overflow-hidden"
    >
      <div className="bg-slate-900 p-5 text-white flex justify-between items-center">
        <div className="flex items-center gap-2 font-black italic text-sm">
          <Bot className="text-[#00C8A5]" size={20} /> עדכון AI: {order.client_info}
        </div>
        <button onClick={onClose}><X size={18} /></button>
      </div>
      <div className="p-6 h-64 overflow-y-auto bg-slate-50/50 text-xs font-bold text-slate-600">
        <div className="bg-white p-3 rounded-2xl shadow-sm mb-4 border border-slate-100">
          אהלן ראמי, אני מזהה את הזמנה #{order.order_number}. מה נרצה לעדכן בה?
        </div>
      </div>
      <div className="p-4 border-t border-slate-100 flex gap-2 bg-white">
        <input 
          value={msg} onChange={(e) => setMsg(e.target.value)}
          placeholder="למשל: תשנה כתובת להרצל 5..."
          className="flex-1 bg-slate-100 p-3 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-[#3D7AFE]"
        />
        <button className="bg-[#3D7AFE] text-white p-3 rounded-xl shadow-lg shadow-blue-500/20"><Send size={18}/></button>
      </div>
    </motion.div>
  );
};
