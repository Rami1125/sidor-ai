import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// לקוח רגיל לצד משתמש
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// לקוח מנהל (אם תרצה להשתמש ב-API Route)
// const supabaseService = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE!);
