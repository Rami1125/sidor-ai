'use client';
import React, { useState, useEffect, useRef } from 'react';
import AppLayout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { 
  Send, Bot, User, Paperclip, Mic, 
  CheckCheck, Phone, Video, MoreVertical 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SabanChat() {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    const channel = supabase.channel('chat_main_sync')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
        setMessages(prev => [...prev, payload.new]);
        scrollToBottom();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchMessages = async () => {
    const { data } = await supabase.from('chat_messages').select('*').order('created_at', { ascending: true });
    setMessages(data || []);
    scrollToBottom();
  };

  const scrollToBottom = () => {
    setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const text = inputValue;
    setInputValue('');

    const { error } = await supabase.from('chat_messages').insert([
      { sender_name: 'ראמי', text, is_ai: false }
    ]);

    if (!error) {
      setIsTyping(true);
      try {
        const response = await fetch('/api/ai-supervisor-core', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: text, sender_name: 'ראמי' })
        });
        const data = await response.json();
        
        await supabase.from('chat_messages').insert([{
          sender_name: 'SABAN AI',
          text: data.reply,
          is_ai: true
        }]);
      } catch (err) {
        console.error("AI Error:", err);
      } finally {
        setIsTyping(false);
      }
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-64px)] bg-[#efeae2]" dir="rtl">
        {/* Header */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-b border-slate-200 shadow-sm z-10">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-emerald-400 shadow-md">
                <Bot size={24} />
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 leading-none">קבוצת ניהול סבן AI</h2>
              <p className="text-[10px] font-bold text-emerald-600 mt-1 uppercase tracking-tighter">פעיל עכשיו</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <Phone size={20} className="hover:text-emerald-600 transition-colors cursor-pointer" />
            <MoreVertical size={20} />
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
          {messages.map((msg, idx) => {
            const isMe = msg.sender_name === 'ראמי';
            return (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={idx} 
                className={`flex ${isMe ? 'justify-start' : 'justify-end'}`}
              >
                <div className={`max-w-[85%] p-3 rounded-2xl shadow-sm ${
                  isMe ? 'bg-[#dcf8c6] rounded-tr-none' : 
                  msg.is_ai ? 'bg-slate-900 text-white rounded-tl-none border-b-2 border-emerald-500' : 
                  'bg-white rounded-tl-none'
                }`}>
                  {!isMe && <p className={`text-[10px] font-black mb-1 uppercase ${msg.is_ai ? 'text-emerald-400' : 'text-blue-600'}`}>{msg.sender_name}</p>}
                  <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  <div className="flex justify-end items-center gap-1 mt-1 opacity-50">
                    <span className="text-[9px] font-bold">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {isMe && <CheckCheck size={12} className="text-emerald-600" />}
                  </div>
                </div>
              </motion.div>
            );
          })}
          {isTyping && (
            <div className="flex justify-end">
              <div className="bg-white p-3 rounded-2xl shadow-sm italic text-[10px] font-black text-slate-400 animate-pulse">
                SABAN AI חושב...
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        {/* Input */}
        <div className="bg-[#f0f2f5] p-3 border-t border-slate-200">
          <form onSubmit={sendMessage} className="max-w-4xl mx-auto flex items-center gap-2">
            <div className="flex-1 bg-white rounded-full flex items-center px-4 py-2 shadow-sm border border-slate-200">
              <Paperclip size={20} className="text-slate-400 ml-2 cursor-pointer hover:text-blue-500 transition-colors" />
              <input 
                type="text" 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="כתוב פקודה למוח..."
                className="flex-1 bg-transparent border-none outline-none text-sm font-medium py-1"
              />
              <Mic size={20} className="text-slate-400 mr-2 cursor-pointer hover:text-red-500 transition-colors" />
            </div>
            <button type="submit" className="w-11 h-11 bg-emerald-600 rounded-full flex items-center justify-center text-white shadow-lg active:scale-90 transition-all">
              <Send size={20} fill="currentColor" />
            </button>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
