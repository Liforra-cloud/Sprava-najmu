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
    // Explicitně vyber pouze ta pole, která víme, že existují
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
        created_at: true,
        updated_at: true,
        tenant: { select: { full_name: true } },
        unit: { select: { identifier: true } },
        payments: { orderBy: { payment_date: 'desc' }, select: {
          id: true, amount: true, payment_date: true, note: true, variable_symbol: true
        }},
      }
    })

    if (!lease) {
      return NextResponse.json({ error: 'Smlouva nenalezena' }, { status: 404 })
    }

    // Bezpečně čteme JSON pole
    const customCharges: CustomCharge[] = Array.isArray(lease.custom_charges)
      ? lease.custom_charges as CustomCharge[]
      : []

    const chargeFlags: ChargeFlags = lease.charge_flags && typeof lease.charge_flags === 'object' && !Array.isArray(lease.charge_flags)
      ? lease.charge_flags as ChargeFlags
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

