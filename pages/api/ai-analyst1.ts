import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ reply: 'Method not allowed' });

  const { query } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!query) return res.status(200).json({ answer: "בוס, לא כתבת שאלה?" });
  if (!apiKey) return res.status(200).json({ answer: "⚠️ שגיאת מפתח (GEMINI_API_KEY חסר)." });

  const today = new Date().toISOString().split('T')[0];
  const modelPool = ["gemini-2.0-flash", "gemini-1.5-flash"]; 

  try {
    // משיכת דאטה בזמן אמת לתוך ההקשר של ה-AI
    const [{ data: orders }, { data: containers }] = await Promise.all([
      supabase.from('orders').select('*').eq('delivery_date', today).neq('status', 'deleted'),
      supabase.from('container_management').select('*').eq('is_active', true)
    ]);

    const systemPrompt = `
      זהות: SABAN OS CORE - המוח התפעולי של ח.סבן.
      הקשר היום: ${today}
      נתוני הובלות: ${JSON.stringify(orders || [])}
      נתוני מכולות: ${JSON.stringify(containers || [])}

      חוקים:
      1. תענה בעברית פשוטה, חדה ומקצועית.
      2. אם מזוהה משימה דחופה (פחות משעה), תציין זאת בבולד.
      3. תמיד תפנה למשתמש כ"בוס".
      4. תשתמש באייקונים מתאימים (📊, 🚚, 🏗️).
    `;

    // לוגיקת ה-Fallback של המודלים
    let aiResponse = "";
    for (const model of modelPool) {
      try {
        const resAi = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${systemPrompt}\n\nשאלה: ${query}` }] }],
            generationConfig: { temperature: 0.1 }
          })
        });
        const data = await resAi.json();
        if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
          aiResponse = data.candidates[0].content.parts[0].text;
          break;
        }
      } catch (e) { continue; }
    }

    return res.status(200).json({ answer: aiResponse || "מצטער בוס, המודלים עמוסים." });

  } catch (error) {
    return res.status(200).json({ answer: "בוס, יש תקלה בגישה לנתונים." });
  }
}
