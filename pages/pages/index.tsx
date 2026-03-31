'use client';
import React from 'react';
import Link from 'next/link';
import { LayoutDashboard, Users, Bot, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SabanHome() {
  const menuItems = [
    { title: 'לוח סידור חי', icon: LayoutDashboard, href: '/admin/master-dashboard', color: 'bg-emerald-500' },
    { title: 'ניהול צוות', icon: Users, href: '/admin/profiles', color: 'bg-blue-500' },
    { title: 'עוזר AI', icon: Bot, href: '/admin/ai-assistant', color: 'bg-purple-500' },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6" dir="rtl">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
        <h1 className="text-5xl font-black italic tracking-tighter mb-2">SABAN <span className="text-emerald-500">OS</span></h1>
        <p className="text-sm opacity-40 uppercase tracking-[0.3em]">Management & Intelligence System</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
        {menuItems.map((item, i) => (
          <Link href={item.href} key={i}>
            <motion.div 
              whileHover={{ scale: 1.05, translateY: -5 }}
              className="bg-white/[0.03] border border-white/10 p-8 rounded-[2.5rem] flex flex-col items-center gap-4 hover:bg-white/[0.05] transition-all cursor-pointer group"
            >
              <div className={`w-16 h-16 ${item.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-emerald-500/20`}>
                <item.icon className="text-black" size={32} />
              </div>
              <span className="text-xl font-bold">{item.title}</span>
              <ArrowLeft className="opacity-0 group-hover:opacity-100 transition-opacity text-emerald-500" />
            </motion.div>
          </Link>
        ))}
      </div>
      
      <footer className="fixed bottom-8 opacity-20 text-[10px] font-bold tracking-widest uppercase">
        © 2026 H. Saban Building Materials 1994 Ltd.
      </footer>
    </div>
  );
}
