// app/api/tenants/[id]/summary/route.ts

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type SummaryData = {
  paidThisMonth: number   // 📆 Zaplaceno tento měsíc
  rentThisMonth: number   // 💰 Nájemné tento měsíc
  monthDebt: number       // ⚠️ Dluh tento měsíc (jen pokud splatnost uplynula)
  totalDebt: number       // 📄 Celkový dluh (nezaplacené úhrady do dneška)
  totalPaid: number       // 📊 Celkem zaplaceno (všechny platby)
  owes: boolean           // true pokud je totalDebt > 0
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const tenantId = params.id

  // 1) Vytáhneme všechny smlouvy pro daného nájemníka
  const leases = await prisma.lease.findMany({
    where: { tenant_id: tenantId },
    select: { id: true },
  })
  const leaseIds = leases.map(l => l.id)
  if (leaseIds.length === 0) {
    // bez smluv není co počítat
    const empty: SummaryData = {
      paidThisMonth: 0,
      rentThisMonth: 0,
      monthDebt: 0,
      totalDebt: 0,
      totalPaid: 0,
      owes: false,
    }
    return NextResponse.json(empty)
  }

  // 2) Platby napříč všemi smlouvami
  const payments = await prisma.payment.findMany({
    where: { lease_id: { in: leaseIds } },
    select: { amount: true, payment_date: true },
  })

  // 3) Měsíční povinnosti (MonthlyObligation) pro všechny smlouvy
  const obligations = await prisma.monthlyObligation.findMany({
    where: { lease_id: { in: leaseIds } },
    select: { year: true, month: true, total_due: true, paid_amount: true, due_day: true },
  })

  // 4) Připravíme si dnešní datum a měsíční kontext
  const now = new Date()
  const currYear = now.getFullYear()
  const currMonth = now.getMonth() + 1
  const today = now.getDate()

  // 5) Spočteme úhrady
  let totalPaid = 0
  let paidThisMonth = 0
  for (const p of payments) {
    const amt = p.amount
    totalPaid += amt
    const d = new Date(p.payment_date || now)
    if (d.getFullYear() === currYear && d.getMonth() + 1 === currMonth) {
      paidThisMonth += amt
    }
  }

  // 6) Spočteme nájemné a dluhy z povinností
  let rentThisMonth = 0
  let monthDebt = 0
  let totalDebt = 0

  for (const o of obligations) {
    const { year, month, total_due, paid_amount, due_day } = o
    const unpaid = Math.max(0, total_due - paid_amount)

    // za všechny měsíce až do aktuálního (včetně) kumulujeme dluh
    if (year < currYear || (year === currYear && month <= currMonth)) {
      totalDebt += unpaid
    }

    // za tento měsíc: kolik mělo být, a případný dluh pokud už splatnost uplynula
    if (year === currYear && month === currMonth) {
      rentThisMonth += total_due
      if (due_day != null && today > due_day) {
        monthDebt = unpaid
      }
    }
  }

  const owes = totalDebt > 0

  const summary: SummaryData = {
    paidThisMonth,
    rentThisMonth,
    monthDebt,
    totalDebt,
    totalPaid,
    owes,
  }

  return NextResponse.json(summary)
}
