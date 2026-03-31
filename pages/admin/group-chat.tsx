'use client';
import React, { useState, useEffect, useRef } from 'react';
import AppLayout from '../../components/Layout';
import { supabase } from '../../lib/supabase';
import { Send, Hash, Bell, Shield, Paperclip, MoreVertical, CheckCheck, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// הגדרת משתתפים לצא'ט עם תמונות מקצועיות UI
const teamMembers: { [key: string]: string } = {
  'הראל': 'https://i.postimg.cc/44r6V05C/harel.jpg',
  'נתנאל ח. סבן': 'https://i.postimg.cc/3wTMxG7W/ai.jpg',
  'ראמי מסארווה': 'https://i.postimg.cc/mD8zQcby/rami.jpg',
  'SABAN AI': 'https://i.postimg.cc/3wTMxG7W/ai.jpg' // למוח יש את הלוגו של ה-AI
};

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
      .channel('group-chat-v3')
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
    if (!error) {
      handleAIAutomation(input);
      setInput('');
    }
  };

  const handleAIAutomation = async (text: string) => {
    // לוגיקה של המוח (AI): זרימת עבודה חכמה
    if (text.includes('חסר') || text.includes('להזמין')) {
      setTimeout(async () => {
        await supabase.from('group_messages').insert([{
          sender_name: 'SABAN AI',
          sender_role: 'מערכת חכמה',
          content: `🤖 @נתנאל, בוס, זיהיתי חוסר. המשימה נרשמה אוטומטית בדאשבורד הרכש.`,
          type: 'ai'
        }]);
      }, 1500);
    }
    if (text.includes('העברה') || text.includes('להחרש')) {
      setTimeout(async () => {
        await supabase.from('group_messages').insert([{
          sender_name: 'SABAN AI',
          sender_role: 'מערכת חכמה',
          content: `🤖 @איציק זהבי, בקשת העברה זוהתה. @עלי יקבל עדכון לסידור ברגע שראמי יאשר.`,
          type: 'ai'
        }]);
      }, 1500);
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col flex-1 h-full max-w-5xl mx-auto bg-[#E5DDD5] shadow-2xl overflow-hidden" dir="rtl">
        
        {/* Chat Header (WhatsApp Style) */}
        <div className="p-4 bg-[#F0F2F5] border-b border-slate-200 flex items-center justify-between shadow-sm z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-emerald-600 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white">
              <Hash size={24} />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#111B21] tracking-tight">קבוצת הסידור | <span className="text-emerald-600">sabanos</span></h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider italic">מערכת ניהול חכמה - ח. סבן</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
             <button className="p-3 text-slate-500 hover:text-emerald-600 transition-all"><Bell size={19} /></button>
             <button className="p-3 text-slate-500 hover:text-black"><MoreVertical size={19} /></button>
          </div>
        </div>

        {/* Message Area (WhatsApp Bg + Meroobah) */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-3 bg-[#E5DDD5] scroll-smooth">
          {messages.map((m, i) => {
            const isMe = m.sender_name === 'ראמי מסארווה';
            const isAI = m.type === 'ai';
            const avatarUrl = teamMembers[m.sender_name] || 'https://i.postimg.cc/T34X4BqB/default.jpg';

            return (
              <motion.div
                key={m.id || i}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${isAI ? 'justify-center' : (isMe ? 'justify-start' : 'justify-end')}`}
              >
                {!isAI && isMe && <img src={avatarUrl} alt={m.sender_name} className="w-8 h-8 rounded-full border border-slate-200 mt-1" />}
                
                <div className={`relative max-w-[80%] p-4 shadow-sm ${
                  isAI 
                  ? 'bg-[#0B0F1A] text-emerald-400 text-center text-xs border border-emerald-500/20 rounded-2xl flex items-center gap-2' 
                  : (isMe ? 'chat-bubble-me' : 'chat-bubble-them')
                }`}>
                  {isAI && <Bot size={16} className="text-emerald-500 shrink-0"/>}
                  
                  {!isAI && (
                    <div className={`flex items-center gap-2 mb-1 text-[10px] font-black uppercase tracking-widest ${isMe ? 'text-emerald-700' : 'text-emerald-600'}`}>
                      {m.sender_name} • {m.sender_role}
                    </div>
                  )}
                  <p className="text-[14px] font-medium leading-relaxed">{m.content}</p>
                  
                  {!isAI && (
                    <div className={`flex justify-end mt-1 opacity-50 text-slate-400`}>
                      <span className="text-[9px] ml-1">10:09</span>
                      <CheckCheck size={13} />
                    </div>
                  )}
                </div>

                {!isAI && !isMe && <img src={avatarUrl} alt={m.sender_name} className="w-8 h-8 rounded-full border border-slate-200 mt-1" />}
              </motion.div>
            );
          })}
        </div>

        {/* Input Area (WhatsApp Input) */}
        <div className="p-4 bg-[#F0F2F5] border-t border-slate-200">
          <form onSubmit={sendMessage} className="flex items-center gap-3">
            <button type="button" className="p-3 text-slate-500 hover:text-emerald-600 transition-all">
              <Paperclip size={21} />
            </button>
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="פקודה חדשה לסידור (למשל: '@נתנאל חסר מלט')..."
              className="flex-1 bg-white border border-slate-200 p-4 rounded-[2rem] outline-none focus:border-emerald-500 transition-all text-sm placeholder:text-slate-400"
            />
            <button 
              type="submit" 
              className="bg-emerald-600 text-white p-4 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all"
            >
              <Send size={21} className="rotate-180" />
            </button>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
