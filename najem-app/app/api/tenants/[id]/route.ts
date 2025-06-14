// app/api/tenants/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { supabaseRouteClient } from '@/lib/supabaseRouteClient'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params
  const supabase = supabaseRouteClient()

  // Získání nájemníka
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', id)
    .single()

  if (tenantError) return NextResponse.json({ error: tenantError.message }, { status: 500 })

  // Získání smluv včetně jednotky a nemovitosti
  const { data: leases, error: leasesError } = await supabase
    .from('leases')
    .select(`
      id,
      name,
      rent_amount,
      start_date,
      end_date,
      monthly_water,
      monthly_gas,
      monthly_electricity,
      monthly_services,
      repair_fund,
      custom_fields,
      unit:unit_id (
        id,
        identifier,
        property:property_id (
          id,
          name
        )
      )
    `)
    .eq('tenant_id', id)

  if (leasesError) return NextResponse.json({ error: leasesError.message }, { status: 500 })

  // (Volitelné) Můžeš stále vracet totalRent/totalDebt pokud potřebuješ:
  // ...platební logika zde, případně ji můžeš odstranit

  return NextResponse.json({
    tenant,
    leases,
    // totalRent,
    // totalDebt,
  })
}
