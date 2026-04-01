'use client';
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../../components/Layout';
import { supabase } from '../../lib/supabase';
import { 
  Zap, Search, ShieldCheck, Play, 
  MessageSquare, Terminal, RefreshCw, Cpu, Database, AlertCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AiSimulator() {
  const [rules, setRules] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [matchedRule, setMatchedRule] = useState<any>(null);
  const [aiResponse, setAiResponse] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('ai_rules').select('*');
    if (error) console.error("Error fetching rules:", error);
    setRules(data || []);
    setLoading(false);
  };

  const runSimulation = () => {
    if (!query.trim()) return;
    setIsSimulating(true);
    setMatchedRule(null);
    setAiResponse('');

    // מנגנון זיהוי חוקים משופר
    setTimeout(() => {
      const found = rules.find(r => 
        query.includes(r.action_type) || 
        (r.condition && query.includes(r.condition))
      );

      if (found) {
        setMatchedRule(found);
        setAiResponse(`⚠️ חוק הופעל: "${found.instruction}"`);
      } else {
        setAiResponse("✅ אין חוקים מגבילים. הפעולה מאושרת להזרקה.");
      }
      setIsSimulating(false);
    }, 800);
  };

  return (
    <Layout>
      <Head>
        <title>SABAN OS | AI Simulator</title>
      </Head>

      <div className="min-h-screen bg-[#F8F9FA] flex flex-col overflow-y-auto pb-20" dir="rtl">
        
        {/* Header פנימי קבוע */}
        <div className="bg-white border-b border-slate-200 p-6 sticky top-0 z-30 shadow-sm">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2 italic">
                <Cpu className="text-emerald-600" size={28} /> סימולטור SABAN AI
              </h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">בדיקת חוקים וסנכרון DB</p>
            </div>
            <button onClick={fetchRules} className="p-2 hover:bg-slate-100 rounded-full transition-all">
               <RefreshCw size={18} className={`text-slate-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto w-full p-4 space-y-6 mt-4">
          
          {/* אזור הקלט */}
          <section className="bg-slate-900 rounded-[2rem] p-6 shadow-2xl border-b-4 border-emerald-500">
            <div className="flex flex-col gap-4">
              <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest px-1">מה הפקודה ששלח איש הצוות?</label>
              <div className="flex gap-2">
                <input 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="הקלד כאן פקודה לסימולציה..."
                  className="flex-1 bg-white/10 border border-white/10 rounded-xl p-4 text-white font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button 
                  onClick={runSimulation}
                  disabled={isSimulating || loading}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 rounded-xl font-black transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSimulating ? <RefreshCw className="animate-spin" /> : <Play fill="currentColor" size={20} />}
                </button>
              </div>
            </div>
          </section>

          {/* לוח סטטוס מהיר */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100">
              <div className="flex justify-between items-start mb-4 text-slate-400">
                <Terminal size={20} />
                <span className="text-[9px] font-black uppercase">Engine Status</span>
              </div>
              <div className="h-12 flex items-center">
                 {isSimulating ? (
                   <span className="text-emerald-600 font-bold animate-pulse italic">מנתח חוקים...</span>
                 ) : matchedRule ? (
                   <span className="text-red-500 font-bold flex items-center gap-2"><AlertCircle size={16}/> חסימה פעילה</span>
                 ) : (
                   <span className="text-slate-400 font-bold italic">ממתין לפעולה</span>
                 )}
              </div>
            </div>

            <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100">
              <div className="flex justify-between items-start mb-4 text-emerald-500">
                <MessageSquare size={20} />
                <span className="text-[9px] font-black uppercase text-slate-400">AI Logic</span>
              </div>
              <p className="text-xs font-bold text-slate-700 leading-relaxed italic truncate">
                {aiResponse || "כאן תופיע תגובת המערכת..."}
              </p>
            </div>
          </div>

          {/* טבלת חוקים - גלילה עצמאית */}
          <section className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="font-black text-slate-800 flex items-center gap-2 italic text-sm">
                <Database size={16} className="text-slate-400" /> חוקים קיימים במאגר
              </h2>
              <span className="text-[9px] font-black bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full uppercase italic">
                {rules.length} חוקים פעילים
              </span>
            </div>
            
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-right border-collapse">
                <thead className="sticky top-0 bg-white z-10 shadow-sm">
                  <tr className="text-[10px] font-black text-slate-400 uppercase">
                    <th className="p-4 border-b">פעולה</th>
                    <th className="p-4 border-b">תנאי</th>
                    <th className="p-4 border-b">הוראת ביצוע</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <tr><td colSpan={3} className="p-10 text-center animate-pulse font-bold text-slate-300">טוען נתונים מהמאגר...</td></tr>
                  ) : rules.map(rule => (
                    <tr key={rule.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="p-4 text-[11px] font-black text-slate-900 uppercase">{rule.action_type}</td>
                      <td className="p-4 text-[11px] font-bold text-slate-500 italic">{rule.condition || 'כללי'}</td>
                      <td className="p-4 text-[11px] font-bold text-slate-700 group-hover:text-emerald-600 transition-colors">{rule.instruction}</td>
                    </tr>
                  ))}
                  {!loading && rules.length === 0 && (
                    <tr><td colSpan={3} className="p-10 text-center text-slate-300 font-bold">לא נמצאו חוקים. וודא שהגדרת אותם ב-Database.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

        </div>
      </div>
    </Layout>
  );
}
