// app/api/units/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { supabaseRouteClient } from '@/lib/supabaseRouteClient'

export async function GET() {
  const supabase = supabaseRouteClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Nepřihlášený uživatel' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('units')
    .select('id, name, address, description')
    .eq('user_id', session.user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// Přidej tento POST handler:
export async function POST(request: NextRequest) {
  const supabase = supabaseRouteClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Nelze zjistit přihlášeného uživatele.' }, { status: 401 })
  }

  const { name, address, description } = await request.json()

  const { data, error } = await supabase
    .from('units')
    .insert([
      {
        name,
        address,
        description,
        user_id: session.user.id,
      },
    ])
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
