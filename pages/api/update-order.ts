import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '' // חשוב להשתמש ב-Service Role כדי לעקוף RLS
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id, updates } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Missing ID' });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) throw error;

    return res.status(200).json(data);
  } catch (err: any) {
    console.error("Update Order Error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
