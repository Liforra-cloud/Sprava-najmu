// app/api/statement/route.ts

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const unitId = searchParams.get('unitId')
  const from = searchParams.get('from') // formát YYYY-MM
  const to = searchParams.get('to')     // formát YYYY-MM

  if (!unitId || !from || !to) {
    return NextResponse.json({ error: 'unitId, from a to jsou povinné.' }, { status: 400 })
  }

  // Parsování období
  const [fromYear, fromMonth] = from.split('-').map(Number)
  const [toYear, toMonth] = to.split('-').map(Number)

  // Dotaz přes lease na unit_id
  const obligations = await prisma.monthlyObligation.findMany({
    where: {
      lease: { unit_id: unitId },
      OR: [
        { year: fromYear, month: { gte: fromMonth, lte: 12 } },
        { year: toYear, month: { lte: toMonth, gte: 1 } },
      ],
    },
    include: { lease: true },
    orderBy: [
      { year: 'asc' },
      { month: 'asc' },
    ],
  })

  return NextResponse.json(obligations)
}
