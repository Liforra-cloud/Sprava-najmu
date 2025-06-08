// app/api/properties/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'

interface Context {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, context: Context) {
  const { id } = context.params
  // Odpovíme jednoduše vrácením id, otestujeme, že to projde build
  return NextResponse.json({ gotId: id })
}
