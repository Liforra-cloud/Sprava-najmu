// app/api/properties/[id]/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

// GET handler pro detail property + embed units
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params
  const { data, error } = await supabase
    .from('properties')
    .select(
      `id, name, address, description, date_added, units(id, identifier, floor, disposition, area, occupancy_status, monthly_rent, deposit, date_added)`
    )
    .eq('id', id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}
