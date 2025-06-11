// app/api/unit-tenants/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { supabaseRouteClient } from '@/lib/supabaseRouteClient'

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params
  const supabase = supabaseRouteClient()
  const { error } = await supabase
    .from('unit_tenants')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
