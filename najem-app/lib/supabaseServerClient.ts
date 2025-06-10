// lib/supabaseServerClient.ts

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("Missing Supabase service-role key or URL!");
}

export const supabaseServer = createClient(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: { persistSession: false, detectSessionInUrl: false },
  }
);

// **Alias pro stávající importy ve starších souborech:**
export const supabaseServerClient = supabaseServer;
