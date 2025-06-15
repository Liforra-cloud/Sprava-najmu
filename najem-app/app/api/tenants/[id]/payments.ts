// app/api/tenants/[id]/payments/route.ts

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

  // Najdi všechny leases (nájemní smlouvy) pro daného nájemníka
  const { data: leases, error: leasesError } = await supabase
    .from('leases')
    .select('id')
    .eq('tenant_id', id)

  if (leasesError) return NextResponse.json({ error: leasesError.message }, { status: 500 })

  const leaseIds = leases?.map(l => l.id) || []

  // Získání plateb, kde lease_id je v leaseIds
  let payments = []
  if (leaseIds.length > 0) {
    const { data: paymentsData, error: paymentsError } = await supabase
      .from('payments')
      .select('amount, payment_date, payment_type, lease_id')
      .in('lease_id', leaseIds)

    if (paymentsError) return NextResponse.json({ error: paymentsError.message }, { status: 500 })

    payments = paymentsData
  }

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
    payments,
  })
}
