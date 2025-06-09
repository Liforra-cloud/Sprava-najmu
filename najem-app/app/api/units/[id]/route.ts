// app/api/units/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { supabaseRouteClient } from '@/lib/supabaseRouteClient'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const id = url.pathname.split('/').pop()

  if (!id) {
    return NextResponse.json({ error: 'Missing ID in request' }, { status: 400 })
  }

  const supabase = supabaseRouteClient()

  const { data, error } = await supabase
    .from('units')
    .select(`
      id,
      name,
      address,
      description,
      date_added,
      units (
        id,
        identifier,
        floor,
        disposition,
        area,
        occupancy_status,
        monthly_rent,
        deposit,
        date_added
      )
    `)
    .eq('id', id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: error?.message || 'Property not found' }, { status: 500 })
  }

  return NextResponse.json(data, { status: 200 })
}

export async function PATCH(request: NextRequest) {
  const url = new URL(request.url)
  const id = url.pathname.split('/').pop()

  if (!id) {
    return NextResponse.json({ error: 'Missing ID in request' }, { status: 400 })
  }

  const supabase = supabaseRouteClient()

  // Zjisti session uživatele
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Nepřihlášený uživatel' }, { status: 401 })
  }

  const updates = await request.json()

  // Updatujeme pouze pro konkrétní id a user_id
  const { data, error } = await supabase
    .from('units')
    .update({
      name: updates.name,
      address: updates.address,
      description: updates.description,
      date_added: updates.date_added,
    })
    .eq('id', id)
    .eq('user_id', session.user.id) // Tohle je klíčové pro správný update!
    .select()
    .single()

  if (error || !data) {
    return NextResponse.json({ error: error?.message || 'Failed to update property' }, { status: 500 })
  }

  return NextResponse.json(data, { status: 200 })
}
