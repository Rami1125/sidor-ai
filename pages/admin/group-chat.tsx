'use client';
import React, { useState, useEffect, useRef } from 'react';
import AppLayout from '../../components/Layout';
import { supabase } from '../../lib/supabase';
import { Send, Menu, Paperclip, CheckCheck, Bot, User } from 'lucide-react';

const teamPhotos: { [key: string]: string } = {
  'הראל': 'https://i.postimg.cc/44r6V05C/harel.jpg',
  'נתנאל ח. סבן': 'https://i.postimg.cc/3wTMxG7W/ai.jpg',
  'ראמי מסארווה': 'https://i.postimg.cc/mD8zQcby/rami.jpg',
  'איציק זהבי': 'https://i.postimg.cc/138846705/itzik.jpg',
  'SABAN AI': 'https://i.postimg.cc/3wTMxG7W/ai.jpg'
};

export default function ProfessionalChat() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    const channel = supabase.channel('realtime-chat').on('postgres_changes', 
      { event: 'INSERT', schema: 'public', table: 'group_messages' }, 
      (p) => setMessages(prev => [...prev, p.new])
    ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchMessages = async () => {
    const { data } = await supabase.from('group_messages').select('*').order('created_at', { ascending: true });
    setMessages(data || []);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const myMsg = { sender_name: 'ראמי מסארווה', sender_role: 'מנהל מערכת', content: input, type: 'user' };
    await supabase.from('group_messages').insert([myMsg]);
    
    // חיבור ל-AI: המערכת סורקת ותוקפת
    processAI(input);
    setInput('');
  };

  const processAI = async (text: string) => {
    if (text.includes('@נתנאל') || text.includes('חסר') || text.includes('העברה')) {
      const { data: aiResponse } = await fetch('/api/ai-analyst', {
        method: 'POST',
        body: JSON.stringify({ query: text, context: 'group_chat' })
      }).then(res => res.json());

      await supabase.from('group_messages').insert([{
        sender_name: 'SABAN AI',
        sender_role: 'מערכת חכמה',
        content: aiResponse || `🤖 פקודה התקבלה. מעדכן את ${text.includes('נתנאל') ? 'נתנאל' : 'איציק'} ומבצע רישום בדאשבורד.`,
        type: 'ai'
      }]);
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-full bg-[#e5ddd5] relative">
        {/* Header קומפקטי */}
        <div className="bg-[#f0f2f5] p-3 flex items-center justify-between border-b border-gray-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold shadow-md">S</div>
            <div>
              <h2 className="text-sm font-bold text-[#111b21]">קבוצת הסידור | sabanos</h2>
              <p className="text-[10px] text-gray-500 font-medium">נתנאל, הראל, יואב, איציק, אורן, ראמי</p>
            </div>
          </div>
        </div>

        {/* שטח הודעות - גודל מלא */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-1 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat">
          {messages.map((m, i) => {
            const isMe = m.sender_name === 'ראמי מסארווה';
            const isAI = m.type === 'ai';
            return (
              <div key={i} className={`flex gap-2 ${isAI ? 'justify-center my-4' : (isMe ? 'justify-start' : 'justify-end')}`}>
                {!isAI && isMe && <img src={teamPhotos[m.sender_name]} className="w-7 h-7 rounded-full self-end mb-1" />}
                <div className={`bubble ${isAI ? 'bg-black text-emerald-400 rounded-lg border border-emerald-500/30' : (isMe ? 'bubble-me' : 'bubble-them')}`}>
                  {!isAI && <p className="text-[10px] font-bold text-emerald-700 mb-0.5">{m.sender_name}</p>}
                  <p className="whitespace-pre-wrap leading-tight">{m.content}</p>
                  <div className="flex justify-end items-center gap-1 mt-0.5 opacity-50">
                    <span className="text-[9px]">14:20</span>
                    {!isAI && <CheckCheck size={12} className="text-blue-500" />}
                  </div>
                </div>
                {!isAI && !isMe && <img src={teamPhotos[m.sender_name]} className="w-7 h-7 rounded-full self-end mb-1" />}
              </div>
            );
          })}
        </div>

        {/* תיבת טקסט וואטסאפ */}
        <div className="bg-[#f0f2f5] p-3 flex items-center gap-2 border-t border-gray-300">
          <Paperclip size={22} className="text-gray-500 cursor-pointer" />
          <form onSubmit={handleSend} className="flex-1 flex gap-2">
            <input 
              value={input} onChange={e => setInput(e.target.value)}
              placeholder="הקלד הודעה..."
              className="flex-1 bg-white p-2.5 rounded-lg outline-none text-sm shadow-sm"
            />
            <button type="submit" className="bg-[#00a884] text-white p-2.5 rounded-full shadow-md active:scale-95 transition-all">
              <Send size={20} className="rotate-180" />
            </button>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
