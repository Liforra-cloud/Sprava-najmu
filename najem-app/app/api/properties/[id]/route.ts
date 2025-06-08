// app/api/properties/[id]/route.ts

import { NextResponse } from 'next/server'

export async function GET() {
  // jednoduchá odpověď pro test
  return NextResponse.json({ ok: true })
}
