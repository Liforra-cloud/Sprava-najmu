// app/api/statements/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type StatementItem = {
  name: string;
  item_type?: string;
  totalAdvance: number;
  consumption: number | '';
  unit: string;
  totalCost: number | '';
  diff: number;
  note?: string;
};

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params
  const { data: statement, error } = await supabase
    .from('statements')
    .select('*, statement_items(*)')
    .eq('id', id)
    .single()
  if (error || !statement) return NextResponse.json({ error: error?.message }, { status: 404 })
  return NextResponse.json(statement)
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params
  const body = await request.json()
  const { status, items } = body

  const { error } = await supabase
    .from('statements')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (Array.isArray(items)) {
    await supabase.from('statement_items').delete().eq('statement_id', id)
    const itemsToInsert = (items as StatementItem[]).map((it, idx) => ({
      statement_id: id,
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
    if (itemsToInsert.length) {
      await supabase.from('statement_items').insert(itemsToInsert)
    }
  }

  return NextResponse.json({ ok: true })
}
