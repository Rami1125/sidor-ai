import type { NextApiRequest, NextApiResponse } from 'next';

// הגדרת מאגר המודלים
const MODEL_POOL = [
  "gemini-1.5-flash", // מודל עם מכסה נפרדת וגדולה יותר בדרך כלל
  "gemini-3.1-flash-lite-preview",
  "gemini-2.0-flash"  // נשים אותו בסוף עד שהחסימה תשתחרר
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // רק פניות POST מאושרות
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, imageBase64 } = req.body;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (!geminiKey) return res.status(500).json({ error: "Missing API Key" });
  if (!imageBase64) return res.status(400).json({ error: "No image provided" });

  // ניקוי ה-Base64
  const cleanData = imageBase64.includes('base64,') 
    ? imageBase64.split('base64,')[1] 
    : imageBase64;

  let lastError = null;

  // לוגיקת Fallback בין מודלים
  for (const modelName of MODEL_POOL) {
    try {
      const aiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: "אתה המומחה הטכני של ח.סבן. נתח את התמונה ואבחן סדקים, חלודה או צורך באיטום. תן פתרון עם מוצרי סיקה/טמבור." },
                { inline_data: { mime_type: "image/jpeg", data: cleanData } }
              ]
            }]
          })
        }
      );

      const data = await aiRes.json();

      if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
        const reply = data.candidates[0].content.parts[0].text;
        return res.status(200).json({ reply, model: modelName });
      }
      
      lastError = data.error?.message || "Empty response from AI";
    } catch (err: any) {
      lastError = err.message;
    }
  }

  return res.status(500).json({ error: `כל המודלים נכשלו: ${lastError}` });
}
