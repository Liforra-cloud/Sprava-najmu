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

  const period_from = new Date(`${from}-01`)
  const [y, m]      = to.split('-').map(Number)
  const period_to   = new Date(y, m, 0)

  try {
    const st = await prisma.statement.create({
      data: {
        unit_id:        unitId,
        lease_id:       null,
        period_from,
        period_to,
        title,
        annual_summary: annualSummary,
      }
    })
    return NextResponse.json(st)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
