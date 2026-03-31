import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ reply: 'Method not allowed' });

  const { query } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!query) return res.status(200).json({ answer: "בוס, לא כתבת שאלה?" });
  if (!apiKey) return res.status(200).json({ answer: "⚠️ שגיאת מפתח (GEMINI_API_KEY חסר)." });

  const today = new Date().toISOString().split('T')[0];
    const modelPool = ["gemini-3.1-flash-lite-preview", "gemini-1.5-pro"];  
  try {
    // משיכת נתונים מ-Supabase
    const [orders, containers, transfers] = await Promise.all([
      supabase.from('orders').select('*').eq('delivery_date', today).neq('status', 'deleted'),
      supabase.from('container_management').select('*').eq('start_date', today).neq('status', 'deleted'),
      supabase.from('transfers').select('*').eq('transfer_date', today)
    ]);

    const contextData = `
      נתוני מערכת Saban OS (${today}):
      - חומרים והובלות: ${JSON.stringify(orders.data || [])}
      - מכולות (הצבה/החלפה/הוצאה): ${JSON.stringify(containers.data || [])}
      - העברות: ${JSON.stringify(transfers.data || [])}
    `;

    const prompt = `
      זהות: Saban OS Core - מוח תפעולי ויזואלי ונקי.
      משימה: הפקת דוח ישיר לבוס על בסיס הנתונים בלבד.
      
      חוקי עיצוב (קשיח):
      1. איסור על Markdown כפול (**). השתמש בכוכבית אחת (*) בלבד להדגשה.
      2. כותרת: 📊 *סיכום תפעולי | [נושא]*
      3. מבנה שורה (חובה להפריד שורות לאייקון):
         ![Icon]([Link])
         • לקוח: *[שם]* | סטטוס: *[מצב]*,
         
      4. לינקים לאייקונים (ירוק וואטסאפ):
         - הצבה: https://img.icons8.com/?size=48&id=12119&format=png&color=00a884
         - החלפה: https://img.icons8.com/?size=48&id=ifMVi1WVk8u2&format=png&color=00a884
         - הוצאה: https://img.icons8.com/?size=48&id=12122&format=png&color=00a884
         - חומרים: https://img.icons8.com/?size=48&id=823&format=png&color=00a884

      5. חתימה בסוף: ![Saban](https://cdn-icons-png.flaticon.com/512/2318/2318048.png)

      חוקי מענה: ענה רק על מה שנשאל, בלי נימוסים. אם אין מידע - "אין מידע להיום."

      הנתונים:
      ${contextData}

      שאלה: "${query}"
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
