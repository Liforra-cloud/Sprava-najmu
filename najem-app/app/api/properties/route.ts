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

// nový typ pro attachment, pokud budeš chtít použít později
type Attachment = {
  id: string
  property_id: string
  url: string
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

  // 3. Načti attachments (přílohy) pro všechny properties v jednom dotazu
  let attachments: Attachment[] = []
  if (propertyIds.length > 0) {
    const { data: attachmentsData, error: attachmentsError } = await supabase
      .from('attachments')
      .select('id, property_id')
      .in('property_id', propertyIds)

    if (attachmentsError) {
      return NextResponse.json({ error: attachmentsError.message }, { status: 500 })
    }
    attachments = attachmentsData ?? []
  }

  // 4. Spočítáme souhrny + indikátory pro každou nemovitost
  const propertyMap = propertyList.map((property) => {
    const propUnits = units.filter((u) => u.property_id === property.id)
    const unitCount = propUnits.length
    const occupiedCount = propUnits.filter((u) => u.occupancy_status === 'obsazeno').length
    const totalRent = propUnits.reduce((sum, u) => sum + (Number(u.monthly_rent) || 0), 0)
    const hasAttachment = attachments.some(a => a.property_id === property.id)
    const hasNote = !!property.description && property.description.trim().length > 0
    return {
      ...property,
      unitCount,
      occupiedCount,
      totalRent,
      hasAttachment,
      hasNote,
    }
  })

  return NextResponse.json(propertyMap)
}
