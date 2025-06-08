// app/api/properties/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

/**
 * GET single property by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message || 'Nemovitost nenalezena' },
      { status: 404 }
    )
  }
  return NextResponse.json(data)
}

/**
 * PUT update property by ID
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params
  const { name, address, description } = await request.json()
  const { data, error } = await supabase
    .from('properties')
    .update({ name, address, description })
    .eq('id', id)
    .select()
    .single()

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message || 'Aktualizace selhala' },
      { status: 500 }
    )
  }
  return NextResponse.json(data)
}
