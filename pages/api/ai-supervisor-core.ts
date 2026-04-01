import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabase';
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ reply: "רק POST, בוס." });

  const { query, sender_name } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;
  const today = new Date().toISOString().split('T')[0];

  if (!apiKey) return res.status(200).json({ reply: "⚠️ חסר GEMINI_API_KEY." });

  // 1. הגדרת מאגר המודלים ורוטציה
  const modelPool = ["gemini-3.1-flash-lite-preview", "gemini-2.0-flash"];
  let aiResponse = null;
  let selectedModelName = "";

  // 2. שליפת נתוני LIVE להקשר
  const [{ data: orders }, { data: containers }] = await Promise.all([
    supabase.from('orders').select('*').eq('delivery_date', today).neq('status', 'history'),
    supabase.from('container_management').select('*').eq('is_active', true)
  ]);

  const genAI = new GoogleGenerativeAI(apiKey);

  // לוגיקת ניסיון מעבר בין מודלים (Rotation)
  for (const modelName of modelPool) {
    try {
      selectedModelName = modelName;
      const model = genAI.getGenerativeModel({ model: modelName });

      const systemPrompt = `
  זהות: SABAN AI | בוס: ראמי.
  
  חוק ברזל (אל תפר לעולם):
  בכל פעם שאתה מאשר הזרקה, עדכון או מחיקה, אתה חייב להוסיף בסוף התשובה בלוק JSON מדויק בין DATA_START ל-DATA_END. 
  ללא הבלוק הזה המשימה לא תירשם!

  מבנה להזרקת מכולה (INSERT ל-container_management):
  DATA_START{
    "action": "INSERT",
    "table": "container_management",
    "data": {
      "client_name": "שם הלקוח",
      "delivery_address": "כתובת",
      "action_type": "הצבה",
      "container_size": "8 קוב",
      "contractor_name": "כראדי 32",
      "order_time": "12:30",
      "status": "approved",
      "is_active": true,
      "start_date": "${today}"
    }
  }DATA_END

  צוות לתיוג: @הראל (מנכ"ל), @נתנאל (קניין), @איציק זהבי (החרש), @יואב (סידור).
  סגנון: מקצועי, תמציתי, חוקר ומוודא שדות חסרים.
`;
      const chat = model.startChat({
        history: [{ role: "user", parts: [{ text: systemPrompt }] }],
      });

      const result = await chat.sendMessage(`הודעה מ${sender_name || 'ראמי'}: ${query}`);
      aiResponse = result.response.text();
      
      if (aiResponse) break; // הצלחנו? צא מהלופ

    } catch (err) {
      console.warn(`מודל ${modelName} נכשל, מנסה את הבא...`, err);
      continue; // נכשל? נסה את המודל הבא ב-Pool
    }
  }

  if (!aiResponse) return res.status(200).json({ reply: "בוס, כל המודלים עמוסים. תנסה עוד דקה." });

  try {
    // 3. ביצוע הפקודות ב-Database (הזרקה/מחיקה)
    const jsonMatch = aiResponse.match(/DATA_START([\s\S]*?)DATA_END/);
    let executionNote = "";

    if (jsonMatch) {
      const command = JSON.parse(jsonMatch[1]);
      if (command.action === 'INSERT') {
        await supabase.from(command.table).insert([command.data]);
        executionNote = "✅ הוזרק ללוח.";
      } else if (command.action === 'DELETE') {
        await supabase.from(command.table).delete().eq('id', command.id);
        executionNote = "🗑️ נמחק מהמערכת.";
      } else if (command.action === 'UPDATE') {
        await supabase.from(command.table).update(command.data).eq('id', command.id);
        executionNote = "🔄 עודכן בהצלחה.";
      }
    }

    const cleanReply = aiResponse.replace(/DATA_START[\s\S]*?DATA_END/, '').trim();
    return res.status(200).json({ 
      reply: executionNote ? `${executionNote}\n\n${cleanReply}` : cleanReply 
    });

  } catch (error) {
    return res.status(200).json({ reply: "בוס, המשימה בוצעה אבל יש שגיאה בעיבוד התשובה." });
  }
}
