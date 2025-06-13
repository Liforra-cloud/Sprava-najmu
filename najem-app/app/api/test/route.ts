import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  const supabase = createClient(url!, key!)

  const { data, error } = await supabase.from('documents').select('*').limit(1)

  return NextResponse.json({
    envLoaded: {
      NEXT_PUBLIC_SUPABASE_URL: url?.slice(0, 20),
      SUPABASE_SERVICE_ROLE_KEY: key?.slice(0, 20),
      isKeyDefined: Boolean(key),
    },
    data,
    error,
  })
}
