// app/api/leases/[id]/monthly-obligation/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(req.url)
    const month = Number(searchParams.get('month')) // např. 6
    const year = Number(searchParams.get('year'))   // např. 2025

    if (!month || !year) {
      return NextResponse.json({ error: 'Musíš zadat měsíc a rok.' }, { status: 400 })
    }

    const obligation = await prisma.monthlyObligation.findFirst({
      where: {
        lease_id: params.id,
        month,
        year,
      },
    })

    if (!obligation) {
      return NextResponse.json({ error: 'Rozpis pro tento měsíc nenalezen.' }, { status: 404 })
    }

    return NextResponse.json(obligation)
  } catch (error) {
    return NextResponse.json({ error: 'Chyba serveru' }, { status: 500 })
  }
}
