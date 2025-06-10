// lib/supabaseServerClient.ts
import { createClient } from '@supabase/supabase-js';

// tyto proměnné jsi už přidal/a do .env(.local) i do Vercel ENV
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Service-role key nebo URL nejsou definovány v env!');
}

export const supabaseServer = createClient(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    // Server only – neukládáme session, nečteme URL hash apod.
    auth: { persistSession: false, detectSessionInUrl: false }
  }
);
