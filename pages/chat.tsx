pages/chat.tsx'use client';
import React, { useState, useEffect, useRef } from 'react';
import AppLayout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { 
  Send, Bot, User, paperclip, Mic, 
  CheckCheck, Phone, Video, MoreVertical 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SabanChat() {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. טעינת הודעות והאזנה ל-Realtime
  useEffect(() => {
    fetchMessages();
    const channel = supabase.channel('public_chat')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
        setMessages(prev => [...prev, payload.new]);
        scrollToBottom();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchMessages = async () => {
    const { data } = await supabase.from('chat_messages').select('*').order('created_at', { ascending: true }).limit(50);
    setMessages(data || []);
    scrollToBottom();
  };

  const scrollToBottom = () => {
    setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  // 2. שליחת הודעה והפעלת ה-AI
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage = {
      sender_name: 'ראמי (בוס)',
      text: inputValue,
      is_ai: false,
      created_at: new Date().toISOString()
    };

    setInputValue('');
    const { error } = await supabase.from('chat_messages').insert([userMessage]);

    if (!error) {
      setIsTyping(true);
      // קריאה ל-API של ה-AI שיצרנו קודם
      const response = await fetch('/api/ai-supervisor-core', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMessage.text, sender_name: 'ראמי' })
      });
      const data = await response.json();
      
      // הזרקת תשובת ה-AI לצאט
      await supabase.from('chat_messages').insert([{
        sender_name: 'SABAN AI',
        text: data.reply,
        is_ai: true
      }]);
      setIsTyping(false);
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-64px)] bg-[#efeae2] overflow-hidden" dir="rtl">
        
        {/* Header של הצ'אט */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-b border-slate-200 shadow-sm z-10">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white shadow-md">
                <Bot size={24} />
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 leading-none">קבוצת ניהול סבן AI</h2>
              <p className="text-[10px] font-bold text-emerald-600 mt-1 uppercase tracking-tighter">פעיל עכשיו | הראל, נתנאל, יואב</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <Phone size={20} className="hover:text-emerald-600 cursor-pointer transition-colors" />
            <MoreVertical size={20} />
          </div>
        </div>

        {/* אזור ההודעות */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
          {messages.map((msg, idx) => {
            const isMe = msg.sender_name.includes('ראמי');
            const isAI = msg.is_ai;

            return (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                key={idx} 
                className={`flex ${isMe ? 'justify-start' : 'justify-end'}`}
              >
                <div className={`max-w-[85%] p-3 rounded-2xl shadow-sm relative ${
                  isMe ? 'bg-[#dcf8c6] rounded-tr-none' : 
                  isAI ? 'bg-slate-900 text-white rounded-tl-none border-b-4 border-emerald-500' : 
                  'bg-white rounded-tl-none'
                }`}>
                  {!isMe && <p className={`text-[10px] font-black mb-1 uppercase ${isAI ? 'text-emerald-400' : 'text-blue-600'}`}>{msg.sender_name}</p>}
                  <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  <div className="flex justify-end items-center gap-1 mt-1">
                    <span className="text-[9px] opacity-50 font-bold">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {isMe && <CheckCheck size={12} className="text-emerald-600" />}
                  </div>
                </div>
              </motion.div>
            );
          })}
          {isTyping && (
            <div className="flex justify-end">
              <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm flex gap-1">
                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        {/* אזור הקלדה */}
        <div className="bg-[#f0f2f5] p-3 border-t border-slate-200">
          <form onSubmit={sendMessage} className="max-w-4xl mx-auto flex items-center gap-2">
            <div className="flex-1 bg-white rounded-full flex items-center px-4 py-2 shadow-sm border border-slate-200">
              <input 
                type="text" 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="כתוב פקודה או הודעה לצוות..."
                className="flex-1 bg-transparent border-none outline-none text-sm font-medium py-1"
              />
              <Mic size={20} className="text-slate-400 cursor-pointer hover:text-emerald-600 transition-colors" />
            </div>
            <button 
              type="submit"
              className="w-11 h-11 bg-emerald-600 rounded-full flex items-center justify-center text-white shadow-lg active:scale-90 transition-all"
            >
              <Send size={20} fill="currentColor" />
            </button>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
