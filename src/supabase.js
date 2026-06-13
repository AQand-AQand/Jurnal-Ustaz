import { createClient } from '@supabase/supabase-js';

// Mengambil URL dan KEY secara otomatis dari sistem environment variables cloud Anda
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
