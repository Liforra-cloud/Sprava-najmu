//app/api/tenants/route.ts

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const activeParam = url.searchParams.get('active')  // "true" | "false" | null

  // teď postavíme WHERE podle activeParam
  const now = new Date()
  let where: any = {}

  if (activeParam === 'true') {
    // aktivní = mají aspoň jednu smlouvu, která právě běží
    where.leases = {
      some: {
        start_date: { lte: now },
        OR: [
          { end_date: null },
          { end_date: { gte: now } },
        ],
      }
    }
  } else if (activeParam === 'false') {
    // neaktivní = nemají žádnou běžící smlouvu
    where.leases = {
      none: {
        start_date: { lte: now },
        OR: [
          { end_date: null },
          { end_date: { gte: now } },
        ],
      }
    }
  }
  // pokud activeParam==null, where={} => vrací všechny

  const tenants = await prisma.tenant.findMany({
    where,
    select: {
      id: true,
      full_name: true,
      email: true,
      phone: true,
      // třeba i počet smluv
      _count: { select: { leases: true } },
    },
    orderBy: { full_name: 'asc' },
  })

  return NextResponse.json(tenants)
}
