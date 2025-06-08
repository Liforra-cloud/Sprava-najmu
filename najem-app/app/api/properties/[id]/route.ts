// app/api/properties/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: any,
  context: any
) {
  // jen prověříme, jestli build projde a parametr přijde
  return NextResponse.json({
    gotParams: context.params
  })
}
