// najem-app/app/api/leases/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lease = await prisma.lease.findUnique({
      where: { id: params.id },
      include: {
        tenant: { select: { name: true } },
        unit: { select: { identifier: true } }
      }
    })

    if (!lease) {
      return NextResponse.json({ error: 'Smlouva nenalezena' }, { status: 404 })
    }

    // @ts-expect-error: customFields není v typech, ale existuje v databázi
    const customTotal = lease.customFields?.reduce((sum, field) => {
      return field.billable ? sum + (field.value || 0) : sum
    }, 0) || 0

    const totalBillableRent =
      Number(lease.rentAmount || 0) +
      Number(lease.monthlyWater || 0) +
      Number(lease.monthlyGas || 0) +
      Number(lease.monthlyElectricity || 0) +
      Number(lease.monthlyServices || 0) +
      customTotal

    return NextResponse.json({
      ...lease,
      totalBillableRent
    })
  } catch (error) {
    console.error('Chyba při načítání smlouvy:', error)
    return NextResponse.json({ error: 'Chyba serveru' }, { status: 500 })
  }
}
