import { supabase } from '../lib/supabase';

export const useAIUpdate = () => {
  const updateOrderWithAI = async (orderId: string, aiAnalysis: any) => {
    // עדכון דינמי לפי ניתוח ה-AI (כתובת, שעה, נהג וכו')
    const { data, error } = await supabase
      .from('orders')
      .update({ ...aiAnalysis, status: 'approved' })
      .eq('id', orderId)
      .select();

    if (!error) {
      // כאן נכנסת הלוגיקה של OneSignal (נשלח ל-API ייעודי)
      await fetch('/api/notify', {
        method: 'POST',
        body: JSON.stringify({ title: 'הזמנה עודכנה', body: `הזמנה ${orderId} עודכנה ע"י AI` })
      });
    }
    return { data, error };
  };

  return { updateOrderWithAI };
};
