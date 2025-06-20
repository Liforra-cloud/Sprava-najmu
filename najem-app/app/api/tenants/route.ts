// app/api/tenants/route.ts

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
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
    phone: t.phone ?? null,
    personal_id: t.personal_id ?? null,
    address: t.address ?? null,
    employer: t.employer ?? null,
    note: t.note ?? null,
    date_registered: t.date_registered
      ? t.date_registered.toISOString()
      : null,
    active_unit_count: t.leases.length,
  }))

  return NextResponse.json(result)
}
