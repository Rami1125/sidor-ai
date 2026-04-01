'use client';
import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Layout from '../../components/Layout';
import { supabase } from '../../lib/supabase';
import { 
  Cpu, Send, ShieldAlert, CheckCircle2, 
  Terminal, BarChart3, Edit3, Trash2, Zap, 
  Play, RefreshCw, Type, Brain, SkipForward, X, Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SabanAiStudio() {
  const [rules, setRules] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [effect, setEffect] = useState<'type' | 'think' | 'skip'>('type');
  const [isMounted, setIsMounted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { 
    setIsMounted(true);
    fetchRules(); 
  }, []);

  const fetchRules = async () => {
    const { data, error } = await supabase
      .from('ai_rules')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
        console.error("Fetch Error:", error);
        return;
    }
    setRules(data || []);
  };

  const handleSimulate = () => {
    if (!query.trim()) return;
    setIsProcessing(true);
    setSimulationResult(null);

    const delay = effect === 'think' ? 3000 : (effect === 'skip' ? 400 : 1200);

    setTimeout(() => {
      const matched = rules.find(r => 
        query.includes(r.action_type) || 
        (r.condition && query.includes(r.condition))
      );
      setSimulationResult({
        matched: !!matched,
        response: matched ? matched.instruction : "הפקודה אושרה. מזריק נתונים למערכת ח. סבן...",
        accuracy: matched ? 99 : 82
      });
      setIsProcessing(false);
    }, delay);
  };

  const deleteRule = async (id: string) => {
    if (!confirm('למחוק את החוק מהמוח?')) return;
    const { error } = await supabase.from('ai_rules').delete().eq('id', id);
    if (error) alert("שגיאה במחיקה: " + error.message);
    fetchRules();
  };

  const updateRule = async () => {
    if (!editingRule) return;
    
    // בניית האובייקט בצורה נקייה כדי למנוע שגיאת 400
    const updateData = {
      action_type: editingRule.action_type,
      instruction: editingRule.instruction,
      condition: editingRule.condition || null
    };

    const { error } = await supabase
      .from('ai_rules')
      .update(updateData)
      .eq('id', editingRule.id);

    if (error) {
      console.error("Update Error:", error);
      alert("שגיאה בשמירה: " + error.message);
    } else {
      setEditingRule(null);
      fetchRules();
    }
  };

  if (!isMounted) return null;

  return (
    <Layout>
      <div className="min-h-screen bg-[#F1F5F9] text-slate-900 font-sans pb-20" dir="rtl">
        <Head>
          <title>SABAN AI | Pro Studio</title>
          <meta name="mobile-web-app-capable" content="yes" />
        </Head>

        {/* Header */}
        <header className="bg-white border-b border-slate-200 p-6 sticky top-0 z-40 shadow-sm">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg">
                <Cpu className="text-emerald-400" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-black italic tracking-tighter uppercase">Saban <span className="text-emerald-600">Studio</span></h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Logic Control Center</p>
              </div>
            </div>
            
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              {['type', 'think', 'skip'].map((eff) => (
                <button 
                  key={eff} onClick={() => setEffect(eff as any)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${effect === eff ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-400'}`}
                >
                  {eff === 'type' ? 'כתיבה' : eff === 'think' ? 'חשיבה' : 'דילוג'}
                </button>
              ))}
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* ניהול חוקים */}
          <div className="lg:col-span-5 space-y-6">
            <section className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
                <h3 className="text-sm font-black flex items-center gap-2 italic"><Terminal size={18} /> מאגר חוקים</h3>
                <button onClick={fetchRules}><RefreshCw size={14} className={isProcessing ? 'animate-spin' : ''} /></button>
              </div>
              <div className="max-h-[600px] overflow-y-auto scrollbar-hide">
                <table className="w-full text-right">
                  <tbody className="divide-y divide-slate-100">
                    {rules.map(r => (
                      <tr key={r.id} className="group hover:bg-slate-50 transition-all">
                        <td className="p-4">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[9px] font-black bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded uppercase">{r.action_type}</span>
                            {r.condition && <span className="text-[9px] font-bold text-slate-400 italic">תנאי: {r.condition}</span>}
                          </div>
                          <p className="text-xs font-bold text-slate-700 leading-snug">{r.instruction}</p>
                        </td>
                        <td className="p-4 flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-all">
                          <button onClick={() => setEditingRule(r)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"><Edit3 size={16} /></button>
                          <button onClick={() => deleteRule(r.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* סימולטור צ'אט */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden flex flex-col h-[650px] relative">
              <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-slate-50/50">
                <AnimatePresence>
                  {simulationResult && !isProcessing && (
                    <>
                      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex justify-start">
                        <div className="bg-slate-900 text-white p-4 rounded-2xl rounded-tr-none max-w-[85%] font-bold shadow-lg">{query}</div>
                      </motion.div>
                      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex justify-end">
                        <div className={`p-5 rounded-2xl rounded-tl-none max-w-[85%] shadow-xl border-2 ${simulationResult.matched ? 'bg-red-50 border-red-200 text-red-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'}`}>
                          <div className="flex items-center gap-2 mb-2">
                            {simulationResult.matched ? <ShieldAlert size={18} className="text-red-600" /> : <CheckCircle2 size={18} className="text-emerald-600" />}
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">SABAN AI RESPONSE</span>
                          </div>
                          <p className="text-sm font-black leading-relaxed italic">{simulationResult.response}</p>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
                {isProcessing && (
                  <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-300">
                    <Brain className="animate-pulse" size={40} />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em]">Analyzing Rules Engine</span>
                  </div>
                )}
              </div>

              <div className="p-6 bg-white border-t border-slate-100">
                <div className="flex gap-3">
                  <input 
                    value={query} onChange={(e) => setQuery(e.target.value)}
                    placeholder="הקלד פקודה לבדיקה..."
                    className="flex-1 bg-slate-50 border-none rounded-2xl p-4 font-bold outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner"
                  />
                  <button onClick={handleSimulate} disabled={isProcessing} className="bg-slate-900 text-white px-8 rounded-2xl font-black flex items-center gap-2 hover:bg-slate-800 transition-all">
                    <Play size={18} fill="currentColor" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* מודאל עריכה משופר - פותר שגיאת 400 */}
        <AnimatePresence>
          {editingRule && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditingRule(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 relative z-10 shadow-2xl">
                <div className="flex justify-between items-center mb-8 border-b pb-4">
                  <h3 className="text-xl font-black italic">עריכת חוק מוח</h3>
                  <button onClick={() => setEditingRule(null)} className="p-2 hover:bg-slate-100 rounded-full"><X /></button>
                </div>
                <div className="space-y-5">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">סוג פעולה (Action)</label>
                    <input 
                      className="w-full bg-slate-50 p-4 rounded-xl border-none font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                      value={editingRule.action_type} onChange={(e) => setEditingRule({...editingRule, action_type: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">תנאי הפעלה (Condition)</label>
                    <input 
                      className="w-full bg-slate-50 p-4 rounded-xl border-none font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                      value={editingRule.condition || ''} onChange={(e) => setEditingRule({...editingRule, condition: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">הוראת המוח (Instruction)</label>
                    <textarea 
                      className="w-full bg-slate-50 p-4 rounded-xl border-none font-bold h-32 outline-none focus:ring-2 focus:ring-emerald-500"
                      value={editingRule.instruction} onChange={(e) => setEditingRule({...editingRule, instruction: e.target.value})}
                    />
                  </div>
                  <button onClick={updateRule} className="w-full bg-emerald-600 text-white p-4 rounded-xl font-black shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all">
                    <Save size={18} /> שמור חוק במאגר
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
