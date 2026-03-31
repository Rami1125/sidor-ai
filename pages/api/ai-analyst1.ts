import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ answer: 'Method not allowed' });

  const { query, senderPhone } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!query) return res.status(200).json({ answer: "בוס, לא כתבת שאלה?" });
  if (!apiKey) return res.status(200).json({ answer: "⚠️ שגיאת מפתח (GEMINI_API_KEY חסר)." });

  const today = new Date().toISOString().split('T')[0];
  const modelPool = ["gemini-3.1-flash-lite-preview", "gemini-1.5-pro"];
  try {
    // משיכת נתונים לתוך ההקשר
    const [{ data: orders }, { data: containers }] = await Promise.all([
      supabase.from('orders').select('*').eq('delivery_date', today).neq('status', 'deleted'),
      supabase.from('container_management').select('*').eq('is_active', true)
    ]);

    // הגדרת ה-System Prompt (חייב להיות לפני הלולאה)
    const systemPrompt = `
      זהות: העוזר האישי של ראמי (ח. סבן). סגנון: מקצועי, חד, ענייני.
      נתוני מערכת היום (${today}):
      - הובלות: ${JSON.stringify(orders || [])}
      - מכולות: ${JSON.stringify(containers || [])}

      תפקיד: זיהוי והזרקת JSON מדויק למשימות.
      1. ORDER (חומרים): נהג חכמת/עלי.
      2. CONTAINER (מכולות): קבלן שארק 30/כראדי 32/שי שרון 40.
         פעולות: "הצבה", "החלפה", "הוצאה".
      3. TRANSFER (העברות): מהחרש/מהתלמיד.

      הזרק JSON מדויק בפורמט הזה בלבד:
      DATA_START{
        "type": "ORDER" | "CONTAINER" | "TRANSFER",
        "action_type": "הצבה" | "החלפה" | "הוצאה",
        "client": "שם הלקוח",
        "address": "כתובת",
        "date": "${today}",
        "time": "HH:mm",
        "executor": "נהג או קבלן"
      }DATA_END
    `;

    let aiText = "";
    // לולאת Fallback על המודלים
    for (const modelName of modelPool) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${systemPrompt}\n\nשאלה: ${query}` }] }],
            generationConfig: { temperature: 0.1 }
          })
        });

        const data = await response.json();
        if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
          aiText = data.candidates[0].content.parts[0].text;
          break;
        }
      } catch (e) {
        console.error(`Error with model ${modelName}`);
      }
    }

    // ניתוח ה-JSON והזרקה ל-Database
    const jsonStr = aiText.match(/DATA_START([\s\S]*?)DATA_END/)?.[1];
    if (jsonStr) {
      const task = JSON.parse(jsonStr);
      if (task.type === 'ORDER') {
        await supabase.from('orders').insert([{
          client_info: task.client,
          location: task.address,
          delivery_date: task.date,
          order_time: task.time,
          driver_name: task.executor,
          status: 'pending'
        }]);
      }
      // הוסף כאן הזרקות נוספות למכולות/העברות במידת הצורך
    }

    const cleanReply = aiText.replace(/DATA_START[\s\S]*?DATA_END/, '').trim();
    return res.status(200).json({ answer: cleanReply || "בוצע בוס, המשימה עודכנה." });

  } catch (error) {
    return res.status(200).json({ answer: "בוס, יש תקלה בגישה לנתונים." });
  }
}
