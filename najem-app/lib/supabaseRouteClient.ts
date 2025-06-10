// lib/supabaseRouteClient.ts
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { type Database } from '@/types/supabase'

export function supabaseRouteClient(cookies: any) {
  // createRouteHandlerClient automaticky použije ANON_KEY a session z cookies
  return createRouteHandlerClient({ cookies });
}
