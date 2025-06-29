// app/api/statement/new/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest) {
  const { leaseId, year, month, chargeId, overrideVal } = await req.json()
  if (!leaseId) {
    return NextResponse.json({ error: 'leaseId je povinné' }, { status: 400 })
  }

  // Zjistit lease podle leaseId nebo unitId
  let lease = await prisma.lease.findUnique({ where: { id: leaseId } })
  if (!lease) {
    // pokud leaseId neexistuje, pokusit se najít nájemní smlouvu podle unitId
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
    return NextResponse.json({ error: 'Lease pro dané ID nebyl nalezen' }, { status: 400 })
  }

  // Najít existující záznam override (podle lease_id, year, month, charge_id)
  const existing = await prisma.statementEntry.findFirst({
    where: { lease_id: lease.id, year, month, charge_id: chargeId }
  })

  let entry
  if (existing) {
    // aktualizovat existující override záznam
    entry = await prisma.statementEntry.update({
      where: { id: existing.id },
      data: { override_val: overrideVal }
    })
  } else {
    // vytvořit nový override záznam
    entry = await prisma.statementEntry.create({
      data: {
        lease_id: lease.id,
        unit_id: lease.unit_id,
        year,
        month,
        charge_id: chargeId,
        override_val: overrideVal,
        note: null,
        title: '',  // titulek zůstává prázdný (není to hlavní záznam)
        period_from: new Date(`${year}-${String(month).padStart(2,'0')}-01`),
        period_to: new Date(`${year}-${String(month).padStart(2,'0')}-01`),
        data: {},            // prázdný JSON (nutné vyplnit, protože sloupec je NOT NULL)
        annual_summary: null // u override záznamu není souhrn
      }
    })
  }

  return NextResponse.json(entry)
}
