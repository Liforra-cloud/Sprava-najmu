// app/api/tenants/[id]/route.ts

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabaseRouteClient } from '@/lib/supabaseRouteClient'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const supabase = supabaseRouteClient()
  const tenantId = params.id

  // Zjistíme aktuálního uživatele
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Nejste přihlášeni.' }, { status: 401 })
  }

  // 1) Načteme nájemníka pouze pokud patří tomuto uživateli
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', tenantId)
    .eq('user_id', user.id)
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
  const summary = {
    totalDue: 0,
    paidThisMonth: 0,
    totalPaid: 0,
    debt: 0,
    debtThisMonth: 0,
  }

  return NextResponse.json({ tenant, leases, summary })
}
