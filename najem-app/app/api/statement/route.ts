// app/api/statement/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Pomocná funkce na převod YYYY-MM na {rok, měsíc}
function parseYm(ym: string) {
  const [year, month] = ym.split('-').map(Number)
  return { year, month }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const unitId = url.searchParams.get('unitId')
  const from = url.searchParams.get('from')    // '2024-01'
  const to = url.searchParams.get('to')        // '2024-12'

  if (!unitId || !from || !to) {
    return NextResponse.json({ error: 'unitId, from, to jsou povinné parametry' }, { status: 400 })
  }

  const fromObj = parseYm(from)
  const toObj = parseYm(to)

  // Najdi všechny leases pro jednotku v daném období
  const leases = await prisma.lease.findMany({
    where: { unit_id: unitId }
  })
  const leaseIds = leases.map(l => l.id)

  // Najdi všechny monthly_obligation pro dané leases a období
  const obligations = await prisma.monthlyObligation.findMany({
    where: {
      lease_id: { in: leaseIds },
      OR: [
        {
          year: fromObj.year,
          month: { gte: fromObj.month }
        },
        {
          year: toObj.year,
          month: { lte: toObj.month }
        },
        {
          year: { gt: fromObj.year, lt: toObj.year }
        }
      ]
    }
  })

  // Funkce na součet zaplacených záloh (paid_amount) pouze za měsíce s aktivním flagem (název flagu např. 'rent_amount')
  const sumPaid = (flag: string) =>
    obligations
      .filter(o => {
        const flags = o.charge_flags as Record<string, boolean> | null;
        return flags && flags[flag];
      })
      .reduce((sum, o) => sum + (o.paid_amount || 0), 0);

  // Funkce na pole měsíců, kdy byl daný flag aktivní
  const monthsWithFlag = (flag: string) =>
    obligations
      .filter(o => {
        const flags = o.charge_flags as Record<string, boolean> | null;
        return flags && flags[flag];
      })
      .map(o => o.month);

  // Sestav položky pro StatementTable
  const advanceItems = [
    {
      id: 'rent',
      name: 'Nájem',
      totalAdvance: sumPaid('rent_amount'),
      unit: 'Kč',
      chargeableMonths: monthsWithFlag('rent_amount'),
    },
    {
      id: 'electricity',
      name: 'Elektřina',
      totalAdvance: sumPaid('monthly_electricity'),
      unit: 'Kč',
      chargeableMonths: monthsWithFlag('monthly_electricity'),
    },
    {
      id: 'water',
      name: 'Voda',
      totalAdvance: sumPaid('monthly_water'),
      unit: 'Kč',
      chargeableMonths: monthsWithFlag('monthly_water'),
    },
    // ... případně další položky
  ]

  return NextResponse.json({
    items: advanceItems,
    allCharges: advanceItems,
  })
}
