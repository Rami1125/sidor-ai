'use client';
import React, { useState, useEffect, useRef } from 'react';
import AppLayout from '../../components/Layout';
import { supabase } from '../../lib/supabase';
import { Send, Hash, Bell, Paperclip, MoreVertical, CheckCheck, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const teamPhotos: { [key: string]: string } = {
  'הראל': 'https://i.postimg.cc/44r6V05C/harel.jpg',
  'נתנאל ח. סבן': 'https://i.postimg.cc/3wTMxG7W/ai.jpg',
  'ראמי מסארווה': 'https://i.postimg.cc/mD8zQcby/rami.jpg',
  'איציק זהבי': 'https://i.postimg.cc/138846705/itzik.jpg',
  'SABAN AI': 'https://i.postimg.cc/3wTMxG7W/ai.jpg'
};

export default function SabanGroupChat() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
    loadMyProfile();
    fetchMessages();

    const channel = supabase
      .channel('group-chat-v4')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'group_messages' }, (payload: any) => {
        setMessages((prev) => [...prev, payload.new]);
        if (payload.new.sender_name !== 'ראמי מסארווה') {
          audioRef.current?.play().catch(() => {});
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

    const userContent = input;
    setInput('');

    const msgData = {
      sender_id: currentUser.id,
      sender_name: currentUser.full_name,
      sender_role: currentUser.role,
      content: userContent,
      type: 'user'
    };

    const { error } = await supabase.from('group_messages').insert([msgData]);
    
    if (!error) {
      // קריאה למוח (AI) לניתוח ההודעה
      callAI(userContent);
    }
  };

  const callAI = async (text: string) => {
    setIsAiTyping(true);
    try {
      const response = await fetch('/api/ai-analyst', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: text, 
          sender_name: currentUser?.full_name || 'ראמי' 
        }),
      });

      const data = await response.json();
      
      // הזרקת תגובת ה-AI לטבלה כדי שכולם יראו
      await supabase.from('group_messages').insert([{
        sender_name: 'SABAN AI',
        sender_role: 'מערכת חכמה',
        content: data.reply,
        type: 'ai'
      }]);
    } catch (err) {
      console.error("AI Bridge Failed", err);
    } finally {
      setIsAiTyping(false);
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col flex-1 h-[calc(100vh-64px)] max-w-5xl mx-auto bg-[#E5DDD5] relative shadow-2xl" dir="rtl">
        
        {/* Header - WhatsApp Style */}
        <div className="p-3 bg-[#F0F2F5] border-b border-gray-300 flex items-center justify-between z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold shadow-md">S</div>
            <div>
              <h2 className="text-sm font-bold text-[#111B21]">קבוצת הסידור | sabanos</h2>
              <p className="text-[10px] text-gray-500 font-medium">הראל, נתנאל, יואב, איציק, אורן, ראמי</p>
            </div>
          </div>
          <MoreVertical size={20} className="text-gray-500 cursor-pointer" />
        </div>

        {/* Messages Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-1 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat">
          {messages.map((m, i) => {
            const isMe = m.sender_name === 'ראמי מסארווה';
            const isAI = m.type === 'ai';
            const avatarUrl = teamPhotos[m.sender_name] || 'https://i.postimg.cc/T34X4BqB/default.jpg';

            return (
              <div key={i} className={`flex gap-2 ${isAI ? 'justify-center my-4' : (isMe ? 'justify-start' : 'justify-end')}`}>
                {!isAI && isMe && <img src={avatarUrl} className="w-8 h-8 rounded-full self-end mb-1 border border-white" />}
                
                <motion.div 
                  initial={{ scale: 0.95, opacity: 0 }} 
                  animate={{ scale: 1, opacity: 1 }}
                  className={`bubble ${isAI ? 'bg-[#0B0F1A] text-emerald-400 border border-emerald-500/30 rounded-xl px-6 py-2 flex items-center gap-3' : (isMe ? 'bubble-me' : 'bubble-them')}`}
                >
                  {isAI && <Bot size={18} className="text-emerald-500 animate-pulse" />}
                  <div className="flex flex-col">
                    {!isAI && <p className="text-[10px] font-black text-emerald-700 mb-0.5 uppercase tracking-tighter">{m.sender_name}</p>}
                    <p className="whitespace-pre-wrap leading-tight text-[14.5px]">{m.content}</p>
                    <div className="flex justify-end items-center gap-1 mt-1 opacity-40">
                      <span className="text-[9px]">10:30</span>
                      {!isAI && <CheckCheck size={13} className={isMe ? "text-blue-500" : "text-gray-400"} />}
                    </div>
                  </div>
                </motion.div>

                {!isAI && !isMe && <img src={avatarUrl} className="w-8 h-8 rounded-full self-end mb-1 border border-white" />}
              </div>
            );
          })}
          {isAiTyping && (
            <div className="flex justify-center my-2">
              <div className="bg-black/80 text-emerald-500 text-[10px] px-4 py-1 rounded-full animate-bounce">SABAN AI מנתח נתונים...</div>
            </div>
          )}
        </div>

        {/* Input Field */}
        <div className="bg-[#f0f2f5] p-3 flex items-center gap-3 border-t border-gray-300">
          <Paperclip size={22} className="text-gray-500 cursor-pointer hover:text-emerald-600 transition-all" />
          <form onSubmit={sendMessage} className="flex-1 flex gap-2">
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="פקודה לצוות או שאלה למוח..."
              className="flex-1 bg-white p-3 rounded-xl outline-none text-sm shadow-sm placeholder:text-gray-400"
            />
            <button 
              type="submit" 
              className="bg-[#00a884] text-white p-3 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all"
            >
              <Send size={20} className="rotate-180" />
            </button>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
