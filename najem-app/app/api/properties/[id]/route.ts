// app/api/properties/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

type Params = { params: { id: string } }

export async function GET(request: NextRequest, { params }: Params) {
  const { id } = params

  const { data, error } = await supabase
    .from('properties')
    .select(`
      id,
      name,
      address,
      description,
      date_added,
      units (
        id,
        identifier,
        floor,
        disposition,
        area,
        occupancy_status,
        monthly_rent,
        deposit,
        date_added
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = params
  const updates = await request.json()

  const { data, error } = await supabase
    .from('properties')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = params

  const { error } = await supabase
    .from('properties')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ message: 'Property deleted' })
}
