// app/api/properties/[id]/route.ts
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // jen vrátíme id, abychom ověřili signaturu
  return NextResponse.json({ ok: true, id: params.id })
}
