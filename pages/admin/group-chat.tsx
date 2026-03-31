'use client';
import React, { useState, useEffect, useRef } from 'react';
import AppLayout from '../../components/Layout';
import { supabase } from '../../lib/supabase';
import { Send, Hash, Bell, Shield, Info, Paperclip, MoreVertical, CheckCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SabanGroupChat() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // אתחול צלצול הודעה
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
    
    loadMyProfile();
    fetchMessages();

    // האזנה בזמן אמת עם צלצול
    const channel = supabase
      .channel('group-chat-v2')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'group_messages' }, (payload) => {
        setMessages((prev) => [...prev, payload.new]);
        // השמעת צלצול אם ההודעה לא נשלחה על ידי המשתמש הנוכחי
        if (payload.new.sender_name !== 'ראמי מסארווה') {
          audioRef.current?.play().catch(e => console.log("Audio play blocked", e));
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
// בתוך ה-useEffect של הצ'אט
const playNotificationSound = () => {
  const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
  audio.play().catch(err => console.log("Sound blocked until user interacts with page"));
};

// בתוך ה-on('postgres_changes'...)
if (payload.new.sender_name !== 'ראמי מסארווה') {
  playNotificationSound();
  
  // שליחת התראה ויזואלית אם האפליקציה ברקע
  if (Notification.permission === "granted") {
    new Notification(`הודעה חדשה מ${payload.new.sender_name}`, {
      body: payload.new.content,
      icon: 'https://i.postimg.cc/3wTMxG7W/ai.jpg'
    });
  }
}
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
      handleAIAutomation(input);
      setInput('');
    }
  };

  const handleAIAutomation = async (text: string) => {
    if (text.includes('חסר') || text.includes('להזמין')) {
      setTimeout(async () => {
        await supabase.from('group_messages').insert([{
          sender_name: 'SABAN AI',
          content: `🤖 @נתנאל, בוס, זיהיתי חוסר קריטי. המשימה נרשמה במעקב רכש.`,
          type: 'ai'
        }]);
      }, 1000);
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-100px)] max-w-6xl mx-auto bg-[#F8F9FA] rounded-[3rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white" dir="rtl">
        
        {/* Header - עיצוב בהיר משולב כהה */}
        <div className="p-6 bg-white border-b border-slate-200 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[#0B0F1A] rounded-2xl flex items-center justify-center text-emerald-500 shadow-xl">
              <Hash size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#0B0F1A] tracking-tight">קבוצת הסידור | <span className="text-emerald-600">SABAN OS</span></h2>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">6 מנהלים בחיבור ישיר</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
             <button className="p-3 bg-slate-100 rounded-full text-slate-400 hover:text-emerald-600 transition-all"><Bell size={20} /></button>
             <button className="p-3 bg-slate-100 rounded-full text-slate-400"><MoreVertical size={20} /></button>
          </div>
        </div>

        {/* Message Area - בהיר ונקי */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 bg-gradient-to-b from-white to-[#F1F3F5] scroll-smooth">
          {messages.map((m, i) => {
            const isMe = m.sender_name === 'ראמי מסארווה';
            const isAI = m.type === 'ai';

            return (
              <motion.div
                key={m.id || i}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${isAI ? 'justify-center' : (isMe ? 'justify-start' : 'justify-end')}`}
              >
                <div className={`relative max-w-[80%] p-5 rounded-[2rem] shadow-sm ${
                  isAI 
                  ? 'bg-[#0B0F1A] text-emerald-400 text-center text-sm border-2 border-emerald-500/20' 
                  : (isMe ? 'bg-white text-slate-800 rounded-tr-none border border-slate-200' : 'bg-emerald-600 text-white rounded-tl-none shadow-emerald-200')
                }`}>
                  {!isAI && (
                    <div className={`flex items-center gap-2 mb-1 text-[10px] font-black uppercase tracking-widest ${isMe ? 'text-emerald-600' : 'text-emerald-100'}`}>
                      {m.sender_name} • {m.sender_role}
                    </div>
                  )}
                  <p className="text-[15px] font-medium leading-relaxed">{m.content}</p>
                  
                  {!isAI && (
                    <div className={`flex justify-end mt-1 opacity-50 ${isMe ? 'text-slate-400' : 'text-white'}`}>
                      <CheckCheck size={14} />
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Input Area - עיצוב כהה משולב (Deep Nav) */}
        <div className="p-6 bg-white border-t border-slate-200">
          <form onSubmit={sendMessage} className="flex items-center gap-4 bg-[#F1F3F5] p-2 rounded-[2.5rem] border border-slate-200 focus-within:border-emerald-500 transition-all">
            <button type="button" className="p-3 text-slate-400 hover:text-emerald-600 transition-all">
              <Paperclip size={22} />
            </button>
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="פקודה חדשה לסידור..."
              className="flex-1 bg-transparent p-3 outline-none text-slate-800 font-bold placeholder:text-slate-400"
            />
            <button 
              type="submit" 
              className="bg-[#0B0F1A] text-emerald-500 p-4 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all"
            >
              <Send size={22} className="rotate-180" />
            </button>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
