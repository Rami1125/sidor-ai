'use client';
import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Truck, Box, MessageSquare, Settings, ChevronLeft } from 'lucide-react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuItems = [
    { name: 'לוח בקרה LIVE', href: '/admin/master-dashboard', icon: Truck },
    { name: 'ניהול מכולות', href: '/admin/containers', icon: Box },
    { name: 'צ\'אט סבן AI', href: '/chat', icon: MessageSquare },
    { name: 'הגדרות מערכת', href: '/settings', icon: Settings },
  ];

  const teamMembers = [
    { id: '22b540ab', name: 'הראל', role: 'מנכ"ל', avatar: 'https://media-mrs2-3.cdn.whatsapp.net/v/t61.24694-24/425943135_310910548378865_3167279294851460849_n.jpg?stp=dst-jpg_s96x96_tt6&ccb=11-4&oh=01_Q5Aa4AH3gTV5kn0Pf4keryJCrFNpKX-8mVhfeB2zKUz7wJ0Nvw&oe=69D993CF&_nc_sid=5e03e0&_nc_cat=104' },
    { id: '33c651bc', name: 'נתנאל ח. סבן', role: 'קניין', avatar: 'https://media-mrs2-3.cdn.whatsapp.net/v/t61.24694-24/467941675_543027198650536_1927742493184989891_n.jpg?stp=dst-jpg_s96x96_tt6&ccb=11-4&oh=01_Q5Aa4AGRrdYa7CA723729zlwkwChykGTGRtx5N82AG7Yx5IIOg&oe=69D9A3AF&_nc_sid=5e03e0&_nc_cat=105' },
    { id: '0df1b95b', name: 'ראמי מסארווה', role: 'מנהל מערכת', avatar: 'https://media-mrs2-3.cdn.whatsapp.net/v/t61.24694-24/620186722_866557896271587_5747987865837500471_n.jpg?ccb=11-4&oh=01_Q5Aa4AFHLaxAzRrOCQMldxN3FNxshHVVLZeblN-29NtRk5vcgg&oe=69D9ADEB&_nc_sid=5e03e0&_nc_cat=111' },
    { id: '44d762cd', name: 'יואב', role: 'סידור', avatar: 'https://media-mrs2-3.cdn.whatsapp.net/v/t61.24694-24/467941675_543027198650536_1927742493184989891_n.jpg?stp=dst-jpg_s96x96_tt6&ccb=11-4&oh=01_Q5Aa4AGRrdYa7CA723729zlwkwChykGTGRtx5N82AG7Yx5IIOg&oe=69D9A3AF&_nc_sid=5e03e0&_nc_cat=105' },
    { id: '4db7e946', name: 'איציק זהבי', role: 'מנהל החרש', avatar: 'https://media-mrs2-3.cdn.whatsapp.net/v/t61.24694-24/138846705_247951546693089_6505800604178808158_n.jpg?stp=dst-jpg_s96x96_tt6&ccb=11-4&oh=01_Q5Aa4AHK9fHN2ium3-Y-pHN00dmHYmnmaUvizKUwEBg2m5EX5w&oe=69D9AF10&_nc_sid=5e03e0&_nc_cat=105' },
    { id: '55e873de', name: 'אורן המחסנאי', role: 'מחסן', avatar: 'https://media-mrs2-3.cdn.whatsapp.net/v/t61.24694-24/363069350_240772492167785_3931567360848718727_n.jpg?stp=dst-jpg_s96x96_tt6&ccb=11-4&oh=01_Q5Aa4AG7jNNJwFQfm7M0PfcaezqgISLGrw6_GBoTaN90Nzp_Rg&oe=69D998A6&_nc_sid=5e03e0&_nc_cat=107' },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#111B21] font-sans" dir="rtl">
      <Head>
        <title>לוח סידור | SABAN OS</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </Head>

      <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 z-[100] px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsMenuOpen(true)} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
            <Menu size={24} />
          </button>
          <span className="font-black italic text-xl tracking-tighter text-slate-900">SABAN<span className="text-emerald-600">OS</span></span>
        </div>
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs shadow-sm border border-emerald-200">RM</div>
        </div>
      </header>

      <main className="pt-16">
        {children}
      </main>

      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[110]"
            />
            
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-72 bg-white z-[120] p-6 shadow-2xl flex flex-col border-l border-slate-100"
            >
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
                <span className="font-black italic text-lg text-emerald-600">לוח סידור</span>
                <button onClick={() => setIsMenuOpen(false)} className="p-2 text-slate-400 hover:text-black transition-colors">
                  <X size={22} />
                </button>
              </div>
              
              <nav className="space-y-1 flex-1">
                {menuItems.map((item) => (
                  <Link href={item.href} key={item.name} onClick={() => setIsMenuOpen(false)} className="block">
                    <div className="flex items-center gap-4 p-4 hover:bg-emerald-50 rounded-2xl transition-all group">
                      <item.icon size={20} className="text-slate-400 group-hover:text-emerald-600 transition-colors" />
                      <span className="font-bold text-sm text-slate-800">{item.name}</span>
                    </div>
                  </Link>
                ))}
              </nav>
              
              <div className="mt-auto pt-6 border-t border-slate-100 space-y-2 max-h-[45vh] overflow-y-auto scrollbar-hide">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 px-2">צוות פעיל</p>
                {teamMembers.map(member => (
                  <Link 
                    href={`/chat?userId=${member.id}&name=${encodeURIComponent(member.name)}`} 
                    key={member.id}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl transition-all group"
                  >
                    <div className="relative flex-shrink-0">
                      <img src={member.avatar} alt={member.name} className="w-9 h-9 rounded-full border-2 border-white shadow-sm object-cover" />
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-black text-slate-900 group-hover:text-emerald-600 transition-colors truncate">{member.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold leading-none truncate">{member.role}</p>
                    </div>
                    <ChevronLeft size={14} className="text-slate-300 group-hover:text-emerald-600 transition-all transform group-hover:-translate-x-1" />
                  </Link>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-72 bg-white z-[120] p-6 shadow-2xl flex flex-col border-l border-slate-100"
            >
              <div className="flex items-center justify-between mb-10 pb-4 border-b border-slate-100">
                <span className="font-black italic text-lg text-emerald-600">SABAN OS</span>
                <button onClick={() => setIsMenuOpen(false)} className="p-2 text-slate-400 hover:text-black">
                  <X size={22} />
                </button>
              </div>
              
              <nav className="space-y-2 flex-1">
                {menuItems.map((item) => (
                  <Link href={item.href} key={item.name} onClick={() => setIsMenuOpen(false)} className="block">
                    <div className="flex items-center gap-4 p-4 hover:bg-emerald-50 rounded-2xl transition-all group">
                      <item.icon size={20} className="text-slate-400 group-hover:text-emerald-600" />
                      <span className="font-bold text-sm text-slate-800">{item.name}</span>
                    </div>
                  </Link>
                ))}
              </nav>
              
              {/* רשימת משתתפים לחיצה */}
              <div className="mt-auto pt-6 border-t border-slate-100 space-y-3">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">צוות פעיל</p>
                {teamMembers.map(member => (
                  <Link 
                    href={`/chat?user=${encodeURIComponent(member.name)}`} 
                    key={member.name}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl transition-all group"
                  >
                    <div className="relative">
                      <img src={member.avatar} alt={member.name} className="w-8 h-8 rounded-full border border-slate-200" />
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></div>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-600">{member.name}</p>
                      <p className="text-[10px] text-slate-400 font-medium leading-none">{member.role}</p>
                    </div>
                    <ChevronLeft size={14} className="text-slate-300 group-hover:text-emerald-600" />
                  </Link>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div> // <--- כאן היה חסר ה-div הסוגר!
  );
}
