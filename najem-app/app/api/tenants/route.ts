// app/api/tenants/route.ts

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth' // nebo tvoje metoda

export async function GET(req: Request) {
  // 1) Zjistit aktuálního uživatele
  const session = await getServerSession() // uprav podle svého auth systému
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ error: 'Nejste přihlášeni.' }, { status: 401 })
  }

  const now = new Date()

  // 2) Filtruj pouze nájemníky daného uživatele
  const tenants = await prisma.tenant.findMany({
    where: { user_id: userId }, // <-- klíčová změna!
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

