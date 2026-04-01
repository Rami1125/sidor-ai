'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import Script from 'next/script';
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
      <Head>
        <title>לוח סידור הזמנות </title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </Head>

      {/* OneSignal SDK Setup */}
      <Script 
        src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" 
        strategy="afterInteractive" 
      />
      <Script id="onesignal-init" strategy="afterInteractive">
        {`
          window.OneSignalDeferred = window.OneSignalDeferred || [];
          OneSignalDeferred.push(async function(OneSignal) {
            await OneSignal.init({
              appId: "327841ea-ec74-457a-a2b5-f43d06e8d661",
            });
          });
        `}
      </Script>
      
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
            
{/* רשימת משתתפים UI בתחתית התפריט - עכשיו לחיצה! */}
<div className="mt-10 pt-6 border-t border-slate-100 space-y-3">
    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">משתתפים פעילים</p>
    
    {teamMembers.slice(0, 4).map(member => (
        <Link 
            href={`/chat?user=${encodeURIComponent(member.name)}`} 
            key={member.name}
            onClick={() => setIsMenuOpen(false)}
            className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl transition-all group cursor-pointer"
        >
            <div className="relative">
                <img 
                    src={member.avatar} 
                    alt={member.name} 
                    className="w-9 h-9 rounded-full border-2 border-white shadow-sm group-hover:border-emerald-200 transition-all" 
                />
                {/* נקודת סטטוס אונליין */}
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></div>
            </div>
            
            <div className="flex-1">
                <p className="text-xs font-black text-slate-900 group-hover:text-emerald-700 transition-colors">{member.name}</p>
                <p className="text-[10px] text-slate-400 font-bold leading-none">{member.role}</p>
            </div>
            
            <ChevronLeft size={14} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-all ml-1" />
        </Link>
    ))}
</div>

      {/* Main Content Area - בגודל מלא */}
      <main className="pt-16 h-screen flex flex-col">{children}</main>
    </div>
  );
}
