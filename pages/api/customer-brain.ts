import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { message, senderPhone } = req.body;
  const cleanMsg = (message || "").trim();
  const phone = senderPhone?.replace('@c.us', '') || 'unknown';
  const geminiKey = process.env.GEMINI_API_KEY;

  try {
    // 1. שליפת זיכרון והזמנה קיימת
    const { data: memory } = await supabase.from('customer_memory').select('*').eq('clientId', phone).maybeSingle();
    const { data: lastOrder } = await supabase.from('orders').select('*').ilike('client_info', `%${phone}%`).order('created_at', { ascending: false }).limit(1).maybeSingle();
    
    const currentUserName = memory?.user_name || "";
    const chatHistory = memory?.accumulated_knowledge || "";
    
    const orderStatusInfo = lastOrder ? 
      `סטטוס הזמנה #${lastOrder.order_number}: ${lastOrder.status}. שעה: ${lastOrder.delivery_time || 'טרם נקבעה'}. נהג: ${lastOrder.driver_info || 'טרם שויך'}.` 
      : "אין הזמנה פעילה.";

    // 2. חיפוש מלאי ומוצרים - התיקון כאן (הוספת : string)
    const searchWords = cleanMsg.split(/\s+/).filter((word: string) => word.length >= 3);
    
    let inventoryData = "";
    if (searchWords.length > 0) {
      const { data: exact } = await supabase.from('brain_inventory').select('*').or(`sku.eq.${cleanMsg},product_name.ilike.%${cleanMsg}%`).limit(1).maybeSingle();
      if (exact) inventoryData = `מוצר במלאי: ${exact.product_name}, מק"ט: ${exact.sku}.`;
    }

    // 3. ה-PROMPT המעודכן כולל לוגיקת מכולות
    const prompt = `
      זהות: אתה סדרן ההזמנות של "ח.סבן". מקצועי, חד ותמציתי. 
      לקוח: ${currentUserName || 'אורח'}.
      מידע הזמנה קיימת: ${orderStatusInfo}
      נתוני מלאי: ${inventoryData}

      חוקים אסטרטגיים:
      1. בירור סטטוס: ענה ללקוח על שעה ונהג אם המידע קיים.
      2. לוגיקת מכולות: הצבה (חדש), החלפה או הוצאה. אם במיקום ציבורי בהרצליה/רעננה, הזהר מקנס סופ"ש ושלח לינק להיתר.
      3. מוצרים: אשר מוצרים בבולטים (•) והוסף SAVE_ORDER_DB:[SKU]:[QTY]. 
      4. שכירות: ציין ששכירות מכולה היא ל-10 ימים, ביום ה-9 יש לתאם פינוי/החלפה.

      הודעה: ${cleanMsg}
      היסטוריה: ${chatHistory}
    `;

    // קריאה ל-Gemini
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const data = await response.json();
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "אחי, שלח שוב.";

    // 4. עדכון זיכרון
    await supabase.from('customer_memory').upsert({
      clientId: phone, 
      user_name: currentUserName, 
      accumulated_knowledge: (chatHistory + "\nלקוח: " + cleanMsg + "\nבוט: " + replyText).slice(-1000)
    }, { onConflict: 'clientId' });

    // ניקוי פקודות לפני שליחה
    const finalReply = replyText
      .replace(/SAVE_ORDER_DB:[\w:-]+/g, "")
      .replace(/CLIENT_NOTE:\[.*?\]/g, "")
      .trim();

    return res.status(200).json({ reply: finalReply });

  } catch (error) {
    return res.status(200).json({ reply: "מצטער, חלה שגיאה במערכת המכולות." });
  }
}
