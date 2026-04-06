import { NextRequest, NextResponse } from 'next/server';

// הגדרות שרת ל-Vercel
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// בתיקיית app משתמשים ב-export בשם המתודה (POST)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileName, fileData, mimeType, phone } = body;

    const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzuKzJdg7B3Q0Q42IonnWlEgsE_o_Sj2dgqxpHrmU0ro-MYmlismm9LzMnpbn7y8rOj/exec";

    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName,
        fileData,
        mimeType,
        phone
      }),
    });

    const result = await response.json();

    if (result.status === 'success') {
      return NextResponse.json({ link: result.link });
    } else {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }

  } catch (error: any) {
    console.error("Upload Route Error:", error.message);
    return NextResponse.json({ 
      error: "Internal Server Error", 
      details: error.message 
    }, { status: 500 });
  }
}
