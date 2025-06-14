//app/api/leases/[id]/payments/route.ts


// app/api/leases/[id]/payments/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET – načíst platby pro danou smlouvu
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const payments = await prisma.payment.findMany({
      where: { lease_id: params.id },
      orderBy: { payment_date: 'desc' }
    })
    return NextResponse.json(payments)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Chyba při načítání plateb' }, { status: 500 })
  }
}

// POST – přidat platbu
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()

    const payment = await prisma.payment.create({
      data: {
        lease_id: params.id,
        amount: body.amount,
        payment_date: new Date(body.payment_date),
        payment_type: body.payment_type || null,
        note: body.note || null,
        variable_symbol: body.variable_symbol || null,
        payment_month: body.payment_month || null
      }
    })

    return NextResponse.json(payment)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Chyba při ukládání platby' }, { status: 500 })
  }
}

// PUT – upravit platbu
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()

    if (!body.id) {
      return NextResponse.json({ error: 'Chybí ID platby' }, { status: 400 })
    }

    const updated = await prisma.payment.update({
      where: { id: body.id },
      data: {
        amount: body.amount,
        payment_date: new Date(body.payment_date),
        payment_type: body.payment_type || null,
        note: body.note || null,
        variable_symbol: body.variable_symbol || null,
        payment_month: body.payment_month || null
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Chyba při úpravě platby' }, { status: 500 })
  }
}

// DELETE – smazat platbu
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json()

    if (!id) {
      return NextResponse.json({ error: 'Chybí ID platby ke smazání' }, { status: 400 })
    }

    await prisma.payment.delete({ where: { id } })

    return NextResponse.json({ message: 'Platba byla smazána' })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Chyba při mazání platby' }, { status: 500 })
  }
}
