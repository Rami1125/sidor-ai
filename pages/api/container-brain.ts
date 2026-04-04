import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { message, senderPhone } = req.body;
  const phone = senderPhone?.replace('@c.us', '') || 'unknown';
  const geminiKey = process.env.GEMINI_API_KEY;

  try {
    // 1. בדיקת מכולה קיימת אצל הלקוח
    const { data: activeContainer } = await supabase
      .from('orders')
      .select('*')
      .eq('is_container', true)
      .ilike('client_info', `%${phone}%`)
      .neq('status', 'removed')
      .maybeSingle();

    // 2. לוגיקת ימי שכירות (אם יש מכולה)
    let rentalInfo = "";
    if (activeContainer) {
      const daysDiff = Math.floor((Date.now() - new Date(activeContainer.created_at).getTime()) / (1000 * 60 * 60 * 24));
      rentalInfo = `המכולה אצלו כבר ${daysDiff} ימים. (שכירות חינם עד 10 ימים).`;
    }

    const prompt = `
      זהות: אתה סדרן המכולות של "ח.סבן". מקצועי ותמציתי.
      מידע לוגיסטי: ${activeContainer ? "לקוח עם מכולה פעילה בכתובת: " + activeContainer.warehouse : "לקוח חדש"}.
      מצב שכירות: ${rentalInfo}

      חוקי מכולות:
      1. לקוח קיים: הצעה להחלפה (מלאה בחדשה) או הוצאה (פינוי).
      2. לקוח חדש: פינג-פונג "פרטי או ציבורי?".
      3. הרצליה/כ"ס/רעננה: אזהרת קנס 800 ש"ח + איסור סופ"ש (פינוי בשישי ב-14:00). לינק להיתר: https://www.herzliya.muni.il/טופס-הצבת-מכולות/
      4. יום 9: אם הלקוח שואל, ציין שמחר נגמרת השכירות החינמית.

      הודעה: "${message}"
      פקודות: CONTAINER_OP:[הצבה/החלפה/הוצאה]
    `;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    
    const data = await response.json();
    let reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "אחי, שלח שוב.";

    // 3. הזרקה לטבלה במקרה של זיהוי פעולה
    if (reply.includes("CONTAINER_OP:")) {
      const type = reply.match(/CONTAINER_OP:\[?(.*?)\]?/)?.[1] || "הצבה";
      await supabase.from('orders').insert([{
        client_info: `מכולה | ${phone}`,
        warehouse: `מכולה 8 קוב - ${type}`,
        is_container: true,
        status: 'pending',
        order_time: new Date().toLocaleTimeString('he-IL')
      }]);
    }

    return res.status(200).json({ reply: reply.replace(/CONTAINER_OP:.*?/g, "").trim() });
  } catch (e) {
    return res.status(500).json({ error: "API Error" });
  }
}
