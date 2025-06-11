// app/api/unit-tenants/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { supabaseRouteClient } from '@/lib/supabaseRouteClient'

// GET – výpis všech přiřazení (není nutné použít error, pokud nechceš vracet chybu)
export async function GET() {
  const supabase = supabaseRouteClient()
  const { data, error } = await supabase
    .from('unit_tenants')
    .select(`
      id,
      unit_id,
      tenant_id,
      date_from,
      date_to,
      contract_number,
      note,
      tenant:tenants (
        id,
        full_name,
        email
      )
    `)
    .order('date_from', { ascending: false })

  // Tady musíš error použít!
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// POST – přiřazení nájemníka k jednotce
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    if (!body.unit_id || !body.tenant_id || !body.date_from) {
      return NextResponse.json({ error: 'Chybí povinná data (unit_id, tenant_id, date_from)' }, { status: 400 })
    }
    const supabase = supabaseRouteClient()
    const { data, error } = await supabase
      .from('unit_tenants')
      .insert([body])
      .select(`
        id,
        unit_id,
        tenant_id,
        date_from,
        date_to,
        contract_number,
        note
      `)
      .single()
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
}
