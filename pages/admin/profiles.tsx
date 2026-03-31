'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { UserPlus, Shield, HardHat, Truck, Trash2 } from 'lucide-react';

export default function ProfileManagement() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [formData, setFormData] = useState({ full_name: '', role: 'קניין', phone: '' });

  useEffect(() => { fetchProfiles(); }, []);

  const fetchProfiles = async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at');
    setProfiles(data || []);
  };

  const addProfile = async () => {
    await supabase.from('profiles').insert([formData]);
    setFormData({ full_name: '', role: 'קניין', phone: '' });
    fetchProfiles();
  };

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white p-8" dir="rtl">
      <h1 className="text-3xl font-black text-emerald-500 mb-8 italic">ניהול צוות ח.סבן</h1>
      
      <div className="bg-white/5 p-6 rounded-3xl border border-white/10 mb-8 flex gap-4 items-end">
        <div>
          <label className="block text-xs font-bold mb-2">שם מלא</label>
          <input value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="bg-slate-800 p-3 rounded-xl outline-none border border-white/5" />
        </div>
        <div>
          <label className="block text-xs font-bold mb-2">תפקיד</label>
          <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="bg-slate-800 p-3 rounded-xl outline-none border border-white/5">
            <option>מנכ"ל</option>
            <option>קניין</option>
            <option>מנהל מחסן</option>
            <option>נהג</option>
          </select>
        </div>
        <button onClick={addProfile} className="bg-emerald-600 p-3 rounded-xl font-bold flex gap-2"><UserPlus /> הוסף לצוות</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {profiles.map(p => (
          <div key={p.id} className="bg-[#161B2C] p-6 rounded-[2.5rem] border border-white/5 relative">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500">
                {p.role === 'נהג' ? <Truck /> : <Shield />}
              </div>
              <div>
                <h3 className="font-black text-xl">{p.full_name}</h3>
                <span className="text-xs opacity-50 uppercase font-bold tracking-widest">{p.role}</span>
              </div>
            </div>
            <button className="absolute top-6 left-6 text-red-500/30 hover:text-red-500"><Trash2 size={16}/></button>
          </div>
        ))}
      </div>
    </div>
  );
}
