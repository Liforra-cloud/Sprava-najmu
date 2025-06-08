// app/api/properties/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  // Otestujeme, že parametr přijde
  return NextResponse.json({ gotId: id });
}
