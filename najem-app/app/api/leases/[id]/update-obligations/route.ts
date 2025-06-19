// app/api/leases/[id]/update-obligations/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

/** Tvar, jaký máme v DB pro custom_charges */
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

    // 1) Debug: mode a leaseId
    let body: any
    try {
      body = await req.json()
    } catch (e) {
      console.error('🔴 Invalid JSON body', e)
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }
    const { mode } = body as { mode?: string }
    console.log('🛠️ update-obligations called', { leaseId, mode })

    // 2) Načteme základní data smlouvy
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
    if (!lease) {
      console.error('🔴 Smlouva nenalezena:', leaseId)
      return NextResponse.json({ error: 'Smlouva nenalezena' }, { status: 404 })
    }

    // 3) Sestavíme WHERE podmínku
    let whereClause: Prisma.MonthlyObligationWhereInput = {
      lease_id: leaseId,
    }

    if (mode === 'future') {
      const now = new Date()
      // příští měsíc
      const next = new Date(now.getFullYear(), now.getMonth() + 1, 1)
      const year = next.getFullYear()
      const month = next.getMonth() + 1

      whereClause = {
        lease_id: leaseId,
        year,
        month,
      }
    }

    // Debug: co se posílá do findMany
    console.log('🛠️ whereClause:', whereClause)

    // Získáme příslušné zápisy
    const obligations = await prisma.monthlyObligation.findMany({
      where: whereClause,
    })
    console.log('🛠️ obligations to update:', obligations.length)

    // Rozbalíme flagy a custom_charges
    const flags = (lease.charge_flags ?? {}) as Record<string, boolean>
    const customs = Array.isArray(lease.custom_charges)
      ? (lease.custom_charges as unknown as CustomCharge[])
      : []

    // 4) Projdeme a updatujeme
    for (const ob of obligations) {
      const rent = flags.rent_amount ? Number(lease.rent_amount ?? 0) : 0
      const water = flags.monthly_water ? Number(lease.monthly_water ?? 0) : 0
      const gas = flags.monthly_gas ? Number(lease.monthly_gas ?? 0) : 0
      const electricity = flags.monthly_electricity ? Number(lease.monthly_electricity ?? 0) : 0
      const services = flags.monthly_services ? Number(lease.monthly_services ?? 0) : 0
      const repairs = flags.repair_fund ? Number(lease.repair_fund ?? 0) : 0

      const customSum = customs.reduce(
        (sum, c) => c.enabled ? sum + Number(c.amount ?? 0) : sum,
        0
      )

      const total_due = rent + water + gas + electricity + services + repairs + customSum
      const debt = total_due - ob.paid_amount

      await prisma.monthlyObligation.update({
        where: { id: ob.id },
        data: {
          rent,
          water,
          gas,
          electricity,
          services,
          repair_fund: repairs,
          total_due,
          debt,
          // Prisma očekává JsonObject / JsonArray, proto přetypujeme:
          charge_flags: flags as unknown as Prisma.JsonObject,
          custom_charges: customs as unknown as Prisma.JsonArray,
        },
      })
      console.log('✅ updated obligation', ob.id)
    }

    return NextResponse.json({ success: true })

  } catch (err) {
    console.error('Chyba při update-obligations:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}
