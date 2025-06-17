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
        tenant: true,
        unit: true,
        payments: {
          orderBy: { payment_date: 'desc' }
        },
      },
    })

    if (!lease) {
      return NextResponse.json({ error: 'Smlouva nenalezena' }, { status: 404 })
    }

    const totalBillableRent =
      (lease.charge_flags?.rent_amount ? lease.rent_amount : 0) +
      (lease.charge_flags?.monthly_water ? lease.monthly_water : 0) +
      (lease.charge_flags?.monthly_gas ? lease.monthly_gas : 0) +
      (lease.charge_flags?.monthly_electricity ? lease.monthly_electricity : 0) +
      (lease.charge_flags?.monthly_services ? lease.monthly_services : 0) +
      (lease.charge_flags?.repair_fund ? lease.repair_fund : 0) +
      (Array.isArray(lease.custom_charges)
        ? lease.custom_charges.reduce(
            (sum, item) => (item.enabled ? sum + item.amount : sum),
            0
          )
        : 0)

    return NextResponse.json({
      ...lease,
      totalBillableRent
    })
  } catch (err) {
    console.error('API error loading lease:', err)
    return NextResponse.json(
      { error: 'Server error při načítání smlouvy' },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()

    const lease = await prisma.lease.update({
      where: { id: params.id },
      data: {
        name: body.name,
        unit_id: body.unit_id,
        tenant_id: body.tenant_id,
        start_date: body.start_date ? new Date(body.start_date) : undefined,
        end_date: body.end_date ? new Date(body.end_date) : null,
        due_date: body.due_date ? new Date(body.due_date) : null,
        rent_amount: Number(body.rent_amount ?? 0),
        monthly_water: Number(body.monthly_water ?? 0),
        monthly_gas: Number(body.monthly_gas ?? 0),
        monthly_electricity: Number(body.monthly_electricity ?? 0),
        monthly_services: Number(body.monthly_services ?? 0),
        repair_fund: Number(body.repair_fund ?? 0),
        custom_fields: typeof body.custom_fields === 'object' ? body.custom_fields : {},
        custom_charges: Array.isArray(body.custom_charges) ? body.custom_charges : [],
        charge_flags:
          typeof body.charge_flags === 'object' && !Array.isArray(body.charge_flags)
            ? body.charge_flags
            : {},
      },
    })

    return NextResponse.json({ success: true, lease })
  } catch (error) {
    console.error('API error saving lease:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Chyba při ukládání smlouvy' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.payment.deleteMany({
      where: { lease_id: params.id }
    })

    await prisma.monthlyObligation.deleteMany({
      where: { lease_id: params.id }
    })

    await prisma.lease.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error deleting lease:', error)
    return NextResponse.json(
      { error: 'Chyba při mazání smlouvy' },
      { status: 500 }
    )
  }
}

