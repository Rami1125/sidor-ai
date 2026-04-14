import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// חיבור ל-Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// רשימת מודלים fallback
const MODEL_POOL = [
  "gemini-1.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash-8b"
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  
  // 🌐 CORS (חובה ל-Webflow)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // טיפול ב-preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, imageBase64 } = req.body;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (!geminiKey) {
    return res.status(500).json({ error: 'Missing GEMINI_API_KEY' });
  }

  try {
    // 📦 שליפת מלאי
    const { data: inventory, error } = await supabase
      .from('brain_inventory')
      .select('product_name, sku, category, coverage_rate, rami_touch, description')
      .limit(10);

    if (error) {
      console.error("Supabase error:", error);
    }

    const inventoryContext = inventory?.map(item => 
      `- ${item.product_name} (SKU: ${item.sku}): ${item.description}. טיפ: ${item.rami_touch}`
    ).join('\n') || '';

    // 🔁 לולאת מודלים (fallback)
    for (const modelName of MODEL_POOL) {
      try {

        const isVisual = !!imageBase64;

        const prompt = `
אתה מומחה חומרי בניין של ח. סבן.

מלאי זמין:
${inventoryContext}

הנחיות:
1. אם יש חישוב לפי מ"ר – החזר JSON:
{"reply": "...", "cart": [{"name": "...", "qty": 0}]}
2. השתמש במוצרים אמיתיים מהמלאי
3. תן תשובות מקצועיות וקצרות

הודעת לקוח:
${message || "ניתוח תמונה"}
`;

        const parts: any[] = [{ text: prompt }];

        // תמונה
        if (isVisual) {
          parts.push({
            inline_data: {
              mime_type: "image/jpeg",
              data: imageBase64.replace(/^data:image\/\w+;base64,/, "")
            }
          });
        }

        // 🤖 קריאה ל-Gemini
        const aiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts }]
            })
          }
        );

        const data = await aiRes.json();

        const rawReply = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (rawReply) {
          try {
            // ניסיון לפרש JSON
            const cleaned = rawReply.replace(/```json|```/g, "");
            const parsed = JSON.parse(cleaned);

            return res.status(200).json({
              reply: parsed.reply || "",
              cart: parsed.cart || []
            });

          } catch {
            // fallback טקסט רגיל
            return res.status(200).json({
              reply: rawReply,
              cart: []
            });
          }
        }

      } catch (err) {
        console.warn("Model failed:", modelName);
        continue;
      }
    }

    return res.status(500).json({ error: "All models failed" });

  } catch (err: any) {
    console.error("Server error:", err);
    return res.status(500).json({
      error: "Server error",
      details: err.message
    });
  }
}
