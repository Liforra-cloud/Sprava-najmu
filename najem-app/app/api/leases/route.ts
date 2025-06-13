// najem-app/app/api/leases/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const lease = await prisma.lease.create({
      data: {
        unitId: body.unitId,
        tenantId: body.tenantId,
        startDate: new Date(body.startDate),
        endDate: body.endDate ? new Date(body.endDate) : null,
        rentAmount: Number(body.rentAmount),
        monthlyWater: Number(body.monthlyWater ?? 0),
        monthlyGas: Number(body.monthlyGas ?? 0),
        monthlyElectricity: Number(body.monthlyElectricity ?? 0),
        monthlyServices: Number(body.monthlyServices ?? 0),
        repairFund: Number(body.repairFund ?? 0),
        customFields: body.customFields,
      }
    })

    return NextResponse.json({ id: lease.id }, { status: 201 })
  } catch (error) {
    console.error('Chyba při vytváření smlouvy:', error)
    return NextResponse.json({ error: 'Chyba serveru' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const leases = await prisma.lease.findMany({
      include: {
        tenant: { select: {name: true } },
        unit: { select: { identifier: true } }
      },
      orderBy: { startDate: 'desc' }
    })

    const leasesWithTotal = leases.map(lease => {
      const customTotal = lease.customFields?.reduce((sum, field) => {
        return field.billable ? sum + (field.value || 0) : sum
      }, 0) || 0

      const totalBillableRent =
        Number(lease.rentAmount) +
        Number(lease.monthlyWater) +
        Number(lease.monthlyGas) +
        Number(lease.monthlyElectricity) +
        Number(lease.monthlyServices) +
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
