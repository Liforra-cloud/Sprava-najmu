/app/api/unit-tenants/[id]/route.ts

import { NextResponse } from 'next/server';
import { supabaseRouteClient } from '@/lib/supabaseRouteClient';

// Smazání přiřazení nájemníka k jednotce (unit_tenants)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
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
