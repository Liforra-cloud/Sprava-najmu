//app/api/leases/[id]/monthly-obligations/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createMonthlyObligation } from '@/lib/createMonthlyObligation'

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
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ error: 'Neznámá chyba' }, { status: 500 })
  }
}
