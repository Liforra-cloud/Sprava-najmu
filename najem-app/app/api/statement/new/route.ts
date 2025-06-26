// app/api/statements/new/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Body = {
  unitId:        string
  title:         string
  from:          string // "YYYY-MM"
  to:            string // "YYYY-MM"
  annualSummary: Record<string, {
    total:      number
    actual:     number
    difference: number
  }>
}

export async function POST(req: NextRequest) {
  let body: Body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Neplatné JSON tělo' }, { status: 400 })
  }

  const { unitId, title, from, to, annualSummary } = body
  if (!unitId || !title || !from || !to) {
    return NextResponse.json(
      { error: 'unitId, title, from a to jsou povinné' },
      { status: 400 }
    )
  }

  // konvertujeme YYYY-MM na datum od / do
  const period_from = new Date(`${from}-01`)
  const [year, month] = to.split('-').map(Number)
  const period_to   = new Date(year, month, 0)

  try {
    // místo `prisma.statement` použijeme `prisma.statementEntry`
    const st = await prisma.statementEntry.create({
      data: {
        id:            `${unitId}-${from}-${to}`, // nebo prostě nechat uuid()
        lease_id:      unitId,                    // či null, jak potřebujete
        year:          period_from.getFullYear(),
        month:         period_from.getMonth() + 1,
        charge_id:     '',                         // prázdné pro metadata
        override_val:  null,
        note:          JSON.stringify({           
                         title,
                         period_from,
                         period_to,
                         annualSummary
                       }),
      }
    })
    return NextResponse.json(st)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
