// app/api/unit-tenants/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { supabaseRouteClient } from '@/lib/supabaseRouteClient';

// POST – vytvoření přiřazení nájemníka k jednotce
export async function POST(request: NextRequest) {
  const supabase = supabaseRouteClient();
  const body = await request.json();

  // Pokud je date_to prázdný string, udělej z něj null
  if (body.date_to === '') {
    body.date_to = null;
  }

  const { data, error } = await supabase
    .from('unit_tenants')
    .insert([body])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

// DELETE endpoint (volitelný, pro mazání přiřazení)
export async function DELETE(request: NextRequest) {
  const url = new URL(request.url);
  const id = url.pathname.split('/').pop();
  if (!id) {
    return NextResponse.json({ error: 'Chybí ID' }, { status: 400 });
  }
  const supabase = supabaseRouteClient();
  const { error } = await supabase
    .from('unit_tenants')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
