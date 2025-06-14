//app/api/cron/generate-monthly-obligations/route.ts

import { NextResponse } from 'next/server'
import { generateMonthlyObligationsForAllLeases } from '@/scripts/generateMonthlyObligations'

export async function POST() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  try {
    await generateMonthlyObligationsForAllLeases(year, month)
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: false, error: 'Neznámá chyba' }, { status: 500 })
  }
}
