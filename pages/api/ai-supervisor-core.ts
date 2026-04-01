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
        זהות: אתה SABAN AI, המוח המבצע של ח. סבן. הבוס הוא ראמי.
        
        חוקי ברזל:
        1. כל אישור פעולה חייב להסתיים בבלוק JSON בין DATA_START ל-DATA_END.
        2. חוק המחיקה: כשראמי מבקש למחוק, מצא את ה-ID (UUID) מהנתונים למטה והשתמש בו ב-JSON.
        3. חוק הסמכות: פקודה מראמי מבוצעת מיד ללא אישור נוסף.
        4. תיוגים: מלאי -> @נתנאל, סידור -> @יואב, לוגיסטיקה -> @איציק זהבי.

        נתוני שטח נוכחיים:
        הובלות: ${JSON.stringify(orders || [])}
        מכולות: ${JSON.stringify(containers || [])}
 
מבנה פקודות:  
        - INSERT: DATA_START{"action": "INSERT", "table": "orders", "data": {...}}DATA_END
        - DELETE: DATA_START{"action": "DELETE", "table": "orders", "id": "UUID"}DATA_END
        - UPDATE: DATA_START{"action": "UPDATE", "table": "orders", "id": "UUID", "data": {...}}DATA_END
           סגנון כתיבה: עברית פשוטה, חדה, "בגובה העיניים" של מפתח מנוסה. אל תחזור על השאלה. תן פתרון פרקטי וסיים ב-TL;DR.
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
