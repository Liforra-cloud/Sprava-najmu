// app/api/properties/[id]/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// GET /api/properties/:id
export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  const { id } = context.params;
  const { data, error } = await supabase
    .from('properties')
    .select('id, name, address, description, date_added')
    .eq('id', id)
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

// PUT /api/properties/:id
export async function PUT(
  request: Request,
  context: { params: { id: string } }
) {
  const { id } = context.params;
  const updates = await request.json();
  const { data, error } = await supabase
    .from('properties')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

// DELETE /api/properties/:id
export async function DELETE(
  request: Request,
  context: { params: { id: string } }
) {
  const { id } = context.params;
  const { error } = await supabase
    .from('properties')
    .delete()
    .eq('id', id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ id });
}
