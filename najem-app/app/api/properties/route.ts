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

  // 3. Spočítáme souhrny pro každou nemovitost
  const propertyMap = propertyList.map((property) => {
    const propUnits = units.filter((u) => u.property_id === property.id)
    const unitCount = propUnits.length
    const occupiedCount = propUnits.filter((u) => u.occupancy_status === 'obsazeno').length
    const totalRent = propUnits.reduce((sum, u) => sum + (Number(u.monthly_rent) || 0), 0)
    return {
      ...property,
      unitCount,
      occupiedCount,
      totalRent,
    }
  })

  return NextResponse.json(propertyMap)
}
