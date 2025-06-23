// app/api/statements/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const unit_id = searchParams.get('unit_id')
  let query = supabase.from('statements').select('*').order('created_at', { ascending: false })
  if (unit_id) query = query.eq('unit_id', unit_id)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { unit_id, lease_id, from_month, to_month, items } = body

  const { data: statement, error } = await supabase
    .from('statements')
    .insert([
      { unit_id, lease_id, from_month, to_month }
    ])
    .select()
    .single()

  if (error || !statement) return NextResponse.json({ error: error?.message }, { status: 500 })

  if (Array.isArray(items) && items.length > 0) {
    const itemsToInsert = items.map((it: any, idx: number) => ({
      statement_id: statement.id,
      name: it.name,
      item_type: it.item_type ?? '',
      total_advance: it.totalAdvance ?? 0,
      consumption: it.consumption ?? null,
      unit: it.unit ?? '',
      total_cost: it.totalCost ?? 0,
      diff: it.diff ?? 0,
      note: it.note ?? '',
      order_index: idx,
    }))
    const { error: itemErr } = await supabase
      .from('statement_items')
      .insert(itemsToInsert)
    if (itemErr) return NextResponse.json({ error: itemErr.message }, { status: 500 })
  }

  return NextResponse.json(statement, { status: 201 })
}
