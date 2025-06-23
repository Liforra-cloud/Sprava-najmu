// app/api/tenants/route.ts

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET() {
  // 1) Zjistit aktuálního přihlášeného uživatele
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Nejste přihlášeni.' }, { status: 401 })
  }

  const now = new Date()

  // 2) Filtrovat pouze nájemníky daného uživatele
  const tenants = await prisma.tenant.findMany({
    where: { user_id: user.id }, // <- tenant musí mít sloupec user_id!
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

  // 3) Výstup jako dříve
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
