// najem-app/app/api/leases/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type CustomCharge = { name: string; amount: number; enabled: boolean }
type ChargeFlags = { [key: string]: boolean }

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const lease = await prisma.lease.findUnique({
      where: { id: params.id },
      include: {
        tenant: true,
        unit: true,
        payments: true,
      },
    })

    if (!lease) return NextResponse.json({ error: 'Smlouva nenalezena' }, { status: 404 })

    const customCharges = Array.isArray(lease.custom_charges) ? lease.custom_charges : []
    const chargeFlags = typeof lease.charge_flags === 'object' ? lease.charge_flags : {}

    const totalBillableRent =
      (chargeFlags.rent_amount ? lease.rent_amount : 0) +
      (chargeFlags.monthly_water ? lease.monthly_water : 0) +
      (chargeFlags.monthly_gas ? lease.monthly_gas : 0) +
      (chargeFlags.monthly_electricity ? lease.monthly_electricity : 0) +
      (chargeFlags.monthly_services ? lease.monthly_services : 0) +
      (chargeFlags.repair_fund ? lease.repair_fund : 0) +
      customCharges.reduce((sum, c) => c.enabled ? sum + c.amount : sum, 0)

    return NextResponse.json({
      ...lease,
      totalBillableRent,
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Chyba serveru při načítání' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await req.json()
    const lease = await prisma.lease.update({
      where: { id: params.id },
      data: {
        name: data.name,
        unit_id: data.unit_id,
        tenant_id: data.tenant_id,
        start_date: new Date(data.start_date),
        end_date: data.end_date ? new Date(data.end_date) : null,
        due_date: data.due_date ? new Date(data.due_date) : null,
        rent_amount: data.rent_amount,
        monthly_water: data.monthly_water,
        monthly_gas: data.monthly_gas,
        monthly_electricity: data.monthly_electricity,
        monthly_services: data.monthly_services,
        repair_fund: data.repair_fund,
        charge_flags: data.charge_flags,
        custom_charges: data.custom_charges,
        custom_fields: data.custom_fields ?? {},
      },
    })

    return NextResponse.json({ success: true, lease })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Chyba při aktualizaci smlouvy' }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.payment.deleteMany({ where: { lease_id: params.id } })
    await prisma.monthlyObligation.deleteMany({ where: { lease_id: params.id } })
    await prisma.lease.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Chyba při mazání smlouvy:', err)
    return NextResponse.json({ error: 'Nepodařilo se smazat smlouvu' }, { status: 500 })
  }
}
