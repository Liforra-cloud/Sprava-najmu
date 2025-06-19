// app/api/leases/[id]/update-obligations/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

interface CustomCharge {
  name: string
  amount: number
  enabled: boolean
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const leaseId = params.id
    const body = (await req.json()) as {
      mode?: 'all' | 'future'
      year?: number
      month?: number
    }

    // načíst smlouvu
    const lease = await prisma.lease.findUnique({
      where: { id: leaseId },
      select: {
        rent_amount: true,
        monthly_water: true,
        monthly_gas: true,
        monthly_electricity: true,
        monthly_services: true,
        repair_fund: true,
        charge_flags: true,
        custom_charges: true,
      },
    })
    if (!lease) return NextResponse.json({ error: 'Smlouva nenalezena' }, { status: 404 })

    // postavíme whereClause
    let whereClause: Prisma.MonthlyObligationWhereInput = { lease_id: leaseId }

    // pokud mám explicit year+month, použij je
    if (body.year != null && body.month != null) {
      whereClause = {
        lease_id: leaseId,
        year: body.year,
        month: body.month,
      }
    } else if (body.mode === 'future') {
      // jen budoucí
      const now = new Date()
      const Y = now.getFullYear()
      const M = now.getMonth() + 1
      whereClause = {
        lease_id: leaseId,
        AND: [
          {
            OR: [
              { year: { gt: Y } },
              { AND: [{ year: Y }, { month: { gt: M } }] },
            ],
          },
        ],
      }
    }
    // jinak (mode==='all' nebo nic) zůstává jen podle lease_id

    const obligations = await prisma.monthlyObligation.findMany({ where: whereClause })

    const flags = (lease.charge_flags ?? {}) as Record<string, boolean>
    const customs = Array.isArray(lease.custom_charges)
      ? (lease.custom_charges as unknown as CustomCharge[])
      : []

    for (const ob of obligations) {
      const rent = flags.rent_amount ? Number(lease.rent_amount ?? 0) : 0
      const water = flags.monthly_water ? Number(lease.monthly_water ?? 0) : 0
      const gas = flags.monthly_gas ? Number(lease.monthly_gas ?? 0) : 0
      const electricity = flags.monthly_electricity ? Number(lease.monthly_electricity ?? 0) : 0
      const services = flags.monthly_services ? Number(lease.monthly_services ?? 0) : 0
      const repairs = flags.repair_fund ? Number(lease.repair_fund ?? 0) : 0

      const customSum = customs.reduce(
        (sum, c) => (c.enabled ? sum + Number(c.amount ?? 0) : sum),
        0
      )

      const totalDue = rent + water + gas + electricity + services + repairs + customSum
      const newDebt = totalDue - ob.paid_amount

      await prisma.monthlyObligation.update({
        where: { id: ob.id },
        data: {
          rent,
          water,
          gas,
          electricity,
          services,
          repair_fund: repairs,
          total_due: totalDue,
          debt: newDebt,
          charge_flags: flags as unknown as Prisma.JsonObject,
          custom_charges: customs as unknown as Prisma.JsonArray,
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Chyba při update obligations:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}

