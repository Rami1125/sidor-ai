'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Send, Camera, FileText, Loader2, 
  CheckCircle, AlertCircle, Zap, Database 
} from 'lucide-react';
import { supabase } from '@/lib/supabase'; // שימוש בלקוח הקיים במאגר

/**
 * רכיב סינכרון הזמנות חכם - Saban OS Visual Engine
 * מיועד להזרקת נתונים מהירה מהשטח למערכת
 */
export default function SmartOrderSync() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [status, setStatus] = useState(null); // 'success' | 'error' | null
  const fileInputRef = useRef(null);
  const scrollRef = useRef(null);

  // סנכרון גלילה כמו ב-SabanAIAssistant
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [loading, isScanning]);

  /**
   * עיבוד פקודה קולית או טקסטואלית דרך ה-Supervisor Core
   */
  const processCommand = async (text) => {
    if (!text.trim()) return;
    setLoading(true);
    setStatus(null);

    try {
      // קריאה ל-API של ה-Supervisor שקיים במאגר
      const res = await fetch('/api/ai-supervisor-core', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: text, 
          sender_name: "ראמי מסארווה" 
        })
      });

      const data = await res.json();
      
      if (data.reply.includes('✅')) {
        setStatus('success');
        // סאונד הצלחה - בדומה ל-OrderBoard
        new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play().catch(() => {});
      } else {
        setStatus('error');
      }
      
      setInput('');
    } catch (e) {
      console.error("Sync Error:", e);
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * עיבוד ויזואלי של תעודות משלוח (OCR + Vision)
   */
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = async (event) => {
      const base64 = event.target?.result;
      const base64Clean = base64.split(',')[1];

      try {
        // שימוש ב-tools-brain לניתוח ויזואלי מקצועי
        const aiRes = await fetch('/api/tools-brain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            message: "חלץ נתוני תעודת משלוח והזרק למערכת", 
            imageBase64: base64Clean 
          })
        });
        
        const aiData = await aiRes.json();
        if (aiData.reply) setStatus('success');
      } catch (e) {
        setStatus('error');
      } finally {
        setIsScanning(false);
      }
    };
  };

  return (
    <div className="bg-[#111b21] border-t border-white/5 p-4 fixed bottom-0 left-0 right-0 z-[100] backdrop-blur-md bg-opacity-95">
      <div className="max-w-4xl mx-auto">
        
        {/* אינדיקטורים של המוח */}
        <AnimatePresence>
          {(loading || isScanning) && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 mb-3 text-emerald-500 text-[10px] font-black uppercase tracking-[0.2em] italic"
            >
              <Loader2 size={12} className="animate-spin" />
              {isScanning ? "SABAN Visual Engine Scanning..." : "AI Analyst Processing..."}
            </motion.div>
          )}

          {status && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`flex items-center gap-2 mb-3 text-[11px] font-bold p-2 rounded-xl border ${
                status === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-red-500/10 border-red-500/30 text-red-500'
              }`}
            >
              {status === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
              {status === 'success' ? "בוצע בוס! הנתונים הוזרקו לסידור." : "תקלה בהזרקה, נסה שוב."}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-end gap-3">
          {/* כפתור סריקה מהירה */}
          <div className="relative">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileUpload} 
              accept="image/*,application/pdf" 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-12 h-12 rounded-2xl bg-[#2a3942] text-emerald-500 flex items-center justify-center border border-white/5 shadow-xl hover:bg-emerald-500 hover:text-white transition-all"
            >
              <Camera size={22} />
            </button>
          </div>

          {/* שדה קלט חכם */}
          <div className="flex-1 bg-[#2a3942] rounded-[1.5rem] flex items-center px-4 py-1 border border-white/5 focus-within:border-emerald-500/30 transition-all shadow-inner">
            <textarea 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="פקודה למוח: 'תעביר את עלי למכולה בהרצל'..."
              className="flex-1 bg-transparent py-3 outline-none text-sm text-[#e9edef] resize-none max-h-32 custom-scrollbar"
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), processCommand(input))}
            />
            
            <button 
              onClick={() => processCommand(input)}
              disabled={loading || !input.trim()}
              className="mr-2 text-emerald-500 hover:scale-110 disabled:opacity-30 transition-all"
            >
              <Send size={22} className="rotate-180" />
            </button>
          </div>
        </div>

        {/* Quick Actions - מבוסס על סגנון ה-PWA במאגר */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar mt-3 pb-1">
          {[
            { label: 'מצב מכולות', icon: Database },
            { label: 'סיכום היום', icon: Zap },
            { label: 'לוח נהגים', icon: Zap }
          ].map((action, i) => (
            <button 
              key={i}
              onClick={() => processCommand(action.label)}
              className="whitespace-nowrap px-4 py-1.5 bg-[#202c33] rounded-full text-[10px] font-black border border-white/5 text-slate-400 hover:text-emerald-500 transition-all"
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
      <div ref={scrollRef} />
    </div>
  );
}
