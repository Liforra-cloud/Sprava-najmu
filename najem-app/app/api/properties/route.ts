// app/api/properties/route.ts
import { NextResponse } from 'next/server'
import { supabaseServerClient } from '@/lib/supabaseServerClient'

export async function GET() {
  const supabase = supabaseServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Nepřihlášený uživatel' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('properties')
    .select('id, name, address, description')
    .eq('user_id', session.user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
