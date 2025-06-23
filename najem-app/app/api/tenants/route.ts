// app/api/tenants/route.ts

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// GET - všechny nájemníky uživatele
export async function GET() {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Nejste přihlášeni.' }, { status: 401 })
  }

  const now = new Date()

  const tenants = await prisma.tenant.findMany({
    where: { user_id: user.id },
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

// POST - přidání nového nájemníka
export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Nejste přihlášeni.' }, { status: 401 })
  }

  const body = await req.json()
  const {
    full_name,
    email,
    phone,
    personal_id,
    address,
    employer,
    note,
  } = body

  try {
    const newTenant = await prisma.tenant.create({
      data: {
        full_name,
        email,
        phone,
        personal_id,
        address,
        employer,
        note,
        user_id: user.id, // správné párování na uživatele
      },
    })
    return NextResponse.json(newTenant)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

