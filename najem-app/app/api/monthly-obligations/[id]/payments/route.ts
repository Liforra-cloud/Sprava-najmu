  //app/api/monthly-obligations/[id]/payments/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET – načti všechny platby k dané monthly obligation
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payments = await prisma.payment.findMany({
      where: { monthly_obligation_id: params.id },
      orderBy: [{ payment_date: 'asc' }],
    })
    return NextResponse.json(payments)
  } catch (error) {
    return NextResponse.json(
      { error: 'Chyba při načítání plateb', detail: error instanceof Error ? error.message : undefined },
      { status: 500 }
    )
  }
}

// POST – přidej platbu k dané monthly obligation
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()
    if (!body.amount || !body.payment_date || !body.lease_id) {
      return NextResponse.json(
        { error: 'Chybí částka, datum platby nebo lease_id' },
        { status: 400 }
      )
    }

    const payment = await prisma.payment.create({
      data: {
        lease_id: body.lease_id,
        monthly_obligation_id: params.id,
        amount: body.amount,
        payment_date: new Date(body.payment_date),
        payment_type: body.payment_type || null,
        note: body.note || null,
        variable_symbol: body.variable_symbol || null,
        payment_month: body.payment_month || null,
        payment_breakdown: body.payment_breakdown || null,
      },
    })

    return NextResponse.json(payment)
  } catch (error) {
    return NextResponse.json(
      { error: 'Chyba při ukládání platby', detail: error instanceof Error ? error.message : undefined },
      { status: 500 }
    )
  }
}

// PUT – úprava platby (volitelné, pokud chceš editovat platby)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.id) {
      return NextResponse.json(
        { error: 'Chybí ID platby' },
        { status: 400 }
      )
    }

    const updated = await prisma.payment.update({
      where: { id: body.id },
      data: {
        amount: body.amount,
        payment_date: new Date(body.payment_date),
        payment_type: body.payment_type || null,
        note: body.note || null,
        variable_symbol: body.variable_symbol || null,
        payment_month: body.payment_month || null,
        payment_breakdown: body.payment_breakdown || null,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json(
      { error: 'Chyba při úpravě platby', detail: error instanceof Error ? error.message : undefined },
      { status: 500 }
    )
  }
}

// DELETE – smaž platbu
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json()
    if (!id) {
      return NextResponse.json(
        { error: 'Chybí ID platby ke smazání' },
        { status: 400 }
      )
    }
    await prisma.payment.delete({ where: { id } })

    return NextResponse.json({ message: 'Platba byla smazána' })
  } catch (error) {
    return NextResponse.json(
      { error: 'Chyba při mazání platby', detail: error instanceof Error ? error.message : undefined },
      { status: 500 }
    )
  }
}
