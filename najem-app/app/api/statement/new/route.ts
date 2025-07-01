// app/api/statement/new/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PATCH /api/statement/new
// Ukládá dílčí override záznam pro jednotlivé měsíční položky.
export async function PATCH(req: NextRequest) {
  // Tělo požadavku
  interface OverrideRequest {
    leaseId:     string
    year:        number
    month:       number
    chargeId:    string
    overrideVal: number | null
  }

  const { leaseId, year, month, chargeId, overrideVal } =
    (await req.json()) as OverrideRequest

  if (!leaseId) {
    return NextResponse.json({ error: 'leaseId je povinné' }, { status: 400 })
  }

  // Najdi lease
  let lease = await prisma.lease.findUnique({ where: { id: leaseId } })
  if (!lease) {
    lease = await prisma.lease.findFirst({
      where: {
        unit_id: leaseId,
        start_date: { lte: new Date(`${year}-${String(month).padStart(2,'0')}-01`) },
        OR: [
          { end_date: null },
          { end_date: { gte: new Date(`${year}-${String(month).padStart(2,'0')}-01`) } }
        ]
      }
    })
  }
  if (!lease) {
    return NextResponse.json({ error: 'Lease pro dané ID nebyl nalezen' }, { status: 404 })
  }

  // Zkontroluj existující override
  const existing = await prisma.statementEntry.findFirst({
    where: {
      lease_id:  lease.id,
      year,
      month,
      charge_id: chargeId
    }
  })

  let entry
  if (existing) {
    // Aktualizuj override_val
    entry = await prisma.statementEntry.update({
      where: { id: existing.id },
      data: { override_val: overrideVal }
    })
  } else {
    // Vytvoř nový override záznam (annual_summary vynecháme => NULL)
    entry = await prisma.statementEntry.create({
      data: {
        lease_id:     lease.id,
        unit_id:      lease.unit_id,
        year,
        month,
        charge_id:    chargeId,
        override_val: overrideVal,
        note:         null,
        title:        '',  // prázdný title znamená dílčí override
        period_from:  new Date(`${year}-${String(month).padStart(2,'0')}-01`),
        period_to:    new Date(`${year}-${String(month).padStart(2,'0')}-01`),
        data:         {}   // JSON sloupec je NOT NULL
        // annual_summary NEUVÁDĚJTE, zůstane NULL
      }
    })
  }

  return NextResponse.json(entry)
}
