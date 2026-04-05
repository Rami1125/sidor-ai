import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const modelPool = [
  // המודל החדש והחסכוני ביותר להרצה מהירה (שוחרר ב-31 למרץ)
  "gemini-3.1-flash-lite-preview", 
  
  // המודל החזק ביותר לניתוח טקסט ומדיה (עודכן ב-9 למרץ)
  "gemini-3.1-pro-preview", 
  
  // המודל החדש של גוגל למשימות ממוקדות ויעילות (שוחרר ב-2 לאפריל)
  "gemma-4-31b-it" 
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
  const selectedModel = modelPool[Math.floor(Math.random() * modelPool.length)];

  try {
    // 1. שליפת ידע משולב: אימון, מלאי, זיכרון והזמנה אחרונה לסטטוס
    const { data: training } = await supabase.from('ai_training').select('content');
    const { data: inventory } = await supabase.from('brain_inventory').select('*');
    const { data: memory } = await supabase.from('customer_memory').select('*').eq('clientId', phone).maybeSingle();
    const { data: lastOrder } = await supabase.from('orders').select('*').ilike('client_info', `%${phone}%`).order('created_at', { ascending: false }).limit(1).maybeSingle();
    
    // 2. זיהוי עיר ללוגיקת מכולות
    let cityLogic = "";
    for (const city in MUNICIPALITY_RULES) {
      if (cleanMsg.includes(city)) {
        cityLogic = `עיר: ${city}. הנחיות קריטיות: ${MUNICIPALITY_RULES[city].alert} לינק להיתר: ${MUNICIPALITY_RULES[city].link}`;
      }
    }

    const orderStatusInfo = lastOrder 
      ? `סטטוס הזמנה #${lastOrder.order_number}: ${lastOrder.status}. שעה: ${lastOrder.delivery_time || 'טרם נקבעה'}. נהג: ${lastOrder.driver_info || 'טרם שויך'}.` 
      : "אין הזמנה פעילה כרגע.";

    const prompt = `
      זהות: המוח המרכזי של "ח.סבן". סמכותי, תמציתי, עובד בשיטת פינג-פונג.
      שם הלקוח: ${memory?.user_name || 'אורח'}.
      מידע על הזמנה קיימת: ${orderStatusInfo}
      
      חוקי מחיר למכולה: 8 קו"ב = 1,200 ₪ + מע"מ (ציין מחיר רק אם נשאלת).
      
      ידע מקצועי (ai_training):
      ${training?.map(t => t.content).join('\n')}
      
      מלאי זמין (brain_inventory):
      ${inventory?.map(i => `${i.product_name} (מק"ט: ${i.sku}): ${i.price}₪`).join('\n')}

      לוגיקה עירונית (אם רלוונטי):
      ${cityLogic}

      הנחיות פלט למערכת:
      - אישור הזמנה: הוסף SAVE_ORDER_DB:[SKU/פריט]:[כמות].
      - הערת לקוח/דחיפות: הוסף CLIENT_NOTE:[התוכן]. (מדליק זיקית 🦎).
      - הצגת מוצר: הוסף SHOW_PRODUCT_CARD:[SKU].
      
      חשוב: אם מדובר בייעוץ טכני, אל תדבר על זמני אספקה. אם מדובר בהזמנה, ציין ששעה סופית נקבעת ע"י המשרד.

      הודעה: "${cleanMsg}"
      היסטוריה: ${memory?.accumulated_knowledge || ""}
    `;

    const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    
    const aiData = await aiRes.json();
    let reply = aiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "אחי, שלח שוב הודעה.";

    // 3. עיבוד פקודות ועדכון Database
    const hasSave = reply.includes("SAVE_ORDER_DB:");
    const hasNote = reply.includes("CLIENT_NOTE:");
    const clientNote = reply.match(/CLIENT_NOTE:\[(.*?)\]/)?.[1] || null;

    if (hasSave || hasNote) {
      if (lastOrder && lastOrder.status === 'pending') {
        // עדכון הזמנה קיימת (איחוד)
        await supabase.from('orders').update({
          warehouse: lastOrder.warehouse + (hasSave ? `\n• עדכון: ${cleanMsg}` : ""),
          customer_note: clientNote || lastOrder.customer_note,
          has_new_note: !!clientNote
        }).eq('id', lastOrder.id);
      } else {
        // יצירת הזמנה חדשה
        await supabase.from('orders').insert([{
          client_info: `שם: ${memory?.user_name || 'אורח'} | טלפון: ${phone}`,
          product_name: "📦 סל מוצרים מתעדכן",
          warehouse: cleanMsg,
          customer_note: clientNote,
          has_new_note: !!clientNote,
          status: 'pending',
          order_time: new Date().toLocaleTimeString('he-IL')
        }]);
      }
    }

    // 4. עדכון זיכרון ושם לקוח
    let updatedUserName = memory?.user_name;
    if (!updatedUserName && cleanMsg.length < 15 && !cleanMsg.includes("?")) {
      updatedUserName = cleanMsg.replace(/שמי|אני|קוראים לי/g, "").trim();
    }

    await supabase.from('customer_memory').upsert({
      clientId: phone,
      user_name: updatedUserName,
      accumulated_knowledge: ((memory?.accumulated_knowledge || "") + `\nU: ${cleanMsg}\nAI: ${reply}`).slice(-1500)
    }, { onConflict: 'clientId' });

    // ניקוי פקודות מהתשובה ללקוח
    const cleanReply = reply.replace(/\[.*?\]/g, "").replace(/SAVE_ORDER_DB:.*?/g, "").replace(/SHOW_PRODUCT_CARD:.*?/g, "").replace(/CLIENT_NOTE:.*?/g, "").trim();

    return res.status(200).json({ reply: cleanReply });

  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ reply: "אחי, המוח בטעינה. נסה שוב בעוד רגע." });
  }
}
