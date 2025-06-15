//app/api/payments/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { supabaseRouteClient } from '@/lib/supabaseRouteClient'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const tenantId = searchParams.get('tenant_id')
  const supabase = supabaseRouteClient()

  if (!tenantId) return NextResponse.json({ error: 'tenant_id is required' }, { status: 400 })

  // Získání leases
  const { data: leases, error: leasesError } = await supabase
    .from('leases')
    .select('id')
    .eq('tenant_id', tenantId)

  if (leasesError) return NextResponse.json({ error: leasesError.message }, { status: 500 })

  const leaseIds = leases?.map(l => l.id) || []

  // Získání plateb
  let payments: any[] = []
  if (leaseIds.length > 0) {
    const { data: paymentsData, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .in('lease_id', leaseIds)

    if (paymentsError) return NextResponse.json({ error: paymentsError.message }, { status: 500 })

    payments = paymentsData
  }

  return NextResponse.json({ payments })
}
