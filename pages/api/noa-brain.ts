import type { NextApiRequest, NextApiResponse } from 'next';
import { sheetsSync } from '../../lib/google-sheets/sync';
import { supabase } from '../../lib/supabase';

// ניהול Pool המודלים שביקשת
const MODEL_POOL = [
  "gemini-1.5-flash", 
  "gemini-3.1-flash-lite-preview",
  "gemini-2.0-flash" 
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { message, securityCode, modelIndex = 0 } = req.body;

  if (!message || !securityCode) {
    return res.status(400).json({ status: "ERROR", message: "Missing params" });
  }

  try {
    // 1. בחירת מודל מה-Pool
    const selectedModel = MODEL_POOL[modelIndex] || MODEL_POOL[0];

    // 2. עדכון ב-Supabase (שליטה ובקרה על המאגר)
    const { error: dbError } = await supabase
      .from('ai_logs')
      .insert([{ 
        command: message, 
        user_code: securityCode, 
        model_used: selectedModel,
        status: 'processing' 
      }]);

    if (dbError) throw dbError;

    // 3. שליחה לביצוע בגוגל (Sheets/Drive) דרך ה-Apps Script
    const result = await sheetsSync.sendCommand(message, securityCode);

    // 4. עדכון הצלחה ב-Supabase
    await supabase
      .from('ai_logs')
      .update({ status: 'success', response: JSON.stringify(result) })
      .eq('user_code', securityCode);

    return res.status(200).json({
      ...result,
      model: selectedModel
    });

  } catch (error: any) {
    console.error("Brain Error:", error);
    return res.status(500).json({ status: "ERROR", message: error.message });
  }
}
