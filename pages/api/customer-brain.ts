// api/chat/route.js (Vercel / Next.js)
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-ai"; // אם אתה משתמש ב-SDK של סופבייס

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(req) {
  const { messages, userInput } = await req.json();

  // 1. הגדרת המוח (כאן אתה מדביק את ה-Prompt שהגדרנו)
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: `
      אתה המוח המרכזי של "ח. סבן". תפקידך לנהל שיחות מכירה ולוגיסטיקה.
      חוקים:
      - הודעה אחת = שאלה אחת.
      - סגנון דיבור: מקצועי, תמציתי, "שותף/אח".
      - בסיום הזמנה חובה להוסיף: SAVE_ORDER_DB:[מוצר:כמות].
      - אם יש בקשה מיוחדת הוסף: CLIENT_NOTE:[התוכן].
      - השעה הסופית נקבעת על ידי המשרד.
    `,
  });

  const chat = model.startChat({
    history: messages, // היסטוריית השיחה שנשמרת בצד הלקוח
  });

  // 2. שליחת ההודעה ל-Gemini
  const result = await chat.sendMessage(userInput);
  const fullResponse = result.response.text();

  // 3. לוגיקה לחילוץ פקודות (Parsing)
  let cleanText = fullResponse;
  
  // זיהוי פקודת שמירה לבסיס הנתונים
  const orderMatch = fullResponse.match(/SAVE_ORDER_DB:\[(.*?)\]/);
  if (orderMatch) {
    const orderDetails = orderMatch[1];
    // כאן אתה מפעיל פונקציה שכותבת ל-Supabase
    await saveToSupabase(orderDetails);
    // מנקים את הפקודה מהטקסט שהלקוח רואה
    cleanText = cleanText.replace(orderMatch[0], "");
  }

  // זיהוי הערת לקוח
  const noteMatch = fullResponse.match(/CLIENT_NOTE:\[(.*?)\]/);
  if (noteMatch) {
    await saveClientNote(noteMatch[1]);
    cleanText = cleanText.replace(noteMatch[0], "");
  }

  // 4. החזרת התשובה "הנקייה" לממשק
  return new Response(JSON.stringify({ text: cleanText.trim() }));
}

async function saveToSupabase(details) {
  // הלוגיקה שלך לחיבור ל-DB
  console.log("Saving to DB:", details);
}
