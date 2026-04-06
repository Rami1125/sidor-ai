import type { NextApiRequest, NextApiResponse } from 'next';

const MODEL_POOL = [
  "gemini-1.5-flash", 
  "gemini-3.1-flash-lite-preview",
  "gemini-2.0-flash" 
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { message, senderPhone, imageBase64 } = req.body;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (!geminiKey) return res.status(500).json({ error: "Missing API Key" });

  let lastError = null;

  for (const modelName of MODEL_POOL) {
    try {
      const isVisual = !!imageBase64;
      const parts: any[] = [{ text: isVisual 
        ? "אתה המומחה הטכני של ח.סבן. נתח תמונה בשיטת הפינג-פונג: 1. ניתוח זריז. 2. פתרון מהיר/מקיף. 3. בקשת מ\"ר. אם הלקוח נותן מ\"ר, אל תדבר על מכולות, תן רשימת חומרים לאיטום/שיקום בלבד!"
        : `אתה המומחה של ח.סבן. הלקוח שואל על: ${message}. אם מדובר בכמות מ"ר, ענה: 'סגור אחי, מכין לך רשימה ל-2 מ"ר'.` 
      }];

      if (isVisual) {
        parts.push({
          inline_data: { mime_type: "image/jpeg", data: imageBase64.replace(/^data:image\/\w+;base64,/, "") }
        });
      }

      const aiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts }] })
        }
      );

      const data = await aiRes.json();
      if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
        return res.status(200).json({ reply: data.candidates[0].content.parts[0].text });
      }
      lastError = data.error?.message || "Empty response";
    } catch (err: any) {
      lastError = err.message;
    }
  }
  return res.status(500).json({ error: lastError });
}
