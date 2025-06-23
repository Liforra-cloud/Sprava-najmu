// app/api/statement/route.ts


import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Všechny typy poplatků, které můžeš účtovat (podle modelu)
const CHARGE_TYPES = [
  { key: 'rent', name: 'Nájemné' },
  { key: 'water', name: 'Voda' },
  { key: 'gas', name: 'Plyn' },
  { key: 'electricity', name: 'Elektřina' },
  { key: 'services', name: 'Služby' },
  { key: 'repair_fund', name: 'Fond oprav' },
  // Přidej vlastní custom_charges, pokud máš v DB
]

export async function GET(req: NextRequest) {
  const unitId = req.nextUrl.searchParams.get('unitId')
  const from = req.nextUrl.searchParams.get('from') // '2025-01'
  const to = req.nextUrl.searchParams.get('to')

  if (!unitId || !from || !to) {
    return NextResponse.json({ error: 'Chybí parametr' }, { status: 400 })
  }

  // Najdi všechny lease pro jednotku (unit)
  const leases = await prisma.lease.findMany({
    where: { unit_id: unitId },
    select: { id: true }
  })

  const leaseIds = leases.map(l => l.id)
  if (!leaseIds.length) {
    return NextResponse.json({ items: [], allCharges: [] })
  }

  // Parsování měsíců
  const [fromYear, fromMonth] = from.split('-').map(Number)
  const [toYear, toMonth] = to.split('-').map(Number)

  // Všechny obligations pro lease + období
  const obligations = await prisma.monthlyObligation.findMany({
    where: {
      lease_id: { in: leaseIds },
      OR: [
        { year: fromYear, month: { gte: fromMonth } },
        { year: toYear, month: { lte: toMonth } },
        { year: { gt: fromYear, lt: toYear } },
      ]
    },
    orderBy: [{ year: 'asc' }, { month: 'asc' }]
  })

  // Udělej tabulku pouze účtovaných poplatků (kde je něco účtováno)
  const chargedObligations = obligations.flatMap(ob => {
    return CHARGE_TYPES
      .filter(ct => ob[ct.key] && ob[ct.key] > 0)
      .map(ct => ({
        id: ob.id + '-' + ct.key,
        month: `${ob.year}-${ob.month.toString().padStart(2, '0')}`,
        type: ct.key,
        label: ct.name,
        amount: ob[ct.key],
        obligationId: ob.id,
        leaseId: ob.lease_id,
      }))
  })

  // Tabulka všech poplatků, i těch nezaúčtovaných (aby šly přidat)
  let allCharges: any[] = []
  for (const ob of obligations) {
    for (const ct of CHARGE_TYPES) {
      allCharges.push({
        id: ob.id + '-' + ct.key,
        month: `${ob.year}-${ob.month.toString().padStart(2, '0')}`,
        type: ct.key,
        label: ct.name,
        amount: ob[ct.key] || 0,
        obligationId: ob.id,
        leaseId: ob.lease_id,
      })
    }
  }

  return NextResponse.json({ items: chargedObligations, allCharges })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  // Očekává: { obligationId, type, amount }
  const { obligationId, type, amount } = body
  if (!obligationId || !type) {
    return NextResponse.json({ error: 'Neplatná data' }, { status: 400 })
  }

  // Update MonthlyObligation: např. { rent: 10000 }
  const updated = await prisma.monthlyObligation.update({
    where: { id: obligationId },
    data: { [type]: amount }
  })

  return NextResponse.json({ ok: true, updated })
}
