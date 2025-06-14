// najem-app/app/api/leases/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Typ pro vlastní náklady (custom_fields)
type CustomField = {
  label: string
  value: number
  billable: boolean
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const lease = await prisma.lease.create({
      data: {
        name: body.name,
        unit_id: body.unit_id,             // POZOR: snake_case
        tenant_id: body.tenant_id,         // POZOR: snake_case
        start_date: new Date(body.start_date),
        end_date: body.end_date ? new Date(body.end_date) : null,
        rent_amount: Number(body.rent_amount),
        monthly_water: Number(body.monthly_water ?? 0),
        monthly_gas: Number(body.monthly_gas ?? 0),
        monthly_electricity: Number(body.monthly_electricity ?? 0),
        monthly_services: Number(body.monthly_services ?? 0),
        repair_fund: Number(body.repair_fund ?? 0),
        custom_fields: body.custom_fields ?? []
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
        tenant: { select: { full_name: true } },
        unit: { select: { identifier: true } }
      },
      orderBy: { start_date: 'desc' }
    })

    const leasesWithTotal = leases.map(lease => {
      // Bezpečné přetypování custom_fields
      const customFields = lease.custom_fields as CustomField[] ?? []

      const customTotal = customFields.reduce((sum, field) => {
        return field.billable ? sum + (field.value || 0) : sum
      }, 0)

      const totalBillableRent =
        Number(lease.rent_amount ?? 0) +
        Number(lease.monthly_water ?? 0) +
        Number(lease.monthly_gas ?? 0) +
        Number(lease.monthly_electricity ?? 0) +
        Number(lease.monthly_services ?? 0) +
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
