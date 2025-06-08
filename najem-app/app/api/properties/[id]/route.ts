// app/api/properties/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // jednoduchá odpověď pro test
  return NextResponse.json({ ok: true })
}
