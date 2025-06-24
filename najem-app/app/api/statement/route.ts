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

  // Povolené klíče pro sumBy
  type AllowedKey = 'rent' | 'electricity' | 'water' | 'gas' | 'services' | 'repair_fund';

  const sumBy = (key: AllowedKey) =>
    obligations.reduce((sum, o) => sum + ((o[key] as number) || 0), 0);

  // Výstupní data pro StatementTable
  const advanceItems = [
  {
    id: 'rent',
    name: 'Nájem',
    totalAdvance: sumBy('rent'),
    paid: obligations.reduce((sum, o) => {
      const flags = o.charge_flags as Record<string, boolean> | null;
      return sum + ((flags && flags.rent_amount ? o.paid_amount : 0) || 0);
    }, 0),
    unit: 'Kč',
    chargeableMonths: obligations
      .filter(o => {
        const flags = o.charge_flags as Record<string, boolean> | null;
        return flags && flags.rent_amount;
      })
      .map(o => o.month),
  },
    {
      id: 'electricity',
      name: 'Elektřina',
      totalAdvance: sumBy('electricity'),
      paid: obligations.reduce((sum, o) => {
        const flags = o.charge_flags as Record<string, boolean> | null;
        return sum + ((flags && flags.monthly_electricity ? o.paid_amount : 0) || 0);
      }, 0),
      unit: 'Kč'
    },
    {
      id: 'water',
      name: 'Voda',
      totalAdvance: sumBy('water'),
      paid: obligations.reduce((sum, o) => {
        const flags = o.charge_flags as Record<string, boolean> | null;
        return sum + ((flags && flags.monthly_water ? o.paid_amount : 0) || 0);
      }, 0),
      unit: 'Kč'
    },
    // ... další položky dle potřeby
  ]

  return NextResponse.json({
    items: advanceItems,
    allCharges: advanceItems,
  })
}
