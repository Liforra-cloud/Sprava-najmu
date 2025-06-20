// app/api/tenants/route.ts

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_: NextRequest) {
  const now = new Date()

  // Načteme všechny nájemníky spolu s právě běžícími smlouvami
  const tenants = await prisma.tenant.findMany({
    include: {
      leases: {
        where: {
          start_date: { lte: now },
          OR: [
            { end_date: null },
            { end_date: { gte: now } },
          ],
        },
      },
    },
    orderBy: { full_name: 'asc' },
  })

  // Připravíme výstup s počtem aktivních smluv
  const result = tenants.map(t => ({
    id: t.id,
    full_name: t.full_name,
    email: t.email,
    phone: t.phone,
    personal_id: t.personal_id,
    address: t.address,
    employer: t.employer,
    note: t.note,
    date_registered: t.date_registered.toISOString(),
    active_unit_count: t.leases.length,
  }))

  return NextResponse.json(result)
}
