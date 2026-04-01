'use client';
import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { 
  Send, Paperclip, MoreVertical, 
  Bot, Menu, X, Users, Smartphone, Monitor 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const teamPhotos: { [key: string]: string } = {
  'הראל': 'https://ui-avatars.com/api/?name=Harel&background=059669&color=fff',
  'נתנאל ח. סבן': 'https://ui-avatars.com/api/?name=Netanel&background=0284c7&color=fff',
  'ראמי מסארווה': 'https://ui-avatars.com/api/?name=Rami&background=000&color=fff', 
  'איציק זהבי': 'https://ui-avatars.com/api/?name=Itzik&background=7c3aed&color=fff',
  'SABAN AI': 'https://i.postimg.cc/3wTMxG7W/ai.jpg'
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
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload: any) => {
        setMessages((prev) => [...prev, payload.new]);
        if (payload.new.sender_name !== 'ראמי מסארווה') {
          audioRef.current?.play().catch(() => {});
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

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
    // וודא ששם הטבלה ב-Supabase הוא chat_messages
    const { data, error } = await supabase.from('chat_messages').select('*').order('created_at', { ascending: true });
    if (error) {
      console.error("Supabase Error:", error);
      return;
    }
    setMessages(data || []);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userContent = input;
    setInput('');

    const msgData = {
      sender_name: currentUser.full_name,
      text: userContent,
      is_ai: false,
      created_at: new Date().toISOString()
    };

    const { error } = await supabase.from('chat_messages').insert([msgData]);
    if (!error) callAI(userContent);
  };

  const callAI = async (text: string) => {
    setIsAiTyping(true);
    try {
      const response = await fetch('/api/ai-supervisor-core', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: text, sender_name: currentUser?.full_name }),
      });
      const data = await response.json();
      
      await supabase.from('chat_messages').insert([{
        sender_name: 'SABAN AI',
        text: data.reply,
        is_ai: true,
        created_at: new Date().toISOString()
      }]);
    } catch (err) {
      console.error("AI Bridge Failed", err);
    } finally {
      setIsAiTyping(false);
    }
  };

  return (
    <Layout>
      <Head>
        <title>SABAN OS | Group Chat</title>
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="icon" href="data:;base64,iVBORw0KGgo=" />
      </Head>

      <div className="flex h-[calc(100vh-64px)] w-full bg-[#E5DDD5] overflow-hidden relative" dir="rtl">
        <AnimatePresence>
          {isSidebarOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setIsSidebarOpen(false)}
                className="fixed inset-0 bg-black/20 z-40 lg:hidden"
              />
              <motion.aside 
                initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                className="fixed right-0 top-0 bottom-0 w-72 bg-[#F0F2F5] border-l border-gray-300 z-50 flex flex-col shadow-2xl"
              >
                <div className="p-6 bg-[#00a884] text-white flex items-center justify-between">
                  <div className="flex items-center gap-2 font-black italic">
                    <Users size={20} /> <span>חברי הצוות</span>
                  </div>
                  <button onClick={() => setIsSidebarOpen(false)}><X /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {Object.keys(teamPhotos).map(name => (
                    <div key={name} className="flex items-center gap-3 p-3 bg-white rounded-2xl shadow-sm">
                      <img src={teamPhotos[name]} className="w-10 h-10 rounded-full border-2 border-emerald-500 object-cover" alt="" />
                      <span className="text-sm font-black text-slate-700">{name}</span>
                    </div>
                  ))}
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        <div className="flex-1 flex flex-col h-full bg-[#E5DDD5] relative">
          <header className="h-16 bg-[#F0F2F5] border-b border-gray-300 flex items-center justify-between px-4 shrink-0 z-10 shadow-sm">
            <div className="flex items-center gap-3">
              <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-gray-200 rounded-full">
                <Menu size={24} className="text-gray-600" />
              </button>
              <div className="w-10 h-10 bg-[#00a884] rounded-full flex items-center justify-center text-white font-black shadow-md border-2 border-white text-xl italic">S</div>
              <div>
                <h2 className="text-sm font-black text-[#111B21] leading-none uppercase tracking-tight">Saban Command</h2>
                <p className="text-[10px] text-emerald-600 font-bold mt-1">AI פעיל...</p>
              </div>
            </div>
            <div className="flex gap-4 text-gray-500 items-center">
                <Smartphone className="lg:hidden" size={20} />
                <MoreVertical size={20} className="cursor-pointer" />
            </div>
          </header>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide pb-24">
            {messages.map((m, i) => {
              const isMe = m.sender_name === 'ראמי' || m.sender_name === 'ראמי מסארווה';
              const isAI = m.is_ai;
              return (
                <div key={i} className={`flex ${isAI ? 'justify-center my-8' : (isMe ? 'justify-start' : 'justify-end')}`}>
                  <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    className={`relative max-w-[85%] lg:max-w-[70%] px-4 py-2 shadow-md ${
                      isAI ? 'bg-slate-900 text-emerald-400 border-b-4 border-emerald-500 rounded-2xl flex items-center gap-3' : 
                      (isMe ? 'bg-white rounded-2xl rounded-tr-none' : 'bg-[#DCF8C6] rounded-2xl rounded-tl-none')
                    }`}
                  >
                    {isAI && <Bot size={20} className="animate-pulse flex-shrink-0" />}
                    <div className="flex flex-col">
                      {!isAI && <span className="text-[10px] font-black text-emerald-700 uppercase mb-1 tracking-widest">{m.sender_name}</span>}
                      <p className="text-[14px] font-bold leading-relaxed whitespace-pre-wrap">{m.text}</p>
                      <div className="flex justify-end items-center gap-1 mt-1 opacity-40 text-[9px]">
                        <span>{new Date(m.created_at).toLocaleTimeString('he-IL', {hour: '2-digit', minute:'2-digit'})}</span>
                        {isMe && <CheckCheckIcon size={14} />}
                      </div>
                    </div>
                  </motion.div>
                </div>
              );
            })}
            {isAiTyping && (
              <div className="flex justify-center">
                <div className="bg-black text-emerald-400 text-[11px] px-8 py-2 rounded-full animate-bounce font-black shadow-2xl border border-emerald-500/30">
                  SABAN AI מנתח...
                </div>
              </div>
            )}
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-3 bg-[#F0F2F5] border-t border-gray-300">
            <form onSubmit={sendMessage} className="max-w-4xl mx-auto flex items-center gap-3">
              <Paperclip size={24} className="text-gray-500 cursor-pointer hidden sm:block" />
              <input 
                value={input} onChange={(e) => setInput(e.target.value)}
                placeholder="כתוב פקודה..."
                className="flex-1 bg-white p-4 rounded-2xl outline-none text-sm shadow-inner font-black border border-slate-200"
              />
              <button type="submit" className="bg-[#00a884] text-white p-4 rounded-2xl shadow-xl active:scale-95 transition-all">
                <Send size={24} className="rotate-180" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function CheckCheckIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
      <path d="M18 6 7 17l-5-5"/><path d="m22 10-7.5 7.5L13 16"/>
    </svg>
  );
}
