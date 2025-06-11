// app/api/properties/[id]/route.ts

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
    .from('properties')
    .select(`
      id,
      name,
      address,
      description,
      property_type,
      owner,
      year_built,
      total_area,
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
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Nepřihlášený uživatel' }, { status: 401 })
  }

  const updates = await request.json()

  const { data, error } = await supabase
    .from('properties')
    .update({
      name: updates.name,
      address: updates.address,
      description: updates.description,
      property_type: updates.property_type,
      owner: updates.owner,
      year_built: updates.year_built,
      total_area: updates.total_area,
      date_added: updates.date_added,
    })
    .eq('id', id)
    .eq('user_id', session.user.id)
    .select()
    .single()

  if (error || !data) {
    return NextResponse.json({ error: error?.message || 'Failed to update property' }, { status: 500 })
  }

  return NextResponse.json(data, { status: 200 })
}

