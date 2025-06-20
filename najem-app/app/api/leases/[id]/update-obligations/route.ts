// app/api/leases/[id]/update-obligations/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

interface CustomCharge { name: string; amount: number; enabled: boolean }
interface RequestBody { mode: 'all' | 'future' }

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const leaseId = params.id
    const { mode } = (await req.json()) as RequestBody
    console.log('🔍 update-obligations called for lease:', leaseId, 'mode:', mode)

    // načteme jen to nejnutnější
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

    // postavíme WHERE podle režimu
    let whereClause: Prisma.MonthlyObligationWhereInput = { lease_id: leaseId }
    if (mode === 'future') {
      const now = new Date()
      const nextMonthFirst = new Date(now.getFullYear(), now.getMonth() + 1, 1)
      const year = nextMonthFirst.getFullYear()
      const month = nextMonthFirst.getMonth() + 1

      // všechny závazky od příštího měsíce dál
      whereClause = {
        lease_id: leaseId,
        OR: [
          { year: year,  month: { gte: month } },
          { year: {    gt:  year  } }
        ],
      }
    }
    console.log('🔍 whereClause bude:', JSON.stringify(whereClause))

    const obligations = await prisma.monthlyObligation.findMany({ where: whereClause })
    console.log(`🔍 našel jsem ${obligations.length} závazků k aktualizaci`)

    const flags = (lease.charge_flags ?? {}) as Record<string, boolean>
    const customs = Array.isArray(lease.custom_charges)
      ? (lease.custom_charges as unknown as CustomCharge[])
      : []

    for (const ob of obligations) {
      // spočítáme nové částky
      const rent = flags.rent_amount ? Number(lease.rent_amount) : 0
      const water = flags.monthly_water ? Number(lease.monthly_water) : 0
      const gas = flags.monthly_gas ? Number(lease.monthly_gas) : 0
      const electricity = flags.monthly_electricity ? Number(lease.monthly_electricity) : 0
      const services = flags.monthly_services ? Number(lease.monthly_services) : 0
      const repairs = flags.repair_fund ? Number(lease.repair_fund) : 0
      const customSum = customs.reduce(
        (sum, c) => c.enabled ? sum + Number(c.amount) : sum,
        0
      )
      const total_due = rent + water + gas + electricity + services + repairs + customSum
      const debt = total_due - ob.paid_amount

      console.log(
        `  🔄 updating obligation ${ob.id}: total_due=${total_due}, debt=${debt}`
      )

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
          charge_flags: flags as unknown as Prisma.JsonObject,
          custom_charges: customs as unknown as Prisma.JsonArray,
        },
      })
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
