import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

// וידוי שהמפתחות קיימים לפני יצירת הקליינט
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("CRITICAL: Supabase keys are missing in Environment Variables");
}

const supabaseAdmin = createClient(supabaseUrl || '', supabaseServiceKey || '');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // פתיחת חסימת CORS לשיטה חכמה
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { id, updates } = req.body;

  try {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) throw error;
    return res.status(200).json(data);
  } catch (err: any) {
    // זה ידפיס לך ב-Vercel Logs בדיוק מה הבעיה
    return res.status(500).json({ 
      error: "Server Error", 
      message: err.message,
      hint: "Check if SUPABASE_SERVICE_ROLE_KEY is set in Vercel Settings" 
    });
  }
}
