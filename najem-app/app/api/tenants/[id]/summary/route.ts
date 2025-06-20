//app/api/tenants/[id]/summary/route.ts

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const tenantId = params.id

  // 1) Načti všechny smlouvy nájemníka
  const leases = await prisma.lease.findMany({
    where: { tenant_id: tenantId },
    select: { id: true }
  })
  const leaseIds = leases.map(l => l.id)
  if (leaseIds.length === 0) {
    // bez smluv žádné závazky ani platby
    return NextResponse.json({
      totalDue: 0,
      totalPaid: 0,
      paidThisMonth: 0,
      totalDebt: 0,
      debtThisMonth: 0,
      owes: false
    })
  }

  // 2) Načti všechny měsíční závazky
  const obligations = await prisma.monthlyObligation.findMany({
    where: { lease_id: { in: leaseIds } },
    select: { year: true, month: true, total_due: true, debt: true }
  })

  // 3) Načti všechny platby
  const payments = await prisma.payment.findMany({
    where: {
      lease_id: { in: leaseIds },
      payment_date: { not: null }
    },
    select: { amount: true, payment_date: true }
  })

  // pomocné proměnné
  const now = new Date()
  const curY = now.getFullYear()
  const curM = now.getMonth() + 1

  // 4) Součty
  const totalDue       = obligations.reduce((s, o) => s + o.total_due, 0)
  const totalPaid      = payments.reduce((s, p) => s + p.amount, 0)
  const paidThisMonth  = payments
    .filter(p => {
      const d = new Date(p.payment_date!)
      return d.getFullYear() === curY && d.getMonth()+1 === curM
    })
    .reduce((s, p) => s + p.amount, 0)
  const totalDebt      = obligations.reduce((s, o) => s + o.debt, 0)
  const debtThisMonth  = obligations
    .filter(o => o.year === curY && o.month === curM)
    .reduce((s, o) => s + o.debt, 0)

  return NextResponse.json({
    totalDue,
    totalPaid,
    paidThisMonth,
    totalDebt,
    debtThisMonth,
    owes: totalDebt > 0
  })
}

