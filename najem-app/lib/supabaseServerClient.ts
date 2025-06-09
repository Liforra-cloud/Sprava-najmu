// lib/supabaseServerClient.ts
import { cookies } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { type Database } from '@/types/supabase'

export const supabaseServerClient = () => {
  return createServerComponentClient<Database>({ cookies })
}
