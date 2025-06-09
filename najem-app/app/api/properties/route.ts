// app/api/properties/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseServerClient'

export async function GET() {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError || !session) {
    return NextResponse.json({ error: 'Nepřihlášený uživatel.' }, { status: 401 })
  }

  const userId = session.user.id

  const { data, error } = await supabase
    .from('properties')
    .select('id, name, address, description')
    .eq('user_id', userId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
