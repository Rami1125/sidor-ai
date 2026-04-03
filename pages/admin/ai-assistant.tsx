import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Menu, Send, X, Bot, User, Zap, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AIAssistant() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, history: messages }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMessages(prev => [...prev, { role: 'assistant', content: data.content }]);
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'בוס, יש תקלה בחיבור למוח. נסה שוב בעוד רגע.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#0f172a] text-slate-100 font-sans dir-rtl" dir="rtl">
      {/* Header */}
      <header className="p-4 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex justify-between items-center shrink-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-500/20"><Bot size={24}/></div>
          <h1 className="text-xl font-black italic tracking-tighter uppercase text-white">Saban <span className="text-blue-500">AI</span></h1>
        </div>
        <div className="bg-slate-800 px-3 py-1 rounded-full text-[10px] font-black text-blue-400 border border-slate-700 animate-pulse">
          LIVE INTELLIGENCE
        </div>
      </header>

      {/* Chat Messages */}
      <main ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-[#0f172a] to-black">
        <AnimatePresence>
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-20 p-10">
              <Sparkles size={60} className="mb-4 text-blue-500" />
              <p className="text-lg font-black italic">המוח של סבן מוכן לפעולה.<br/>איך אני יכול לעזור היום?</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={i} 
              className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}
            >
              <div className={`max-w-[85%] p-4 rounded-[1.8rem] shadow-2xl relative ${
                msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-slate-800/80 backdrop-blur-sm text-slate-100 border border-slate-700 rounded-tl-none'
              }`}>
                <div className={`flex items-center gap-2 mb-1 text-[9px] font-black uppercase tracking-tighter ${msg.role === 'user' ? 'text-blue-100' : 'text-blue-400'}`}>
                  {msg.role === 'user' ? <User size={12}/> : <Zap size={12}/>}
                  {msg.role === 'user' ? 'Rami' : 'Saban AI Assistant'}
                </div>
                <div className="text-sm font-bold leading-relaxed whitespace-pre-wrap">
                  {msg.content}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {loading && (
          <div className="flex justify-end items-center gap-2 text-blue-500 font-black italic text-[10px]">
            <LoaderIcon /> סבן מעבד נתונים...
          </div>
        )}
      </main>

      {/* Input Area */}
      <footer className="p-4 bg-slate-900 border-t border-slate-800 shrink-0">
        <div className="max-w-4xl mx-auto flex gap-2">
          <input 
            className="flex-1 p-4 bg-slate-800 border border-slate-700 rounded-2xl outline-none focus
