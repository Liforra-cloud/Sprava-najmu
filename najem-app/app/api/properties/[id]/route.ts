// app/api/properties/[id]/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET({ params }: { params: { id: string } }) {
  const { data, error } = await supabase
    .from('properties')
    .select(`
      id,
      name,
      address,
      description,
      date_added,
      units(
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
    .eq('id', params.id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}
