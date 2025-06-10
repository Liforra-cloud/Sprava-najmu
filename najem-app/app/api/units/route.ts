import { NextResponse } from 'next/server'
import { supabaseRouteClient } from '@/lib/supabaseRouteClient'

// Handler pro získání všech jednotek uživatele
export async function GET() {
  const supabase = supabaseRouteClient()
  // Získání session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  if (sessionError) {
    return NextResponse.json({ error: sessionError.message }, { status: 500 })
  }
  if (!session) {
    return NextResponse.json({ error: 'Nepřihlášený uživatel' }, { status: 401 })
  }

  // Načtení ID nemovitostí patřících uživateli
  const { data: properties, error: propError } = await supabase
    .from('properties')
    .select('id')
    .eq('user_id', session.user.id)
  if (propError) {
    return NextResponse.json({ error: propError.message }, { status: 500 })
  }

  const propertyIds = properties.map((p) => p.id)
  if (propertyIds.length === 0) {
    // Uživatel nemá žádné nemovitosti
    return NextResponse.json([])
  }

  // Načtení jednotek pro dané nemovitosti
  const { data: units, error: unitsError } = await supabase
    .from('units')
    .select('id, identifier, floor, area, isOccupied, property_id')
    .in('property_id', propertyIds)
  if (unitsError) {
    return NextResponse.json({ error: unitsError.message }, { status: 500 })
  }

  return NextResponse.json(units)
}

// Handler pro vytvoření nové jednotky
export async function POST(request: Request) {
  const supabase = supabaseRouteClient()
  // Získání session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  if (sessionError) {
    return NextResponse.json({ error: sessionError.message }, { status: 500 })
  }
  if (!session) {
    return NextResponse.json({ error: 'Nepřihlášený uživatel' }, { status: 401 })
  }

  // Parsování těla požadavku
  const { identifier, floor, area, isOccupied, property_id } = await request.json()

  // Vložení nové jednotky
  const { data, error } = await supabase
    .from('units')
    .insert({ identifier, floor, area, isOccupied, property_id })
    .select()
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
