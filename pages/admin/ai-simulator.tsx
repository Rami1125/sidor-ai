'use client';
import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { supabase } from '../../lib/supabase';
import { 
  Zap, Search, ShieldCheck, Play, 
  MessageSquare, Terminal, RefreshCw, Cpu, Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AiSimulator() {
  const [rules, setRules] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [matchedRule, setMatchedRule] = useState<any>(null);
  const [aiResponse, setAiResponse] = useState('');

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    const { data } = await supabase.from('ai_rules').select('*').eq('is_active', true);
    setRules(data || []);
  };

  const runSimulation = () => {
    if (!query.trim()) return;
    setIsSimulating(true);
    setMatchedRule(null);
    setAiResponse('');

    // סימולציה של מנוע החוקים
    setTimeout(() => {
      const found = rules.find(r => 
        query.includes(r.action_type) || 
        (r.condition && query.includes(r.condition))
      );

      if (found) {
        setMatchedRule(found);
        setAiResponse(`זיהיתי חוק פעיל: "${found.instruction}". אני עוצר את הפעולה ומבקש אישור מנהל או דורש מסמכים נוספים.`);
      } else {
        setAiResponse("לא נמצאו חוקים מגבילים. הפעולה תבוצע ותוזרק ל-DB באופן אוטומטי.");
      }
      setIsSimulating(false);
    }, 1200);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-[#F8F9FA] pb-20" dir="rtl">
        {/* Header - PWA Style */}
        <div className="bg-white border-b border-slate-200 p-6 pt-10">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                <Cpu className="text-emerald-600" size={28} /> סימולטור חוקי מוח
              </h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">בדיקת לוגיקה בזמן אמת</p>
            </div>
            <div className="flex gap-2">
               <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
               <span className="text-[10px] font-bold text-slate-400">ENGINE LIVE</span>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-4 space-y-6 mt-6">
          
          {/* אזור הקלט - כהה ויוקרתי */}
          <section className="bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl text-white">
            <label className="text-xs font-black text-emerald-400 uppercase mb-4 block tracking-tighter">הזן שאילתה לבדיקת חוקים</label>
            <div className="flex gap-3">
              <input 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="למשל: 'תוסיף הובלה ללקוח חדש'..."
                className="flex-1 bg-white/10 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-500"
              />
              <button 
                onClick={runSimulation}
                disabled={isSimulating}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 rounded-2xl font-black flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {isSimulating ? <RefreshCw className="animate-spin" /> : <Play fill="currentColor" size={18} />}
              </button>
            </div>
          </section>

          {/* לוח התוצאות */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* סטטוס המנוע */}
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col justify-between h-48">
              <div className="flex justify-between">
                <Terminal className="text-slate-400" size={24} />
                <span className="text-[10px] font-black text-slate-300 uppercase">System Log</span>
              </div>
              <div className="mt-4">
                {isSimulating ? (
                  <p className="text-sm font-bold text-emerald-600 animate-pulse">סורק טבלת ai_rules...</p>
                ) : matchedRule ? (
                  <p className="text-sm font-bold text-red-500 flex items-center gap-2">
                    <AlertCircle size={16} /> נמצאה התאמה לחוק #{matchedRule.id.slice(0,4)}
                  </p>
                ) : (
                  <p className="text-sm font-bold text-slate-400">ממתין לפקודה...</p>
                )}
              </div>
              <div className="flex gap-1 mt-4">
                <div className={`h-1 flex-1 rounded-full ${isSimulating ? 'bg-emerald-500' : 'bg-slate-100'}`}></div>
                <div className={`h-1 flex-1 rounded-full ${matchedRule ? 'bg-amber-500' : 'bg-slate-100'}`}></div>
                <div className={`h-1 flex-1 rounded-full ${aiResponse ? 'bg-emerald-500' : 'bg-slate-100'}`}></div>
              </div>
            </div>

            {/* תגובת ה-AI המשוערת */}
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col h-48">
              <div className="flex justify-between mb-4">
                <MessageSquare className="text-emerald-500" size={24} />
                <span className="text-[10px] font-black text-slate-300 uppercase">AI Output</span>
              </div>
              <p className="text-sm font-black text-slate-700 leading-relaxed italic">
                {aiResponse || "הזן שאילתה כדי לראות איך המוח יגיב לצוות בשטח..."}
              </p>
            </div>
          </div>

          {/* טבלת חוקים פעילים - שליפה מהירה */}
          <section className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
              <h2 className="font-black text-slate-800 flex items-center gap-2">
                <Database size={18} className="text-slate-400" /> מאגר חוקים נוכחי
              </h2>
              <span className="text-[10px] font-black bg-white px-3 py-1 rounded-full border border-slate-200">{rules.length} חוקים</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="text-[10px] font-black text-slate-400 uppercase border-b border-slate-50">
                    <th className="p-4">פעולה</th>
                    <th className="p-4">תנאי</th>
                    <th className="p-4">הנחיית המוח</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {rules.map(rule => (
                    <tr key={rule.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 text-xs font-black text-emerald-600">{rule.action_type}</td>
                      <td className="p-4 text-xs font-bold text-slate-500">{rule.condition || 'ללא'}</td>
                      <td className="p-4 text-xs font-medium text-slate-800">{rule.instruction}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

        </div>
      </div>
    </Layout>
  );
}

function CheckCheckIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
      <path d="M18 6 7 17l-5-5"/><path d="m22 10-7.5 7.5L13 16"/>
    </svg>
  );
}
