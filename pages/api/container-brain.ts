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
    let { data: memory } = await supabase.from('customer_memory').select('*').eq('clientId', phone).maybeSingle();
    let { data: lastOrder } = await supabase.from('orders').select('*').ilike('client_info', `%${phone}%`).order('created_at', { ascending: false }).limit(1).maybeSingle();
    
    let currentUserName = memory?.user_name || "";
    let chatHistory = memory?.accumulated_knowledge || "";

    // 2. חישוב ימי שכירות מכולה (אם יש)
    let rentalStatus = "";
    if (lastOrder && (lastOrder as any).is_container) {
      const days = Math.floor((Date.now() - new Date(lastOrder.created_at).getTime()) / (1000 * 60 * 60 * 24));
      rentalStatus = `המכולה אצל הלקוח ${days} ימים.`;
    }

    // 3. חיפוש מוצר (השורה שתוקנה)
    const searchWords = cleanMsg.split(/\s+/).filter((word: string) => word.length >= 3);
    let inventoryData = "";
    if (searchWords.length > 0) {
      const { data: exact } = await supabase.from('brain_inventory').select('*').or(`sku.eq.${cleanMsg},product_name.ilike.%${cleanMsg}%`).limit(1).maybeSingle();
      if (exact) inventoryData = `מוצר במלאי: ${exact.product_name}, מק"ט: ${exact.sku}.`;
    }

    const prompt = `
      זהות: סדרן "ח.סבן". 
      לקוח: ${currentUserName || 'אורח'}.
      סטטוס מכולה: ${rentalStatus}
      נתוני מלאי: ${inventoryData}
      
      משימות:
      - בירור סטטוס הזמנה (שעה ונהג).
      - הצבת/החלפת/הוצאת מכולה (שכירות 10 ימים, אזהרת קנס בהרצליה).
      - הוספת מוצרי בנייה (SAVE_ORDER_DB:[SKU]:[QTY]).
      
      הודעת לקוח: "${cleanMsg}"
    `;

    // קריאה ל-Gemini
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const data = await response.json();
    let replyText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "אחי, נסה שוב.";

    // עדכון זיכרון
    await supabase.from('customer_memory').upsert({
      clientId: phone, 
      accumulated_knowledge: (chatHistory + "\n" + cleanMsg).slice(-1000)
    }, { onConflict: 'clientId' });

    return res.status(200).json({ reply: replyText.replace(/\[.*?\]/g, "").trim() });

  } catch (e) {
    return res.status(200).json({ reply: "מצטער, חלה שגיאה במוח." });
  }
}
