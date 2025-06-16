// app/api/monthly-obligations/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Typ pro tělo requestu (můžeš rozšířit dle potřeby)
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
  custom_charges?: unknown // pokud máš typ CustomCharge, použij
  charge_flags?: Record<string, boolean>
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

    // Sestav aktualizační objekt podle příchozího datového typu
    const updateData: MonthlyObligationUpdate = {}

    if ('paid_amount' in data) updateData.paid_amount = data.paid_amount
    if ('rent' in data) updateData.rent = data.rent
    if ('water' in data) updateData.water = data.water
    if ('gas' in data) updateData.gas = data.gas
    if ('electricity' in data) updateData.electricity = data.electricity
    if ('services' in data) updateData.services = data.services
    if ('repair_fund' in data) updateData.repair_fund = data.repair_fund
    if ('debt' in data) updateData.debt = data.debt
    if ('total_due' in data) updateData.total_due = data.total_due
    if ('note' in data) updateData.note = data.note

    // Custom charges a charge_flags jsou JSON pole
    if ('custom_charges' in data) updateData.custom_charges = data.custom_charges
    if ('charge_flags' in data) updateData.charge_flags = data.charge_flags

    const updated = await prisma.monthlyObligation.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json({ error: 'Chyba při aktualizaci', detail: error instanceof Error ? error.message : undefined }, { status: 500 })
  }
}
