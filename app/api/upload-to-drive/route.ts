import type { NextApiRequest, NextApiResponse } from 'next';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // פתיחת חסימה עד 10 מגה
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { message, imageBase64 } = req.body;
  const geminiKey = process.env.GEMINI_API_KEY;

  try {
    const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: "אתה מומחה טכני של ח.סבן. נתח את התמונה ואבחן סדקים, חלודה או צורך באיטום." },
            { inline_data: { mime_type: "image/jpeg", data: imageBase64 } }
          ]
        }]
      })
    });

    const data = await aiRes.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "לא הצלחתי לראות ברור, אחי. תנסה לצלם שוב מקרוב.";
    
    return res.status(200).json({ reply });
  } catch (error) {
    return res.status(500).json({ error: "טעות בניתוח התמונה" });
  }
}
