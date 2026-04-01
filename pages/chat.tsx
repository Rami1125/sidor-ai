'use client';
import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { 
  Send, Paperclip, MoreVertical, CheckCheck, 
  Bot, Menu, X, Users, Smartphone, Monitor 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SabanGroupChat() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false); // לפתרון שגיאת Hydration
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // פתרון לשגיאה 418 - מוודא שהרינדור קורה רק אחרי שהדף עלה בדפדפן
  useEffect(() => {
    setIsMounted(true);
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
    loadMyProfile();
    fetchMessages();

    // האזנה לטבלה הנכונה: group_messages
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
    // שימוש בטבלה group_messages כפי שמופיע ב-SQL שלך
    const { data, error } = await supabase.from('group_messages').select('*').order('created_at', { ascending: true });
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
      content: userContent, // שימוש ב-content לפי מבנה הטבלה שלך
      type: 'user',
      created_at: new Date().toISOString()
    };

    const { error } = await supabase.from('group_messages').insert([msgData]);
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

  // מונע את שגיאת ה-Hydration
  if (!isMounted) return null;

  return (
    <Layout>
      <div className="flex h-[calc(100vh-64px)] w-full bg-[#E5DDD5] overflow-hidden relative" dir="rtl">
        <Head>
          <title>SABAN OS | Group Chat</title>
        </Head>

        {/* ... (שאר ה-JSX נשאר זהה לקוד הקודם שלך) ... */}
        {/* וודא שאתה משתמש ב-m.content ולא ב-m.text במיפוי ההודעות */}
      </div>
    </Layout>
  );
}
