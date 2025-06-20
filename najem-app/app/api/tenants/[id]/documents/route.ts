// app/api/tenants/[id]/documents/route.ts

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabaseRouteClient } from '@/lib/supabaseRouteClient'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const supabase = supabaseRouteClient()
  const tenantId = params.id

  const { data, error } = await supabase
    .from('documents')
    .select('id, name, url, date, created_at')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}

// POST se deleguje na váš obecný /api/documents, proto ho zde nemusíme duplikovat
