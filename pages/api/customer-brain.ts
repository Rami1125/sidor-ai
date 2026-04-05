import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// שימוש במודלים המעודכנים ביותר לאפריל 2026 (כולל פתרון ל-Rotation)
// pages/api/customer-brain.ts
const modelPool = [
  "gemini-3.1-flash-lite-preview", // המודל הכי יציב כרגע
  "gemini-3.1-pro-preview",
  "gemini-2.0-flash"
];

const MUNICIPALITY_RULES: any = {
  "תל אביב": { link: "https://bit.ly/tlv-container", alert: "חובה לפנות בשישי עד 10:00. קנס: ~730 ש\"ח." },
  "הרצליה": { link: "https://bit.ly/herzliya-container", alert: "חובה לפנות בשישי עד 14:00. אין השארה בשבת! קנס: 800 ש\"ח." },
  "נתניה": { link: "https://bit.ly/netanya-container", alert: "אגרת הצבה יומית: 140 ש\"ח. הצבה בכחול-לבן בלבד." },
  "רעננה": { link: "https://bit.ly/raanana-container", alert: "פינוי חובה משישי 12:00. קנס: 730 ש\"ח." },
  "חולון": { link: "https://bit.ly/holon-container", alert: "נוהל 2026: איסור מוחלט על השארה בסופ\"ש." }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { message, senderPhone } = req.body;
  const cleanMsg = (message || "").trim();
  const phone = senderPhone?.replace('@c.us', '') || 'unknown';
  
  // בחירת מודל רנדומלית מהפול המעודכן
  const selectedModel = modelPool[Math.floor(Math.random() * modelPool.length)];

  try {
    // 1. שליפת נתונים מהמאגר
    const { data: training } = await supabase.from('ai_training').select('content');
    const { data: inventory } = await supabase.from('brain_inventory').select('*');
    const { data: memory } = await supabase.from('customer_memory').select('*').eq('clientId', phone).maybeSingle();
    const { data: lastOrder } = await supabase.from('orders').select('*').ilike('client_info', `%${phone}%`).order('created_at', { ascending: false }).limit(1).maybeSingle();
    
    // 2. בדיקת לוגיקה עירונית
    let cityLogic = "";
    for (const city in MUNICIPALITY_RULES) {
      if (cleanMsg.includes(city)) {
        cityLogic = `עיר: ${city}. הנחיות: ${MUNICIPALITY_RULES[city].alert} לינק: ${MUNICIPALITY_RULES[city].link}`;
      }
    }

    const prompt = `
      זהות: המוח המרכזי של "ח.סבן". סמכותי, תמציתי, עובד בשיטת פינג-פונג.
      הלקוח: ${memory?.user_name || 'אורח'}.
      סטטוס הזמנה קיימת: ${lastOrder ? `${lastOrder.status}, שעה: ${lastOrder.delivery_time || 'בטיפול'}, נהג: ${lastOrder.driver_info || 'טרם'}` : 'אין'}

      ידע מקצועי:
      ${training?.map(t => t.content).join('\n')}
      
      מלאי ומחירים:
      ${inventory?.map(i => `${i.product_name} (${i.sku}): ${i.price}₪`).join('\n')}

      ${cityLogic}

      הנחיות פלט (חובה):
      - אישור הזמנה: SAVE_ORDER_DB:[מוצר]:[כמות]
      - הערה דחופה/זיקית: CLIENT_NOTE:[התוכן]
      - הצגת כרטיס: SHOW_PRODUCT_CARD:[SKU]
      - אם מדובר בייעוץ טכני בלבד: אל תציג זמני אספקה.

      הודעה: "${cleanMsg}"
      היסטוריה: ${memory?.accumulated_knowledge || ""}
    `;

    // 3. קריאה ל-Gemini API עם ה-Key מה-Environment
    const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    
    const aiData = await aiRes.json();
    
    // אם המודל לא זמין, נחזיר הודעת שגיאה מפורטת ללוגים
    if (aiData.error) {
      console.error("Gemini Error:", aiData.error.message);
      throw new Error(aiData.error.message);
    }

    let reply = aiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "אחי, המוח בטעינה, שלח שוב.";

    // 4. עיבוד פקודות ועדכון Supabase (סגירת מעגל)
    const hasNote = reply.includes("CLIENT_NOTE:");
    const clientNote = reply.match(/CLIENT_NOTE:\[(.*?)\]/)?.[1] || null;

    if (reply.includes("SAVE_ORDER_DB:") || hasNote) {
      if (lastOrder && lastOrder.status === 'pending') {
        await supabase.from('orders').update({
          warehouse: lastOrder.warehouse + `\n• עדכון: ${cleanMsg}`,
          customer_note: clientNote || lastOrder.customer_note,
          has_new_note: !!clientNote
        }).eq('id', lastOrder.id);
      } else {
        await supabase.from('orders').insert([{
          client_info: `שם: ${memory?.user_name || 'אורח'} | טלפון: ${phone}`,
          warehouse: cleanMsg,
          customer_note: clientNote,
          has_new_note: !!clientNote,
          status: 'pending',
          order_time: new Date().toLocaleTimeString('he-IL')
        }]);
      }
    }

    // 5. עדכון זיכרון
    await supabase.from('customer_memory').upsert({
      clientId: phone,
      accumulated_knowledge: ((memory?.accumulated_knowledge || "") + `\nU: ${cleanMsg}\nAI: ${reply}`).slice(-1500)
    }, { onConflict: 'clientId' });

    // ניקוי התשובה מפקודות לפני שליחה ללקוח
    const cleanReply = reply.replace(/\[.*?\]/g, "").replace(/SAVE_ORDER_DB:.*?/g, "").replace(/CLIENT_NOTE:.*?/g, "").replace(/SHOW_PRODUCT_CARD:.*?/g, "").trim();

    return res.status(200).json({ reply: cleanReply });

  } catch (error: any) {
    console.error("Critical Failure:", error.message);
    return res.status(200).json({ reply: "בוס, יש תקלה בחיבור ל-Gemini. וודא שה-API KEY מעודכן ב-Vercel." });
  }
}
