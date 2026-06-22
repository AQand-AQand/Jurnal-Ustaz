// File: src/lib/supabase.js
import { createClient } from '@supabase/supabase-js';

// Mengambil kredensial dari Environment Variables (.env) agar aman.
// Fallback ke string asli hanya untuk sementara selama masa development.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://gjfdxqhwwytcgylokksq.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_1SSrr1ebYfBvZ7V60egzfg__Q_wz_Pm";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
