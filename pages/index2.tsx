'use client';
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Truck, Package, ChevronLeft } from 'lucide-react';

export default function EntryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // פונקציית ניווט מהירה לצאט עם פקודה ראשונית
  const startOrder = (type: string) => {
    setLoading(true);
    // מעבר לדף הצאט (שנמצא ב-chat.tsx או נתיב אחר שנגדיר)
    router.push({
      pathname: '/chat',
      query: { initAction: type }
    });
  };

  return (
    <div className="min-h-screen bg-[#0b141a] flex flex-col items-center justify-center p-4 italic" dir="rtl">
      <Head>
        <title>SABAN OS | כניסה למערכת</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </Head>

      {/* Header עליון דק וסמכותי */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-0 w-full p-6 flex justify-between items-center z-50 bg-gradient-to-b from-[#0b141a] to-transparent"
      >
        <div className="flex items-center gap-2">
          <ShieldCheck className="text-emerald-500" size={24} />
          <span className="font-black text-white tracking-tighter uppercase">SABAN <span className="text-emerald-500">COMMANDER</span></span>
        </div>
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">System v3.1 Live</div>
      </motion.header>

      {/* הקונטיינר המרכזי עם התמונה שלך */}
      <main className="relative w-full max-w-lg mt-12">
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative rounded-[3rem] overflow-hidden shadow-2xl border border-white/5 bg-[#111b21]"
        >
          {/* התמונה שיצרת - רקע הכניסה */}
          <img 
            src="https://i.postimg.cc/wTFJbMNp/Designer-1.png" // וודא שזה הלינק הנכון לתמונה שלך
            alt="Saban AI Entry" 
            className="w-full h-auto opacity-90"
          />

          {/* שכבת כפתורים שקופים (Ghost Layer) - ממוקמת בדיוק מעל הקווים בתמונה */}
          <div className="absolute inset-0 flex flex-col justify-end p-8 pb-12 gap-4">
            
            {/* כפתור חומרי בניין - יושב על השדה הראשון */}
            <button 
              onClick={() => startOrder('חומרי בניין')}
              className="w-full h-16 bg-white/0 hover:bg-white/5 border border-white/10 rounded-2xl transition-all active:scale-95 flex items-center justify-between px-6 group"
            >
              <div className="flex items-center gap-4 text-white">
                <Package className="text-blue-400" size={24} />
                <span className="text-xl font-black uppercase tracking-tight italic">חומרי בניין</span>
              </div>
              <ChevronLeft className="text-slate-500 group-hover:translate-x-[-5px] transition-transform" />
            </button>

            {/* כפתור מכולה - יושב על השדה השני */}
            <button 
              onClick={() => startOrder('מכולה')}
              className="w-full h-16 bg-white/0 hover:bg-white/5 border border-white/10 rounded-2xl transition-all active:scale-95 flex items-center justify-between px-6 group"
            >
              <div className="flex items-center gap-4 text-white">
                <Truck className="text-emerald-400" size={24} />
                <span className="text-xl font-black uppercase tracking-tight italic">הזמנת מכולה</span>
              </div>
              <ChevronLeft className="text-slate-500 group-hover:translate-x-[-5px] transition-transform" />
            </button>
          </div>
        </motion.div>

        {/* Loading Overlay */}
        <AnimatePresence>
          {loading && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#0b141a]/80 backdrop-blur-md flex items-center justify-center rounded-[3rem] z-50"
            >
              <div className="flex flex-col items-center gap-4 text-emerald-500 font-black italic uppercase tracking-widest">
                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <span>Initializing Brain...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer סמכותי ותמציתי */}
      <footer className="mt-8 text-center space-y-2">
        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">Authorized Access Only</p>
        <div className="h-1 w-12 bg-emerald-500 mx-auto rounded-full opacity-30" />
      </footer>

      <style jsx global>{`
        body { background-color: #0b141a; margin: 0; font-family: 'Assistant', sans-serif; }
        ::-webkit-scrollbar { width: 0px; }
      `}</style>
    </div>
  );
}
