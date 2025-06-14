// najem-app/app/api/leases/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Typ pro vlastní náklad
type CustomCharge = {
  name: string
  amount: number
  enabled: boolean
}

// Typ pro charge_flags
type ChargeFlags = {
  rent_amount: boolean
  monthly_water: boolean
  monthly_gas: boolean
  monthly_electricity: boolean
  monthly_services: boolean
  repair_fund: boolean
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Zkontroluj, že custom_charges je pole objektů se správnými klíči
    const custom_charges: CustomCharge[] = Array.isArray(body.custom_charges)
      ? body.custom_charges.map((item: any) => ({
          name: String(item.name),
          amount: Number(item.amount ?? 0),
          enabled: !!item.enabled,
        }))
      : []

    // Zkontroluj, že charge_flags je objekt se správnými klíči
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
        charge_flags: charge_flags,                 // ← Ukládáš nové pole!
        custom_charges: custom_charges,             // ← Ukládáš nové pole!
        total_billable_rent: 0,                     // nebo můžeš dopočítat
      }
    })

    return NextResponse.json({ id: lease.id }, { status: 201 })
  } catch (error) {
    console.error('Chyba při vytváření smlouvy:', error)
    return NextResponse.json({ error: 'Chyba serveru' }, { status: 500 })
  }
}

// GET zůstává v zásadě stejný, jen pokud chceš ve výpočtu zahrnout nové pole custom_charges místo custom_fields:
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
      const customCharges = lease.custom_charges as CustomCharge[] ?? []
      const customTotal = customCharges.reduce((sum, item) =>
        item.enabled ? sum + (item.amount || 0) : sum, 0
      )
      const totalBillableRent =
        (lease.charge_flags?.rent_amount ? Number(lease.rent_amount ?? 0) : 0) +
        (lease.charge_flags?.monthly_water ? Number(lease.monthly_water ?? 0) : 0) +
        (lease.charge_flags?.monthly_gas ? Number(lease.monthly_gas ?? 0) : 0) +
        (lease.charge_flags?.monthly_electricity ? Number(lease.monthly_electricity ?? 0) : 0) +
        (lease.charge_flags?.monthly_services ? Number(lease.monthly_services ?? 0) : 0) +
        (lease.charge_flags?.repair_fund ? Number(lease.repair_fund ?? 0) : 0) +
        customTotal

      return {
        ...lease,
        totalBillableRent
      }
    })

    return NextResponse.json(leasesWithTotal)
  } catch (error) {
    console.error('Chyba při načítání smluv:', error)
    return NextResponse.json({ error: 'Chyba serveru' }, { status: 500 })
  }
}
