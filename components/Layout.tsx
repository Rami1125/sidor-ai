'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, X, LayoutDashboard, MessageSquare, Users, Settings, Bell, ChevronLeft, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// הגדרת משתתפים לצא'ט עם תמונות מקצועיות UI
const teamMembers = [
  { name: 'הראל', role: 'מנכ"ל', avatar: 'https://i.postimg.cc/44r6V05C/harel.jpg' },
  { name: 'נתנאל ח. סבן', role: 'קניין', avatar: 'https://i.postimg.cc/3wTMxG7W/ai.jpg' },
  { name: 'ראמי מסארווה', role: 'מנהל מערכת', avatar: 'https://i.postimg.cc/mD8zQcby/rami.jpg' },
  { name: 'יואב', role: 'סידור', avatar: 'https://i.postimg.cc/T34X4BqB/default.jpg' },
  { name: 'איציק זהבי', role: 'מנהל החרש', avatar: 'https://i.postimg.cc/T34X4BqB/default.jpg' },
  { name: 'אורן המחסנאי', role: 'מחסן', avatar: 'https://i.postimg.cc/T34X4BqB/default.jpg' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuItems = [
    { name: 'דאשבורד', icon: LayoutDashboard, href: '/admin/master-dashboard' },
    { name: 'קבוצת הסידור', icon: MessageSquare, href: '/admin/group-chat' },
    { name: 'צוות ופרופילים', icon: Users, href: '/admin/profiles' },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#111B21] font-sans" dir="rtl">
      
      {/* Header - Saban OS Style */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-lg border-b border-slate-200 flex items-center justify-between px-6 z-[100] shadow-sm">
        <button onClick={() => setIsMenuOpen(true)} className="p-2 hover:bg-slate-100 rounded-full">
          <Menu size={24} className="text-[#111B21]" />
        </button>
        <div className="flex items-center gap-2">
           <span className="font-black italic text-xl tracking-tighter text-[#111B21]">SABAN <span className="text-emerald-600">OS</span></span>
        </div>
        <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white font-black text-sm border-2 border-white shadow-lg">R</div>
      </header>

      {/* תפריט צד נפרס (Overlay Drawer) - כמו אפליקציה */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* רקע מעומעם ללחיצה לסגירה */}
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsMenuOpen(false)} 
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110]" 
            />
            
            {/* התפריט עצמו */}
            <motion.div 
              initial={{ x: '100%' }} 
              animate={{ x: 0 }} 
              exit={{ x: '100%' }} 
              transition={{ type: 'spring', damping: 25, stiffness: 200 }} 
              className="fixed top-0 right-0 bottom-0 w-72 bg-white z-[120] p-6 shadow-2xl flex flex-col border-l border-slate-100"
            >
              <div className="flex items-center justify-between mb-10 pb-4 border-b border-slate-100">
                <span className="font-black italic text-lg text-emerald-600">SABAN OS</span>
                <button onClick={() => setIsMenuOpen(false)} className="p-2 text-slate-400 hover:text-black"><X size={22} /></button>
              </div>
              
              <nav className="space-y-4 flex-1">
                {menuItems.map((item) => (
                  <Link href={item.href} key={item.name} onClick={() => setIsMenuOpen(false)}>
                    <div className="flex items-center gap-4 p-4 hover:bg-emerald-50 rounded-2xl transition-all group">
                      <item.icon size={22} className="text-slate-400 group-hover:text-emerald-600" />
                      <span className="font-bold text-sm text-slate-800">{item.name}</span>
                      <ChevronLeft size={16} className="text-slate-300 mr-auto group-hover:text-emerald-600" />
                    </div>
                  </Link>
                ))}
              </nav>
              
              {/* רשימת משתתפים UI בתחתית התפריט */}
              <div className="mt-10 pt-6 border-t border-slate-100 space-y-3">
                 <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">משתתפים פעילים</p>
                 {teamMembers.slice(0, 4).map(member => (
                    <div key={member.name} className="flex items-center gap-3">
                        <img src={member.avatar} alt={member.name} className="w-8 h-8 rounded-full border border-slate-100" />
                        <div>
                            <p className="text-xs font-bold text-slate-900">{member.name}</p>
                            <p className="text-[10px] text-emerald-600 font-bold">{member.role}</p>
                        </div>
                    </div>
                 ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area - בגודל מלא */}
      <main className="pt-16 h-screen flex flex-col">{children}</main>
    </div>
  );
}
