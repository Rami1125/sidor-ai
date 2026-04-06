import type { NextApiRequest, NextApiResponse } from 'next';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { message, imageBase64 } = req.body;
  const geminiKey = process.env.GEMINI_API_KEY;

  // הגנה: בדיקת מפתח API
  if (!geminiKey) {
    console.error("Missing GEMINI_API_KEY");
    return res.status(500).json({ error: "שרת ה-AI לא מוגדר (חסר מפתח)" });
  }

  // הגנה: בדיקת תוכן התמונה
  if (!imageBase64) {
    return res.status(400).json({ error: "לא התקבלה תמונה לניתוח" });
  }

  try {
    const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: "אתה המומחה הטכני של ח.סבן. נתח את התמונה ואבחן סדקים, חלודה או צורך באיטום. תן פתרון עם מוצרי סיקה/טמבור." },
            { 
              inline_data: { 
                mime_type: "image/jpeg", 
                data: imageBase64.replace(/^data:image\/\w+;base64,/, "") // ניקוי ה-Prefix אם קיים
              } 
            }
          ]
        }]
      })
    });

    const data = await aiRes.json();

    if (data.error) {
      console.error("Gemini API Error:", data.error);
      return res.status(500).json({ error: data.error.message });
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "לא הצלחתי לנתח את התמונה.";
    return res.status(200).json({ reply });

  } catch (error: any) {
    console.error("Runtime Error in tools-brain:", error.message);
    return res.status(500).json({ error: "שגיאת שרת פנימית בניתוח" });
  }
}
