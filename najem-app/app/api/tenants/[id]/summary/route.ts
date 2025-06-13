//app/api/tenants/[id]/summary/route.ts

import { supabaseRouteClient } from '@/lib/supabaseRouteClient'
import { NextResponse } from 'next/server'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const supabase = supabaseRouteClient()
  const tenantId = params.id

  // Najdeme nájemní smlouvy pro daného nájemníka
  const { data: leases, error: leaseErr } = await supabase
    .from('leases')
    .select('id')
    .eq('tenant_id', tenantId)

  if (leaseErr || !leases) {
    return NextResponse.json({ error: leaseErr?.message || 'Nenalezeno' }, { status: 500 })
  }

  const leaseIds = leases.map(l => l.id)

  if (leaseIds.length === 0) {
    return NextResponse.json({
      totalRent: 0,
      totalDebt: 0,
      monthRent: 0,
      monthDebt: 0,
      owes: false
    })
  }

  // Načteme všechny platby pro tyto leases
  const { data: payments, error: payErr } = await supabase
    .from('payments')
    .select('amount, payment_type, payment_date')
    .in('lease_id', leaseIds)

  if (payErr || !payments) {
    return NextResponse.json({ error: payErr?.message || 'Chyba při načítání plateb' }, { status: 500 })
  }

  // Spočítáme celkové hodnoty
  let totalRent = 0
  let totalDebt = 0

  payments.forEach(p => {
    if (p.payment_type === 'nájemné') totalRent += Number(p.amount)
    if (p.payment_type === 'neuhrazeno') totalDebt += Number(p.amount)
  })

  // Spočítáme hodnoty za aktuální měsíc
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const monthPayments = payments.filter(p => {
    const d = new Date(p.payment_date)
    return d >= firstDay && d <= lastDay
  })

  let monthRent = 0
  let monthDebt = 0

  monthPayments.forEach(p => {
    if (p.payment_type === 'nájemné') monthRent += Number(p.amount)
    if (p.payment_type === 'neuhrazeno') monthDebt += Number(p.amount)
  })

  return NextResponse.json({
    totalRent,
    totalDebt,
    monthRent,
    monthDebt,
    owes: totalDebt + monthDebt > 0
  })
}
