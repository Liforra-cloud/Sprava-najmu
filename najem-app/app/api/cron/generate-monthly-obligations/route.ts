//app/api/cron/generate-monthly-obligations/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { generateMonthlyObligationsForAllLeases } from '@/scripts/generateMonthlyObligations'

export async function POST() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1 // POZOR: getMonth() je 0-based!

  try {
    await generateMonthlyObligationsForAllLeases(year, month)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
