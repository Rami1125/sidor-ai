import { NextRequest, NextResponse } from 'next/server';

// מאגר המודלים המעודכן - חסין כדורים
const MODEL_POOL = [
  "gemini-2.0-flash",           // הכי מהיר וחכם כרגע (דיפולט)
  "gemini-1.5-pro",             // יציב מאוד לניתוח עמוק
  "gemini-1.5-flash-8b"         // גיבוי מהיר במקרה של עומס קיצוני
];

export async function POST(req) {
  try {
    const { message, senderPhone } = await req.json();
    const geminiKey = process.env.GEMINI_API_KEY;

    if (!geminiKey) return NextResponse.json({ error: "Missing API Key" }, { status: 500 });

    let lastError = null;

    // לוגיקת ה-Retry והמעבר בין מודלים (חסין כדורים)
    for (const modelName of MODEL_POOL) {
      try {
        console.log(`Trying model: ${modelName}`);
        
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{ 
                  text: `אתה המוח המרכזי של ח.סבן. לקוח פנה אליך בכתובת: ${message}. 
                         היה מקצועי, ענייני, חברותי ועזור לו בכל נושא טכני או הזמנה. 
                         אם אתה לא יודע, תגיד שנציג אנושי יחזור אליו לטלפון ${senderPhone}.` 
                }]
              }],
              generationConfig: {
                temperature: 0.7,
                topP: 0.8,
                topK: 40
              }
            })
          }
        );

        const data = await response.json();

        if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
          const reply = data.candidates[0].content.parts[0].text;
          return NextResponse.json({ reply, modelUsed: modelName });
        }

        // אם הגענו לכאן, המודל החזיר תשובה ריקה או שגיאת API
        console.warn(`Model ${modelName} failed, trying next...`);
        lastError = data.error?.message || "Empty response";

      } catch (err) {
        console.error(`Error with ${modelName}:`, err.message);
        lastError = err.message;
      }
    }

    // אם כל המודלים נכשלו
    throw new Error(`All models failed. Last error: ${lastError}`);

  } catch (error) {
    console.error("Critical Brain Error:", error);
    return NextResponse.json({ 
      reply: "בוס, המערכת בעומס קל. נסה לשלוח שוב בעוד רגע או שנציג אנושי יחזור אליך.",
      error: error.message 
    }, { status: 500 });
  }
}
