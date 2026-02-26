import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log("SUPABASE URL:", import.meta.env.VITE_SUPABASE_URL);
console.log("HAS ANON KEY:", Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY));

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Missing Supabase env vars. Check VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);