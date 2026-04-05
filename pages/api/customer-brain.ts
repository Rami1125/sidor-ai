import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const modelPool = [
  "gemini-2.0-pro-exp-02-05",
  "gemini-2.0-flash",
  "gemini-3.1-flash-lite-preview"
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
  const selectedModel = modelPool[Math.floor(Math.random() * modelPool.length)];

  try {
    // 1. שאיבת ידע מטבלת אימון המוח (ai_training) ומלאי
    const { data: training } = await supabase.from('ai_training').select('content');
    const { data: inventory } = await supabase.from('brain_inventory').select('*');
    const { data: memory } = await supabase.from('customer_memory').select('*').eq('clientId', senderPhone).maybeSingle();
    
    // 2. זיהוי עיר
    let cityLogic = "";
    for (const city in MUNICIPALITY_RULES) {
      if (cleanMsg.includes(city)) {
        cityLogic = `עיר: ${city}. הנחיות: ${MUNICIPALITY_RULES[city].alert} לינק: ${MUNICIPALITY_RULES[city].link}`;
      }
    }

    const prompt = `
      זהות: המוח המרכזי של "ח.סבן". סמכותי, מכבד, תמציתי. 
      סגנון: פינג-פונג. ענה קצר ולעניין. השתמש ב"אחי" כשותף, לא כחפרן.
      
      חוקי מחיר:
      - מכולה 8 קו"ב: 1,200 ₪ + מע"מ.
      - חשוב: ציין מחיר רק אם נשאלת עליו מפורשות.
      
      ידע מקצועי (מטבלת אימון):
      ${training?.map(t => t.content).join('\n')}
      
      מלאי זמין:
      ${inventory?.map(i => `${i.product_name} (${i.sku}): ${i.price}₪`).join('\n')}

      לוגיקה עירונית:
      ${cityLogic}

      הנחיות פלט:
      - הזמנה מאושרת? הוסף SAVE_ORDER_DB:[מוצר]:[כמות].
      - מוצר מהמלאי? הוסף SHOW_PRODUCT_CARD:[SKU].
      - מכולה בערים בעייתיות? שלח לינק להיתר ואזהרת קנס.

      הודעה: "${cleanMsg}"
      זיכרון: ${memory?.accumulated_knowledge || ""}
    `;

    const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    
    const aiData = await aiRes.json();
    const reply = aiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "אחי, שלח שוב.";

    // עדכון זיכרון משותף
    await supabase.from('customer_memory').upsert({
      clientId: senderPhone,
      accumulated_knowledge: ((memory?.accumulated_knowledge || "") + `\nU: ${cleanMsg}\nAI: ${reply}`).slice(-1200)
    });

    return res.status(200).json({ reply });

  } catch (error) {
    return res.status(500).json({ reply: "בוס, המוח בטעינה. נסה שוב." });
  }
}
