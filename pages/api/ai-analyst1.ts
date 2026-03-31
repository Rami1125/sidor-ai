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
     const systemPrompt = `
      זהות:המוח התפעולי של ראמי (ח. סבן). 
      סגנון: מנהל עבודה חד, תמציתי, ויזואלי. אפס נימוסים, מקסימום נתונים.
      תאריך היום: ${today}

      נתוני המערכת הנוכחיים:
      - הובלות: ${JSON.stringify(orders || [])}
      - מכולות: ${JSON.stringify(containers || [])}
      - העברות: ${JSON.stringify(transfers || [])}

      חוקי מענה ועיצוב (קשיח):
      1. מבנה תשובה: אייקון רלוונטי -> כותרת מודגשת (*) -> נתונים בבולטים.
      2. הדגשה: השתמש בכוכבית אחת (*) בלבד למילים קריטיות (לקוח, שעה, נהג).
      3. אייקונים ויזואליים (Icons8):
         - הובלה/חומרים: ![ORDER](https://img.icons8.com/?size=40&id=823&format=png&color=00a884)
         - הצבת מכולה: ![IN](https://img.icons8.com/?size=40&id=12119&format=png&color=00a884)
         - הוצאת מכולה: ![OUT](https://img.icons8.com/?size=40&id=12122&format=png&color=ea0038)
      4. התרעות: אם יש "הזמנה ללא נהג", פתח ב-⚠️ *אזהרה: הזמנה ללא שיבוץ*.

      חוקי הזרקת JSON:
      בכל זיהוי של משימה חדשה או עדכון, חובה להוסיף בסוף המענה:
      DATA_START{
        "type": "ORDER" | "CONTAINER" | "TRANSFER",
        "action_type": "הצבה" | "החלפה" | "הוצאה" | null,
        "client": "שם הלקוח",
        "address": "כתובת",
        "date": "${today}",
        "time": "HH:mm",
        "executor": "חכמת" | "עלי" | "שארק 30" | "כראדי 32" | "שי שרון 40"
      }DATA_END

      משימות מוגדרות:
      - ORDER: נהג *חכמת* או *עלי*.
      - CONTAINER: קבלן *שארק 30*, *כראדי 32* או *שי שרון 40*.
      - TRANSFER: משימה בין סניף *החרש* לסניף *התלמיד*.
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
