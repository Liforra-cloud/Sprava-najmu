// app/api/statements/new/route.ts

// app/api/statements/new/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const { propertyId, unitId, title, from, to } = await req.json()

  if (!unitId || !title || !from || !to) {
    return NextResponse.json(
      { error: 'unitId, title, from a to jsou povinné' },
      { status: 400 }
    )
  }

  const entry = await prisma.statementEntry.create({
    data: {
      lease_id:  unitId,
      charge_id: '',        // značí hlavní záznam
      year:      Number(from.split('-')[0]),
      month:     Number(from.split('-')[1]),
      note:      JSON.stringify({ propertyId, title, from, to })
    }
  })

  return NextResponse.json(entry)
}
