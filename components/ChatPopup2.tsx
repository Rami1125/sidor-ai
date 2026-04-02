'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from "framer-motion";
import { Send, X } from "lucide-react";

export default function ChatPopup({ order, onClose }: any) {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<any[]>([]);
  const [typing, setTyping] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(scrollToBottom, [chat, typing]);

  const sendMessage = async () => {
    if (!message.trim()) return;

    const userMsg = { from: "user", text: message };
    setChat(prev => [...prev, userMsg]);
    setMessage("");

    // ✅ הפעלת Typing…
    setTyping(true);

    const response = await fetch("/api/ai-supervisor-core", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: message,
        sender_name: "ראמי",
      }),
    });

    const data = await response.json();

    // ✅ הפסקת Typing…
    setTyping(false);

    const aiMsg = { from: "ai", text: data.reply };
    setChat(prev => [...prev, aiMsg]);
  };

  return (
    <motion.div
      initial={{ y: 200, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 200, opacity: 0 }}
      transition={{ duration: 0.35 }}
      className="
        fixed bottom-0 right-0 
        w-full md:w-96 
        h-[70vh] 
        bg-white shadow-2xl 
        rounded-t-3xl 
        flex flex-col 
        z-[999999]
      "
      style={{ direction: "rtl" }}
    >
      {/* HEADER */}
      <div className="p-4 flex justify-between items-center bg-blue-600 text-white rounded-t-3xl">
        <h2 className="text-lg font-bold">AI – עדכון הזמנה</h2>
        <button onClick={onClose}><X size={26} /></button>
      </div>

      {/* CHAT AREA */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">

        {chat.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: msg.from === "user" ? 30 : -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25 }}
            className={`
              p-3 rounded-xl max-w-[80%]
              ${msg.from === "user"
                ? "bg-blue-200 text-blue-900 ml-auto"
                : "bg-white border text-gray-800 mr-auto shadow-sm"
              }
            `}
          >
            {msg.text}
          </motion.div>
        ))}

        {/* ✅ AI TYPING ANIMATION */}
        {typing && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25 }}
            className="mr-auto bg-white border p-3 rounded-xl shadow-sm w-20"
          >
            <div className="flex gap-1">
              <motion.span
                className="w-2 h-2 bg-gray-600 rounded-full"
                animate={{ y: [0, -4, 0] }}
                transition={{ repeat: Infinity, duration: 0.6 }}
              />
              <motion.span
                className="w-2 h-2 bg-gray-600 rounded-full"
                animate={{ y: [0, -4, 0] }}
                transition={{ repeat: Infinity, duration: 0.6, delay: 0.15 }}
              />
              <motion.span
                className="w-2 h-2 bg-gray-600 rounded-full"
                animate={{ y: [0, -4, 0] }}
                transition={{ repeat: Infinity, duration: 0.6, delay: 0.3 }}
              />
            </div>
          </motion.div>
        )}

      </div>

      {/* INPUT BAR */}
      <div className="p-4 border-t flex flex-col gap-2 bg-white">

        {/* QUICK ACTIONS */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setMessage("שנה שעה ל־12:00")}
            className="bg-gray-200 px-3 py-1 rounded-full text-sm"
          >
            שעה → 12:00
          </button>

          <button
            onClick={() => setMessage("שנה נהג ל־עלי")}
            className="bg-gray-200 px-3 py-1 rounded-full text-sm"
          >
            נהג → עלי
          </button>

          <button
            onClick={() => setMessage("שנה כתובת ללקוח")}
            className="bg-gray-200 px-3 py-1 rounded-full text-sm"
          >
            עדכן כתובת
          </button>
        </div>

        {/* INPUT */}
        <div className="flex gap-2">
          <input
            className="flex-1 p-2 border rounded-lg"
            placeholder="מה תרצה שה‑AI יבצע?"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />

          <button
            onClick={sendMessage}
            className="bg-blue-600 hover:bg-blue-700 p-3 rounded-xl text-white"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
