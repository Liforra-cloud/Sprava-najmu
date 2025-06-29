// app/api/statements/new/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Body = {
  leaseId:     string
  year:        number
  month:       number
  chargeId:    string
  overrideVal: number | null
}

export async function PATCH(req: NextRequest) {
  const { leaseId, year, month, chargeId, overrideVal } = await req.json() as Body
  if (!leaseId) {
    return NextResponse.json({ error:'leaseId je povinné' }, { status:400 })
  }
  const id = `${leaseId}-${year}-${month}-${chargeId}`
  const entry = await prisma.statementEntry.upsert({
    where:  { id },
    create: {
      id,
      lease_id:    leaseId,
      year, month,
      charge_id:   chargeId,
      override_val: overrideVal,
      note:         null
    },
    update: {
      override_val: overrideVal
    }
  })
  return NextResponse.json(entry)
}
