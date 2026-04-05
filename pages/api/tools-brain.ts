import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');
const geminiKey = process.env.GEMINI_API_KEY;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { message, senderPhone, imageUrl } = req.body;
  const cleanMsg = (message || "").trim();
  const userIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'guest';
  const clientId = senderPhone || userIP;

  // 1. הגדרת בסיס הידע הטכני (The Knowledge Base)
  const TECHNICAL_KNOWLEDGE = `
    מומחיות ח.סבן: איטום, שיקום בטון, גבס וצבע.
    מפרטי סדקים:
    - סדק שיער (<0.3 מ"מ): שטחי, טיפול בשפכטל פנים/חוץ.
    - סדק התפשטות: רחב במרכז, דורש חומר פוליאוריטני גמיש (סיקה פלקס).
    - סדק מבני: חשיפת ברזל, דורש מרגמת שיקום (סיקה 212/610).
    חומרים נפוצים:
    - סיקה 107: איטום צמנטי דו-רכיבי. צריכה: 3-4 ק"ג למ"ר (2 שכבות).
    - טיח שחור: יישור קירות רטובים.
    מכולות: פסולת בניין כבדה דורשת מכולה 8 קוב.
  `;

  try {
    const { data: memory } = await supabase.from('customer_memory').select('*').eq('clientId', clientId).maybeSingle();
    const currentUserName = memory?.user_name || "אורח";
    const chatHistory = memory?.accumulated_knowledge || "";

    // 2. בניית ה-Prompt המומחה
    const prompt = `
      זהות: אתה המומחה הטכני של "ח.סבן חומרי בניין". אתה מדריך מקצועי, לא מוכר.
      לקוח: ${currentUserName}.
      
      בסיס ידע: ${TECHNICAL_KNOWLEDGE}
      היסטוריית פרויקט: ${chatHistory.slice(-2000)}

      חוקי תגובה (פורמט "משרד חקירות"):
      1. זיהוי הבעיה/הסדק: אבחון טכני מדויק.
      2. גורם נפוץ: למה זה קרה?
      3. תוכנית עבודה שלב-אחר-שלב: (הריסה, אינסטלציה, איטום, גמר).
      4. רשימת מוצרים וכמויות: (למשל: "סיקה 107 - 2 שקים ל-10 מ"ר").
      5. זמני ייבוש והערות בטיחות.

      אם המשתמש שלח תמונה (imageUrl: ${imageUrl || 'אין'}), נתח אותה לפי שכבות ה-Vision:
      - האם זה ברזל חלוד? האם זו התנפחות טיח?
      
      הודעת משתמש: "${cleanMsg}"
    `;

    // 3. פנייה ל-Gemini Vision/Flash
    const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            ...(imageUrl ? [{ inline_data: { mime_type: "image/jpeg", data: imageUrl.split(',')[1] } }] : [])
          ]
        }]
      })
    });

    const aiData = await aiRes.json();
    const reply = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "אני בודק את המפרט הטכני עבורך...";

    // 4. עדכון הזיכרון (צבירת ניסיון וירטואלי)
    const newEntry = `\nU: ${cleanMsg}\nAI: ${reply.slice(0, 300)}`;
    await supabase.from('customer_memory').upsert({
      clientId: clientId,
      accumulated_knowledge: (chatHistory + newEntry).slice(-4000),
      updated_at: new Date().toISOString()
    }, { onConflict: 'clientId' });

    return res.status(200).json({ reply });

  } catch (error) {
    return res.status(500).json({ error: "טעות טכנית במוח" });
  }
}
