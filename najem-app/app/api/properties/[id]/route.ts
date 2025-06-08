// app/api/properties/[id]/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET({ params }: { params: { id: string } }) {
  const { id } = params
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 })
  }
  return NextResponse.json(data)
}

export async function PUT({ params, request }: { params: { id: string }; request: Request }) {
  const { id } = params
  const { name, address, description } = await request.json()
  const { data, error } = await supabase
    .from('properties')
    .update({ name, address, description })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}
