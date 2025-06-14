// najem-app/app/api/leases/route.ts
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const custom_charges: CustomCharge[] = Array.isArray(body.custom_charges)
      ? body.custom_charges.map((item: CustomCharge) => ({
          name: String(item.name),
          amount: Number(item.amount ?? 0),
          enabled: !!item.enabled,
        }))
      : []

    const defaultFlags: ChargeFlags = {
      rent_amount: true,
      monthly_water: true,
      monthly_gas: true,
      monthly_electricity: true,
      monthly_services: true,
      repair_fund: true,
    }
    const charge_flags: ChargeFlags = {
      ...defaultFlags,
      ...(body.charge_flags || {}),
    }

    const lease = await prisma.lease.create({
      data: {
        name: body.name,
        unit_id: body.unit_id,
        tenant_id: body.tenant_id,
        start_date: new Date(body.start_date),
        end_date: body.end_date ? new Date(body.end_date) : null,
        rent_amount: Number(body.rent_amount),
        monthly_water: Number(body.monthly_water ?? 0),
        monthly_gas: Number(body.monthly_gas ?? 0),
        monthly_electricity: Number(body.monthly_electricity ?? 0),
        monthly_services: Number(body.monthly_services ?? 0),
        repair_fund: Number(body.repair_fund ?? 0),
        charge_flags: charge_flags,
        custom_charges: custom_charges,
        total_billable_rent: 0, // nebo vypočítej pokud chceš
      }
    })

    return NextResponse.json({ id: lease.id }, { status: 201 })
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ error: 'Chyba serveru' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const leases = await prisma.lease.findMany({
      include: {
        tenant: { select: { full_name: true } },
        unit: { select: { identifier: true } }
      },
      orderBy: { start_date: 'desc' }
    })

    const leasesWithTotal = leases.map(lease => {
      const customCharges = (lease.custom_charges ?? []) as CustomCharge[]
      const chargeFlags: ChargeFlags = lease.charge_flags ?? {}

      const customTotal = customCharges.reduce((sum, item) =>
        item.enabled ? sum + (item.amount || 0) : sum, 0
      )

      const totalBillableRent =
        (chargeFlags.rent_amount ? Number(lease.rent_amount ?? 0) : 0) +
        (chargeFlags.monthly_water ? Number(lease.monthly_water ?? 0) : 0) +
        (chargeFlags.monthly_gas ? Number(lease.monthly_gas ?? 0) : 0) +
        (chargeFlags.monthly_electricity ? Number(lease.monthly_electricity ?? 0) : 0) +
        (chargeFlags.monthly_services ? Number(lease.monthly_services ?? 0) : 0) +
        (chargeFlags.repair_fund ? Number(lease.repair_fund ?? 0) : 0) +
        customTotal

      return {
        ...lease,
        totalBillableRent
      }
    })

    return NextResponse.json(leasesWithTotal)
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ error: 'Chyba serveru' }, { status: 500 })
  }
}

