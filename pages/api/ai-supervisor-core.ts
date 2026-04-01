// pages/api/ai-supervisor-core.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabase';
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ reply: "רק POST, בוס." });

  const { query, sender_name } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;
  const today = new Date().toISOString().split('T')[0];

  if (!apiKey) return res.status(200).json({ reply: "⚠️ חסר GEMINI_API_KEY." });

  // 1. שליפת נתוני LIVE להקשר מקסימלי
  const [{ data: orders }, { data: containers }] = await Promise.all([
    supabase.from('orders').select('*').eq('delivery_date', today).neq('status', 'history'),
    supabase.from('container_management').select('*').eq('is_active', true)
  ]);

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelPool = ["gemini-3.1-flash-lite-preview", "gemini-2.0-flash"];
  let aiResponse = null;

  for (const modelName of modelPool) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const systemPrompt = `
        זהות: אתה SABAN AI, המוח המבצע של ח. סבן. הבוס הוא ראמי.
        
        הנחיות לביצוע פקודות מורכבות:
        1. החלפת מכולה (EXCHANGE): דורשת שני צעדים - עדכון המכולה הקיימת ל-is_active: false והזרקת מכולה חדשה.
        2. עדכון סטטוס: שינוי סטטוס הזמנה/מכולה לפי ID.
        3. חוק ה-JSON: כל פקודה חייבת להיות בתוך DATA_START ו-DATA_END.
        4. תמיכה במערך פקודות: ניתן לשלוח מערך של פעולות (Array) בתוך ה-JSON.

        נתוני שטח נוכחיים:
        הובלות: ${JSON.stringify(orders || [])}
        מכולות: ${JSON.stringify(containers || [])}

        פורמט JSON נדרש לפקודות:
        {
          "actions": [
            {"type": "INSERT", "table": "orders", "data": {...}},
            {"type": "UPDATE", "table": "container_management", "id": "UUID", "data": {"is_active": false}},
            {"type": "DELETE", "table": "orders", "id": "UUID"}
          ]
        }

        סגנון כתיבה: עברית של "מנהל עבודה" - חד, תכליתי, מקצועי. בלי חפירות.
      `;

      const chat = model.startChat({
        history: [{ role: "user", parts: [{ text: systemPrompt }] }],
      });

      const result = await chat.sendMessage(`הודעה מ${sender_name || 'ראמי'}: ${query}`);
      aiResponse = result.response.text();
      if (aiResponse) break;
    } catch (err) {
      console.warn(`Model ${modelName} failed, retrying...`);
    }
  }

  if (!aiResponse) return res.status(200).json({ reply: "בוס, המוח עמוס. נסה שוב." });

  try {
    const jsonMatch = aiResponse.match(/DATA_START([\s\S]*?)DATA_END/);
    let executionLog = [];

    if (jsonMatch) {
      const { actions } = JSON.parse(jsonMatch[1]);
      
      for (const action of actions) {
        if (action.type === 'INSERT') {
          await supabase.from(action.table).insert([action.data]);
          executionLog.push(`✅ נוצר ב-${action.table}`);
        } else if (action.type === 'UPDATE') {
          await supabase.from(action.table).update(action.data).eq('id', action.id);
          executionLog.push(`🔄 עודכן ב-${action.table}`);
        } else if (action.type === 'DELETE') {
          await supabase.from(action.table).delete().eq('id', action.id);
          executionLog.push(`🗑️ נמחק מ-${action.table}`);
        }
      }
    }

    const cleanReply = aiResponse.replace(/DATA_START[\s\S]*?DATA_END/, '').trim();
    const prefix = executionLog.length > 0 ? `${executionLog.join(' | ')}\n\n` : "";
    
    return res.status(200).json({ reply: prefix + cleanReply });

  } catch (error) {
    console.error("Execution Error:", error);
    return res.status(200).json({ reply: "בוס, הפקודה הובנה אבל הביצוע ב-DB נכשל." });
  }
}
