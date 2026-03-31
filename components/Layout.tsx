'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, X, LayoutDashboard, MessageSquare, Users, Settings, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuItems = [
    { name: 'דאשבורד סידור', icon: LayoutDashboard, href: '/admin/master-dashboard' },
    { name: 'צ\'אט ארגוני', icon: MessageSquare, href: '/admin/ai-assistant' },
    { name: 'פרופילים וצוות', icon: Users, href: '/admin/profiles' },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans overflow-x-hidden">
      {/* Header קבוע */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-black/60 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6 z-[100]">
        <button onClick={() => setIsMenuOpen(true)} className="p-2 hover:bg-white/5 rounded-xl">
          <Menu size={24} className="text-emerald-500" />
        </button>
        <span className="font-black italic text-xl tracking-tighter">SABAN <span className="text-emerald-500">OS</span></span>
        <button className="relative p-2"><Bell size={20} /><span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" /></button>
      </header>

      {/* תפריט המבורגר צדדי (Mobile & Desktop) */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMenuOpen(false)} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25 }} className="fixed top-0 right-0 bottom-0 w-72 bg-[#0A0A0A] border-l border-white/10 z-[120] p-8">
              <button onClick={() => setIsMenuOpen(false)} className="mb-12 p-2 hover:bg-white/5 rounded-xl"><X size={24} /></button>
              <nav className="space-y-6">
                {menuItems.map((item) => (
                  <Link href={item.href} key={item.name} onClick={() => setIsMenuOpen(false)}>
                    <div className="flex items-center gap-4 p-4 hover:bg-emerald-500/10 rounded-2xl transition-all group">
                      <item.icon size={22} className="group-hover:text-emerald-500" />
                      <span className="font-bold">{item.name}</span>
                    </div>
                  </Link>
                ))}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="pt-20 pb-10 px-4 max-w-7xl mx-auto">{children}</main>
    </div>
  );
}
