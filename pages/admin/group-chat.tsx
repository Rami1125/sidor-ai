'use client';
import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import AppLayout from '../../components/Layout';
import { supabase } from '../../lib/supabase';
import { 
  Send, Paperclip, MoreVertical, CheckCheck, 
  Bot, Menu, X, Users, Smartphone, Monitor 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// אווטארים יציבים כ-Fallback
const teamPhotos: { [key: string]: string } = {
  'הראל': 'https://ui-avatars.com/api/?name=Harel&background=0f172a&color=fff',
  'נתנאל ח. סבן': 'https://ui-avatars.com/api/?name=Netanel&background=10b981&color=fff',
  'ראמי מסארווה': 'https://ui-avatars.com/api/?name=Rami+Saban&background=10b981&color=fff',
  'איציק זהבי': 'https://ui-avatars.com/api/?name=Itzik&background=0284c7&color=fff',
  'SABAN AI': 'https://ui-avatars.com/api/?name=AI&background=000&color=10b981'
};

export default function SabanGroupChat() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
    loadMyProfile();
    fetchMessages();

    const channel = supabase
      .channel('group-chat-v5')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'group_messages' }, (payload: any) => {
        setMessages((prev) => [...prev, payload.new]);
        if (payload.new.sender_name !== 'ראמי מסארווה') {
          audioRef.current?.play().catch(() => {});
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // גלילה אוטומטית לתחתית בכל הודעה חדשה
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isAiTyping]);

  const loadMyProfile = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('full_name', 'ראמי מסארווה').maybeSingle();
    setCurrentUser(data || { full_name: 'ראמי מסארווה', role: 'מנהל מערכת' });
  };

  const fetchMessages = async () => {
    const { data } = await supabase.from('group_messages').select('*').order('created_at', { ascending: true });
    setMessages(data || []);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userContent = input;
    setInput('');

    const msgData = {
      sender_name: currentUser.full_name,
      content: userContent,
      type: 'user',
      created_at: new Date().toISOString()
    };

    const { error } = await supabase.from('group_messages').insert([msgData]);
    if (!error) callAI(userContent);
  };

  const callAI = async (text: string) => {
    setIsAiTyping(true);
    try {
      const response = await fetch('/api/ai-supervisor-core', { // שימוש ב-Core המשודרג
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: text, sender_name: currentUser?.full_name }),
      });
      const data = await response.json();
      
      await supabase.from('group_messages').insert([{
        sender_name: 'SABAN AI',
        content: data.reply,
        type: 'ai',
        created_at: new Date().toISOString()
      }]);
    } catch (err) {
      console.error("AI Bridge Failed", err);
    } finally {
      setIsAiTyping(false);
    }
  };

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-64px)] w-full bg-[#E5DDD5] overflow-hidden relative" dir="rtl">
        <Head>
          <title>SABAN OS | Group Chat</title>
          <meta name="mobile-web-app-capable" content="yes" />
        </Head>

        {/* Sidebar - Desktop / Drawer - Mobile */}
        <AnimatePresence>
          {(isSidebarOpen || typeof window !== 'undefined' && window.innerWidth > 1024) && (
            <motion.aside 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              className="fixed lg:relative right-0 top-0 bottom-0 w-72 bg-[#F0F2F5] border-l border-gray-300 z-50 flex flex-col shadow-2xl lg:shadow-none"
            >
              <div className="p-6 bg-[#00a884] text-white flex items-center justify-between">
                <div className="flex items-center gap-2 font-black italic">
                  <Users size={20} /> <span>חברי הקבוצה</span>
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden"><X /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {Object.keys(teamPhotos).map(name => (
                  <div key={name} className="flex items-center gap-3 p-2 hover:bg-white rounded-xl transition-all cursor-pointer">
                    <img src={teamPhotos[name]} className="w-10 h-10 rounded-full border-2 border-emerald-500" />
                    <span className="text-sm font-bold text-slate-700">{name}</span>
                  </div>
                ))}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Chat Main Area */}
        <div className="flex-1 flex flex-col h-full bg-[url('https://i.postimg.cc/9M4Z9k0p/wa-bg.png')] bg-repeat relative">
          
          {/* Header */}
          <header className="h-16 bg-[#F0F2F5] border-b border-gray-300 flex items-center justify-between px-4 shrink-0 z-10 shadow-sm">
            <div className="flex items-center gap-3">
              <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 hover:bg-gray-200 rounded-full">
                <Menu size={24} className="text-gray-600" />
              </button>
              <div className="w-10 h-10 bg-[#00a884] rounded-full flex items-center justify-center text-white font-black shadow-md">S</div>
              <div>
                <h2 className="text-sm font-black text-[#111B21] leading-none">קבוצת הסידור | sabanos</h2>
                <p className="text-[10px] text-emerald-600 font-bold mt-1">SABAN AI מחובר ומנטר...</p>
              </div>
            </div>
            <div className="flex gap-4 text-gray-500">
               <Monitor className="hidden lg:block" size={20} />
               <Smartphone className="lg:hidden" size={20} />
               <MoreVertical size={20} className="cursor-pointer" />
            </div>
          </header>

          {/* Messages Area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth scrollbar-hide pb-24 lg:pb-4">
            {messages.map((m, i) => {
              const isMe = m.sender_name === 'ראמי מסארווה';
              const isAI = m.type === 'ai';
              return (
                <div key={i} className={`flex ${isAI ? 'justify-center my-6' : (isMe ? 'justify-start' : 'justify-end')}`}>
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    className={`relative max-w-[85%] lg:max-w-[70%] px-4 py-2 shadow-sm ${
                      isAI ? 'bg-slate-900 text-emerald-400 border border-emerald-500/30 rounded-2xl flex items-center gap-3' : 
                      (isMe ? 'bg-white rounded-2xl rounded-tr-none' : 'bg-[#DCF8C6] rounded-2xl rounded-tl-none')
                    }`}
                  >
                    {isAI && <Bot size={20} className="animate-pulse" />}
                    <div className="flex flex-col">
                      {!isAI && <span className="text-[10px] font-black text-emerald-700 uppercase mb-1">{m.sender_name}</span>}
                      <p className="text-[14px] font-medium leading-relaxed whitespace-pre-wrap">{m.content}</p>
                      <div className="flex justify-end items-center gap-1 mt-1 opacity-40 text-[9px]">
                        <span>{new Date(m.created_at).toLocaleTimeString('he-IL', {hour: '2-digit', minute:'2-digit'})}</span>
                        {isMe && <CheckCheck size={14} className="text-blue-500" />}
                      </div>
                    </div>
                  </motion.div>
                </div>
              );
            })}
            {isAiTyping && (
              <div className="flex justify-center">
                <div className="bg-black/70 text-emerald-400 text-[10px] px-6 py-2 rounded-full animate-bounce font-black italic">
                  SABAN AI מנתח ומזריק ללוח...
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-[#F0F2F5] border-t border-gray-300 lg:relative">
            <form onSubmit={sendMessage} className="max-w-4xl mx-auto flex items-center gap-3">
              <Paperclip size={24} className="text-gray-500 cursor-pointer hover:text-emerald-600 transition-all hidden sm:block" />
              <input 
                value={input} onChange={(e) => setInput(e.target.value)}
                placeholder="פקודה לצוות או הזרקה למוח..."
                className="flex-1 bg-white p-4 rounded-2xl outline-none text-sm shadow-inner font-bold"
              />
              <button type="submit" className="bg-[#00a884] text-white p-4 rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all">
                <Send size={24} className="rotate-180" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
