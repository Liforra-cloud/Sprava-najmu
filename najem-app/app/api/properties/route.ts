// app/api/properties/route.ts

import { NextResponse } from 'next/server'
import { supabaseRouteClient } from '@/lib/supabaseRouteClient'

type Property = {
  id: string
  name: string
  address: string
  description?: string
}

type Unit = {
  id: string
  property_id: string
  monthly_rent: number | null
  occupancy_status: string
}

export async function GET() {
  const supabase = supabaseRouteClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Nepřihlášený uživatel' }, { status: 401 })
  }

  // 1. Načteme properties uživatele
  const { data: properties, error: propError } = await supabase
    .from('properties')
    .select('id, name, address, description')
    .eq('user_id', session.user.id)

  if (propError) {
    return NextResponse.json({ error: propError.message }, { status: 500 })
  }

  const propertyList: Property[] = properties ?? []

  // 2. Načteme všechny jednotky těchto nemovitostí (jen potřebná pole)
  const propertyIds = propertyList.map((p) => p.id)
  let units: Unit[] = []
  if (propertyIds.length > 0) {
    const { data: unitsData, error: unitError } = await supabase
      .from('units')
      .select('id, property_id, monthly_rent, occupancy_status')
      .in('property_id', propertyIds)

    if (unitError) {
      return NextResponse.json({ error: unitError.message }, { status: 500 })
    }
    units = unitsData ?? []
  }

  // 3. Načteme počet příloh ke každé nemovitosti (attachments)
  const attachmentsCount: Record<string, number> = {}
  if (propertyIds.length > 0) {
    const { data: attachmentsData, error: attachError } = await supabase
      .from('attachments')
      .select('property_id, id')
      .in('property_id', propertyIds)

    if (attachError) {
      return NextResponse.json({ error: attachError.message }, { status: 500 })
    }

    // Vytvoř hash { property_id: count }
    attachmentsData?.forEach((a: { property_id: string }) => {
      attachmentsCount[a.property_id] = (attachmentsCount[a.property_id] || 0) + 1
    })
  }

  // 4. Sestavíme výsledek
  const propertyMap = propertyList.map((property) => {
    const propUnits = units.filter((u) => u.property_id === property.id)
    const unitCount = propUnits.length
    const occupiedCount = propUnits.filter((u) => u.occupancy_status === 'obsazeno').length
    const totalRent = propUnits.reduce((sum, u) => sum + (Number(u.monthly_rent) || 0), 0)

    // Má property poznámku?
    const hasNote = !!(property.description && property.description.trim().length > 0)
    // Má property přílohu?
    const hasAttachment = (attachmentsCount[property.id] || 0) > 0

    return {
      ...property,
      unitCount,
      occupiedCount,
      totalRent,
      hasNote,
      hasAttachment,
    }
  })

  return NextResponse.json(propertyMap)
}

// ⬇️⬇️⬇️ NOVÁ POST METODA ⬇️⬇️⬇️

export async function POST(request: Request) {
  const supabase = supabaseRouteClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Nepřihlášený uživatel' }, { status: 401 })
  }

  const body = await request.json()
  const {
    name,
    address,
    description,
    property_type,
    owner,
    year_built,
    total_area,
  } = body

  // Kontrola povinných polí
  if (!name || !address) {
    return NextResponse.json({ error: 'Název a adresa jsou povinné.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('properties')
    .insert([{
      name,
      address,
      description,
      property_type,
      owner,
      year_built: year_built ? parseInt(year_built) : null,
      total_area: total_area ? parseFloat(total_area) : null,
      user_id: session.user.id
    }])
    .select('id')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: error?.message || 'Nepodařilo se přidat nemovitost.' }, { status: 500 })
  }

  return NextResponse.json({ id: data.id }, { status: 200 })
}
