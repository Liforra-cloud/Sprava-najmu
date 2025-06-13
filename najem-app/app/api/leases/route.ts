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
        monthlyServices: Number(body.monthlyServices ?? 0)
      }
    })

    return NextResponse.json({ id: lease.id }, { status: 201 })
  } catch (error) {
    console.error('Chyba při vytváření smlouvy:', error)
    return NextResponse.json({ error: 'Chyba serveru' }, { status: 500 })
  }
}
