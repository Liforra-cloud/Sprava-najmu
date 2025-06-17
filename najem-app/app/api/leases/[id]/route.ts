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
      include: {
        tenant: true, // Zahrne celý objekt nájemníka
        unit: true,   // Zahrne celou jednotku
        payments: {
          orderBy: { payment_date: 'desc' }
        }
      }
    })

    if (!lease) {
      return NextResponse.json({ error: 'Smlouva nenalezena' }, { status: 404 })
    }

    const customCharges: CustomCharge[] = Array.isArray(lease.custom_charges)
      ? lease.custom_charges as CustomCharge[]
      : []

    const chargeFlags: ChargeFlags = lease.charge_flags &&
      typeof lease.charge_flags === 'object' &&
      !Array.isArray(lease.charge_flags)
      ? lease.charge_flags as ChargeFlags
      : {}

    const customTotal = customCharges.reduce(
      (sum, field) => (field.enabled ? sum + (field.amount || 0) : sum),
      0
    )

    const totalBillableRent =
      (chargeFlags.rent_amount ? Number(lease.rent_amount || 0) : 0) +
      (chargeFlags.monthly_water ? Number(lease.monthly_water || 0) : 0) +
      (chargeFlags.monthly_gas ? Number(lease.monthly_gas || 0) : 0) +
      (chargeFlags.monthly_electricity ? Number(lease.monthly_electricity || 0) : 0) +
      (chargeFlags.monthly_services ? Number(lease.monthly_services || 0) : 0) +
      (chargeFlags.repair_fund ? Number(lease.repair_fund || 0) : 0) +
      customTotal

    return NextResponse.json({
      ...lease,
      totalBillableRent
    })
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ error: 'Chyba serveru' }, { status: 500 })
  }
}

