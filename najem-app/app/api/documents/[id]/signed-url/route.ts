// /app/api/documents/[id]/signed-url/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { supabaseRouteClient } from '@/lib/supabaseRouteClient'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = supabaseRouteClient()

  try {
    // 1. Načti dokument z DB
    const { data, error } = await supabase
      .from('documents')
      .select('file_name, mime_type')
      .eq('id', params.id)
      .single()

    if (error || !data?.file_name) {
      console.error('DB error:', error)
      return NextResponse.json({ error: error?.message ?? 'Dokument nenalezen' }, { status: 404 })
    }

    // 2. Zkus vygenerovat podepsanou URL pro bucket 'documents'
    const { data: urlData, error: urlError } = await supabase.storage
      .from('documents')
      .createSignedUrl(data.file_name, 60 * 60) // 1 hodina

    if (urlError || !urlData?.signedUrl) {
      console.error('Storage error:', urlError)
      return NextResponse.json({ error: urlError?.message ?? 'Chyba při získání URL' }, { status: 500 })
    }

    return NextResponse.json({
      url: urlData.signedUrl,
      mimeType: data.mime_type,
      fileName: data.file_name,
    })

  } catch (err) {
    // Vypiš cokoliv dalšího
    console.error('API route crash:', err)
    return NextResponse.json({ error: 'Unknown error', detail: String(err) }, { status: 500 })
  }
}
