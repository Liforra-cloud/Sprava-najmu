// app/api/tenants/[id]/route.ts

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabaseRouteClient } from '@/lib/supabaseRouteClient'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const supabase = supabaseRouteClient()
  const tenantId = params.id

  // 1) Načteme nájemníka
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', tenantId)
    .single()
  if (tenantError || !tenant) {
    return NextResponse.json({ error: tenantError?.message ?? 'Nenalezeno' }, { status: 404 })
  }

  // 2) Načteme smlouvy (leases)
  const { data: leases, error: leasesError } = await supabase
    .from('leases')
    .select(`
      id,
      name,
      rent_amount,
      start_date,
      end_date,
      unit:unit_id (
        id,
        identifier,
        property:property_id ( id, name )
      )
    `)
    .eq('tenant_id', tenantId)
  if (leasesError) {
    return NextResponse.json({ error: leasesError.message }, { status: 500 })
  }

  // 3) Shrnutí plateb (volitelné; ukázka skeletonu)
  // Tady byste volali supabase.from('monthly_obligations') nebo payments,
  // sečtli totalDue, paidThisMonth, totalPaid, apod.
  const summary = {
    totalDue: 0,
    paidThisMonth: 0,
    totalPaid: 0,
    debt: 0,
    debtThisMonth: 0,
  }

  return NextResponse.json({ tenant, leases, summary })
}
