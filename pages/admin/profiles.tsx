'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import AppLayout from '../../components/Layout';
import { UserPlus, Mail, Phone, Briefcase, ShieldCheck, Eye, EyeOff, Trash2 } from 'lucide-react';

export default function AdvancedProfiles() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    full_name: '', email: '', phone: '', department: 'מחסן', role: '', capabilities: '', can_view_containers: false
  });

  useEffect(() => { fetchProfiles(); }, []);

  const fetchProfiles = async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    setProfiles(data || []);
  };

  const handleAdd = async () => {
    const newProfile = { ...formData, capabilities: formData.capabilities.split(',') };
    await supabase.from('profiles').insert([newProfile]);
    setFormData({ full_name: '', email: '', phone: '', department: 'מחסן', role: '', capabilities: '', can_view_containers: false });
    fetchProfiles();
  };

  const toggleContainerAuth = async (id: string, current: boolean) => {
    await supabase.from('profiles').update({ can_view_containers: !current }).eq('id', id);
    fetchProfiles();
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-8 p-4">
        <h1 className="text-3xl font-black text-emerald-500 italic">ניהול משאבי אנוש | SABAN OS</h1>

        {/* טופס הוספה מודרני */}
        <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 grid grid-cols-1 md:grid-cols-3 gap-4 shadow-2xl">
          <input placeholder="שם מלא" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="bg-black/40 p-4 rounded-2xl outline-none border border-white/5" />
          <input placeholder="מייל" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="bg-black/40 p-4 rounded-2xl outline-none border border-white/5" />
          <input placeholder="נייד" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="bg-black/40 p-4 rounded-2xl outline-none border border-white/5" />
          <input placeholder="תפקיד" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="bg-black/40 p-4 rounded-2xl outline-none border border-white/5" />
          <select value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="bg-black/40 p-4 rounded-2xl outline-none border border-white/5">
             <option value="מחסן">מחסן</option>
             <option value="רכש">רכש</option>
             <option value="הובלה">הובלה</option>
             <option value="הנהלה">הנהלה</option>
          </select>
          <input placeholder="תכונות (מופרד בפסיק)" value={formData.capabilities} onChange={e => setFormData({...formData, capabilities: e.target.value})} className="bg-black/40 p-4 rounded-2xl outline-none border border-white/5" />
          <button onClick={handleAdd} className="md:col-span-3 bg-emerald-500 text-black font-black p-4 rounded-2xl hover:scale-[1.02] transition-all">הזרק איש צוות למערכת</button>
        </div>

        {/* רשימת פרופילים */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {profiles.map(p => (
            <div key={p.id} className="bg-white/[0.02] border border-white/10 p-6 rounded-[3rem] relative group">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                  <Briefcase size={32} />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-black">{p.full_name}</h3>
                  <div className="text-xs opacity-40 font-bold uppercase tracking-widest mb-2">{p.role} | {p.department}</div>
                  <div className="flex gap-2 flex-wrap">
                    {p.capabilities?.map((c: any) => <span className="text-[9px] bg-white/5 px-2 py-1 rounded-md opacity-60 italic">#{c}</span>)}
                  </div>
                </div>
                <button 
                  onClick={() => toggleContainerAuth(p.id, p.can_view_containers)}
                  className={`p-4 rounded-2xl transition-all ${p.can_view_containers ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'bg-white/5 text-white/40'}`}
                >
                  {p.can_view_containers ? <Eye size={20} /> : <EyeOff size={20} />}
                </button>
              </div>
              <div className="mt-6 pt-6 border-t border-white/5 grid grid-cols-2 gap-4 text-[11px] font-bold opacity-60 italic">
                <div className="flex items-center gap-2"><Mail size={12}/> {p.email}</div>
                <div className="flex items-center gap-2"><Phone size={12}/> {p.phone}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
