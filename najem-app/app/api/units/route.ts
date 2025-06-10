import { NextResponse } from 'next/server'
import { supabaseRouteClient } from '@/lib/supabaseRouteClient'

// Handler pro získání všech jednotek uživatele
export async function GET() {
  const supabase = supabaseRouteClient()
  // Získání session z cookies
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    // Uživatel není přihlášen – vrátíme prázdné pole, aby frontend nepadal
    return NextResponse.json([], { status: 200 })
  }

  // Načtení ID nemovitostí patřících uživateli
  const { data: properties, error: propError } = await supabase
    .from('properties')
    .select('id')
    .eq('user_id', session.user.id)
  if (propError) {
    console.error('Chyba při načítání nemovitostí:', propError.message)
    return NextResponse.json([], { status: 200 })
  }

  const propertyIds = properties.map(p => p.id)
  if (propertyIds.length === 0) {
    // Uživatel nemá žádné nemovitosti
    return NextResponse.json([], { status: 200 })
  }

  // Načtení jednotek pro dané nemovitosti
  // Aliasujeme sloupec `identifier` jako `unit_number` a přidáme `description`
  const { data: units, error: unitsError } = await supabase
    .from('units')
    .select(`
      id,
      property_id,
      unit_number:identifier,
      description,
      floor,
      area,
      isOccupied
    `)
    .in('property_id', propertyIds)
  if (unitsError) {
    console.error('Chyba při načítání jednotek:', unitsError.message)
    return NextResponse.json([], { status: 200 })
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
  const { unit_number, floor, area, isOccupied, property_id, description } = await request.json()

  // Vložení nové jednotky (identifier = unit_number)
  const { data, error } = await supabase
    .from('units')
    .insert({ identifier: unit_number, floor, area, isOccupied, property_id, description })
    .select()
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

