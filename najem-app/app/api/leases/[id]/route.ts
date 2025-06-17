// najem-app/app/api/leases/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type CustomCharge = {
  name: string
  amount: number
  enabled: boolean
}
type ChargeFlags = {
  rent_amount?: boolean
  monthly_water?: boolean
  monthly_gas?: boolean
  monthly_electricity?: boolean
  monthly_services?: boolean
  repair_fund?: boolean
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
        occupancy_status: true,
        created_at: true,
        updated_at: true,
        tenant: { select: { full_name: true } },
        unit: { select: { identifier: true } },
        payments: {
          orderBy: { payment_date: 'desc' },
          select: {
            id: true,
            amount: true,
            payment_date: true,
            note: true,
            variable_symbol: true
          }
        }
      }
    })

    if (!lease) {
      return NextResponse.json({ error: 'Smlouva nenalezena' }, { status: 404 })
    }

    const customCharges: CustomCharge[] = Array.isArray(lease.custom_charges)
      ? lease.custom_charges
      : []

    const chargeFlags: ChargeFlags =
      lease.charge_flags && typeof lease.charge_flags === 'object'
        ? lease.charge_flags
        : {}

    const customTotal = customCharges.reduce(
      (sum, c) => (c.enabled ? sum + (c.amount || 0) : sum),
      0
    )

    const totalBillableRent =
      (chargeFlags.rent_amount ? Number(lease.rent_amount ?? 0) : 0) +
      (chargeFlags.monthly_water ? Number(lease.monthly_water ?? 0) : 0) +
      (chargeFlags.monthly_gas ? Number(lease.monthly_gas ?? 0) : 0) +
      (chargeFlags.monthly_electricity ? Number(lease.monthly_electricity ?? 0) : 0) +
      (chargeFlags.monthly_services ? Number(lease.monthly_services ?? 0) : 0) +
      (chargeFlags.repair_fund ? Number(lease.repair_fund ?? 0) : 0) +
      customTotal

    return NextResponse.json({
      ...lease,
      totalBillableRent
    })
  } catch (err) {
    console.error('API error loading lease:', err)
    return NextResponse.json({ error: 'Server error při načítání smlouvy' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()

    const lease = await prisma.lease.update({
      where: { id: params.id },
      data: {
        name: body.name,
        start_date: body.start_date ? new Date(body.start_date) : undefined,
        end_date: body.end_date ? new Date(body.end_date) : null,
        rent_amount: Number(body.rent_amount ?? 0),
        monthly_water: Number(body.monthly_water ?? 0),
        monthly_gas: Number(body.monthly_gas ?? 0),
        monthly_electricity: Number(body.monthly_electricity ?? 0),
        monthly_services: Number(body.monthly_services ?? 0),
        repair_fund: Number(body.repair_fund ?? 0),
        custom_fields: typeof body.custom_fields === 'object' ? body.custom_fields : {},
        custom_charges: Array.isArray(body.custom_charges) ? body.custom_charges : [],
        charge_flags: typeof body.charge_flags === 'object' ? body.charge_flags : {},
        occupancy_status: body.occupancy_status ?? undefined
      }
    })

    return NextResponse.json({ success: true, lease })
  } catch (error) {
    console.error('API error saving lease:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Chyba při ukládání smlouvy' },
      { status: 500 }
    )
  }
}
