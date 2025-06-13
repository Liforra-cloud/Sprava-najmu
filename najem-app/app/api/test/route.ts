import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs' // zajistí běh na serveru

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  console.log('SERVICE KEY (first 10 chars):', process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 10))

  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .limit(1)

  return NextResponse.json({ data, error })
}
