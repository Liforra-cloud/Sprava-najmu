// app/api/statement/new/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Body = {
  leaseId:     string
  year:        number
  month:       number
  chargeId?:   string
  overrideVal?: number
  note?:       string
}

export async function PATCH(req: NextRequest) {
  let body: Body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: 'Neplatné JSON tělo požadavku' },
      { status: 400 }
    )
  }

  const { leaseId, year, month, chargeId = '', overrideVal, note } = body

  if (!leaseId || typeof year !== 'number' || typeof month !== 'number') {
    return NextResponse.json(
      { error: 'leaseId, year a month jsou povinné' },
      { status: 400 }
    )
  }

  try {
    const id = `${leaseId}-${year}-${month}-${chargeId}`
    const entry = await prisma.statementEntry.upsert({
      where:  { id },
      create: {
        id,
        lease_id:     leaseId,
        year,
        month,
        charge_id:    chargeId,
        override_val: overrideVal ?? null,
        note:         note ?? null
      },
      update: {
        override_val: overrideVal ?? null,
        note:         note ?? null
      }
    })
    return NextResponse.json(entry)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
