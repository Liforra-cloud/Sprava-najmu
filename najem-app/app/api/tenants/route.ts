//app/api/tenants/route.ts

import { NextResponse } from 'next/server'
import { supabaseRouteClient } from '@/lib/supabaseRouteClient'

// GET – seznam všech nájemníků včetně počtu aktivních jednotek
export async function GET() {
  const supabase = supabaseRouteClient()
  // Načteme všechny nájemníky
  const { data: tenants, error } = await supabase
    .from('tenants')
    .select('*')
    .order('date_registered', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Načteme počty jednotek pro každého nájemníka (jen aktivní, tedy bez date_to)
  const tenantIds = (tenants ?? []).map(t => t.id)
  let unitCounts: Record<string, number> = {}

  if (tenantIds.length > 0) {
    const { data: assignments, error: aErr } = await supabase
      .from('unit_tenants')
      .select('tenant_id')
      .is('date_to', null)
      .in('tenant_id', tenantIds)

    if (!aErr && assignments) {
      // Spočítáme počet aktivních jednotek pro každého tenant_id
      unitCounts = assignments.reduce((acc: Record<string, number>, rec: { tenant_id: string }) => {
        acc[rec.tenant_id] = (acc[rec.tenant_id] || 0) + 1
        return acc
      }, {})
    }
  }

  // Vrátíme nájemníky včetně počtu jednotek
  const result = (tenants ?? []).map(t => ({
    ...t,
    active_unit_count: unitCounts[t.id] || 0
  }))

  return NextResponse.json(result)
}

// POST – vytvoření nájemníka
export async function POST(request: Request) {
  const body = await request.json()
  const supabase = supabaseRouteClient()
  const { data, error } = await supabase.from('tenants').insert([body]).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}


