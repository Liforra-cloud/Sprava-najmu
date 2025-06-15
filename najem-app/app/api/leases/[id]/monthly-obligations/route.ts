// app/api/leases/[id]/monthly-obligations/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createMonthlyObligation } from '@/lib/createMonthlyObligation'

// GET – načti všechny měsíční povinnosti pro danou smlouvu včetně plateb
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const obligations = await prisma.monthlyObligation.findMany({
      where: { lease_id: params.id },
      orderBy: [{ year: 'asc' }, { month: 'asc' }],
      include: { payments: true }, // TADY přidáno!
    })
    return NextResponse.json(obligations)
  } catch {
    return NextResponse.json(
      { error: 'Chyba při načítání měsíčních povinností' },
      { status: 500 }
    )
  }
}

// POST – vytvoř jeden rozpis pro zvolený měsíc
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { year, month } = await req.json()
  if (!year || !month) {
    return NextResponse.json({ error: 'Chybí rok nebo měsíc' }, { status: 400 })
  }

  try {
    const obligation = await createMonthlyObligation({
      leaseId: params.id,
      year: Number(year),
      month: Number(month),
    })
    return NextResponse.json({ success: true, obligation })
  } catch {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ error: 'Neznámá chyba' }, { status: 500 })
  }
}
