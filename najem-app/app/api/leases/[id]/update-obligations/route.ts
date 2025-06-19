// app/api/leases/[id]/update-obligations/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const leaseId = params.id
  const { mode } = await req.json() as { mode: 'all' | 'future' }

  // Načti smlouvu
  const lease = await prisma.lease.findUnique({
    where: { id: leaseId },
    select: {
      rent_amount: true,
      monthly_water: true,
      monthly_gas: true,
      monthly_electricity: true,
      monthly_services: true,
      repair_fund: true,
      custom_charges: true,
      charge_flags: true,
    },
  })
  if (!lease) {
    return NextResponse.json({ error: 'Smlouva nenalezena' }, { status: 404 })
  }

  // Připrav where podle režimu
  const now = new Date()
  const thisYear = now.getFullYear()
  const thisMonth = now.getMonth() + 1

  const whereClause: Prisma.MonthlyObligationWhereInput = {
    lease_id: leaseId,
    ...(mode === 'future' && {
      OR: [
        { year: { gt: thisYear } },
        { year: thisYear, month: { gt: thisMonth } },
      ],
    }),
  }

  // Načti závazky
  const obligations = await prisma.monthlyObligation.findMany({
    where: whereClause,
  })

  // Vlajky a vlastní poplatky
  const flags = lease.charge_flags as Record<string, boolean>
  const customs = Array.isArray(lease.custom_charges) ? lease.custom_charges : []

  for (const ob of obligations) {
    const rent = flags.rent_amount ? Number(lease.rent_amount ?? 0) : 0
    const water = flags.monthly_water ? Number(lease.monthly_water ?? 0) : 0
    const gas = flags.monthly_gas ? Number(lease.monthly_gas ?? 0) : 0
    const electricity = flags.monthly_electricity ? Number(lease.monthly_electricity ?? 0) : 0
    const services = flags.monthly_services ? Number(lease.monthly_services ?? 0) : 0
    const repairs = flags.repair_fund ? Number(lease.repair_fund ?? 0) : 0

    // bezpečné vyhodnocení, c může být null nebo undefined
    const customSum = customs.reduce(
      (sum, c) => (c?.enabled ? sum + Number(c.amount ?? 0) : sum),
      0,
    )

    const totalDue = rent + water + gas + electricity + services + repairs + customSum

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
        debt: totalDue - ob.paid_amount,
        charge_flags: flags,
        custom_charges: customs,
      },
    })
  }

  return NextResponse.json({ success: true })
}
