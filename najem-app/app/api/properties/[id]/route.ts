// app/api/properties/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET(
  request: NextRequest,
  /** 
   * context může obsahovat kromě params i další vlastnosti (searchParams, locale, …),
   * proto tu necháváme volnou index‐signature 
   */
  context: { params: { id: string }; [key: string]: unknown }
) {
  const { id } = context.params

  // načteme tu jednu nemovitost včetně jednotek
  const { data, error } = await supabase
    .from('properties')
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

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
