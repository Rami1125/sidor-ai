import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabase';
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ reply: "בוס, רק POST עובד כאן." });

  const { query, sender_name } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;
  const today = new Date().toISOString().split('T')[0];

  if (!apiKey) return res.status(200).json({ reply: "⚠️ שגיאת מפתח (GEMINI_API_KEY חסר)." });

  try {
    // 1. שליפת נתוני LIVE להקשר של המוח
    const [{ data: orders }, { data: containers }] = await Promise.all([
      supabase.from('orders').select('*').eq('delivery_date', today).neq('status', 'history'),
      supabase.from('container_management').select('*').eq('is_active', true)
    ]);

    const genAI = new GoogleGenerativeAI(apiKey);
    // הגדרה נכונה של המודל בתוך ה-Scope
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const systemPrompt = `
      זהות: SABAN AI - המוח המבצע של ח. סבן. אתה מנהל את הארגון של ראמי (הבוס).
      צוות לתיוג: @הראל (מנכ"ל), @נתנאל (קניין), @איציק זהבי (מנהל החרש), @יואב (סידור).

      מצב שטח (${today}):
      הובלות: ${JSON.stringify(orders || [])}
      מכולות: ${JSON.stringify(containers || [])}

      תפקיד:
      1. ניתוח פקודות: הזרקה, עדכון, מחיקה או סגירה להיסטוריה.
      2. תיוג אוטומטי: חוסר מלאי -> @נתנאל. בעיה בסידור -> @יואב. העברות -> @איציק זהבי.
      
      פורמט פקודות (חובה JSON בתוך DATA_START ו-DATA_END):
      DATA_START{"action": "INSERT/UPDATE/DELETE", "table": "orders/container_management", "data": {}, "id": "UUID"}DATA_END

      סגנון: מקצועי, חד, תמציתי. תמיד תפנה לראמי כ"בוס".
    `;

    const chat = model.startChat({
      history: [{ role: "user", parts: [{ text: systemPrompt }] }],
    });

    const result = await chat.sendMessage(`הודעה מ${sender_name || 'ראמי'}: ${query}`);
    const aiText = result.response.text();

    // 2. ביצוע הפקודות ב-Database
    const jsonMatch = aiText.match(/DATA_START([\s\S]*?)DATA_END/);
    let executionNote = "";

    if (jsonMatch) {
      try {
        const command = JSON.parse(jsonMatch[1]);
        if (command.action === 'INSERT') {
          await supabase.from(command.table).insert([command.data]);
          executionNote = "✅ המשימה הוזרקה ללוח.";
        } else if (command.action === 'DELETE') {
          await supabase.from(command.table).delete().eq('id', command.id);
          executionNote = "🗑️ המשימה נמחקה.";
        } else if (command.action === 'UPDATE') {
          await supabase.from(command.table).update(command.data).eq('id', command.id);
          executionNote = "🔄 המשימה עודכנה.";
        }
      } catch (e) {
        console.error("JSON Parse Error", e);
      }
    }

    const cleanReply = aiText.replace(/DATA_START[\s\S]*?DATA_END/, '').trim();
    return res.status(200).json({ 
      reply: executionNote ? `${executionNote}\n\n${cleanReply}` : cleanReply 
    });

  } catch (error) {
    console.error(error);
    return res.status(200).json({ reply: "בוס, המוח התחמם ב-Build. תבדוק את הלוג." });
  }
}
