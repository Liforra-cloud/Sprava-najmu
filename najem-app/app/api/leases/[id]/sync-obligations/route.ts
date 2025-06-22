// app/api/leases/[id]/sync-obligations/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createMonthlyObligation } from '@/lib/createMonthlyObligation'

// Pomocná funkce: všechny měsíce mezi start a end (YYYY-MM-DD)
function monthsInPeriod(start: string, end?: string): { year: number; month: number }[] {
  const result = []
  const from = new Date(start)
  const to = end ? new Date(end) : new Date()
  let y = from.getFullYear()
  let m = from.getMonth() + 1

  while (y < to.getFullYear() || (y === to.getFullYear() && m <= to.getMonth() + 1)) {
    result.push({ year: y, month: m })
    m += 1
    if (m > 12) {
      m = 1
      y += 1
    }
  }
  return result
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lease = await prisma.lease.findUnique({ where: { id: params.id } })
    if (!lease) return NextResponse.json({ error: 'Smlouva nenalezena' }, { status: 404 })

    // Najdi všechny existující obligations k lease
    const existing = await prisma.monthlyObligation.findMany({
      where: { lease_id: params.id }
    })

    // Vypočítej požadované měsíce dle lease start/end
    const months = monthsInPeriod(lease.start_date, lease.end_date)
    const wanted = new Set(months.map(m => `${m.year}-${m.month}`))
    const existingSet = new Set(existing.map(m => `${m.year}-${m.month}`))

    // Přidej chybějící měsíce
    for (const { year, month } of months) {
      if (!existingSet.has(`${year}-${month}`)) {
        await createMonthlyObligation({ leaseId: lease.id, year, month })
      }
    }
    // Smaž měsíce, které už do období nepatří
    for (const ob of existing) {
      if (!wanted.has(`${ob.year}-${ob.month}`)) {
        await prisma.monthlyObligation.delete({ where: { id: ob.id } })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Chyba při synchronizaci závazků:', error)
    return NextResponse.json({ error: 'Chyba serveru' }, { status: 500 })
  }
}
