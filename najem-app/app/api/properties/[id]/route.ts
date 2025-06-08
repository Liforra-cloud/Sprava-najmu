// app/api/properties/[id]/route.ts

import { NextResponse, NextRequest } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // jen pro otestování, že máme params.id
  return NextResponse.json({ receivedId: params.id })
}
