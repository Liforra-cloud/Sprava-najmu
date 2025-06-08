// app/api/properties/[id]/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

/**
 * GET single property
 * - Removed invalid second parameter
 * - Parse `id` manually from request URL
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const segments = url.pathname.split('/')
  const id = segments[segments.indexOf('properties') + 1]

  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: error?.message || 'Nemovitost nenalezena' }, { status: 404 })
  }
  return NextResponse.json(data)
}

/**
 * PUT update property
 * - Removed invalid second parameter
 * - Parse `id` manually from request URL
 */
export async function PUT(request: Request) {
  const url = new URL(request.url)
  const segments = url.pathname.split('/')
  const id = segments[segments.indexOf('properties') + 1]

  const { name, address, description } = await request.json()
  const { data, error } = await supabase
    .from('properties')
    .update({ name, address, description })
    .eq('id', id)
    .select()
    .single()

  if (error || !data) {
    return NextResponse.json({ error: error?.message || 'Aktualizace selhala' }, { status: 500 })
  }
  return NextResponse.json(data)
}
