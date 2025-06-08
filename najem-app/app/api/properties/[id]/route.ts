// app/api/properties/[id]/route.ts
import { NextResponse, NextRequest } from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // tímhle ověříme, že handler funguje
  return NextResponse.json({ ok: true, id: params.id })
}
