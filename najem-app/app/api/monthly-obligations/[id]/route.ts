// app/api/monthly-obligations/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

type MonthlyObligationUpdate = {
  paid_amount?: number
  rent?: number
  water?: number
  gas?: number
  electricity?: number
  services?: number
  repair_fund?: number
  debt?: number
  total_due?: number
  note?: string
  // TADY! Typuj custom_charges a charge_flags jako Prisma.InputJsonValue
  custom_charges?: Prisma.InputJsonValue
  charge_flags?: Prisma.InputJsonValue
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const mo = await prisma.monthlyObligation.findUnique({
      where: { id: params.id }
    })
    return NextResponse.json(mo)
  } catch (error) {
    return NextResponse.json({ error: 'Chyba při načítání', detail: error instanceof Error ? error.message : undefined }, { status: 500 })
  }
}

// PUT – úprava jednoho měsíčního rozpisu (účtovat, částky, custom_charges atd.)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data: MonthlyObligationUpdate = await req.json()

    // Přímý spread je už možný, typ už je 100% kompatibilní s Prisma
    const updated = await prisma.monthlyObligation.update({
      where: { id: params.id },
      data: data,
    })

    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json({ error: 'Chyba při aktualizaci', detail: error instanceof Error ? error.message : undefined }, { status: 500 })
  }
}
