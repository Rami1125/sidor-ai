import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const modelPool = ["gemini-3.1-flash-lite-preview", "gemini-3.1-pro-preview", "gemini-2.0-flash"];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { message, senderPhone } = req.body;
  const cleanMsg = (message || "").trim();
  const phone = senderPhone?.replace('@c.us', '') || 'admin';
  const geminiKey = process.env.GEMINI_API_KEY;
  const selectedModel = modelPool[Math.floor(Math.random() * modelPool.length)];

  console.log(`--- [צינור נקי] כניסת הודעה: ${cleanMsg} ---`);

  try {
    // 1. שליפת מידע גולמי בלבד מה-DB (בלי לעבד אותו בקוד)
    const { data: training } = await supabase.from('ai_training').select('content');
    const { data: inventory } = await supabase.from('brain_inventory').select('*');
    const { data: memory } = await supabase.from('customer_memory').select('*').eq('clientId', phone).maybeSingle();
    
    const currentUserName = memory?.user_name || "אורח";
    const chatHistory = memory?.accumulated_knowledge || "";

    // 2. בניית ה-Prompt - כאן אנחנו אומרים ל-Gem שהוא המפקד
    const prompt = `
      זהות: המוח המרכזי של "ח.סבן". אתה האחראי הבלעדי על הלוגיקה.
      לקוח נוכחי: ${currentUserName}. טלפון: ${phone}.
      
      מידע זמין עבורך (אל תציג את הכל, השתמש לפי הצורך):
      - מלאי: ${inventory?.map(i => `${i.product_name}: ${i.price}₪`).join(', ')}
      - ידע מקצועי: ${training?.map(t => t.content).join('\n')}
      
      הנחיות לביצוע (פקודות עבור המערכת):
      1. להזמנה/פינוי: חובה להוסיף SAVE_ORDER_DB:[פירוט הפריטים].
      2. להערה/דחיפות/זיקית: חובה להוסיף CLIENT_NOTE:[תוכן ההערה].
      3. לעדכון שם הלקוח: חובה להוסיף SET_USER_NAME:[השם החדש].
      
      חוקי עירייה (באחריותך בלבד):
      - כפר סבא/ויצמן: ציר ראשי, פינוי עד 14:00.
      - תל אביב: פינוי בשישי עד 10:00.
      
      היסטוריה: ${chatHistory.slice(-800)}
      הודעת לקוח: "${cleanMsg}"
    `;

    // 3. קריאה ל-Gem
    const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    
    const aiData = await aiRes.json();
    const replyText = aiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    console.log(`--- [GEMS COMMANDS] --- \n${replyText}`);

    // 4. ביצוע הפקודות שה-Gem שלח (בלי לשאול שאלות)
    
    // א. עדכון שם (רק אם ה-Gem שלח פקודה)
    const newNameMatch = replyText.match(/SET_USER_NAME:\[(.*?)\]/);
    const updatedName = newNameMatch ? newNameMatch[1] : currentUserName;

    // ב. הזרקת הזמנה ללוח (רק אם ה-Gem שלח פקודה)
    if (replyText.includes("SAVE_ORDER_DB") || replyText.includes("CLIENT_NOTE")) {
      const clientNote = replyText.match(/CLIENT_NOTE:\[(.*?)\]/)?.[1] || "";
      const orderDetails = replyText.match(/SAVE_ORDER_DB:\[(.*?)\]/)?.[1] || cleanMsg;

      await supabase.from('orders').insert([{
        client_info: `שם: ${updatedName} | טלפון: ${phone}`,
        warehouse: orderDetails,
        status: 'pending',
        has_new_note: !!clientNote,
        order_time: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
      }]);
      console.log("הזמנה הוזרקה לפי פקודת Gem.");
    }

    // ג. עדכון זיכרון
    await supabase.from('customer_memory').upsert({
      clientId: phone, 
      user_name: updatedName, 
      accumulated_knowledge: (chatHistory + "\nU: " + cleanMsg + "\nAI: " + replyText).slice(-1000)
    }, { onConflict: 'clientId' });

    // 5. ניקוי התשובה ללקוח (הסרת הפקודות)
    const finalReply = replyText.replace(/\[.*?\]/g, "").replace(/SAVE_ORDER_DB:.*?/g, "").replace(/CLIENT_NOTE:.*?/g, "").replace(/SET_USER_NAME:.*?/g, "").trim();

    return res.status(200).json({ reply: finalReply || "רשמתי, מטפל בזה." });

  } catch (error) {
    console.error("Critical Error:", error);
    return res.status(200).json({ reply: "מטפל בזה עכשיו." });
  }
}
