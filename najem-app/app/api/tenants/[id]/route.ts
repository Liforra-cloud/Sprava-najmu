//app/api/tenants/[id]/route.ts

import { NextResponse } from 'next/server'
import { supabaseRouteClient } from '@/lib/supabaseRouteClient'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params
  const supabase = supabaseRouteClient()
  const { data, error } = await supabase.from('tenants').select('*').eq('id', id).single()
  if (error || !data) return NextResponse.json({ error: error?.message || "Nájemník nenalezen" }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { id } = params
  const body = await request.json()
  const supabase = supabaseRouteClient()
  const { data, error } = await supabase.from('tenants').update(body).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
