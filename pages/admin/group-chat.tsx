'use client';
import React, { useState, useEffect, useRef } from 'react';
import AppLayout from '../../components/Layout';
import { supabase } from '../../lib/supabase';
import { Send, User, Bot, Paperclip, Bell, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// הגדרת סוג להודעה
type Message = {
  id: string;
  sender_name: string;
  sender_role: string;
  content: string;
  created_at: string;
  type: 'user' | 'system' | 'ai';
};

export default function GroupChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // שליפת הודעות ראשונית והאזנה לזמן אמת
  useEffect(() => {
    fetchMessages();
    const channel = supabase
      .channel('group_chat_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'group_messages' }, (payload) => {
        setMessages((prev) => [...prev, payload.new as Message]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const fetchMessages = async () => {
    const { data } = await supabase.from('group_messages').select('*').order('created_at', { ascending: true });
    setMessages(data || []);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // כאן אנחנו מדמים את השולח כ"ראמי" (מנהל המערכת)
    const newMessage = {
      sender_name: 'ראמי מסארווה',
      sender_role: 'מנהל מערכת',
      content: input,
      type: 'user'
    };

    const { error } = await supabase.from('group_messages').insert([newMessage]);
    if (!error) setInput('');
    
    // בדיקת AI - אם ההודעה דורשת טיפול (למשל תיוג נתנאל או אורן)
    checkAIResponse(input);
  };

  const checkAIResponse = async (text: string) => {
    if (text.includes('חסר') || text.includes('העברה') || text.includes('נתנאל')) {
      setLoading(true);
      // סימולציה של תגובת AI חכמה שמנתחת את ההקשר של הצוות
      setTimeout(async () => {
        const aiMsg = {
          sender_name: 'SABAN AI',
          sender_role: 'מערכת חכמה',
          content: `🤖 בוס, זיהיתי צורך בטיפול. מתייג את @נתנאל לבדיקת רכש ואת @אורן להכנה במחסן החרש.`,
          type: 'ai'
        };
        await supabase.from('group_messages').insert([aiMsg]);
        setLoading(false);
      }, 1500);
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-140px)] max-w-5xl mx-auto glass-panel rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl bg-[#0A0A0A]/60">
        
        {/* Chat Header */}
        <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              <Hash size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black italic">הצא'ט הארגוני | SABAN OS</h2>
              <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">צוות ניהול וביצוע פעיל</p>
            </div>
          </div>
          <div className="flex -space-x-2">
             {/* כאן אפשר להוסיף עיגולים קטנים עם תמונות של הצוות */}
             <div className="w-8 h-8 rounded-full border-2 border-[#0A0A0A] bg-slate-800 flex items-center justify-center text-[10px] font-bold">+6</div>
          </div>
        </div>

        {/* Message Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
          <AnimatePresence>
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, x: m.type === 'ai' ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex ${m.type === 'ai' ? 'justify-center' : (m.sender_name === 'ראמי מסארווה' ? 'justify-start' : 'justify-end')}`}
              >
                <div className={`max-w-[80%] p-4 rounded-[2rem] ${
                  m.type === 'ai' 
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-center italic text-sm' 
                  : 'bg-white/5 border border-white/10'
                }`}>
                  {m.type !== 'ai' && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black text-emerald-500 uppercase">{m.sender_name}</span>
                      <span className="text-[9px] opacity-30 font-bold">{m.sender_role}</span>
                    </div>
                  )}
                  <p className="text-sm leading-relaxed">{m.content}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Input Area */}
        <div className="p-6 bg-white/5 border-t border-white/5">
          <form onSubmit={handleSend} className="relative flex items-center gap-4">
            <button type="button" className="p-3 text-white/30 hover:text-emerald-500 transition-all"><Paperclip size={20} /></button>
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="כתוב הודעה לצוות..."
              className="flex-1 bg-black/40 border border-white/10 p-4 rounded-2xl outline-none focus:border-emerald-500 transition-all text-sm"
            />
            <button 
              type="submit" 
              className="bg-emerald-500 text-black p-4 rounded-2xl shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all"
            >
              <Send size={20} className="rotate-180" />
            </button>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
