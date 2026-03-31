'use client';
import React, { useState, useEffect, useRef } from 'react';
import AppLayout from '../../components/Layout';
import { supabase } from '../../lib/supabase';
import { Send, Hash, Bell, Shield, Paperclip, MoreVertical, CheckCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SabanGroupChat() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // אתחול צלצול הודעה
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
    
    loadMyProfile();
    fetchMessages();

    // האזנה בזמן אמת עם לוגיקה תקינה ל-payload
    const channel = supabase
      .channel('group-chat-v2')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'group_messages' }, (payload: any) => {
        const newMessage = payload.new;
        setMessages((prev) => [...prev, newMessage]);

        // הפעלת צלצול והתראה אם ההודעה לא ממך
        if (newMessage.sender_name !== 'ראמי מסארווה') {
          audioRef.current?.play().catch(() => console.log("Audio blocked"));
          
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification(`sabanos: הודעה מ${newMessage.sender_name}`, {
              body: newMessage.content,
              icon: 'https://i.postimg.cc/3wTMxG7W/ai.jpg'
            });
          }
        }
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
    if (!error) setInput('');
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-120px)] max-w-6xl mx-auto bg-[#F8F9FA] rounded-[3rem] overflow-hidden shadow-2xl border border-white" dir="rtl">
        
        {/* Header */}
        <div className="p-6 bg-white border-b border-slate-200 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[#0B0F1A] rounded-2xl flex items-center justify-center text-emerald-500">
              <Hash size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#0B0F1A]">קבוצת הסידור | <span className="text-emerald-600">sabanos</span></h2>
              <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider italic">מערכת ניהול חכמה</p>
            </div>
          </div>
          <div className="flex gap-2">
             <button className="p-3 bg-slate-100 rounded-full text-slate-400 hover:text-emerald-600 transition-all"><Bell size={20} /></button>
          </div>
        </div>

        {/* Chat Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 bg-gradient-to-b from-white to-[#F1F3F5]">
          {messages.map((m, i) => {
            const isMe = m.sender_name === 'ראמי מסארווה';
            return (
              <motion.div
                key={m.id || i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${isMe ? 'justify-start' : 'justify-end'}`}
              >
                <div className={`max-w-[80%] p-5 rounded-[2rem] shadow-sm ${
                  isMe ? 'bg-white text-slate-800 border border-slate-200 rounded-tr-none' : 'bg-emerald-600 text-white rounded-tl-none'
                }`}>
                  <div className={`text-[10px] font-black uppercase mb-1 ${isMe ? 'text-emerald-600' : 'text-emerald-100'}`}>
                    {m.sender_name} • {m.sender_role}
                  </div>
                  <p className="text-sm font-medium leading-relaxed">{m.content}</p>
                  <div className="flex justify-end mt-1 opacity-40"><CheckCheck size={12} /></div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Input */}
        <div className="p-6 bg-white border-t border-slate-200">
          <form onSubmit={sendMessage} className="flex items-center gap-4 bg-[#F1F3F5] p-2 rounded-[2.5rem] border border-slate-200">
            <button type="button" className="p-3 text-slate-400 hover:text-emerald-600"><Paperclip size={22} /></button>
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="פקודה חדשה לסידור..."
              className="flex-1 bg-transparent p-3 outline-none text-slate-800 font-bold"
            />
            <button type="submit" className="bg-[#0B0F1A] text-emerald-500 p-4 rounded-full shadow-xl hover:scale-105 active:scale-95 transition-all">
              <Send size={22} className="rotate-180" />
            </button>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
