// lib/supabaseRouteClient.ts
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { type Database } from '@/types/supabase'

export const supabaseRouteClient = () => {
  return createRouteHandlerClient<Database>({ cookies })
}
