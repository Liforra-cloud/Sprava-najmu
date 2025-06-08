// app/api/properties/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Vezmeme celé URL a rozdělíme cestu na segmenty
  const url = new URL(request.url);
  const segments = url.pathname.split('/');
  const id = segments[segments.length - 1]; // poslední segment

  // Pro otestování vrátíme JSON
  return NextResponse.json({ gotId: id });
}
