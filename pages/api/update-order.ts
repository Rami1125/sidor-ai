import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

// 1. זה חייב להיות כאן בחוץ! כדי שהשרת ידע להגדיל את המכסה מראש
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fileName, fileData, mimeType, phone } = req.body;

    const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzuKzJdg7B3Q0Q42IonnWlEgsE_o_Sj2dgqxpHrmU0ro-MYmlismm9LzMnpbn7y8rOj/exec";

    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName, fileData, mimeType, phone }),
    });

    const result = await response.json();

    if (result.status === 'success') {
      return res.status(200).json({ link: result.link });
    } else {
      return res.status(500).json({ error: result.message });
    }

  } catch (error: any) {
    console.error("Upload Error:", error.message);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
