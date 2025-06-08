// app/api/properties/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET(request: NextRequest) {
  // Z URL vytáhneme id nemovitosti
  const url = new URL(request.url)
  const segments = url.pathname.split('/')
  const id = segments[segments.length - 1]

  // Načteme property a její units
  const { data, error } = await supabase
    .from('properties')
    .select(`
      id,
      name,
      address,
      description,
      date_added,
      units:units (
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

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}
