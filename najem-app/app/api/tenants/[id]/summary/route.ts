// app/api/tenants/[id]/summary/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const tenantId = params.id
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  // 1) Všechny měsíční povinnosti do dneška
  const obligationsToDate = await prisma.monthlyObligation.findMany({
    where: {
      lease: { tenant_id: tenantId },
      OR: [
        { year: { lt: currentYear } },
        { year: currentYear, month: { lte: currentMonth } },
      ],
    },
    select: { total_due: true },
  })
  const totalDue = obligationsToDate.reduce((sum, o) => sum + o.total_due, 0)

  // 2) Povinnosti právě za tento měsíc
  const obligationsThisMonth = await prisma.monthlyObligation.findMany({
    where: {
      lease: { tenant_id: tenantId },
      year: currentYear,
      month: currentMonth,
    },
    select: { total_due: true },
  })
  const monthRent = obligationsThisMonth.reduce((sum, o) => sum + o.total_due, 0)

  // 3) Všechny platby do dneška
  const paymentsToDate = await prisma.payment.findMany({
    where: {
      lease: { tenant_id: tenantId },
      payment_date: { lte: now },
    },
    select: { amount: true, payment_date: true },
  })
  const totalPaid = paymentsToDate.reduce((sum, p) => sum + p.amount, 0)

  // 4) Zaplaceno tento měsíc
  const paidThisMonth = paymentsToDate
    .filter(p => {
      const d = p.payment_date!
      return d.getFullYear() === currentYear && d.getMonth() + 1 === currentMonth
    })
    .reduce((sum, p) => sum + p.amount, 0)

  // 5) Výpočet dluhů
  const totalDebt = totalDue - totalPaid
  const monthDebt = monthRent - paidThisMonth

  return NextResponse.json({
    totalDue,
    totalPaid,
    paidThisMonth,
    totalDebt,
    monthDebt,
    owes: totalDebt > 0,
  })
}
