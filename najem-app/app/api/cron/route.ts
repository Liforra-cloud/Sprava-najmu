//app/api/cron/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { generateMonthlyObligationsForAllLeases } from '@/scripts/generateMonthlyObligations'

export async function POST(req: NextRequest) {
  // Ověření autorizačního headeru
  const expected = `Bearer ${process.env.CRON_SECRET}`
  const received = req.headers.get('authorization') || ''
  if (received !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Automaticky nastav aktuální měsíc a rok
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  try {
    await generateMonthlyObligationsForAllLeases(year, month)
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
