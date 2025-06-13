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

  // Získání nájemních smluv pro nájemníka
  const { data: leases, error: leasesError } = await supabase
    .from('leases')
    .select('id, monthly_rent, tenant_id, unit_id')
    .eq('tenant_id', id)

  if (leasesError) return NextResponse.json({ error: leasesError.message }, { status: 500 })

  // Získání všech plateb, které jsou spojené s těmito nájemními smlouvami
  const leaseIds = leases.map(lease => lease.id)
  const { data: payments, error: paymentsError } = await supabase
    .from('payments')
    .select('amount, payment_type, lease_id')
    .in('lease_id', leaseIds)

  if (paymentsError) return NextResponse.json({ error: paymentsError.message }, { status: 500 })

  // Výpočet celkového nájemného a dluhu
  let totalRent = 0
  let totalDebt = 0

  payments?.forEach(payment => {
    if (payment.payment_type === 'nájemné') {
      totalRent += Number(payment.amount)
    }
    if (payment.payment_type === 'neuhrazeno') {
      totalDebt += Number(payment.amount)
    }
  })

  return NextResponse.json({
    tenant,
    totalRent,
    totalDebt,
  })
}
