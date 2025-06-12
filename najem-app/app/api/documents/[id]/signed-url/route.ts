// app/api/documents/[id]/signed-url/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { supabaseRouteClient } from '@/lib/supabaseRouteClient'

// /api/documents/[id]/signed-url
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = supabaseRouteClient()
  // Najdi dokument v DB
  const { data: doc, error } = await supabase
    .from('documents')
    .select('file_name')
    .eq('id', params.id)
    .single()
  if (error || !doc) return NextResponse.json({ error: 'Soubor nenalezen' }, { status: 404 })

  // Vygeneruj signed URL (např. platný 2 minuty = 120 sekund)
  const { data: signedData, error: signedError } = await supabase
    .storage
    .from('documents')
    .createSignedUrl(doc.file_name, 120)
  if (signedError) return NextResponse.json({ error: signedError.message }, { status: 500 })

  return NextResponse.json({ url: signedData.signedUrl })
}
