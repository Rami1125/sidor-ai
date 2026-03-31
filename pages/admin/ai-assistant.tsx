'use client';
import React, { useState, useEffect, useRef } from 'react';
import AppLayout from '../../components/Layout';
import { supabase } from '../../lib/supabase';
import { Send, Bot, User, RefreshCcw, Paperclip, Mic, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AIAssistant() {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // גלילה אוטומטית לסוף הצ'אט
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai-analyst1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMsg }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'ai', content: data.answer }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', content: 'מצטער בוס, יש תקלה בחיבור למוח.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-120px)] max-w-4xl mx-auto bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
        
        {/* Header של הצ'אט */}
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <Bot size={24} />
            </div>
            <div>
              <h2 className="text-slate-900 font-black text-lg">Saban AI Assistant</h2>
              <div className="flex items-center gap-2 text-[10px] text-blue-500 font-bold uppercase tracking-wider">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                מחובר לנתוני הארגון
              </div>
            </div>
          </div>
          <button className="text-slate-400 hover:text-blue-500 transition-colors">
            <RefreshCcw size={20} />
          </button>
        </div>

        {/* אזור ההודעות */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-white scroll-smooth">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-40">
              <Sparkles size={48} className="text-blue-500" />
              <p className="font-bold text-slate-500 uppercase tracking-widest text-sm">איך אני יכול לעזור לך היום, בוס?</p>
            </div>
          )}
          
          <AnimatePresence>
            {messages.map((m, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}
              >
                <div className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'flex-row' : 'flex-row-reverse'}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${
                    m.role === 'user' ? 'bg-slate-100 text-slate-500' : 'bg-blue-500 text-white'
                  }`}>
                    {m.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                  </div>
                  <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    m.role === 'user' 
                      ? 'bg-slate-50 text-slate-800 border border-slate-100 rounded-tr-none' 
                      : 'bg-blue-50 text-blue-900 border border-blue-100 rounded-tl-none'
                  }`}>
                    {m.content}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {loading && (
            <div className="flex justify-end">
              <div className="bg-blue-50 p-4 rounded-2xl rounded-tl-none flex gap-2">
                <span className="w-2 h-2 bg-blue-300 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}
        </div>

        {/* תיבת קלט */}
        <div className="p-6 bg-slate-50/50 border-t border-slate-100">
          <form onSubmit={sendMessage} className="relative flex items-center gap-3">
            <button type="button" className="p-2 text-slate-400 hover:text-blue-500 transition-colors">
              <Paperclip size={20} />
            </button>
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="כתוב הודעה..."
              className="flex-1 bg-white border border-slate-200 p-4 rounded-2xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 text-slate-800 transition-all"
            />
            <button type="button" className="p-2 text-slate-400 hover:text-blue-500 transition-colors">
              <Mic size={20} />
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="bg-blue-500 text-white p-4 rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50"
            >
              <Send size={20} className="rotate-180" />
            </button>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
