// pages/api/ai-supervisor-core.ts - VERSION V4 (UPGRADED)
import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabase';
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ reply: "רק POST, בוס." });

  const { query, sender_name } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;
  const today = new Date().toISOString().split('T')[0];

  if (!apiKey) return res.status(200).json({ reply: "⚠️ חסר GEMINI_API_KEY." });

  // 1. שליפת נתוני LIVE להקשר מקסימלי (הובלות, מכולות פעילות והיסטוריית לקוח)
  const [{ data: orders }, { data: containers }] = await Promise.all([
    supabase.from('orders').select('*').eq('delivery_date', today).neq('status', 'history'),
    supabase.from('container_management').select('*').eq('is_active', true)
  ]);

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelPool = ["gemini-2.0-flash", "gemini-1.5-pro"]; // מודלים חזקים ללוגיקה
  let aiResponse = null;

  for (const modelName of modelPool) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const systemPrompt = `
        זהות: אתה SABAN AI V4, המוח המבצע של ח. סבן. הבוס הוא ראמי מסארווה.
        
        תפקיד: ניטור וביצוע פקודות לוגיסטיות.
        
        הנחיות לביצוע:
        1. החלפת מכולה (EXCHANGE):
           - שלב א': UPDATE למכולה הקיימת (is_active: false).
           - שלב ב': INSERT למכולה חדשה עם פרטי הלקוח.
        2. זיהוי הובלות (ORDERS): אם מדובר במוצרים (חול, בטון, בלוקים), הזרק לטבלת "orders".
        3. חוק ה-JSON הקשיח: כל פעולת DB חייבת להופיע בין DATA_START ל-DATA_END.
        4. חישוב ימי שכירות: אם שואלים על לקוח, בדוק מתי הוצבה המכולה (היום הוא ${today}).

        נתוני שטח נוכחיים:
        הובלות היום: ${JSON.stringify(orders || [])}
        מכולות פעילות: ${JSON.stringify(containers || [])}

        מבנה JSON נדרש (actions בלבד):
        {
          "actions": [
            {"type": "INSERT", "table": "orders" | "container_management", "data": {...}},
            {"type": "UPDATE", "table": "container_management", "id": "UUID", "data": {"is_active": false}},
            {"type": "DELETE", "table": "orders", "id": "UUID"}
          ],
          "summary": "תיאור קצר של מה שביצעת"
        }

        סגנון: "מנהל עבודה" - חד, מקצועי, בלי גינונים מיותרים.
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
        let error = null;
        if (action.type === 'INSERT') {
          const { error: err } = await supabase.from(action.table).insert([action.data]);
          error = err;
          if (!error) executionLog.push(`✅ נוצר ב-${action.table}`);
        } else if (action.type === 'UPDATE') {
          const { error: err } = await supabase.from(action.table).update(action.data).eq('id', action.id);
          error = err;
          if (!error) executionLog.push(`🔄 עודכן ב-${action.table}`);
        } else if (action.type === 'DELETE') {
          const { error: err } = await supabase.from(action.table).delete().eq('id', action.id);
          error = err;
          if (!error) executionLog.push(`🗑️ נמחק מ-${action.table}`);
        }

        if (error) executionLog.push(`❌ שגיאה ב-${action.table}: ${error.message}`);
      }
    }

    const cleanReply = aiResponse.replace(/DATA_START[\s\S]*?DATA_END/, '').trim();
    const prefix = executionLog.length > 0 ? `[LOG: ${executionLog.join(' | ')}]\n\n` : "";
    
    return res.status(200).json({ reply: prefix + cleanReply });

  } catch (error: any) {
    console.error("Execution Error:", error);
    return res.status(200).json({ reply: `בוס, הפקודה הובנה אבל היתה שגיאה בביצוע: ${error.message}` });
  }
}
