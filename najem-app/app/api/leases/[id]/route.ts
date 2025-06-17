// najem-app/app/api/leases/[id]/route.ts

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { InputJsonValue } from '@prisma/client/runtime/library'

type CustomCharge = {
  name: string
  amount: number
  enabled: boolean
}

function parseNumber(value: unknown): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') return parseFloat(value)
  return 0
}

export async function GET(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lease = await prisma.lease.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        unit_id: true,
        tenant_id: true,
        start_date: true,
        end_date: true,
        due_day: true,
        rent_amount: true,
        monthly_water: true,
        monthly_gas: true,
        monthly_electricity: true,
        monthly_services: true,
        repair_fund: true,
        custom_fields: true,
        total_billable_rent: true,
        custom_charges: true,
        charge_flags: true,
        created_at: true,
        updated_at: true,
        tenant: { select: { full_name: true } },
        unit: { select: { identifier: true, occupancy_status: true } },
        payments: {
          orderBy: { payment_date: 'desc' },
          select: {
            id: true,
            amount: true,
            payment_date: true,
            note: true,
            variable_symbol: true,
          },
        },
      },
    })

    if (!lease) {
      return NextResponse.json({ error: 'Smlouva nenalezena' }, { status: 404 })
    }

    const flags = lease.charge_flags as Record<string, boolean> ?? {}

    const customCharges = Array.isArray(lease.custom_charges)
      ? lease.custom_charges as CustomCharge[]
      : []

    const customTotal = customCharges.reduce(
      (sum, c) => (c?.enabled ? sum + parseNumber(c.amount) : sum),
      0
    )

    const totalBillableRent =
      (flags.rent_amount ? parseNumber(lease.rent_amount) : 0) +
      (flags.monthly_water ? parseNumber(lease.monthly_water) : 0) +
      (flags.monthly_gas ? parseNumber(lease.monthly_gas) : 0) +
      (flags.monthly_electricity ? parseNumber(lease.monthly_electricity) : 0) +
      (flags.monthly_services ? parseNumber(lease.monthly_services) : 0) +
      (flags.repair_fund ? parseNumber(lease.repair_fund) : 0) +
      customTotal

    return NextResponse.json({
      ...lease,
      totalBillableRent,
    })
  } catch (err) {
    console.error('API error loading lease:', err)
    return NextResponse.json(
      { error: 'Server error při načítání smlouvy' },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()

    const updatedLease = await prisma.lease.update({
      where: { id: params.id },
      data: {
        name: body.name,
        unit_id: body.unit_id,
        tenant_id: body.tenant_id,
        start_date: body.start_date ? new Date(body.start_date) : undefined,
        end_date: body.end_date ? new Date(body.end_date) : null,
        due_day: body.due_day ? parseInt(body.due_day) : 1,
        rent_amount: Number(body.rent_amount ?? 0),
        monthly_water: Number(body.monthly_water ?? 0),
        monthly_gas: Number(body.monthly_gas ?? 0),
        monthly_electricity: Number(body.monthly_electricity ?? 0),
        monthly_services: Number(body.monthly_services ?? 0),
        repair_fund: Number(body.repair_fund ?? 0),
        custom_fields: body.custom_fields as InputJsonValue,
        custom_charges: body.custom_charges as InputJsonValue,
        charge_flags: body.charge_flags as InputJsonValue,
      },
    })

    // ✅ Aktualizuj měsíční závazky
    const obligations = await prisma.monthlyObligation.findMany({
      where: { lease_id: params.id },
    })

    for (const ob of obligations) {
      const chargeFlags = updatedLease.charge_flags as Record<string, boolean>
      const customCharges = Array.isArray(updatedLease.custom_charges)
        ? updatedLease.custom_charges as CustomCharge[]
        : []

      const rent = chargeFlags.rent_amount ? updatedLease.rent_amount : 0
      const water = chargeFlags.monthly_water ? updatedLease.monthly_water : 0
      const gas = chargeFlags.monthly_gas ? updatedLease.monthly_gas : 0
      const electricity = chargeFlags.monthly_electricity ? updatedLease.monthly_electricity : 0
      const services = chargeFlags.monthly_services ? updatedLease.monthly_services : 0
      const repairs = chargeFlags.repair_fund ? updatedLease.repair_fund : 0
      const custom = customCharges.reduce(
        (sum, charge) => (charge.enabled ? sum + Number(charge.amount ?? 0) : sum),
        0
      )

      const total = rent + water + gas + electricity + services + repairs + custom

      await prisma.monthlyObligation.update({
        where: { id: ob.id },
        data: {
          rent,
          water,
          gas,
          electricity,
          services,
          repair_fund: repairs,
          total_due: total,
          debt: total,
          charge_flags: chargeFlags,
          custom_charges: customCharges,
        },
      })
    }

    return NextResponse.json({ success: true, lease: updatedLease })
  } catch (error) {
    console.error('API error saving lease:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Chyba při ukládání smlouvy' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.payment.deleteMany({
      where: { lease_id: params.id }
    })

    await prisma.lease.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('API error deleting lease:', err)
    return NextResponse.json(
      { error: 'Chyba při mazání smlouvy' },
      { status: 500 }
    )
  }
}

