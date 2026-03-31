import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { query, user_role } = req.body;

  // לוגיקה של זיהוי חוסרים
  const isShortage = query.includes('חסר') || query.includes('אין במלאי');
  let responseText = "בוס, המערכת מעודכנת.";

  if (isShortage) {
    // כאן נכנס ה-Prompt שמתייג את נתנאל
    responseText = `⚠️ שים לב @נתנאל - דווח על חוסר בפריט המבוקש. נא לטפל בהזמנה מול הספק ולעדכן את הסטטוס בתיקיית הלקוח.`;
  }

  res.status(200).json({ answer: responseText });
}
