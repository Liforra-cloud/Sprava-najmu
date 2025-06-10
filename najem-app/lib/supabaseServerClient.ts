// lib/supabaseServerClient.ts

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("Missing Supabase service-role key or URL!");
}

// Creational function to get fresh client instance if desired
export function supabaseServerClient() {
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false, detectSessionInUrl: false },
  });
}

// Direct exported instance for convenience
export const supabaseServer = supabaseServerClient();
