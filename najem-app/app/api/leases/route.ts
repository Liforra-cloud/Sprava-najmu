// najem-app/app/api/leases/route.ts

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createMonthlyObligation } from '@/lib/createMonthlyObligation'

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
      ? body.custom_charges.map((item: unknown) => {
          if (
            typeof item === 'object' &&
            item !== null &&
            'name' in item &&
            'amount' in item &&
            'enabled' in item
          ) {
            return {
              name: String((item as any).name),
              amount: Number((item as any).amount ?? 0),
              enabled: Boolean((item as any).enabled),
            }
          }
          return { name: '', amount: 0, enabled: false }
        })
      : []

    const defaultFlags: ChargeFlags = {
      rent_amount: Boolean(body.rent_amount),
      monthly_water: Boolean(body.monthly_water),
      monthly_gas: Boolean(body.monthly_gas),
      monthly_electricity: Boolean(body.monthly_electricity),
      monthly_services: Boolean(body.monthly_services),
      repair_fund: Boolean(body.repair_fund),
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
        rent_amount: Number(body.rent_amount ?? 0),
        monthly_water: Number(body.monthly_water ?? 0),
        monthly_gas: Number(body.monthly_gas ?? 0),
        monthly_electricity: Number(body.monthly_electricity ?? 0),
        monthly_services: Number(body.monthly_services ?? 0),
        repair_fund: Number(body.repair_fund ?? 0),
        charge_flags,
        custom_charges,
        custom_fields:
          typeof body.custom_fields === 'object' && body.custom_fields !== null
            ? body.custom_fields
            : {},
        total_billable_rent: 0,
      },
    })

    // Vygeneruj měsíční závazky od start_date do end_date (nebo dneška)
    const start = new Date(lease.start_date)
    const end = lease.end_date ? new Date(lease.end_date) : new Date()
    const current = new Date(start.getFullYear(), start.getMonth(), 1)
    const last = new Date(end.getFullYear(), end.getMonth(), 1)

    while (current <= last) {
      const year = current.getFullYear()
      const month = current.getMonth() + 1

      await createMonthlyObligation({
        leaseId: lease.id,
        year,
        month,
      })

      current.setMonth(current.getMonth() + 1)
    }

    return NextResponse.json({ id: lease.id }, { status: 201 })
  } catch (error) {
    console.error('API error creating lease:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Chyba serveru' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const leases = await prisma.lease.findMany({
      include: {
        tenant: { select: { full_name: true } },
        unit: { select: { identifier: true } },
      },
      orderBy: { start_date: 'desc' },
    })

    const leasesWithTotal = leases.map(lease => {
      const customCharges: CustomCharge[] = Array.isArray(lease.custom_charges)
        ? lease.custom_charges as CustomCharge[]
        : []

      const chargeFlags: ChargeFlags =
        lease.charge_flags && typeof lease.charge_flags === 'object' && !Array.isArray(lease.charge_flags)
          ? lease.charge_flags as ChargeFlags
          : {}

      const customTotal = customCharges.reduce(
        (sum, item) => (item.enabled ? sum + (item.amount || 0) : sum),
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

      return {
        ...lease,
        totalBillableRent,
      }
    })

    return NextResponse.json(leasesWithTotal)
  } catch (error) {
    console.error('API error listing leases:', error)
    return NextResponse.json({ error: 'Chyba serveru' }, { status: 500 })
  }
}
