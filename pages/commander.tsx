'use client';
import React, { useState } from 'react';
import Head from 'next/head';
import AppLayout from '../components/Layout';
import { processCommanderCommand } from '../lib/ai-commander-core';
// הוספתי את Cpu לרשימת האייקונים כאן למטה
import { 
  Send, Cpu, MessageSquare, Zap, Truck, Box, History, LayoutDashboard 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import OrderBoard from '../components/OrderBoard';

export default function CommanderPage() {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'warehouse' | 'containers'>('all');

  const typeWriter = (text: string) => {
    setAiResponse('');
    const words = text.split(' ');
    let i = 0;
    const interval = setInterval(() => {
      if (i < words.length) {
        setAiResponse((prev) => prev + (i === 0 ? '' : ' ') + words[i]);
        i++;
      } else {
        clearInterval(interval);
      }
    }, 70); 
  };

  const handleCommand = async () => {
    if (!input.trim()) return;
    const currentInput = input;
    setInput('');
    setIsTyping(true);
    setAiResponse('');

    try {
      const response = await processCommanderCommand(currentInput, 'ראמי מסארווה');
      if (response && response.msg) {
        typeWriter(response.msg);
      } else {
        typeWriter("בוס, המוח לא החזיר תשובה תקינה.");
      }
    } catch (err) {
      typeWriter("שגיאה בתקשורת עם ה-Database.");
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <AppLayout>
      <div className="h-[calc(100vh-64px)] bg-[#F8F9FA] flex overflow-hidden font-sans antialiased" dir="rtl">
        <Head>
          <title>SABAN OS | COMMANDER</title>
        </Head>

        {/* Sidebar ניווט מהיר */}
        <nav className="w-20 lg:w-24 bg-slate-950 flex flex-col items-center py-8 gap-8 border-l border-slate-800 z-50">
          <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 cursor-pointer transition-all hover:rotate-90">
            <Cpu className="text-white" size={24} />
          </div>
          
          <div className="flex flex-col gap-8 mt-10">
            <button onClick={() => setActiveTab('warehouse')} className={`p-4 rounded-2xl transition-all ${activeTab === 'warehouse' ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
              <Truck size={24} />
            </button>
            <button onClick={() => setActiveTab('containers')} className={`p-4 rounded-2xl transition-all ${activeTab === 'containers' ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
              <Box size={24} />
            </button>
            <button onClick={() => setActiveTab('all')} className={`p-4 rounded-2xl transition-all ${activeTab === 'all' ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-500'}`}>
              <LayoutDashboard size={24} />
            </button>
          </div>
        </nav>

        <main className="flex-1 flex flex-col lg:flex-row h-full">
          {/* צ'אט AI */}
          <section className="w-full lg:w-[420px] border-l border-slate-200 bg-white flex flex-col shadow-2xl z-40">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
              <div className="flex items-center gap-2 italic font-black">
                <Zap className="text-emerald-400" size={20} />
                COMMANDER AI
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
              <AnimatePresence>
                {aiResponse && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900 text-emerald-400 p-5 rounded-[2rem] rounded-tr-none shadow-xl font-bold text-sm leading-relaxed border-r-4 border-emerald-500">
                    {aiResponse}
                  </motion.div>
                )}
                {isTyping && (
                  <div className="flex gap-2 p-4 justify-center">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  </div>
                )}
              </AnimatePresence>
            </div>

            <div className="p-6 bg-white border-t border-slate-100">
              <div className="relative group">
                <input 
                  value={input} onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCommand()}
                  placeholder="פקודה למפקד..."
                  className="w-full bg-slate-100 p-5 rounded-[1.5rem] border-none font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner"
                />
                <button onClick={handleCommand} className="absolute left-3 top-1/2 -translate-y-1/2 p-3 bg-slate-900 text-emerald-400 rounded-xl shadow-lg active:scale-90 transition-all">
                  <Send size={20} className="rotate-180" />
                </button>
              </div>
            </div>
          </section>

          {/* לוח סידור */}
          <section className="flex-1 bg-[#F8F9FA] p-6 lg:p-10 overflow-y-auto">
            <header className="mb-10">
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">SABAN <span className="text-emerald-500">OS</span></h1>
            </header>
            <OrderBoard />
          </section>
        </main>
      </div>
    </AppLayout>
  );
}
