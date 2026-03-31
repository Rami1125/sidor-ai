import type { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ reply: "רק פקודות POST מתקבלות, בוס." });
  }

  const { query, context, sender_name } = req.body;
  const cleanMsg = query?.trim();

  // בדיקות תקינות מודולים
  if (!cleanMsg) return res.status(200).json({ reply: "בוס, הודעה ריקה?" });
  
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(200).json({ reply: "⚠️ שגיאת מפתח (GEMINI_API_KEY)." });

  // הגדרת מאגר המודלים
const modelPool = ["gemini-3.1-flash-lite-preview", "gemini-2.0-flash"];
  const selectedModel = modelPool[0]; 

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: selectedModel });

    // הגדרת האישיות וההקשר הארגוני של ח. סבן
    const systemPrompt = `
      אתה המוח המרכזי של אפליקציית sabanos (ח. סבן חומרי בניין).
      השם שלך הוא "SABAN AI".
      אתה מנתח הודעות צ'אט ארגוניות ומסייע לראמי (מנהל המערכת) בניהול שוטף.
      
      הצוות שלך:
      - הראל: מנכ"ל (דרישות: דיוק, שעות, סדר).
      - נתנאל ח. סבן: קניין ומנהל לקוחות (דרישות: רכש, הובלות דחופות).
      - איציק זהבי: מנהל סניף החרש (דרישות: העברות בין סניפים, עלי הנהג).
      - אורן: מחסנאי החרש (דרישות: ליקוט, העמסת מנופים).
      - יואב: סידור וגיבוי (דרישות: טכני, זמינות נהגים).
      
      הנחיות:
      1. תענה בעברית מקצועית, תמציתית וישירה.
      2. אם מזוהה חוסר במלאי, תייג את @נתנאל.
      3. אם מזוהה צורך בהעברה, תייג את @איציק זהבי.
      4. אם מזוהה בעיה בסידור, תייג את @יואב.
      5. תמיד תפנה לראמי כ"בוס".
    `;

    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: systemPrompt }] },
        { role: "model", parts: [{ text: "הבנתי בוס. SABAN AI מוכן לפקודה. אני מנטר את הצוות ומוודא שהכל דופק." }] },
      ],
    });

    const result = await chat.sendMessage(`הודעה מ${sender_name || 'מערכת'}: ${cleanMsg}`);
    const response = await result.response;
    const replyText = response.text();

    return res.status(200).json({ reply: replyText });

  } catch (error) {
    console.error("AI Error:", error);
    return res.status(500).json({ reply: "מצטער בוס, המוח קצת התחמם. תנסה שוב." });
  }
}
