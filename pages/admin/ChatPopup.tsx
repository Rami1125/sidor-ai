// ChatPopup.tsx — פופאפ AI מלא, תואם לוגיקה קיימת, מוכן להדבקה

'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Send } from 'lucide-react';

interface ChatPopupProps {
  order: any;
  onClose: () => void;
}

export default function ChatPopup({ order, onClose }: ChatPopupProps) {
  const [msg, setMsg] = useState('');
  const [chat, setChat] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const sendToAI = async () => {
    if (!msg.trim()) return;

    const newMsg = { from: 'user', text: msg };
    setChat((prev) => [...prev, newMsg]);
    setMsg('');
    setLoading(true);

    // בקשה ל-AI (השרת שלך)
    try {
      const res = await fetch("https://your-server.com/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          prompt: msg,
        }),
      });

      const data = await res.json();

      setChat((prev) => [
        ...prev,
        { from: 'ai', text: data.reply ?? "בוצע ✅" }
      ]);
    } catch (e) {
      setChat((prev) => [
        ...prev,
        { from: 'ai', text: "שגיאת תקשורת עם AI" }
      ]);
    }

    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      className="fixed bottom-0 right-0 w-full md:w-96 bg-white shadow-2xl border rounded-t-2xl z-50"
      style={{ direction: 'rtl' }}
    >
      {/* Header */}
      <div className="p-4 border-b flex justify-between items-center bg-blue-600 text-white rounded-t-2xl">
        <h2 className="font-bold">עדכון הזמנה עם AI – {order.client_info}</h2>
        <button onClick={onClose}>
          <X size={24} className="text-white" />
        </button>
      </div>

      {/* Chat Message Area */}
      <div className="p-4 h-72 overflow-y-auto space-y-3 bg-gray-50">
        {chat.map((c, i) => (
          <div
            key={i}
            className={`p-3 rounded-xl max-w-[85%] ${
              c.from === 'user'
                ? 'bg-blue-100 text-blue-900 ml-auto'
                : 'bg-gray-200 text-gray-800 mr-auto'
            }`}
          >
            {c.text}
          </div>
        ))}

        {loading && (
          <div className="p-3 rounded-xl bg-gray-300 text-gray-700 mr-auto w-fit">
            עובד...
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t flex gap-2 bg-white">
        <input
          type="text"
          className="flex-1 p-2 border rounded-lg outline-none"
          placeholder="מה תרצה לעדכן בהזמנה?"
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
        />

        <button
          onClick={sendToAI}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-lg flex items-center justify-center"
        >
          <Send size={20} />
        </button>
      </div>
    </motion.div>
  );
}
``
