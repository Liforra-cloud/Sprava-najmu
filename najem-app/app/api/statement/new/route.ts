import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Body = {
  leaseId: string
  year: number
  month: number
  chargeId?: string
  overrideVal?: number
  note?: string
}

export async function PATCH(req: NextRequest) {
  const { leaseId, year, month, chargeId, overrideVal, note } = await req.json() as Body
  if (!leaseId || !year || !month) {
    return NextResponse.json({ error: 'leaseId, year, month jsou povinné' }, { status: 400 })
  }

  // upsert: pokud existuje, aktualizuj; jinak vytvoř
  const entry = await prisma.statementEntry.upsert({
    where: {
      // musíš mít v schema unikátní klíč na (lease_id, year, month, charge_id | note)
      id: `${leaseId}-${year}-${month}-${chargeId ?? 'note'}`
    },
    create: {
      id: `${leaseId}-${year}-${month}-${chargeId ?? 'note'}`,
      lease_id: leaseId, year, month,
      charge_id: chargeId ?? '',
      override_val: overrideVal,
      note
    },
    update: {
      override_val: overrideVal,
      note
    }
  })

  return NextResponse.json(entry)
}
