'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from "framer-motion";
import { Send, X } from "lucide-react";

export default function ChatPopup({ order, onClose }: any) {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const sendMessage = async () => {
    if (!message.trim()) return;

    const userMsg = { from: "user", text: message };
    setChat(prev => [...prev, userMsg]);
    setMessage("");

    const response = await fetch("/api/ai-supervisor-core", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: message,
        sender_name: "ראמי"
      })
    });

    const data = await response.json();
    const aiMsg = { from: "ai", text: data.reply };

    setChat(prev => [...prev, aiMsg]);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chat]);

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
        bg-white shadow-2xl rounded-t-3xl 
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
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-100">
        {chat.map((msg, i) => (
          <div
            key={i}
            className={`
              p-3 rounded-xl max-w-[80%]
              ${msg.from === "user"
                ? "bg-blue-200 text-blue-900 ml-auto"
                : "bg-gray-300 text-gray-800 mr-auto"
              }
            `}
          >
            {msg.text}
          </div>
        ))}
      </div>

      {/* INPUT AREA */}
      <div className="p-4 border-t flex gap-2 bg-white">
        <input
          className="flex-1 p-2 border rounded-lg"
          placeholder="מה תרצה שה‑AI יבצע?"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        <button
          onClick={sendMessage}
          className="bg-blue-600 p-3 rounded-xl text-white"
        >
          <Send size={20} />
        </button>
      </div>
    </motion.div>
  );
}
