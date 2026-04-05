import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// 1. בריכת המודלים המתקדמת
const modelPool = [
  "gemini-3.1-flash-lite-preview",
  "gemini-2.0-pro-exp-02-05", 
  "gemini-2.0-flash"
];

// 2. מאגר חוקי המכולות והעיריות (קיסריה - ראשון)
const MUNICIPALITY_RULES: any = {
  "תל אביב": { link: "https://bit.ly/tlv-container", alert: "חובה לפנות בשישי עד 10:00 בבוקר. קנס: ~730 ש\"ח." },
  "הרצליה": { link: "https://www.herzliya.muni.il/טופס-הצבת-מכולות/", alert: "חובה לפנות בשישי עד 14:00. אין השארה בשבת! קנס: 800 ש\"ח." },
  "נתניה": { link: "https://bit.ly/netanya-container", alert: "אגרת הצבה יומית של 140 ש\"ח. הצבה רק בכחול-לבן." },
  "רעננה": { link: "https://bit.ly/raanana-container", alert: "פינוי חובה משישי 12:00 עד ראשון 06:00. קנס: 730 ש\"ח." },
  "חולון": { link: "https://bit.ly/holon-container", alert: "נוהל 2026: איסור מוחלט על השארה בסופ\"ש. קנס כבד." },
  "כפר סבא": { link: "https://forms.kfar-saba.muni.il", alert: "מרחק 12 מ' מצומת חובה. פקח יאשר מיקום בשטח." },
  "חדרה": { link: "https://bit.ly/hadera-container", alert: "חובה לתאם מיקום מול פקח איכות הסביבה לפני הצבה." }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { message, senderPhone } = req.body;
  const cleanMsg = (message || "").trim();
  const phone = senderPhone || 'web_user';
  
  // בחירת מודל רנדומלית מהבריכה לשיפור שרידות
  const selectedModel = modelPool[Math.floor(Math.random() * modelPool.length)];

  try {
    // א. שליפת מלאי וזיכרון לקוח
    const { data: inventory } = await supabase.from('brain_inventory').select('*');
    const { data: memory } = await supabase.from('customer_memory').select('*').eq('clientId', phone).maybeSingle();
    
    // ב. זיהוי עיר ללוגיקת מכולות
    let cityInfo = "";
    for (const city in MUNICIPALITY_RULES) {
      if (cleanMsg.includes(city)) {
        cityInfo = `📌 הנחיות ${city}: ${MUNICIPALITY_RULES[city].alert} \n🔗 לינק להיתר: ${MUNICIPALITY_RULES[city].link}`;
      }
    }

    // ג. הכנת רשימת מוצרים למוח
    const inventoryList = inventory?.map(i => `• ${i.product_name} (מק"ט: ${i.sku}) | מחיר: ${i.price}₪`).join('\n') || "המלאי מתעדכן...";

    const prompt = `
      זהות: המוח הלוגיסטי של "ח.סבן חומרי בניין". מקצועי, חד, "אחי", חבר ושותף לדרך.
      
      ידע מלאי (חומרי בניין):
      ${inventoryList}
      
      לוגיקת מכולות 8 קו"ב:
      - מחיר: 950 ש"ח (כולל פינוי לאתר מורשה).
      - שכירות: 10 ימים כלולים. יום 11+: 50 ש"ח ליום.
      ${cityInfo}

      חוקים קשיחים:
      1. הזמנה: אם הלקוח סגור על מוצר/כמות, אשר לו והוסף SAVE_ORDER_DB:[שם המוצר]:[כמות].
      2. מכולות: בערים הרלוונטיות, שלח את הלינק להיתר והזהר מקנס סופ"ש.
      3. כרטיס מוצר: למוצרים מהמלאי, שלח פקודת SHOW_PRODUCT_CARD:[SKU].
      4. שפה: עברית פשוטה, בלי חפירות, תכל'ס.

      הודעה אחרונה: "${cleanMsg}"
      זיכרון שיחה: ${memory?.accumulated_knowledge || "שיחה חדשה"}
    `;

    // ד. קריאה ל-Gemini API (עם המודל שנבחר מהבריכה)
    const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    
    const aiData = await aiRes.json();
    const reply = aiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "אחי, שלח שוב, משהו בחיבור נפל.";

    // ה. עדכון זיכרון ב-Supabase
    await supabase.from('customer_memory').upsert({
      clientId: phone,
      accumulated_knowledge: ((memory?.accumulated_knowledge || "") + "\nUser: " + cleanMsg + "\nAI: " + reply).slice(-1000)
    }, { onConflict: 'clientId' });

    return res.status(200).json({ reply });

  } catch (error: any) {
    console.error("Brain Crash:", error);
    return res.status(500).json({ reply: "בוס, המוח חם מדי. תן לי שנייה להתקרר ונסה שוב." });
  }
}
