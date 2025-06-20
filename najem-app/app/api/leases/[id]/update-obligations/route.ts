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

    // načteme smlouvu
    const lease = await prisma.lease.findUnique({
      where: { id: leaseId },
      select: {
        rent_amount: true, monthly_water: true, monthly_gas: true,
        monthly_electricity: true, monthly_services: true, repair_fund: true,
        charge_flags: true, custom_charges: true,
      },
    })
    if (!lease) {
      console.error('🔴 Smlouva nenalezena:', leaseId)
      return NextResponse.json({ error: 'Smlouva nenalezena' }, { status: 404 })
    }

    // --- DEBUG: zkusíme i přes findMany vrátit všechno, ale pak skipnout v loopu ---
    const whereClause: Prisma.MonthlyObligationWhereInput = { lease_id: leaseId }
    console.log('🔍 [DEBUG] findMany WHERE:', JSON.stringify(whereClause))

    const obligations = await prisma.monthlyObligation.findMany({ where: whereClause })
    console.log(`🔍 našel jsem celkem ${obligations.length} závazků (měly by to být všechny)`)

    const flags = (lease.charge_flags ?? {}) as Record<string, boolean>
    const customs = Array.isArray(lease.custom_charges)
      ? (lease.custom_charges as unknown as CustomCharge[])
      : []

    for (const ob of obligations) {
      // pokud testujeme future-only, skipujeme všechny kromě 7/2025
      if (mode === 'future' && (ob.year !== 2025 || ob.month !== 7)) {
        console.log(`⏭️ skipuju obligation ${ob.id} (${ob.year}-${String(ob.month).padStart(2,'0')})`)
        continue
      }
      console.log(`✅ updateujeme obligation ${ob.id} (${ob.year}-${String(ob.month).padStart(2,'0')})`)

      // spočítáme nové částky
      const rent = flags.rent_amount ? Number(lease.rent_amount) : 0
      const water = flags.monthly_water ? Number(lease.monthly_water) : 0
      const gas = flags.monthly_gas ? Number(lease.monthly_gas) : 0
      const electricity = flags.monthly_electricity ? Number(lease.monthly_electricity) : 0
      const services = flags.monthly_services ? Number(lease.monthly_services) : 0
      const repairs = flags.repair_fund ? Number(lease.repair_fund) : 0
      const customSum = customs.reduce((s, c) => c.enabled ? s + Number(c.amount) : s, 0)
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
