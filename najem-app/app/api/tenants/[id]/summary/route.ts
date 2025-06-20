// app/api/tenants/[id]/summary/route.ts
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type SummaryData = {
  paidThisMonth: number   // 📆 Zaplaceno tento měsíc
  rentThisMonth: number   // 💰 Nájemné tento měsíc
  monthDebt: number       // ⚠️ Dluh tento měsíc (jen pokud splatnost uplynula)
  totalDebt: number       // 📄 Celkový dluh (nezaplacené úhrady minulých měsíců + aktuální, pokud už po splatnosti)
  totalPaid: number       // 📊 Celkem zaplaceno (všechny platby)
  owes: boolean           // true pokud je totalDebt > 0
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const tenantId = params.id

  // 1) Všechny smlouvy daného nájemníka
  const leases = await prisma.lease.findMany({
    where: { tenant_id: tenantId },
    select: { id: true },
  })
  const leaseIds = leases.map(l => l.id)
  if (leaseIds.length === 0) {
    return NextResponse.json<SummaryData>({
      paidThisMonth: 0,
      rentThisMonth: 0,
      monthDebt: 0,
      totalDebt: 0,
      totalPaid: 0,
      owes: false,
    })
  }

  // 2) Všechny platby
  const payments = await prisma.payment.findMany({
    where: { lease_id: { in: leaseIds } },
    select: { amount: true, payment_date: true },
  })

  // 3) Všechny měsíční povinnosti
  const obligations = await prisma.monthlyObligation.findMany({
    where: { lease_id: { in: leaseIds } },
    select: {
      year: true,
      month: true,
      total_due: true,
      paid_amount: true,
      due_day: true,
    },
  })

  const now = new Date()
  const currYear = now.getFullYear()
  const currMonth = now.getMonth() + 1
  const today = now.getDate()

  // 4) Spočítáme platby
  let totalPaid = 0
  let paidThisMonth = 0
  for (const p of payments) {
    totalPaid += p.amount
    const pd = new Date(p.payment_date || now)
    if (pd.getFullYear() === currYear && pd.getMonth() + 1 === currMonth) {
      paidThisMonth += p.amount
    }
  }

  // 5) Spočítáme nájemné a dluhy
  let rentThisMonth = 0
  let monthDebt = 0
  let totalDebt = 0

  for (const o of obligations) {
    const unpaid = Math.max(0, o.total_due - o.paid_amount)

    // minulý měsíc (nebo starší) => vždy do totalDebt
    if (o.year < currYear || (o.year === currYear && o.month < currMonth)) {
      totalDebt += unpaid
    }

    // tento měsíc
    if (o.year === currYear && o.month === currMonth) {
      rentThisMonth += o.total_due

      // pokud už jsme po dni splatnosti, přičteme i k celkovému dluhu
      if (o.due_day != null && today > o.due_day) {
        totalDebt += unpaid
        monthDebt = unpaid
      }
    }
  }

  const owes = totalDebt > 0

  return NextResponse.json<SummaryData>({
    paidThisMonth,
    rentThisMonth,
    monthDebt,
    totalDebt,
    totalPaid,
    owes,
  })
}
