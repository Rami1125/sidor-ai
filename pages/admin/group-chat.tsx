'use client';
import React, { useState, useEffect, useRef } from 'react';
import AppLayout from '../../components/Layout';
import { supabase } from '../../lib/supabase';
import { Send, Hash, Bell, Shield, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SabanGroupChat() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null); // הפרופיל שלך (ראמי)
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // שלב א': טעינת הפרופיל שלך (מדמים זיהוי משתמש)
    loadMyProfile();
    // שלב ב': טעינת הודעות והאזנה לזמן אמת
    fetchMessages();
    const channel = supabase
      .channel('group-chat')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'group_messages' }, (payload) => {
        setMessages((prev) => [...prev, payload.new]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const loadMyProfile = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('full_name', 'ראמי מסארווה').single();
    setCurrentUser(data);
  };

  const fetchMessages = async () => {
    const { data } = await supabase.from('group_messages').select('*').order('created_at', { ascending: true });
    setMessages(data || []);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !currentUser) return;

    const msgData = {
      sender_id: currentUser.id,
      sender_name: currentUser.full_name,
      sender_role: currentUser.role,
      content: input,
      type: 'user'
    };

    const { error } = await supabase.from('group_messages').insert([msgData]);
    if (!error) {
      // ניתוח AI מהיר להודעה
      handleAIAutomation(input);
      setInput('');
    }
  };

  const handleAIAutomation = async (text: string) => {
    // לוגיקה של המוח: זיהוי תיוגים אוטומטיים
    if (text.includes('חסר') || text.includes('להזמין')) {
      await supabase.from('group_messages').insert([{
        sender_name: 'SABAN AI',
        content: `🤖 זיהיתי חוסר. מתייג את @נתנאל לבדיקת מלאי ורכש מיידי.`,
        type: 'ai'
      }]);
    }
    if (text.includes('העברה') || text.includes('החרש')) {
      await supabase.from('group_messages').insert([{
        sender_name: 'SABAN AI',
        content: `🤖 @איציק זהבי, בקשת העברה זוהתה. @עלי יקבל עדכון לסידור ברגע שראמי יאשר.`,
        type: 'ai'
      }]);
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-140px)] max-w-5xl mx-auto glass-panel rounded-[3rem] overflow-hidden shadow-2xl border border-white/10">
        
        {/* Header - Saban Style */}
        <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-black shadow-lg">
              <Hash size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black italic uppercase tracking-tighter">SABAN <span className="text-emerald-500">GROUP</span></h2>
              <p className="text-[10px] opacity-40 font-bold uppercase">6 משתתפים פעילים | Real-time Management</p>
            </div>
          </div>
          <Shield className="text-emerald-500 opacity-20" size={24} />
        </div>

        {/* Messages List */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide bg-black/20">
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${m.type === 'ai' ? 'justify-center' : (m.sender_name === currentUser?.full_name ? 'justify-start' : 'justify-end')}`}
            >
              <div className={`max-w-[85%] p-4 rounded-[2rem] ${
                m.type === 'ai' 
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-center text-xs' 
                : 'bg-white/5 border border-white/10'
              }`}>
                {m.type !== 'ai' && (
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black text-emerald-500 uppercase">{m.sender_name}</span>
                    <span className="text-[8px] opacity-30 font-bold tracking-widest">{m.sender_role}</span>
                  </div>
                )}
                <p className="text-sm leading-relaxed">{m.content}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Input Field */}
        <div className="p-6 border-t border-white/5 bg-black/40">
          <form onSubmit={sendMessage} className="flex items-center gap-3">
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="כתוב פקודה או עדכון לצוות..."
              className="flex-1 bg-white/5 border border-white/10 p-4 rounded-2xl outline-none focus:border-emerald-500 transition-all text-sm"
            />
            <button type="submit" className="bg-emerald-500 text-black p-4 rounded-2xl shadow-lg hover:scale-105 transition-all">
              <Send size={20} className="rotate-180" />
            </button>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
