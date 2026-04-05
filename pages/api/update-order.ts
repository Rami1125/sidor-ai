import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// התיקון: חייב להיות export default כדי ש-Next.js יזהה את ה-Route
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { orderId, newStatus, clientId } = req.body;

    if (!orderId || !newStatus) {
      return res.status(400).json({ error: 'Missing parameters' });
    }

    // 1. עדכון סטטוס ההזמנה בטבלת orders
    const { error: orderError } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (orderError) throw orderError;

    // 2. עדכון הזיכרון של הלקוח כדי שיקבל הודעה בצאט
    if (clientId) {
      const statusMessage = `\n[SYSTEM]: סטטוס ההזמנה שלך עודכן ל: ${newStatus}`;
      
      // שליפת הזיכרון הקיים
      const { data: memory } = await supabase
        .from('customer_memory')
        .select('accumulated_knowledge')
        .eq('clientId', clientId)
        .maybeSingle();

      const updatedKnowledge = (memory?.accumulated_knowledge || "") + statusMessage;

      await supabase
        .from('customer_memory')
        .update({ accumulated_knowledge: updatedKnowledge })
        .eq('clientId', clientId);
    }

    return res.status(200).json({ success: true, message: 'Order updated successfully' });

  } catch (error: any) {
    console.error("Update Order Error:", error.message);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
