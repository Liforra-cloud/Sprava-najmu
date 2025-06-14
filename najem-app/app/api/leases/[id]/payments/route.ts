//app/api/leases/[id]/payments/route.ts


import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
