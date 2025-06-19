// app/api/leases/[id]/sync-obligations/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createMonthlyObligation } from '@/lib/createMonthlyObligation'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { futureOnly = false } = await req.json()

    const lease = await prisma.lease.findUnique({ where: { id: params.id } })
    if (!lease) return NextResponse.json({ error: 'Smlouva nenalezena' }, { status: 404 })

    const obligations = await prisma.monthlyObligation.findMany({
      where: {
        lease_id: params.id,
        ...(futureOnly ? {
          OR: [
            { year: { gt: new Date().getFullYear() } },
            {
              year: new Date().getFullYear(),
              month: { gte: new Date().getMonth() + 1 }
            }
          ]
        } : {})
      }
    })

    for (const ob of obligations) {
      await prisma.monthlyObligation.delete({ where: { id: ob.id } })
      await createMonthlyObligation({ leaseId: lease.id, year: ob.year, month: ob.month })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Chyba při synchronizaci závazků:', error)
    return NextResponse.json({ error: 'Chyba serveru' }, { status: 500 })
  }
}
